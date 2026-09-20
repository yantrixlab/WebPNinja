export class WebPNinjaError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'WebPNinjaError';
    this.status = status;
  }
}

export class ValidationError extends WebPNinjaError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends WebPNinjaError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class PayloadTooLargeError extends WebPNinjaError {
  constructor(message, maxUploadMb, fileSizeMb) {
    super(message, 413);
    this.name = 'PayloadTooLargeError';
    this.maxUploadMb = maxUploadMb;
    this.fileSizeMb = fileSizeMb;
  }
}

export class CompressionError extends WebPNinjaError {
  constructor(message) {
    super(message, 422);
    this.name = 'CompressionError';
  }
}

export class RateLimitError extends WebPNinjaError {
  constructor(message, quota, used) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.quota = quota;
    this.used = used;
  }
}

export function errorFromResponse(status, body) {
  const message = body?.error || `Request failed with status ${status}`;

  switch (status) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new AuthenticationError(message);
    case 413:
      return new PayloadTooLargeError(message, body?.maxUploadMb, body?.fileSizeMb);
    case 422:
      return new CompressionError(message);
    case 429:
      return new RateLimitError(message, body?.quota, body?.used);
    default:
      return new WebPNinjaError(message, status);
  }
}
