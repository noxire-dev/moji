"""Rate limiting configuration for API routes."""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limit configurations
# General API endpoints: 100 requests per minute
API_RATE_LIMIT = "100/minute"

# Write operations (POST, PUT, DELETE): 30 requests per minute
WRITE_RATE_LIMIT = "30/minute"

# Read operations (GET): 200 requests per minute
READ_RATE_LIMIT = "200/minute"

# Create rate limiter instance with a global default
limiter = Limiter(key_func=get_remote_address, default_limits=[API_RATE_LIMIT])
