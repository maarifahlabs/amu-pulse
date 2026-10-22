import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import type { completeness } from "@/lib/data";
import type { Candidate, Position } from "@/lib/types";

export function VoteCount({ votes, large = false }: { votes: number; large?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-[#f5c400] text-slate-950 shadow-sm ${large ? "px-4 py-2" : "px-3 py-1.5"}`}>
      <span className={`font-extrabold leading-none ${large ? "text-3xl" : "text-xl"}`}>{votes}</span>
      <span className="text-xs font-bold uppercase tracking-wide">{votes === 1 ? "vote" : "votes"}</span>
    </span>
  );
}

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
  return (
    <Link href={`/candidates/${candidate.slug}`} className="card flex gap-4 transition hover:border-brand-500">
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
        {votes != null && <VoteCount votes={votes} />}
      </div>
    </Link>
  );
}
