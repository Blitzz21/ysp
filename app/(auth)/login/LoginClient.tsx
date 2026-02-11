"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const metrics = [
  { value: "120+", label: "Partner chapters" },
  { value: "1.5k+", label: "Active volunteers" },
  { value: "70+", label: "Programs live" },
  { value: "PH", label: "Nationwide reach" },
];

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/admin";
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

  async function exchangeJwt(): Promise<boolean> {
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
  }

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
  }, [redirectTo, router, searchParams]);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError === "oauth") {
      setError("OAuth login failed. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Login failed. Check your credentials.");
        return;
      }

      router.push(redirectTo);
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-frame">
      <div className="auth-nav">
        <div className="auth-brand">
          <span className="auth-logo">YSP</span>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Admin Console</p>
            <p className="font-manrope text-lg font-semibold text-navy">Youth Service Philippines</p>
          </div>
        </div>
        <Link className="auth-return" href="/">
          Return to site
        </Link>
      </div>

      <div className="auth-panel">
        <aside className="auth-aside">
          <div className="auth-aside-card">
            <p className="auth-kicker">Secure access</p>
            <h1 className="auth-title">Sign in to manage YSP programs and chapters.</h1>
            <p className="auth-copy">
              Use your admin credentials or Google account to access the console. All actions
              are tracked and permissioned.
            </p>
            <div className="auth-metrics">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <p className="auth-metric-value">{metric.value}</p>
                  <p className="auth-metric-label">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Admin login</p>
            <h2 className="font-manrope text-2xl font-semibold text-navy">Welcome back</h2>
            <p className="text-sm text-muted">Sign in with your email or Google account.</p>
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
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error ? (
              <div className="auth-reveal rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              className="mt-2 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
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
            onClick={() => {
              if (!oauthUrl) {
                setError("OAuth is not configured. Check Appwrite settings.");
                return;
              }
              window.location.href = oauthUrl;
            }}
          >
            Continue with Google
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

