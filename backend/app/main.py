import sys
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Add backend directory to path for imports to work
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings, setup_logging
from app.middleware import limiter
from app.routes import workspaces_router, tasks_router, notes_router, pages_router, account_router
import logging

# Initialize settings early for middleware
settings = get_settings()

# Setup logging
setup_logging(debug=settings.debug)
logger = logging.getLogger(__name__)
abuse_logger = logging.getLogger("abuse")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy (adjust based on your needs)
        # Allow same-origin and API endpoints
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # unsafe-eval for Swagger UI
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self'"
        )
        response.headers["Content-Security-Policy"] = csp

        # Strict Transport Security (only in production with HTTPS)
        if not settings.debug:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Middleware to add Cache-Control and ETag headers to responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Skip caching for non-GET requests and API endpoints that change frequently
        if request.method != "GET":
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            return response

        # For GET requests, add appropriate cache headers
        path = request.url.path

        # Health check endpoints can be cached briefly
        if path in ["/", "/health"]:
            response.headers["Cache-Control"] = "public, max-age=60"
        # API endpoints - short cache with revalidation
        elif path.startswith("/api/"):
            response.headers["Cache-Control"] = "private, no-cache, must-revalidate"
            # Add ETag for conditional requests
            # Note: Using SHA-256 for ETag generation (cryptographically secure hash)
            if hasattr(response, "body") and response.body:
                try:
                    import hashlib
                    # Generate ETag from response body using SHA-256
                    body_hash = hashlib.sha256(response.body).hexdigest()
                    response.headers["ETag"] = f'"{body_hash[:16]}"'  # Use first 16 chars for ETag
                except Exception:
                    pass
        else:
            # Default: no cache for other endpoints
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests with bodies larger than the configured limit."""

    def __init__(self, app: FastAPI, max_bytes: int = 1_000_000):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    if int(content_length) > self.max_bytes:
                        abuse_logger.warning(
                            "payload_too_large",
                            extra={
                                "path": request.url.path,
                                "method": request.method,
                                "client": request.client.host if request.client else "unknown",
                                "content_length": content_length,
                            },
                        )
                        return Response("Payload too large", status_code=413)
                except ValueError:
                    abuse_logger.warning(
                        "invalid_content_length",
                        extra={
                            "path": request.url.path,
                            "method": request.method,
                            "client": request.client.host if request.client else "unknown",
                            "content_length": content_length,
                        },
                    )
                    return Response("Invalid Content-Length", status_code=400)
            else:
                body = await request.body()
                if len(body) > self.max_bytes:
                    abuse_logger.warning(
                        "payload_too_large",
                        extra={
                            "path": request.url.path,
                            "method": request.method,
                            "client": request.client.host if request.client else "unknown",
                            "content_length": len(body),
                        },
                    )
                    return Response("Payload too large", status_code=413)
                request._body = body

        return await call_next(request)

# App metadata
app = FastAPI(
    title="Moji API",
    description="A workspace-centric task and note management API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

logger.info("Starting Moji API")

# Rate limiting
app.state.limiter = limiter

async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    abuse_logger.warning(
        "rate_limit_exceeded",
        extra={
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else "unknown",
        },
    )
    return await _rate_limit_exceeded_handler(request, exc)

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)

# Security headers middleware (should be first)
app.add_middleware(SecurityHeadersMiddleware)

# Cache control middleware (should be early in the stack)
app.add_middleware(CacheControlMiddleware)

# Request size limit middleware
app.add_middleware(RequestSizeLimitMiddleware, max_bytes=1_000_000)

# Compression middleware (should be added before CORS)
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Only compress responses > 1KB
)

# CORS configuration - restricted to specific methods and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["ETag", "X-Request-ID"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Register routers
API_PREFIX = "/api/v1"
app.include_router(workspaces_router, prefix=API_PREFIX)
app.include_router(tasks_router, prefix=API_PREFIX)
app.include_router(notes_router, prefix=API_PREFIX)
app.include_router(pages_router, prefix=API_PREFIX)
app.include_router(account_router, prefix=API_PREFIX)


@app.get("/")
@limiter.limit("100/minute")
async def root(request: Request):
    """Health check endpoint."""
    return {
        "message": "Moji API is running!",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": "moji-api",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
