"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { PasswordToggleIcon } from "@/components/auth/PasswordToggleIcon";
import { LandingHeader } from "@/components/landing/LandingHeader";

function ResetPasswordForm({ userId, secret }: { userId: string; secret: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/recovery/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret, password, confirmPassword }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not reset password.");
      }
      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : "Could not reset password.";
      setError(reason);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-navy">
        New password
        <div className="relative mt-2">
          <input
            className="auth-input pr-12"
            type={showPasswords ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
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
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
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

      {message ? (
        <div className="auth-reveal rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
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
        <span className="inline-flex items-center justify-center gap-2">
          {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
          {loading ? "Updating..." : "Update password"}
        </span>
      </button>
    </form>
  );
}

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const secret = searchParams.get("secret") ?? "";

  return (
    <div className="auth-frame h-dvh w-dvw bg-slate-50 gradient">
      <LandingHeader />
      <div className="auth-panel auth-panel-single h-dvh w-full flex justify-center items-center">
        <section className="auth-card">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Password reset</p>
            <h1 className="font-manrope text-2xl font-semibold text-navy">Create a new password</h1>
            <p className="text-sm text-muted">Choose a strong password to secure your account.</p>
          </div>

          {!userId || !secret ? (
            <div className="auth-reveal mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Invalid or expired reset link. Request a new one from Forgot password.
            </div>
          ) : (
            <ResetPasswordForm userId={userId} secret={secret} />
          )}

          <div className="auth-footer mt-6 text-sm">
            <span className="text-muted">Need to re-authenticate?</span>
            <Link className="font-semibold text-orange-600" href="/login">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
