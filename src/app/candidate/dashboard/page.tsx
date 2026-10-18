import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { submitAnswer, submitClaim, submitManifesto, submitProfileUpdate } from "@/actions/candidates";
import { FlashMessage } from "@/components/FlashMessage";
import { StatusBadge } from "@/components/StatusBadge";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { joinedField } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Candidate dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ok?: string; error?: string }>;

export default async function CandidateDashboard({ searchParams }: { searchParams: SearchParams }) {
  const { ok, error } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <div className="container-page py-12">
        <p className="card">The candidate dashboard needs Supabase to be configured. See the README.</p>
      </div>
    );
  }

  const viewer = await requireViewer("/candidate/dashboard");
  const db = createAdminClient();
  const { data: candidate } = await db
    .from("candidates")
    .select("id, slug, name, bio, photo_url, bio_pending, profile_update_status, verification_status, positions(title)")
    .eq("profile_id", viewer.id)
    .maybeSingle();

  return (
    <div className="container-page space-y-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Candidate dashboard</h1>
          <p className="text-sm text-slate-600">Signed in as {viewer.email}</p>
        </div>
        <div className="flex gap-2">
          {viewer.role === "admin" && <Link href="/admin/dashboard" className="btn-secondary">Admin</Link>}
          <form action={signOut}><button className="btn-secondary">Sign out</button></form>
        </div>
      </header>
      <FlashMessage ok={ok} error={error} />
      {candidate ? <LinkedCandidate candidate={candidate} /> : <ClaimSection viewerId={viewer.id} />}
    </div>
  );
}

async function ClaimSection({ viewerId }: { viewerId: string }) {
  const db = createAdminClient();
  const [{ data: claims }, { data: unclaimed }] = await Promise.all([
    db.from("candidate_claims").select("id, status, created_at, candidates(name)").eq("profile_id", viewerId).order("created_at", { ascending: false }),
    db.from("candidates").select("id, name, positions(title)").is("profile_id", null).neq("verification_status", "rejected").order("name"),
  ]);
  const pending = claims?.find((c) => c.status === "pending");

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-bold">Claim your candidate profile</h2>
      <p className="text-sm text-slate-600">
        Profiles are created by moderators from the official candidate list. Claim yours so you can publish a bio,
        manifesto and answers. A moderator will verify your identity before anything is linked.
      </p>
      {claims && claims.length > 0 && (
        <ul className="space-y-1 text-sm">
          {claims.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span>{joinedField(c.candidates, "name")}</span> <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      )}
      {pending ? (
        <p className="text-sm font-medium">Your claim is awaiting review.</p>
      ) : (
        <form action={submitClaim} className="space-y-3">
          <div>
            <label htmlFor="candidateId" className="label">Your profile</label>
            <select id="candidateId" name="candidateId" required className="input">
              <option value="">Select…</option>
              {(unclaimed ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {joinedField(c.positions, "title")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="evidence" className="label">How can moderators verify you?</label>
            <textarea
              id="evidence"
              name="evidence"
              required
              rows={3}
              className="input"
              placeholder="e.g. enrolment number, official nomination reference, and a phone number moderators can call"
            />
            <p className="mt-1 text-xs text-slate-500">Visible only to moderators.</p>
          </div>
          <button className="btn-primary">Submit claim</button>
        </form>
      )}
    </section>
  );
}

interface LinkedCandidateRow {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  bio_pending: string | null;
  profile_update_status: string | null;
  verification_status: string;
}

async function LinkedCandidate({ candidate }: { candidate: LinkedCandidateRow }) {
  const db = createAdminClient();
  const [{ data: manifestos }, { data: issues }, { data: answers }] = await Promise.all([
    db.from("manifestos").select("id, content, source_url, status, submitted_at").eq("candidate_id", candidate.id).order("submitted_at", { ascending: false }).limit(1),
    db.from("issues").select("id, slug, title, category").eq("status", "published").order("published_at", { ascending: false }),
    db.from("candidate_answers").select("issue_id, answer, source_url, status").eq("candidate_id", candidate.id),
  ]);
  const manifesto = manifestos?.[0];
  const answerByIssue = new Map((answers ?? []).map((a) => [a.issue_id as string, a]));
  const answeredCount = (answers ?? []).filter((a) => a.status === "published").length;

  return (
    <>
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold">{candidate.name}</p>
          <p className="text-sm text-slate-600">
            Listing: <StatusBadge status={candidate.verification_status} /> · {answeredCount}/{issues?.length ?? 0} answers published
          </p>
        </div>
        <Link href={`/candidates/${candidate.slug}`} className="btn-secondary">View public profile</Link>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Bio and photo</h2>
          <StatusBadge status={candidate.profile_update_status} />
        </div>
        <form action={submitProfileUpdate} className="space-y-3">
          <div>
            <label htmlFor="bio" className="label">Bio</label>
            <textarea id="bio" name="bio" required minLength={20} maxLength={2000} rows={5} className="input" defaultValue={candidate.bio_pending ?? candidate.bio ?? ""} />
          </div>
          <div>
            <label htmlFor="photo" className="label">Photo (JPEG, PNG or WebP, max 2 MB)</label>
            <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
          </div>
          <button className="btn-primary">Submit for review</button>
        </form>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Manifesto</h2>
          <StatusBadge status={manifesto?.status ?? null} />
        </div>
        <form action={submitManifesto} className="space-y-3">
          <textarea name="content" required minLength={50} maxLength={10000} rows={10} className="input" defaultValue={manifesto?.content ?? ""} aria-label="Manifesto" />
          <div>
            <label htmlFor="m-source" className="label">Source link (optional, e.g. a PDF of your printed manifesto)</label>
            <input id="m-source" name="sourceUrl" type="url" className="input" defaultValue={manifesto?.source_url ?? ""} />
          </div>
          <button className="btn-primary">Submit for review</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Answer campus issues</h2>
        <p className="text-sm text-slate-600">
          Every candidate receives the same issues. Editing an answer sends it back for review, so the old version stays
          hidden until the new one is approved.
        </p>
        {(issues ?? []).map((issue) => {
          const existing = answerByIssue.get(issue.id);
          return (
            <form key={issue.id} action={submitAnswer} className="card space-y-3">
              <input type="hidden" name="issueId" value={issue.id} />
              <div className="flex items-start justify-between gap-3">
                <Link href={`/issues/${issue.slug}`} className="font-semibold hover:underline">{issue.title}</Link>
                <StatusBadge status={existing?.status ?? null} />
              </div>
              <textarea name="answer" required minLength={20} maxLength={2000} rows={4} className="input" defaultValue={existing?.answer ?? ""} aria-label={`Your answer to: ${issue.title}`} />
              <input name="sourceUrl" type="url" className="input" placeholder="Supporting link (optional)" defaultValue={existing?.source_url ?? ""} aria-label="Supporting link" />
              <button className="btn-primary">{existing ? "Update answer" : "Submit answer"}</button>
            </form>
          );
        })}
      </section>
    </>
  );
}
