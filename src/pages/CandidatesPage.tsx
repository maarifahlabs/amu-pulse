import { Link, useSearchParams } from "react-router-dom";
import { CandidateCard } from "@/components/CandidateCard";
import { CandidateFilters } from "@/components/CandidateFilters";
import { completeness, filterCandidates, sortByVotes } from "@/lib/data";
import { useDataset } from "@/hooks/useDataset";
import type { Candidate, Position, Dataset } from "@/lib/types";

export function CandidatesPage() {
  const [searchParams] = useSearchParams();
  const position = searchParams.get("position") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const { dataset: ds, voteCounts, loading } = useDataset();

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading candidates…</p>
      </div>
    );
  }

  const candidates = filterCandidates(ds, { position, q });

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl font-display">Candidates</h1>
        <p className="text-slate-600">
          Candidates are grouped by post, with the most votes first. The checklist shows what each candidate has submitted. It is not a rating.
        </p>
      </header>

      <div className="flex justify-end">
        <Link to="/create" className="btn-primary shadow-sm">
          Create your profile
        </Link>
      </div>
      <CandidateFilters positions={ds.positions} />

      {candidates.length === 0 ? (
        <div className="card text-center py-12 text-slate-600 space-y-2">
          <p className="text-base font-semibold">No candidates found matching your filters.</p>
          {(q || position) && (
            <Link to="/candidates" className="text-brand-700 underline font-medium">
              Clear filters
            </Link>
          )}
        </div>
      ) : position ? (
        <CandidateGrid candidates={sortByVotes(candidates, voteCounts)} positions={ds.positions} ds={ds} voteCounts={voteCounts} />
      ) : (
        <div className="space-y-8">
          {ds.positions.map((post) => {
            const inPost = sortByVotes(candidates.filter((c) => c.position_id === post.id), voteCounts);
            if (inPost.length === 0) return null;
            return (
              <section key={post.id} aria-labelledby={`post-${post.id}`} className="space-y-3">
                <h2 id={`post-${post.id}`} className="text-lg font-bold text-slate-800">
                  {post.title} <span className="text-sm font-medium text-slate-500">({inPost.length})</span>
                </h2>
                <CandidateGrid candidates={inPost} positions={ds.positions} ds={ds} voteCounts={voteCounts} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CandidateGrid({
  candidates,
  positions,
  ds,
  voteCounts,
}: {
  candidates: Candidate[];
  positions: Position[];
  ds: Dataset;
  voteCounts: Record<string, number>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {candidates.map((c) => (
        <CandidateCard
          key={c.id}
          candidate={c}
          position={positions.find((p) => p.id === c.position_id)}
          stats={completeness(ds, c)}
          votes={voteCounts[c.id] ?? 0}
        />
      ))}
    </div>
  );
}
