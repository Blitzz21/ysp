"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { PasswordToggleIcon } from "@/components/auth/PasswordToggleIcon";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { getAuthErrorMessage, type AuthErrorPayload } from "@/lib/authErrors";

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

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
    const success = `${origin}/signup?oauth=1&next=${encodeURIComponent(redirectTo)}`;
    const failure = `${origin}/signup?error=oauth`;
    const params = new URLSearchParams({
      project: projectId,
      success,
      failure,
    });
    return `${base}/account/sessions/oauth2/google?${params.toString()}`;
  }, [endpoint, projectId, redirectTo]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

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
      setError("Signup succeeded but session sync failed.");
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
      setError("OAuth signup failed. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, confirmPassword, name }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as AuthErrorPayload | null;
        setError(getAuthErrorMessage(payload, "Signup failed. Please try again."));
        return;
      }

      router.push(redirectTo);
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-frame">
      <LandingHeader fullWidth />

      <div className="auth-panel auth-panel-single">
        <section className="auth-card">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Create account</p>
            <h2 className="font-manrope text-2xl font-semibold text-navy">Join Youth Service Philippines</h2>
            <p className="text-sm text-muted">Create your member account to join chapters and opportunities.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-navy">
              Full name
              <input
                className="auth-input mt-2"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
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
                  type={showPasswords ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  className="auth-icon-button"
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  aria-label={showPasswords ? "Hide password" : "Show password"}
                >
                  <PasswordToggleIcon visible={showPasswords} />
                </button>
              </div>
            </label>
            <label className="block text-sm font-semibold text-navy">
              Confirm password
              <div className="relative mt-2">
                <input
                  className="auth-input pr-12"
                  type={showPasswords ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  className="auth-icon-button"
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  aria-label={showPasswords ? "Hide password" : "Show password"}
                >
                  <PasswordToggleIcon visible={showPasswords} />
                </button>
              </div>
            </label>

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
              className="mt-2 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
                {loading ? "Creating account..." : "Create account"}
              </span>
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-gray-200" />
            or
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-navy shadow-soft transition hover:border-orange-300"
            type="button"
            disabled={loading}
            onClick={() => {
              if (!oauthUrl) {
                setError("OAuth is not configured. Check Appwrite settings.");
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
            <span className="text-muted">Already have an account?</span>
            <Link className="font-semibold text-orange-600" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
