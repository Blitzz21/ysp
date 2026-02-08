"use client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type UseAuthStatusOptions = {
  refreshOnFocus?: boolean;
  refreshOnEvents?: boolean;
};

export function useAuthStatus(options?: UseAuthStatusOptions): {
  status: AuthStatus;
} {
  void options;
  return { status: "unauthenticated" };
}
