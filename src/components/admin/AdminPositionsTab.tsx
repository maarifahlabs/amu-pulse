import React from "react";
import type { Position } from "@/lib/types";
import type { AdminCandidateItem } from "@/lib/admin-api";
import type { AdminTab } from "./AdminSidebar";

interface AdminPositionsTabProps {
  positions: Position[];
  candidates: AdminCandidateItem[];
  onTabChange: (tab: AdminTab) => void;
}

export function AdminPositionsTab({
  positions,
  candidates,
  onTabChange,
}: AdminPositionsTabProps) {
  // Compute candidate counts per position
  const candidateCounts = React.useMemo(() => {
    const map = new Map<string, { verified: number; total: number }>();
    for (const c of candidates) {
      const entry = map.get(c.position_id) || { verified: 0, total: 0 };
      entry.total += 1;
      if (c.verification_status === "verified") {
        entry.verified += 1;
      }
      map.set(c.position_id, entry);
    }
    return map;
  }, [candidates]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900">
            AMUSU Electoral Posts & Quotas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of contested union leadership roles, court representative seats, and candidate distributions
          </p>
        </div>

        <button
          onClick={() => onTabChange("candidates")}
          className="btn-primary text-xs py-2 px-3.5 font-bold"
        >
          Manage Candidates →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((pos) => {
          const stats = candidateCounts.get(pos.id) || { verified: 0, total: 0 };
          const isCabinet = pos.slug === "cabinet-member";

          return (
            <div
              key={pos.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    Sort #{pos.sort_order}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    {isCabinet ? "10 Seats Available" : "1 Seat Available"}
                  </span>
                </div>

                <h3 className="text-base font-bold font-display text-slate-900 leading-snug">
                  {pos.title}
                </h3>
                {pos.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {pos.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{stats.total}</span>
                  <span className="text-slate-500 text-[11px] ml-1">
                    contestants ({stats.verified} verified)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onTabChange("candidates")}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                >
                  View candidates →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
