"use client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type UseAuthStatusOptions = {
  refreshOnFocus?: boolean;
  refreshOnEvents?: boolean;
};

export function useAuthStatus(_options?: UseAuthStatusOptions): {
  status: AuthStatus;
} {
  return { status: "unauthenticated" };
}
