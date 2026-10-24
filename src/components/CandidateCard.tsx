import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import { LiveVoteCount } from "@/components/VoteCounts";
import { NameWithBadge } from "@/components/NameWithBadge";
import { VoteCount } from "@/components/VoteCount";
import type { completeness } from "@/lib/data";
import { candidatePlace } from "@/lib/format";
import type { Candidate, Position } from "@/lib/types";

export { VoteCount };

export function CandidateCard({
  candidate,
  position,
  stats,
  votes,
}: {
  candidate: Candidate;
  position: Position | undefined;
  stats: ReturnType<typeof completeness>;
  votes?: number | null;
}) {
  const place = candidatePlace(candidate);
  const search = `${candidate.name} ${candidate.faculty ?? ""} ${candidate.department ?? ""}`.toLowerCase();
  return (
    <Link
      href={`/candidates/${candidate.slug}`}
      prefetch={false}
      data-candidate=""
      data-id={candidate.id}
      data-name={candidate.name}
      data-position={position?.slug ?? ""}
      data-search={search}
      className="card flex gap-4 transition hover:border-brand-500"
    >
      <Avatar name={candidate.name} photoUrl={candidate.photo_url} />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {position?.title}
            {candidate.ballot_number !== null && ` · No. ${String(candidate.ballot_number).padStart(2, "0")}`}
          </p>
          <h3 className="text-base font-semibold">
            <NameWithBadge id={candidate.id} name={candidate.name} claimed={candidate.profile_id !== null} initialVotes={votes ?? 0} truncate />
          </h3>
          {place && <p className="truncate text-sm text-slate-600">{place}</p>}
        </div>
        <CompletenessIndicator data={stats} />
        {votes != null && <LiveVoteCount id={candidate.id} initial={votes} />}
      </div>
    </Link>
  );
}
