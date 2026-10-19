import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import { ProfileViews } from "@/components/ProfileViews";
import { ShareButton } from "@/components/ShareButton";
import { completeness, findAnswer, getDataset, latestManifesto } from "@/lib/data";
import { absoluteUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const ds = await getDataset();
  const candidate = ds.candidates.find((c) => c.slug === slug);
  return candidate ? { ds, candidate } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return {};
  const position = data.ds.positions.find((p) => p.id === data.candidate.position_id);
  return {
    title: `${data.candidate.name} — ${position?.title ?? "Candidate"}`,
    description: `Bio, manifesto and issue responses from ${data.candidate.name}.`,
  };
}

export default async function CandidatePage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { ds, candidate } = data;

  const position = ds.positions.find((p) => p.id === candidate.position_id);
  const manifesto = latestManifesto(ds, candidate.id);
  const stats = completeness(ds, candidate);

  return (
    <article className="container-page space-y-8 py-8">
      <header className="card flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={candidate.name} photoUrl={candidate.photo_url} size={96} />
        <div className="flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{position?.title}</p>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <ProfileViews slug={candidate.slug} />
          <p className="text-sm text-slate-600">{[candidate.department, candidate.faculty].filter(Boolean).join(" · ")}</p>
          <CompletenessIndicator data={stats} />
          {!stats.claimed && (
            <Link href={`/claim/${candidate.slug}`} className="btn-primary">Claim this profile</Link>
          )}
          {candidate.official_source_url && (
            <a href={candidate.official_source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline">
              Official candidature notice
            </a>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ShareButton
          url={absoluteUrl(`/candidates/${candidate.slug}`)}
          title={candidate.name}
          text={`See ${candidate.name}'s manifesto and answers to campus issues on AMU Pulse`}
        />
        {position && (
          <Link href={`/compare?position=${position.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
            Compare with other {position.title} candidates
          </Link>
        )}
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold">About</h2>
        {candidate.bio ? <p className="prose-text">{candidate.bio}</p> : <p className="text-sm italic text-slate-400">No bio submitted yet.</p>}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold">Manifesto</h2>
        {manifesto ? (
          <>
            <p className="prose-text">{manifesto.content}</p>
            <p className="text-xs text-slate-500">
              Published {formatDate(manifesto.published_at)}
              {manifesto.source_url && (
                <>
                  {" · "}
                  <a href={manifesto.source_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">Source</a>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm italic text-slate-400">No manifesto published yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Responses to campus issues</h2>
        <ul className="space-y-3">
          {ds.issues.map((issue) => {
            const answer = findAnswer(ds, candidate.id, issue.id);
            return (
              <li key={issue.id} className="card space-y-2">
                <Link href={`/issues/${issue.slug}`} className="font-semibold hover:underline">{issue.title}</Link>
                {answer ? (
                  <p className="prose-text text-sm">{answer.answer}</p>
                ) : (
                  <p className="text-sm italic text-slate-400">Awaiting response</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
