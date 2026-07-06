export class AppError extends Error {
  readonly status: number;
  readonly isOperational: boolean;

  constructor(
    message: string,
    status = 400,
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.isOperational = isOperational;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
