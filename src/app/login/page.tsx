import type { Metadata } from "next";
import { signIn, signInWithGoogle, signUp } from "@/actions/auth";
import { FlashMessage } from "@/components/FlashMessage";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

type SearchParams = Promise<{ next?: string; ok?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, ok, error } = await searchParams;

  return (
    <div className="container-page max-w-md space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="text-sm text-slate-600">
          You don&apos;t need an account to browse. Log in to vote, submit a question, or manage a candidate profile.
        </p>
      </header>
      <FlashMessage ok={ok} error={error} />
      <form action={signInWithGoogle} className="card">
        <input type="hidden" name="next" value={next ?? ""} />
        <SubmitButton className="btn-secondary w-full" pendingLabel="Opening Google…">
          <GoogleLogo />
          Continue with Google
        </SubmitButton>
      </form>
      <form action={signIn} className="card space-y-4">
        <h2 className="font-semibold">Sign in</h2>
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="current-password" className="input" />
        </div>
        <SubmitButton className="btn-primary w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>
      <form action={signUp} className="card space-y-4">
        <h2 className="font-semibold">Create an account</h2>
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label htmlFor="signup-email" className="label">Email address</label>
          <input id="signup-email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="signup-password" className="label">Password</label>
          <input id="signup-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <SubmitButton className="btn-secondary w-full" pendingLabel="Creating account…">Create account</SubmitButton>
      </form>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l6.3 5.3C37.4 38.4 44 34 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
