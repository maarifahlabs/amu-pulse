import type { Metadata } from "next";
import Link from "next/link";
import {
  createCandidate, createEvent, createPosition, moderateQuestion, reviewAnswer, reviewClaim, reviewManifesto,
  reviewProfileUpdate, saveIssue, setCandidateVerification, setEventVerified,
} from "@/actions/admin";
import { signOut } from "@/actions/auth";
import { FlashMessage } from "@/components/FlashMessage";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDateTime, joinedField } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ok?: string; error?: string }>;

function ReviewButtons({ id, action, approveLabel = "Approve" }: { id: string; action: (fd: FormData) => Promise<void>; approveLabel?: string }) {
  return (
    <form action={action} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <button name="decision" value="approve" className="btn-primary px-3 py-1.5">{approveLabel}</button>
      <button name="decision" value="reject" className="btn-danger px-3 py-1.5">Reject</button>
    </form>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-bold">
        {title} {count !== undefined && <span className="badge bg-slate-100 text-slate-700">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-slate-500">Nothing pending.</p>;
}

export default async function AdminDashboard({ searchParams }: { searchParams: SearchParams }) {
  const { ok, error } = await searchParams;
  if (!isSupabaseConfigured) {
    return <div className="container-page py-12"><p className="card">Admin requires Supabase to be configured.</p></div>;
  }

  const admin = await requireAdmin();
  const db = createAdminClient();

  const [claims, profileUpdates, manifestos, answers, questions, events, issues, candidates, positions, logs] = await Promise.all([
    db.from("candidate_claims").select("id, evidence, created_at, candidates(name), profiles!candidate_claims_profile_id_fkey(display_name)").eq("status", "pending").order("created_at"),
    db.from("candidates").select("id, name, bio_pending, photo_pending_url").eq("profile_update_status", "pending"),
    db.from("manifestos").select("id, content, source_url, submitted_at, candidates(name)").eq("status", "pending").order("submitted_at"),
    db.from("candidate_answers").select("id, answer, source_url, updated_at, candidates(name), issues(title)").eq("status", "pending").order("updated_at"),
    db.from("questions").select("id, question, created_at, issues(title)").eq("moderation_status", "pending").order("created_at"),
    db.from("election_events").select("id, title, kind, starts_at, source_url, verified_at").order("starts_at"),
    db.from("issues").select("id, slug, title, description, context, category, status").order("created_at", { ascending: false }),
    db.from("candidates").select("id, name, slug, verification_status, profile_id, positions(title)").order("name"),
    db.from("positions").select("id, title, slug").order("sort_order"),
    db.from("audit_logs").select("id, action, entity_type, created_at, profiles(display_name)").order("created_at", { ascending: false }).limit(40),
  ]);

  return (
    <div className="container-page space-y-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin dashboard</h1>
          <p className="text-sm text-slate-600">Signed in as {admin.email}. Every action is recorded in the audit log.</p>
        </div>
        <form action={signOut}><button className="btn-secondary">Sign out</button></form>
      </header>
      <FlashMessage ok={ok} error={error} />

      <Section title="Candidate claims" count={claims.data?.length}>
        {claims.data?.length ? claims.data.map((c) => (
          <div key={c.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0">
            <p className="text-sm">
              <strong>{joinedField(c.profiles, "display_name") || "Unknown user"}</strong> claims{" "}
              <strong>{joinedField(c.candidates, "name")}</strong>
            </p>
            <p className="rounded-lg bg-slate-50 p-2 text-sm">{c.evidence}</p>
            <p className="text-xs text-slate-500">Verify identity independently before approving.</p>
            <ReviewButtons id={c.id} action={reviewClaim} />
          </div>
        )) : <Empty />}
      </Section>

      <Section title="Profile updates" count={profileUpdates.data?.length}>
        {profileUpdates.data?.length ? profileUpdates.data.map((c) => (
          <div key={c.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0">
            <p className="font-semibold">{c.name}</p>
            {c.photo_pending_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.photo_pending_url} alt={`Submitted photo of ${c.name}`} className="h-24 w-24 rounded-full object-cover" />
            )}
            <p className="prose-text text-sm">{c.bio_pending}</p>
            <ReviewButtons id={c.id} action={reviewProfileUpdate} approveLabel="Publish" />
          </div>
        )) : <Empty />}
      </Section>

      <Section title="Manifestos" count={manifestos.data?.length}>
        {manifestos.data?.length ? manifestos.data.map((m) => (
          <details key={m.id} className="border-b border-slate-100 pb-3 last:border-0">
            <summary className="cursor-pointer font-semibold">{joinedField(m.candidates, "name")}</summary>
            <p className="prose-text my-2 text-sm">{m.content}</p>
            {m.source_url && <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">Source</a>}
            <ReviewButtons id={m.id} action={reviewManifesto} approveLabel="Publish" />
          </details>
        )) : <Empty />}
      </Section>

      <Section title="Issue answers" count={answers.data?.length}>
        {answers.data?.length ? answers.data.map((a) => (
          <div key={a.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0">
            <p className="text-sm"><strong>{joinedField(a.candidates, "name")}</strong> on “{joinedField(a.issues, "title")}”</p>
            <p className="prose-text text-sm">{a.answer}</p>
            {a.source_url && <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">Source</a>}
            <ReviewButtons id={a.id} action={reviewAnswer} approveLabel="Publish" />
          </div>
        )) : <Empty />}
      </Section>

      <Section title="Student questions" count={questions.data?.length}>
        {questions.data?.length ? questions.data.map((q) => (
          <div key={q.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0">
            <p className="text-xs text-slate-500">{joinedField(q.issues, "title")}</p>
            <p className="text-sm">{q.question}</p>
            <ReviewButtons id={q.id} action={moderateQuestion} />
          </div>
        )) : <Empty />}
      </Section>

      <Section title="Election dates and notices">
        <ul className="space-y-2">
          {(events.data ?? []).map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <strong>{e.title}</strong> · {formatDateTime(e.starts_at)} · {e.kind} ·{" "}
                <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="underline">source</a>
              </span>
              <form action={setEventVerified}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="verified" value={e.verified_at ? "false" : "true"} />
                <button className={e.verified_at ? "btn-secondary px-3 py-1.5" : "btn-primary px-3 py-1.5"}>
                  {e.verified_at ? "Unpublish" : "Verified against source: publish"}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createEvent} className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <input name="title" required placeholder="Title" className="input" aria-label="Event title" />
          <input name="startsAt" type="datetime-local" required className="input" aria-label="Date and time (IST)" />
          <select name="kind" className="input" aria-label="Kind" defaultValue="milestone">
            <option value="milestone">Milestone</option>
            <option value="polling">Polling day</option>
            <option value="notice">Notice</option>
          </select>
          <input name="sourceUrl" type="url" required placeholder="Official source URL" className="input" aria-label="Source URL" />
          <input name="description" placeholder="Description (optional)" className="input sm:col-span-2" aria-label="Description" />
          <button className="btn-primary sm:col-span-2">Add event</button>
        </form>
      </Section>

      <Section title="Issues" count={issues.data?.length}>
        {(issues.data ?? []).map((i) => (
          <details key={i.id} className="border-b border-slate-100 pb-3 last:border-0">
            <summary className="cursor-pointer text-sm">
              <strong>{i.title}</strong> <StatusBadge status={i.status} />
            </summary>
            <IssueForm issue={i} />
          </details>
        ))}
        <details className="pt-2">
          <summary className="cursor-pointer font-semibold text-brand-700">+ New issue</summary>
          <IssueForm />
        </details>
      </Section>

      <Section title="Candidates" count={candidates.data?.length}>
        <ul className="space-y-2">
          {(candidates.data ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <Link href={`/candidates/${c.slug}`} className="font-semibold hover:underline">{c.name}</Link> ·{" "}
                {joinedField(c.positions, "title")} · {c.profile_id ? "claimed" : "unclaimed"}
              </span>
              <form action={setCandidateVerification} className="flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <select name="verificationStatus" defaultValue={c.verification_status} className="input py-1.5" aria-label={`Verification for ${c.name}`}>
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified (on official list)</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button className="btn-secondary px-3 py-1.5">Save</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createCandidate} className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <input name="name" required placeholder="Full name" className="input" aria-label="Name" />
          <input name="slug" required placeholder="url-slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" className="input" aria-label="Slug" />
          <select name="positionId" required className="input" aria-label="Position">
            {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <select name="verificationStatus" defaultValue="unverified" className="input" aria-label="Verification">
            <option value="unverified">Unverified</option>
            <option value="verified">Verified (on official list)</option>
          </select>
          <input name="department" placeholder="Department" className="input" aria-label="Department" />
          <input name="faculty" placeholder="Faculty" className="input" aria-label="Faculty" />
          <input name="officialSourceUrl" type="url" placeholder="Official list URL" className="input sm:col-span-2" aria-label="Official source URL" />
          <button className="btn-primary sm:col-span-2">Add candidate</button>
        </form>
      </Section>

      <Section title="Positions">
        <p className="text-sm">{(positions.data ?? []).map((p) => p.title).join(" · ") || "None yet."}</p>
        <form action={createPosition} className="grid gap-2 sm:grid-cols-4">
          <input name="title" required placeholder="Title" className="input" aria-label="Position title" />
          <input name="slug" required placeholder="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" className="input" aria-label="Position slug" />
          <input name="sortOrder" type="number" defaultValue={10} className="input" aria-label="Sort order" />
          <input name="description" placeholder="Description" className="input" aria-label="Position description" />
          <button className="btn-primary sm:col-span-4">Add position</button>
        </form>
      </Section>

      <Section title="Audit log (latest 40)">
        <ul className="space-y-1 text-xs text-slate-600">
          {(logs.data ?? []).map((l) => (
            <li key={l.id}>
              {formatDateTime(l.created_at)} · <strong>{joinedField(l.profiles, "display_name") || "system"}</strong> · {l.action} ({l.entity_type})
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

interface IssueRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  context: string | null;
  category: string;
  status: string;
}

function IssueForm({ issue }: { issue?: IssueRow }) {
  return (
    <form action={saveIssue} className="mt-3 grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="id" value={issue?.id ?? ""} />
      <input name="title" required defaultValue={issue?.title} placeholder="Question-style title" className="input sm:col-span-2" aria-label="Title" />
      <input name="slug" required defaultValue={issue?.slug} placeholder="library-hours" pattern="[a-z0-9]+(-[a-z0-9]+)*" className="input" aria-label="Slug" />
      <input name="category" required defaultValue={issue?.category} placeholder="Category" className="input" aria-label="Category" />
      <textarea name="description" defaultValue={issue?.description ?? ""} placeholder="Neutral description" rows={2} className="input sm:col-span-2" aria-label="Description" />
      <textarea name="context" defaultValue={issue?.context ?? ""} placeholder="Context and trade-offs" rows={2} className="input sm:col-span-2" aria-label="Context" />
      <select name="status" defaultValue={issue?.status ?? "draft"} className="input" aria-label="Status">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
      <button className="btn-primary">Save issue</button>
    </form>
  );
}
