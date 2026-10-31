import { Link } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import { NameWithBadge } from "@/components/NameWithBadge";
import type { completeness } from "@/lib/data";
import { candidatePlace } from "@/lib/format";
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
  const place = candidatePlace(candidate);
  const rawSerial = candidate.ballot_number;
  const hasSerial =
    rawSerial !== null &&
    rawSerial !== undefined &&
    String(rawSerial).trim() !== "" &&
    Number(rawSerial) > 0;

  return (
    <Link
      to={`/candidates/${candidate.slug}`}
      className="card relative flex gap-4 transition hover:border-brand-500 hover:shadow-md"
    >
      {/* Official Ballot Serial Number Square Box at Top Right with Green Background */}
      {hasSerial && (
        <div
          className="absolute top-3.5 right-3.5 flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-brand-600 text-white shadow-md border border-brand-700/80 shrink-0 select-none z-10"
          title={`Official Ballot Serial Number: ${rawSerial}`}
        >
          <span className="text-[8px] font-black uppercase tracking-wider text-emerald-100 leading-none">
            SL NO.
          </span>
          <span className="text-base sm:text-lg font-black font-mono leading-none mt-1 text-white">
            {String(rawSerial).padStart(2, "0")}
          </span>
        </div>
      )}

      <Avatar name={candidate.name} photoUrl={candidate.photo_url} />
      <div className={`min-w-0 flex-1 space-y-2 ${hasSerial ? "pr-14" : ""}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {position?.title}
          </p>
          <h3 className="text-base font-semibold">
            <NameWithBadge
              id={candidate.id}
              name={candidate.name}
              claimed={candidate.profile_id !== null}
              initialVotes={votes ?? 0}
              truncate
            />
          </h3>
          {place && <p className="truncate text-sm text-slate-600">{place}</p>}
        </div>
        <CompletenessIndicator data={stats} />
        {votes != null && <VoteCount votes={votes} />}
      </div>
    </Link>
  );
}
