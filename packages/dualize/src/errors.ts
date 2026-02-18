const STATUS_MAP: Record<string, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  VALIDATION: 400,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  INTERNAL: 500,
}

export type ErrorCode = "NOT_FOUND" | "FORBIDDEN" | "VALIDATION" | "CONFLICT" | "UNAUTHORIZED" | "INTERNAL"

export class ActionError extends Error {
  readonly code: ErrorCode
  readonly statusCode: number
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = "ActionError"
    this.code = code
    this.statusCode = STATUS_MAP[code] ?? 500
    this.details = details
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      }
    }
  }
}
