import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(next);
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            navigate(next);
          }
        });
        return () => subscription.unsubscribe();
      }
    });
  }, [navigate, next]);

  return (
    <div className="container-page max-w-md space-y-4 py-20 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
      <h1 className="text-xl font-bold font-display">Confirming your sign-in…</h1>
      <p className="text-sm text-slate-600">Please wait while we complete your authentication.</p>
    </div>
  );
}
