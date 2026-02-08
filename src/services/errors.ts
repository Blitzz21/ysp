export class ValidationError extends Error {
  name = "ValidationError";
}

export class UnauthorizedError extends Error {
  name = "UnauthorizedError";
}

export class ForbiddenError extends Error {
  name = "ForbiddenError";
}

export class NotFoundError extends Error {
  name = "NotFoundError";
}

export class ConflictError extends Error {
  name = "ConflictError";
}

export class RateLimitError extends Error {
  name = "RateLimitError";
}

export class UnexpectedError extends Error {
  name = "UnexpectedError";
}
