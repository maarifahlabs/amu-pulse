import type { Metadata } from "next";
import { submitContact } from "@/actions/contact";
import { FlashMessage } from "@/components/FlashMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact AMU Pulse",
  description: "Contact Maarifah Labs about AMU Pulse, the independent guide to the AMUSU election 2026.",
  alternates: { canonical: absoluteUrl("/contact") },
};

type SearchParams = Promise<{ ok?: string; error?: string }>;

export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, error } = await searchParams;

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Contact us</h1>
        <p className="text-slate-600">
          Questions about AMU Pulse go to Maarifah Labs at{" "}
          <a href="mailto:contact@maarifahlabs.com" className="font-semibold text-brand-700 underline">contact@maarifahlabs.com</a>.
        </p>
      </header>
      <FlashMessage ok={ok} error={error} />
      <form action={submitContact} className="card space-y-4">
        <div className="hidden" aria-hidden>
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" required minLength={2} maxLength={80} className="input" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="message" className="label">Message</label>
          <textarea id="message" name="message" required minLength={10} maxLength={2000} rows={6} className="input" />
        </div>
        <SubmitButton className="btn-primary" pendingLabel="Sending…">Send message</SubmitButton>
      </form>
    </div>
  );
}
