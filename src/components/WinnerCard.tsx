import { Link } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import type { Candidate, Position } from "@/lib/types";
import { candidatePlace } from "@/lib/format";

interface WinnerCardProps {
  candidate: Candidate;
  position?: Position;
  highlightChair?: boolean;
}

export function WinnerCard({ candidate, position, highlightChair }: WinnerCardProps) {
  const place = candidatePlace(candidate);
  const votes = candidate.official_votes;
  const isChair = highlightChair || position?.slug === "president" || position?.slug === "vice-president" || position?.slug === "honorary-secretary";

  return (
    <Link
      to={`/candidates/${candidate.slug}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isChair
          ? "border-amber-300/80 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 shadow-md ring-1 ring-amber-400/30"
          : "border-slate-200 bg-white shadow-sm hover:border-brand-500"
      }`}
    >
      {/* Top Banner Accent */}
      <div
        className={`h-2 w-full ${
          isChair
            ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"
            : "bg-gradient-to-r from-brand-600 to-brand-500"
        }`}
      />

      {/* Main Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header Tags: Elected Badge & Ballot No */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
              isChair
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "bg-brand-600 text-white shadow-xs"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
            ELECTED
          </span>

          {candidate.ballot_number && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-600 border border-slate-200">
              SL #{candidate.ballot_number}
            </span>
          )}
        </div>

        {/* Profile Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className={`rounded-full p-1 ${
                isChair
                  ? "bg-gradient-to-tr from-amber-400 to-yellow-200 ring-2 ring-amber-400"
                  : "bg-gradient-to-tr from-brand-600 to-brand-400 ring-2 ring-brand-500"
              }`}
            >
              <Avatar name={candidate.name} photoUrl={candidate.photo_url} />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md text-sm">
              🏆
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-800 line-clamp-1">
              {position?.title}
            </p>
            <h3 className="text-lg font-bold text-slate-950 group-hover:text-brand-700 transition-colors line-clamp-1">
              {candidate.name}
            </h3>
            {place && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{place}</p>}
          </div>
        </div>

        {/* Official Votes Pill */}
        {votes != null && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Official Votes Polled
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-slate-950 tracking-tight">
                {Number(votes).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase">votes</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer link cue */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-right">
        <span className="text-xs font-bold text-brand-700 group-hover:text-brand-800 group-hover:underline inline-flex items-center gap-1">
          View full profile & answers →
        </span>
      </div>
    </Link>
  );
}
