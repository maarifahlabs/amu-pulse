import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "@/lib/api";

// Codes are single-use; StrictMode runs effects twice in development, so share one exchange per code.
const exchanges = new Map<string, Promise<void>>();

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";
  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) {
      navigate(auth.getSession() ? next : "/login", { replace: true });
      return;
    }
    if (!exchanges.has(code)) exchanges.set(code, auth.exchangeCode(code));
    exchanges
      .get(code)!
      .then(() => navigate(next, { replace: true }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
        navigate(`/login?${new URLSearchParams({ error: message, next })}`, { replace: true });
      });
  }, [code, navigate, next]);

  return (
    <div className="container-page max-w-md space-y-4 py-20 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
      <h1 className="text-xl font-bold font-display">Confirming your sign-in…</h1>
      <p className="text-sm text-slate-600">Please wait while we complete your authentication.</p>
    </div>
  );
}
