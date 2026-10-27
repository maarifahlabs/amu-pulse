import React from "react";
import type { AdminTab } from "./AdminSidebar";
import type { AdminCandidateItem, AdminClaimItem, AdminQuestionItem, AdminAuditLogItem } from "@/lib/admin-api";
import type { Position, Issue } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface AdminOverviewTabProps {
  candidates: AdminCandidateItem[];
  claims: AdminClaimItem[];
  questions: AdminQuestionItem[];
  positions: Position[];
  issues: Issue[];
  auditLogs: AdminAuditLogItem[];
  totalVotesCount: number;
  onTabChange: (tab: AdminTab) => void;
  onOpenAddCandidate: () => void;
}

export function AdminOverviewTab({
  candidates,
  claims,
  questions,
  positions,
  issues,
  auditLogs,
  totalVotesCount,
  onTabChange,
  onOpenAddCandidate,
}: AdminOverviewTabProps) {
  const verifiedCandidatesCount = candidates.filter(
    (c) => c.verification_status === "verified"
  ).length;
  const claimedCandidatesCount = candidates.filter((c) => Boolean(c.profile_id)).length;
  const pendingClaimsCount = claims.length;
  const pendingQuestionsCount = questions.filter(
    (q) => !q.moderation_status || q.moderation_status === "pending"
  ).length;

  const verifiedPercent = candidates.length
    ? Math.round((verifiedCandidatesCount / candidates.length) * 100)
    : 0;

  // Candidates grouped by position
  const candidatesByPosition = React.useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    for (const pos of positions) {
      map.set(pos.id, { title: pos.title, count: 0 });
    }
    for (const cand of candidates) {
      const entry = map.get(cand.position_id);
      if (entry) {
        entry.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [positions, candidates]);

  return (
    <div className="space-y-6">
      {/* Action Required Banner */}
      {(pendingClaimsCount > 0 || pendingQuestionsCount > 0) && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/20">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-amber-950 font-display">
                  Urgent Attention Required ({pendingClaimsCount + pendingQuestionsCount} items)
                </h2>
                <p className="mt-0.5 text-xs text-amber-800">
                  {pendingClaimsCount > 0 && (
                    <span className="font-semibold">{pendingClaimsCount} candidate profile claim(s) </span>
                  )}
                  {pendingClaimsCount > 0 && pendingQuestionsCount > 0 && "and "}
                  {pendingQuestionsCount > 0 && (
                    <span className="font-semibold">{pendingQuestionsCount} student question(s) </span>
                  )}
                  are waiting for administrative review and publication approval.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pendingClaimsCount > 0 && (
                <button
                  type="button"
                  onClick={() => onTabChange("claims")}
                  className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
                >
                  Review Claims ({pendingClaimsCount})
                </button>
              )}
              {pendingQuestionsCount > 0 && (
                <button
                  type="button"
                  onClick={() => onTabChange("questions")}
                  className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100/60 transition"
                >
                  Moderate Questions ({pendingQuestionsCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Candidates */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Candidates</span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              {verifiedPercent}% Verified
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-slate-900">{candidates.length}</span>
            <span className="text-xs text-slate-500 font-medium">registered</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{verifiedCandidatesCount} verified</span>
            <span>{claimedCandidatesCount} claimed</span>
          </div>
        </div>

        {/* Pending Claims */}
        <div className={`rounded-2xl border p-4 shadow-xs ${
          pendingClaimsCount > 0 ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-white"
        }`}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Profile Claims</span>
            {pendingClaimsCount > 0 ? (
              <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                Action
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Clear
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-display ${pendingClaimsCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
              {pendingClaimsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">pending review</span>
          </div>
          <div className="mt-2">
            <button
              onClick={() => onTabChange("claims")}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
            >
              Open claims manager →
            </button>
          </div>
        </div>

        {/* Pending Questions */}
        <div className={`rounded-2xl border p-4 shadow-xs ${
          pendingQuestionsCount > 0 ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-white"
        }`}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Questions</span>
            {pendingQuestionsCount > 0 ? (
              <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                Action
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Clear
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-display ${pendingQuestionsCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
              {pendingQuestionsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">awaiting moderation</span>
          </div>
          <div className="mt-2">
            <button
              onClick={() => onTabChange("questions")}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
            >
              Moderate questions →
            </button>
          </div>
        </div>

        {/* Total Student Votes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Ballots</span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              Live
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-slate-900">
              {totalVotesCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">votes cast</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across verified candidate posts
          </div>
        </div>

        {/* Campus Issues */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Campus Issues</span>
            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
              Published
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-slate-900">{issues.length}</span>
            <span className="text-xs text-slate-500 font-medium">topics</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Wi-Fi, Library, Dining & Placements
          </div>
        </div>

        {/* Contested Positions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Election Posts</span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              AMUSU
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-slate-900">{positions.length}</span>
            <span className="text-xs text-slate-500 font-medium">positions</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Executive & Court seats
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Candidate breakdown, Right = Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates per Post (2 Cols on desktop) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">
                Candidates Distribution by Post
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of candidates contesting each AMUSU position
              </p>
            </div>
            <button
              onClick={() => onTabChange("candidates")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              View all candidates →
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {candidatesByPosition.slice(0, 7).map((pos, idx) => {
              const maxCount = candidatesByPosition[0]?.count || 1;
              const percent = Math.min(100, Math.round((pos.count / maxCount) * 100));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate pr-2">{pos.title}</span>
                    <span className="font-mono text-slate-600 font-bold">{pos.count} candidates</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {candidatesByPosition.length > 7 && (
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                onClick={() => onTabChange("positions")}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                + {candidatesByPosition.length - 7} more positions in Electoral Posts tab
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Quick Admin Actions & Audit Activity */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold font-display text-slate-900">Administrative Quick Actions</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenAddCandidate}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    +
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Add New Candidate</div>
                    <div className="text-[11px] text-slate-500">Insert official ballot contestant</div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange("claims")}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Review Claims</div>
                    <div className="text-[11px] text-slate-500">
                      {pendingClaimsCount} pending verification
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange("candidates")}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    ☰
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Manage Roster</div>
                    <div className="text-[11px] text-slate-500">Verify, edit, or remove candidates</div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </button>
            </div>
          </div>

          {/* Recent Audit Trail Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-display text-slate-900">Recent System Activity</h2>
              <button
                onClick={() => onTabChange("audit")}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
              >
                Full audit log →
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No recent activity recorded.</p>
            ) : (
              <div className="space-y-2.5 divide-y divide-slate-100 pt-1">
                {auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="pt-2.5 first:pt-0 space-y-0.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.created_at ? formatDateTime(log.created_at) : "—"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      By <span className="font-semibold">{log.actor_name || "System"}</span> on{" "}
                      <span className="font-semibold text-slate-800">{log.entity_type}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
