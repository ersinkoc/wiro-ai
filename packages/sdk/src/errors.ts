export class WiroError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WiroError';
  }
}

export class WiroAuthError extends WiroError {
  constructor(message: string = 'Authentication failed. Check your WIRO_API_KEY and WIRO_API_SECRET.') {
    super(message);
    this.name = 'WiroAuthError';
  }
}

export class WiroApiError extends WiroError {
  public readonly statusCode: number;
  public readonly responseBody: string;

  constructor(statusCode: number, responseBody: string) {
    super(`Wiro API error (HTTP ${statusCode}): ${responseBody}`);
    this.name = 'WiroApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class WiroTimeoutError extends WiroError {
  public readonly timeoutSeconds: number;

  constructor(timeoutSeconds: number) {
    super(`Task did not complete within ${timeoutSeconds} seconds. Use wiro_task_status to check progress or increase timeout.`);
    this.name = 'WiroTimeoutError';
    this.timeoutSeconds = timeoutSeconds;
  }
}

export class WiroValidationError extends WiroError {
  constructor(message: string) {
    super(message);
    this.name = 'WiroValidationError';
  }
}
