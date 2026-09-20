class WebPNinjaError(Exception):
    """Base error for all WebP Ninja API failures."""

    def __init__(self, message, status=None):
        super().__init__(message)
        self.message = message
        self.status = status


class ValidationError(WebPNinjaError):
    def __init__(self, message):
        super().__init__(message, 400)


class AuthenticationError(WebPNinjaError):
    def __init__(self, message):
        super().__init__(message, 401)


class PayloadTooLargeError(WebPNinjaError):
    def __init__(self, message, max_upload_mb=None, file_size_mb=None):
        super().__init__(message, 413)
        self.max_upload_mb = max_upload_mb
        self.file_size_mb = file_size_mb


class CompressionError(WebPNinjaError):
    def __init__(self, message):
        super().__init__(message, 422)


class RateLimitError(WebPNinjaError):
    def __init__(self, message, quota=None, used=None):
        super().__init__(message, 429)
        self.quota = quota
        self.used = used


def error_from_response(status, body):
    body = body or {}
    message = body.get("error") or f"Request failed with status {status}"

    if status == 400:
        return ValidationError(message)
    if status == 401:
        return AuthenticationError(message)
    if status == 413:
        return PayloadTooLargeError(message, body.get("maxUploadMb"), body.get("fileSizeMb"))
    if status == 422:
        return CompressionError(message)
    if status == 429:
        return RateLimitError(message, body.get("quota"), body.get("used"))
    return WebPNinjaError(message, status)
