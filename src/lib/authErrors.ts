export type AuthErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unexpected";

export type AuthErrorPayload = {
  error?: string;
  code?: string;
};

const MESSAGE_BY_CODE: Record<AuthErrorCode, string> = {
  validation: "Please review the form fields and try again.",
  unauthorized: "Invalid email or password.",
  forbidden: "Your account does not have permission for this action.",
  not_found: "Account not found.",
  conflict: "This account already exists. Try signing in instead.",
  rate_limited: "Too many attempts. Please wait and try again.",
  unexpected: "Request failed. Please try again.",
};

function isAuthCode(value: string | undefined): value is AuthErrorCode {
  return Boolean(value && value in MESSAGE_BY_CODE);
}

export function getAuthErrorMessage(
  payload: AuthErrorPayload | null,
  fallback: string
): string {
  if (!payload) {
    return fallback;
  }
  if (isAuthCode(payload.code)) {
    if (payload.code === "validation" && payload.error) {
      return payload.error;
    }
    return MESSAGE_BY_CODE[payload.code];
  }
  return payload.error ?? fallback;
}
