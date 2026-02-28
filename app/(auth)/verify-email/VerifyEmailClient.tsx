"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LandingHeader } from "@/components/landing/LandingHeader";

type VerifyApiErrorPayload = {
  code?: string;
  error?: string;
};

type VerifyStatusResult = "verified" | "unverified" | "unauthorized" | "error";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusUnauthorized, setStatusUnauthorized] = useState(false);
  const doneRef = useRef(false);
  const syncInFlightRef = useRef(false);

  const userId = searchParams.get("userId") ?? "";
  const secret = searchParams.get("secret") ?? "";
  const hasLinkParams = Boolean(userId && secret);
  const next = useMemo(() => {
    const value = searchParams.get("next");
    return value && value.startsWith("/") ? value : "/dashboard";
  }, [searchParams]);

  const syncVerificationStatus = useCallback(async (): Promise<VerifyStatusResult> => {
    if (syncInFlightRef.current) {
      return "error";
    }
    syncInFlightRef.current = true;
    try {
      const response = await fetch("/api/auth/verify/status", {
        method: "GET",
        cache: "no-store",
      });
      if (response.status === 401) {
        setStatusUnauthorized(true);
        return "unauthorized";
      }
      if (!response.ok) {
        return "error";
      }
      setStatusUnauthorized(false);
      const payload = (await response.json().catch(() => null)) as { emailVerified?: boolean } | null;
      if (payload?.emailVerified === true) {
        setVerified(true);
        setMessage("Your email is already verified. You can continue to your dashboard.");
        setError(null);
        return "verified";
      }
      return "unverified";
    } catch {
      return "error";
    } finally {
      syncInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (hasLinkParams) {
      return;
    }
    syncVerificationStatus().then(() => { });
  }, [hasLinkParams, syncVerificationStatus]);

  useEffect(() => {
    if (verified || statusUnauthorized || hasLinkParams) {
      return;
    }

    const onFocus = () => {
      syncVerificationStatus().then(() => { });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncVerificationStatus().then(() => { });
      }
    };

    const intervalId = window.setInterval(() => {
      syncVerificationStatus().then(() => { });
    }, 2500);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hasLinkParams, statusUnauthorized, syncVerificationStatus, verified]);

  useEffect(() => {
    if (!hasLinkParams || doneRef.current) {
      return;
    }
    doneRef.current = true;
    setVerifying(true);
    setError(null);
    const run = async () => {
      try {
        const response = await fetch("/api/auth/verify/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, secret }),
        });
        const payload = (await response.json().catch(() => null)) as VerifyApiErrorPayload | null;
        if (!response.ok) {
          if (payload?.code === "conflict") {
            setVerified(true);
            setMessage("Your email is already verified. You can continue to your dashboard.");
            setError(null);
            return;
          }
          if (payload?.code === "validation" || payload?.code === "not_found") {
            setError("Verification link is invalid or expired.");
            return;
          }
          if (payload?.code === "unauthorized") {
            setError("Verification could not be completed. Please request a new link.");
            return;
          }
          if (payload?.code === "rate_limited") {
            setError("Too many verification attempts. Please wait and try again.");
            return;
          }
          setError(payload?.error ?? "Verification failed. Please try again.");
          return;
        }
        setVerified(true);
        setMessage("Your email is verified. You can continue to your dashboard.");
      } catch {
        setError("Verification failed. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    run().then(() => { });
  }, [hasLinkParams, secret, userId]);

  async function handleResend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/verify/start", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not resend verification.");
      }
      setMessage("Verification email sent. Check your inbox.");
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : "Could not resend verification.";
      setError(reason);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-frame h-dvh w-dvw bg-slate-50 gradient">
      <LandingHeader />
      <div className="auth-panel auth-panel-single h-dvh w-full flex justify-center items-center">
        <section className="auth-card">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Email verification</p>
            <h1 className="font-manrope text-2xl font-semibold text-navy">Verify your account</h1>
            <p className="text-sm text-muted">
              You must verify your email before accessing dashboards and protected features.
            </p>
          </div>

          {message ? (
            <div className="auth-reveal mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="auth-reveal mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!verified ? (
              <button
                className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                onClick={handleResend}
                disabled={loading || verifying}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
                  {loading ? "Sending..." : "Resend verification email"}
                </span>
              </button>
            ) : null}

            {verified ? (
              <Link
                href={next}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:border-orange-300 hover:text-orange-600"
              >
                Continue
              </Link>
            ) : null}

            <Link className="text-sm font-semibold text-orange-600 hover:underline" href="/login">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
