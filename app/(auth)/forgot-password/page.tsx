"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { LandingHeader } from "@/components/landing/LandingHeader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/recovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Could not send reset email.");
        return;
      }
      setMessage("If your account exists, we sent a reset link to your email.");
      setTimeout(() => messageRef.current?.focus(), 0);
    } catch {
      setError("Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-frame h-screen w-dvw overflow-hidden">
      <LandingHeader />
      <div className="auth-panel auth-panel-single h-full w-full flex justify-center items-center">
        <section className="auth-card">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Account Recovery</p>
            <h1 className="font-manrope text-2xl font-semibold text-navy">Reset your password</h1>
            <p className="text-sm text-muted">Enter your email and we will send your reset link.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-navy">
              Email
              <input
                className="auth-input mt-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@domain.com"
                required
              />
            </label>

            {message ? (
              <div
                ref={messageRef}
                className="auth-reveal rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                role="status"
                tabIndex={-1}
              >
                {message}
              </div>
            ) : null}

            {error ? (
              <div
                className="auth-reveal rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                role="alert"
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
                {loading ? "Sending..." : "Send reset link"}
              </span>
            </button>
          </form>

          <div className="auth-footer mt-6 text-sm">
            <span className="text-muted">Remembered your password?</span>
            <Link className="font-semibold text-orange-600" href="/login">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
