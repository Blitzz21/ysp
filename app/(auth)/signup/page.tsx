"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getAuthErrorMessage, type AuthErrorPayload } from "@/lib/authErrors";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

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

      router.push("/dashboard");
    } catch {
      setError("Signup failed. Please try again.");
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
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Public Access</p>
            <p className="font-manrope text-lg font-semibold text-navy">Youth Service Philippines</p>
          </div>
        </div>
        <Link className="auth-return" href="/">
          Return to site
        </Link>
      </div>

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
                  {showPasswords ? "Hide" : "Show"}
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
                  {showPasswords ? "Hide" : "Show"}
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-footer mt-6 text-sm">
            <span className="text-muted">Already approved?</span>
            <Link className="font-semibold text-orange-600" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
