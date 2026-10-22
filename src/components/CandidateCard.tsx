import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import type { completeness } from "@/lib/data";
import type { Candidate, Position } from "@/lib/types";

export function CandidateCard({
  candidate,
  position,
  stats,
  votes,
  showCreate = false,
}: {
  candidate: Candidate;
  position: Position | undefined;
  stats: ReturnType<typeof completeness>;
  votes?: number | null;
  showCreate?: boolean;
}) {
  return (
    <article className="card flex flex-col gap-3 transition hover:border-brand-500">
      <Link href={`/candidates/${candidate.slug}`} className="flex gap-4">
        <Avatar name={candidate.name} photoUrl={candidate.photo_url} />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {position?.title}
              {candidate.ballot_number !== null && ` · No. ${String(candidate.ballot_number).padStart(2, "0")}`}
            </p>
            <h3 className="truncate text-base font-semibold">{candidate.name}</h3>
            {candidate.department && <p className="truncate text-sm text-slate-600">{candidate.department}</p>}
          </div>
          <CompletenessIndicator data={stats} />
          {votes != null && (
            <p className="text-xs font-semibold text-brand-800">{votes} {votes === 1 ? "vote" : "votes"}</p>
          )}
        </div>
      </Link>
      {showCreate && candidate.profile_id == null && (
        <Link href={`/claim/${candidate.slug}`} className="btn-primary">Create this profile</Link>
      )}
    </article>
  );
}
