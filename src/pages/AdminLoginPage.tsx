import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, auth } from "@/lib/api";

export function AdminLoginPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in as admin, go straight to dashboard
  useEffect(() => {
    if (!authLoading && user && profile?.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [user, profile, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // 1. Sign in with email + password
      try {
        await auth.signInWithPassword(email.trim(), password);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Authentication failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // 2. Fetch profile to verify admin role
      let role: string | undefined;
      try {
        role = (await api.get<{ profile: { role: string } | null }>("/auth/me")).profile?.role;
      } catch {
        // handled below
      }

      if (!role) {
        await auth.signOut();
        setError("Unable to verify your account. Contact the administrator.");
        setSubmitting(false);
        return;
      }

      if (role !== "admin") {
        await auth.signOut();
        setError("Access denied. This portal is restricted to administrators only.");
        setSubmitting(false);
        return;
      }

      // 3. Admin verified — redirect
      navigate("/admin/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="admin-login-bg">
        <div className="admin-login-card">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-r-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-bg">
      {/* Ambient glow effects */}
      <div className="admin-glow admin-glow--1" aria-hidden />
      <div className="admin-glow admin-glow--2" aria-hidden />

      <div className="admin-login-card">
        {/* Shield icon */}
        <div className="admin-shield">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path
              d="M12 2l7.5 4v6c0 5.25-3.3 8.7-7.5 10-4.2-1.3-7.5-4.75-7.5-10V6L12 2z"
              strokeLinejoin="round"
            />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <header className="text-center space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-white">Admin Portal</h1>
          <p className="text-sm text-slate-400">
            Restricted access — authorized personnel only
          </p>
        </header>

        {error && (
          <div className="admin-error" role="alert">
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4L10 11.4l1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email address
            </label>
            <div className="admin-input-wrap">
              <svg viewBox="0 0 20 20" className="admin-input-icon" fill="currentColor">
                <path d="M3 4a2 2 0 00-2 2v1.16l9 4.5 9-4.5V6a2 2 0 00-2-2H3z" />
                <path d="M18 8.84l-9 4.5-9-4.5V14a2 2 0 002 2h14a2 2 0 002-2V8.84z" />
              </svg>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@amu.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="admin-input-wrap">
              <svg viewBox="0 0 20 20" className="admin-input-icon" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input admin-input--password"
                disabled={submitting}
              />
              <button
                type="button"
                tabIndex={-1}
                className="admin-eye-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3.7 2.3a1 1 0 00-1.4 1.4l14 14a1 1 0 001.4-1.4l-1.5-1.5A9.8 9.8 0 0020 10a9.8 9.8 0 00-14.3-5.2L3.7 2.3zM10 5a5 5 0 014.8 6.4l-1.5-1.5a3 3 0 00-3.2-3.2L8.6 5.2A5 5 0 0110 5z"
                      clipRule="evenodd"
                    />
                    <path d="M4.2 7.5A9.4 9.4 0 000 10a9.8 9.8 0 005.2 5.2l1.5-1.5A3 3 0 0110 7a3 3 0 01-2.5 3l-1.5 1.5A5 5 0 015 10a5 5 0 01-.8-2.5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.5 10a9.8 9.8 0 0119 0 9.8 9.8 0 01-19 0zm9.5-5a5 5 0 100 10 5 5 0 000-10z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="admin-submit-btn"
          >
            {submitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Verifying…
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Sign in to Admin Portal
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-2">
          This portal is for AMUSU election administrators.
          <br />
          Students should use the{" "}
          <a href="/login" className="text-emerald-400 hover:text-emerald-300 transition underline underline-offset-2">
            main sign-in
          </a>
          .
        </p>
      </div>
    </div>
  );
}
