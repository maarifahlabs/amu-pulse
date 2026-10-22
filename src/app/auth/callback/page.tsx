import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AuthContinue } from "@/components/AuthContinue";

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
  const stored = (await cookies()).get("amu_auth_next")?.value;
  const requested = params.next || stored;
  const next = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  const ready = Boolean(params.code || params.token_hash);

  return (
    <div className="container-page max-w-md space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Confirm login</h1>
        <p className="text-sm text-slate-600">
          {ready
            ? "Finishing sign-in."
            : "This login link is missing its sign-in code, or it was already used."}
        </p>
      </header>
      {params.error_description && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {params.error_description}
        </p>
      )}
      {ready ? (
        <AuthContinue
          code={params.code ?? ""}
          tokenHash={params.token_hash ?? ""}
          type={params.type ?? "magiclink"}
          next={next}
        />
      ) : (
        <Link href="/login" className="btn-primary">Request a new link</Link>
      )}
    </div>
  );
}
