"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { PasswordToggleIcon } from "@/components/auth/PasswordToggleIcon";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { getAuthErrorMessage, type AuthErrorPayload } from "@/lib/authErrors";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const submitLockRef = useRef(false);

  const redirectTo = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  }, [searchParams]);

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";

  const oauthUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = endpoint.replace(/\/$/, "");
    const origin = window.location.origin;
    const success = `${origin}/login?oauth=1&next=${encodeURIComponent(redirectTo)}`;
    const failure = `${origin}/login?error=oauth`;
    const params = new URLSearchParams({
      project: projectId,
      success,
      failure,
    });
    return `${base}/account/sessions/oauth2/google?${params.toString()}`;
  }, [endpoint, projectId, redirectTo]);

  const exchangeJwt = useCallback(async (): Promise<boolean> => {
    if (!endpoint || !projectId) {
      setError("Appwrite is not configured. Check environment variables.");
      return false;
    }
    const base = endpoint.replace(/\/$/, "");
    const jwtResponse = await fetch(`${base}/account/jwt`, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": projectId,
      },
      credentials: "include",
    });

    if (!jwtResponse.ok) {
      setError("Login succeeded but session sync failed.");
      return false;
    }

    const payload = (await jwtResponse.json()) as { jwt?: string };
    if (!payload.jwt) {
      setError("Session token missing. Please try again.");
      return false;
    }

    const cookieResponse = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jwt: payload.jwt }),
    });

    if (!cookieResponse.ok) {
      setError("Unable to store session locally.");
      return false;
    }

    return true;
  }, [endpoint, projectId]);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    if (oauth !== "1") return;

    setLoading(true);
    exchangeJwt()
      .then((ok) => {
        if (ok) {
          router.replace(redirectTo);
        }
      })
      .finally(() => setLoading(false));
  }, [exchangeJwt, redirectTo, router, searchParams]);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError === "oauth") {
      setError("OAuth login failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setError(null);

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as AuthErrorPayload | null;
        setError(getAuthErrorMessage(payload, "Login failed. Check your credentials."));
        return;
      }

      const payload = (await response.json().catch(() => null)) as { emailVerified?: boolean } | null;
      if (payload?.emailVerified === false) {
        router.push(`/verify-email?next=${encodeURIComponent(redirectTo)}`);
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="auth-frame">
      <LandingHeader fullWidth />

      <div className="auth-panel auth-panel-single">
        <section className="auth-card">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Account login</p>
            <h2 className="font-manrope text-2xl font-semibold text-navy">Welcome back</h2>
            <p className="text-sm text-muted">Sign in with your email or Google account to continue.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-navy">
              Email
              <input
                className="auth-input mt-2"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-semibold text-navy">
              Password
              <div className="relative mt-2">
                <input
                  className="auth-input pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="auth-icon-button"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <PasswordToggleIcon visible={showPassword} />
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-muted">
                <input
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>
              <Link className="text-sm font-semibold text-orange-600 hover:underline" href="/forgot-password">
                Forgot password?
              </Link>
            </div>

            {error ? (
              <div
                ref={errorRef}
                className="auth-reveal rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                data-testid="auth-error"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                tabIndex={-1}
              >
                {error}
              </div>
            ) : null}

            <button
              className="mt-2 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-orange-500"
              type="submit"
              disabled={loading}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </span>
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-gray-200" />
            or
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-navy shadow-soft transition hover:border-orange-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:border-gray-200"
            type="button"
            disabled={loading}
            onClick={() => {
              if (submitLockRef.current || loading) {
                return;
              }
              submitLockRef.current = true;
              if (!oauthUrl) {
                setError("OAuth is not configured. Check Appwrite settings.");
                submitLockRef.current = false;
                setLoading(false);
                return;
              }
              setLoading(true);
              window.location.href = oauthUrl;
            }}
          >
            {loading ? <span className="auth-spinner auth-spinner--dark" aria-hidden="true" /> : <GoogleIcon />}
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="auth-footer mt-6 text-sm">
            <span className="text-muted">Need an account?</span>
            <Link className="font-semibold text-orange-600" href="/signup">
              Create one
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

