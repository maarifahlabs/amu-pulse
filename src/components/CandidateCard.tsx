import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import type { completeness } from "@/lib/data";
import type { Candidate, Position } from "@/lib/types";

export function CandidateCard({
  candidate,
  position,
  stats,
  views,
}: {
  candidate: Candidate;
  position: Position | undefined;
  stats: ReturnType<typeof completeness>;
  views?: number | null;
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
        {views != null && <p className="text-xs text-slate-500">{views} total views</p>}
      </div>
    </Link>
  );
}
