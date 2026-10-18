import type { Metadata } from "next";
import Link from "next/link";
import { completeMagicLink } from "@/actions/auth";

export const metadata: Metadata = { title: "Confirm login", robots: { index: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  code?: string;
  token_hash?: string;
  type?: string;
  next?: string;
  error_description?: string;
}>;

export default async function AuthCallbackPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/candidate/dashboard";
  const ready = Boolean(params.code || params.token_hash);

  return (
    <div className="container-page max-w-md space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Confirm login</h1>
        <p className="text-sm text-slate-600">
          {ready
            ? "Press Continue to finish signing in. The email link itself does not sign you in."
            : "This login link is missing its sign-in code, or it was already used."}
        </p>
      </header>
      {params.error_description && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {params.error_description}
        </p>
      )}
      {ready ? (
        <form action={completeMagicLink} className="card">
          <input type="hidden" name="code" value={params.code ?? ""} />
          <input type="hidden" name="token_hash" value={params.token_hash ?? ""} />
          <input type="hidden" name="type" value={params.type ?? "magiclink"} />
          <input type="hidden" name="next" value={next} />
          <button className="btn-primary w-full">Continue</button>
        </form>
      ) : (
        <Link href="/login" className="btn-primary">Request a new link</Link>
      )}
    </div>
  );
}
