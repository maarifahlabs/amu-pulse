import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareExplorer } from "@/components/CompareExplorer";
import { getDataset } from "@/lib/data";

export const metadata: Metadata = {
  title: "Compare AMUSU election candidates",
  description: "Compare AMU Students' Union (AMUSU) election 2026 candidates side by side. AMU Pulse presents their published answers equally.",
};

export const revalidate = 1800;

export default async function ComparePage() {
  const ds = await getDataset();
  const answers: Record<string, string> = {};
  for (const answer of ds.answers) answers[`${answer.candidate_id}:${answer.issue_id}`] = answer.answer;

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Compare candidates</h1>
        <p className="text-slate-600">
          Candidates appear in official ballot serial order with identical layout. Nothing here is ranked or scored.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading comparison…</p>}>
        <CompareExplorer
          positions={ds.positions.map((position) => ({ id: position.id, slug: position.slug, title: position.title }))}
          candidates={ds.candidates.map((candidate) => ({
            id: candidate.id,
            slug: candidate.slug,
            name: candidate.name,
            photoUrl: candidate.photo_url,
            positionId: candidate.position_id,
            ballot: candidate.ballot_number,
            claimed: candidate.profile_id !== null,
          }))}
          issues={ds.issues.map((issue) => ({ id: issue.id, slug: issue.slug, title: issue.title }))}
          answers={answers}
        />
      </Suspense>
    </div>
  );
}
