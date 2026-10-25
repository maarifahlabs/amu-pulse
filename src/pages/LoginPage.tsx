import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FlashMessage } from "@/components/FlashMessage";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";
  const ok = searchParams.get("ok") || undefined;
  const error = searchParams.get("error") || undefined;
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(next);
    return null;
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      await signInWithGoogle(next);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-md space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold font-display">Signup/Signin</h1>
        <p className="text-sm text-slate-600">
          You don&apos;t need an account to browse. Signin to vote, submit a question, or manage a candidate profile.
        </p>
      </header>

      <FlashMessage ok={ok} error={error} />

      <div className="card">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-secondary w-full flex items-center justify-center gap-3 py-3 font-semibold hover:bg-slate-50 transition border border-slate-300"
        >
          <GoogleLogo />
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l6.3 5.3C37.4 38.4 44 34 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
