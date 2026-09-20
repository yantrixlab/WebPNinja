from .client import WebPNinja
from .errors import (
    WebPNinjaError,
    ValidationError,
    AuthenticationError,
    PayloadTooLargeError,
    CompressionError,
    RateLimitError,
)

__all__ = [
    "WebPNinja",
    "WebPNinjaError",
    "ValidationError",
    "AuthenticationError",
    "PayloadTooLargeError",
    "CompressionError",
    "RateLimitError",
]
