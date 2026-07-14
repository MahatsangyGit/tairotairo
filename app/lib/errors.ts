export class AppError extends Error {
  readonly status: number;
  readonly isOperational: boolean;
  readonly code?: string;

  constructor(
    message: string,
    status = 400,
    isOperational = true,
    code?: string
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.isOperational = isOperational;
    this.code = code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isPrismaKnownError(
  error: unknown
): error is { code: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    (error as { code: string }).code.startsWith("P")
  );
}
