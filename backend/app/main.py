import sys
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import hashlib
import json

# Add backend directory to path for imports to work
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import get_settings
from app.routes import workspaces_router, tasks_router, notes_router, pages_router


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
            if hasattr(response, "body") and response.body:
                try:
                    # Generate ETag from response body
                    body_hash = hashlib.md5(response.body).hexdigest()
                    response.headers["ETag"] = f'"{body_hash}"'
                except Exception:
                    pass
        else:
            # Default: no cache for other endpoints
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

        return response

# App metadata
app = FastAPI(
    title="Moji API",
    description="A workspace-centric task and note management API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Settings
settings = get_settings()

# Cache control middleware (should be early in the stack)
app.add_middleware(CacheControlMiddleware)

# Compression middleware (should be added before CORS)
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Only compress responses > 1KB
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
API_PREFIX = "/api/v1"
app.include_router(workspaces_router, prefix=API_PREFIX)
app.include_router(tasks_router, prefix=API_PREFIX)
app.include_router(notes_router, prefix=API_PREFIX)
app.include_router(pages_router, prefix=API_PREFIX)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Moji API is running!",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": "moji-api",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
