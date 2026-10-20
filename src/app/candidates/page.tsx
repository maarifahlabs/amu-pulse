import type { Metadata } from "next";
import Link from "next/link";
import { CandidateCard } from "@/components/CandidateCard";
import { CandidateFilters } from "@/components/CandidateFilters";
import { completeness, filterCandidates, getDataset } from "@/lib/data";
import type { Candidate, Position } from "@/lib/types";

export const metadata: Metadata = {
  title: "AMUSU election candidates 2026",
  description: "Candidates contesting the AMU Students' Union (AMUSU) election 2026, listed by post in ballot order on AMU Pulse.",
};

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ position?: string; q?: string }> }) {
  const { position, q } = await searchParams;
  const ds = await getDataset();
  const candidates = filterCandidates(ds, { position, q });

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Candidates</h1>
        <p className="text-slate-600">
          Only candidates verified against the official list are shown, in official ballot serial order. The checklist shows what
          each candidate has submitted. It is not a rating.
        </p>
      </header>

      <CandidateFilters positions={ds.positions} position={position} q={q} />

      {candidates.length === 0 ? (
        <p className="text-slate-600">
          No candidates found. {(q || position) && <Link href="/candidates" className="text-brand-700 underline">Clear filters</Link>}
        </p>
      ) : position ? (
        <CandidateGrid candidates={candidates} positions={ds.positions} ds={ds} />
      ) : (
        <div className="space-y-8">
          {ds.positions.map((post) => {
            const inPost = candidates.filter((c) => c.position_id === post.id);
            if (inPost.length === 0) return null;
            return (
              <section key={post.id} aria-labelledby={`post-${post.id}`} className="space-y-3">
                <h2 id={`post-${post.id}`} className="text-lg font-bold">
                  {post.title} <span className="text-sm font-medium text-slate-500">({inPost.length})</span>
                </h2>
                <CandidateGrid candidates={inPost} positions={ds.positions} ds={ds} />
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
}: {
  candidates: Candidate[];
  positions: Position[];
  ds: Awaited<ReturnType<typeof getDataset>>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {candidates.map((c) => (
        <CandidateCard
          key={c.id}
          candidate={c}
          position={positions.find((p) => p.id === c.position_id)}
          stats={completeness(ds, c)}
        />
      ))}
    </div>
  );
}
