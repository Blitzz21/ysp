"use client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type UseAuthStatusOptions = {
  refreshOnFocus?: boolean;
  refreshOnEvents?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub: options reserved for future use
export function useAuthStatus(_options?: UseAuthStatusOptions): {
  status: AuthStatus;
} {
  return { status: "unauthenticated" };
}
