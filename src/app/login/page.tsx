import type { Metadata } from "next";
import { signIn, signUp } from "@/actions/auth";
import { FlashMessage } from "@/components/FlashMessage";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

type SearchParams = Promise<{ next?: string; ok?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, ok, error } = await searchParams;

  return (
    <div className="container-page max-w-md space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="text-sm text-slate-600">
          You don&apos;t need an account to browse. Log in only to submit a question or manage a candidate profile.
        </p>
      </header>
      <FlashMessage ok={ok} error={error} />
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
        <button className="btn-primary w-full">Sign in</button>
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
        <button className="btn-secondary w-full">Create account</button>
      </form>
    </div>
  );
}
