import type { Metadata } from "next";
import { sendMagicLink } from "@/actions/auth";
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
          You don&apos;t need an account to browse. Log in only to submit a question or manage a candidate profile. We
          email you a one-time link, so there&apos;s no password.
        </p>
      </header>
      <FlashMessage ok={ok} error={error} />
      <form action={sendMagicLink} className="card space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <button className="btn-primary w-full">Send login link</button>
      </form>
    </div>
  );
}
