"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const metrics = [
  { value: "Admin", label: "Role required" },
  { value: "24/7", label: "Console access" },
  { value: "Secure", label: "Appwrite sessions" },
  { value: "YSP", label: "Mission aligned" },
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!endpoint || !projectId) {
      setError("Appwrite is not configured. Check environment variables.");
      return;
    }

    setLoading(true);
    try {
      const base = endpoint.replace(/\/$/, "");
      const accountResponse = await fetch(`${base}/account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": projectId,
        },
        credentials: "include",
        body: JSON.stringify({
          userId: "unique()",
          email,
          password,
          name,
        }),
      });

      if (!accountResponse.ok) {
        const payload = await accountResponse.json().catch(() => null);
        setError(payload?.message ?? "Signup failed. Please try again.");
        return;
      }

      const sessionResponse = await fetch(`${base}/account/sessions/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": projectId,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!sessionResponse.ok) {
        setError("Account created, but login failed. Please sign in.");
        router.push("/login?created=1");
        return;
      }

      router.push("/admin");
    } catch (err) {
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
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Admin Console</p>
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
            <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Create access</p>
            <h2 className="font-manrope text-2xl font-semibold text-navy">Request admin access</h2>
            <p className="text-sm text-muted">
              Admin accounts are provisioned by YSP leadership. If you are approved, your
              role will be activated on login.
            </p>
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  className="auth-icon-button"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "•" : "?"}
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

        <aside className="auth-aside">
          <div className="auth-aside-card">
            <p className="auth-kicker">Admin readiness</p>
            <h3 className="auth-title">What you can do after approval</h3>
            <p className="auth-copy">
              Create programs, publish opportunities, and manage chapters with secure access
              controls and audit-ready permissions.
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
      </div>
    </div>
  );
}
