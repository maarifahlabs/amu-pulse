import { useParams, Link } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { VoteCount } from "@/components/CandidateCard";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import { ProfileViews } from "@/components/ProfileViews";
import { ShareButton } from "@/components/ShareButton";
import { completeness, findAnswer, latestManifesto } from "@/lib/data";
import { candidatePlace, formatDate } from "@/lib/format";
import { useDataset } from "@/hooks/useDataset";

export function CandidateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { dataset: ds, voteCounts, loading } = useDataset();

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading candidate profile…</p>
      </div>
    );
  }

  const candidate = ds.candidates.find((c) => c.slug === slug);
  if (!candidate) {
    return (
      <div className="container-page py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Candidate Not Found</h1>
        <p className="text-slate-600">The candidate profile you are looking for does not exist or has not been verified.</p>
        <Link to="/candidates" className="btn-primary">Browse All Candidates</Link>
      </div>
    );
  }

  const position = ds.positions.find((p) => p.id === candidate.position_id);
  const manifesto = latestManifesto(ds, candidate.id);
  const stats = completeness(ds, candidate);
  const votes = voteCounts[candidate.id] ?? 0;

  return (
    <article className="container-page space-y-8 py-8">
      <header className="card flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={candidate.name} photoUrl={candidate.photo_url} size={96} />
        <div className="flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{position?.title}</p>
          <h1 className="text-2xl font-bold font-display">{candidate.name}</h1>
          <ProfileViews slug={candidate.slug} />
          <VoteCount votes={votes} large />
          {candidatePlace(candidate) && <p className="text-sm text-slate-600">{candidatePlace(candidate)}</p>}
          <CompletenessIndicator data={stats} />
          {!stats.claimed && (
            <Link to={`/claim/${candidate.slug}`} className="btn-primary inline-flex">Claim this profile</Link>
          )}
          {candidate.official_source_url && (
            <a href={candidate.official_source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline block">
              Official candidature notice
            </a>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ShareButton
          url={window.location.href}
          title={candidate.name}
          text={`See ${candidate.name}'s manifesto and answers to campus issues on AMU Pulse`}
        />
        {position && (
          <Link to={`/compare?position=${position.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
            Compare with other {position.title} candidates →
          </Link>
        )}
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold font-display">About</h2>
        {candidate.bio ? <p className="prose-text">{candidate.bio}</p> : <p className="text-sm italic text-slate-400">No bio submitted yet.</p>}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold font-display">Manifesto</h2>
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
        <h2 className="text-lg font-bold font-display">Responses to campus issues</h2>
        <ul className="space-y-3">
          {ds.issues.map((issue) => {
            const answer = findAnswer(ds, candidate.id, issue.id);
            return (
              <li key={issue.id} className="card space-y-2">
                <Link to={`/issues/${issue.slug}`} className="font-semibold text-brand-900 hover:underline">
                  {issue.title}
                </Link>
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
