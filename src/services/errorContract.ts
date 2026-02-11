import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
} from "./errors";

export type DomainErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unexpected";

export type DomainError = {
  code: DomainErrorCode;
  message: string;
  field?: string;
};

const PUBLIC_MESSAGE_BY_CODE: Record<DomainErrorCode, string> = {
  validation: "Please review the highlighted fields and try again.",
  unauthorized: "Authentication required",
  forbidden: "You do not have access to this action.",
  not_found: "The requested resource was not found.",
  conflict: "This record already exists or conflicts with existing data.",
  rate_limited: "Too many requests. Please wait and try again.",
  unexpected: "Request failed. Please try again.",
};

function extractField(message: string): string | undefined {
  const normalized = message.toLowerCase();
  if (normalized.includes("email")) return "email";
  if (normalized.includes("password")) return "password";
  if (normalized.includes("slug")) return "slug";
  if (normalized.includes("title")) return "title";
  if (normalized.includes("description")) return "description";
  if (normalized.includes("date")) return "date";
  if (normalized.includes("sdg")) return "sdgs";
  return undefined;
}

export function normalizeDomainError(error: unknown): DomainError {
  if (error instanceof ValidationError) {
    return { code: "validation", message: error.message, field: extractField(error.message) };
  }
  if (error instanceof UnauthorizedError) {
    return { code: "unauthorized", message: error.message };
  }
  if (error instanceof ForbiddenError) {
    return { code: "forbidden", message: error.message };
  }
  if (error instanceof NotFoundError) {
    return { code: "not_found", message: error.message };
  }
  if (error instanceof ConflictError) {
    return { code: "conflict", message: error.message };
  }
  if (error instanceof RateLimitError) {
    return { code: "rate_limited", message: error.message };
  }
  if (error instanceof UnexpectedError) {
    return { code: "unexpected", message: error.message };
  }
  if (error instanceof Error) {
    return { code: "unexpected", message: error.message };
  }
  return { code: "unexpected", message: "Unknown error" };
}

export function toPublicDomainError(
  error: unknown,
  fallbackMessage?: string
): DomainError {
  const normalized = normalizeDomainError(error);
  if (normalized.code === "validation") {
    return {
      ...normalized,
      message: normalized.message || PUBLIC_MESSAGE_BY_CODE.validation,
    };
  }
  if (normalized.code === "unexpected" && fallbackMessage) {
    return { ...normalized, message: fallbackMessage };
  }
  return {
    ...normalized,
    message: PUBLIC_MESSAGE_BY_CODE[normalized.code],
  };
}

export function fromHttpStatus(
  status: number,
  fallbackMessage?: string
): DomainError {
  if (status === 400) {
    return { code: "validation", message: fallbackMessage ?? PUBLIC_MESSAGE_BY_CODE.validation };
  }
  if (status === 401) {
    return { code: "unauthorized", message: "Invalid email or password." };
  }
  if (status === 403) {
    return { code: "forbidden", message: PUBLIC_MESSAGE_BY_CODE.forbidden };
  }
  if (status === 404) {
    return { code: "not_found", message: PUBLIC_MESSAGE_BY_CODE.not_found };
  }
  if (status === 409) {
    return { code: "conflict", message: PUBLIC_MESSAGE_BY_CODE.conflict };
  }
  if (status === 429) {
    return { code: "rate_limited", message: PUBLIC_MESSAGE_BY_CODE.rate_limited };
  }
  return {
    code: "unexpected",
    message: fallbackMessage ?? PUBLIC_MESSAGE_BY_CODE.unexpected,
  };
}

