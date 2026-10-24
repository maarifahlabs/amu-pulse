import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { submitClaim } from "@/actions/candidates";
import { ClaimSteps } from "@/components/ClaimSteps";
import { NameWithBadge } from "@/components/NameWithBadge";
import { FlashMessage } from "@/components/FlashMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { getViewer } from "@/lib/auth";
import { getDataset } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Submit verification", robots: { index: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> };

export default async function ClaimProfilePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error } = await searchParams;
  const ds = await getDataset();
  const candidate = ds.candidates.find((c) => c.slug === slug);
  if (!candidate) notFound();

  const position = ds.positions.find((p) => p.id === candidate.position_id);
  const viewer = await getViewer();
  const next = `/claim/${candidate.slug}`;

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {position?.title}
          {candidate.ballot_number != null && ` · No. ${String(candidate.ballot_number).padStart(2, "0")}`}
        </p>
        <h1 className="text-2xl font-bold">
          <NameWithBadge id={candidate.id} name={candidate.name} claimed={candidate.profile_id !== null} />
        </h1>
      </header>
      <ClaimSteps current={3} />
      <FlashMessage error={error} />

      {candidate.profile_id ? (
        <p className="card text-sm">This profile has already been claimed. If it is yours, contact the moderators.</p>
      ) : !viewer ? (
        <div className="card space-y-3">
          <p className="text-sm text-slate-700">Log in to submit your email, phone number and proof of candidacy. Your login email can be different from the contact email you submit.</p>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary">Log in to continue</Link>
        </div>
      ) : (
        <form action={submitClaim} className="card space-y-4">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="slug" value={candidate.slug} />
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" required defaultValue={viewer.email ?? ""} autoComplete="email" className="input" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="10-digit mobile number" className="input" />
          </div>
          <div>
            <label htmlFor="proof" className="label">Proof of candidacy</label>
            <textarea
              id="proof"
              name="proof"
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              className="input"
              placeholder="Enrolment number, nomination reference, or another detail a moderator can check"
            />
            <p className="mt-1 text-xs text-slate-500">Visible only to moderators.</p>
          </div>
          <SubmitButton className="btn-primary" pendingLabel="Submitting…">Submit for verification</SubmitButton>
        </form>
      )}
      <Link href="/claim" className="inline-block text-sm font-semibold text-brand-700 hover:underline">Back to search</Link>
    </div>
  );
}
