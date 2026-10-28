import React, { useState, useMemo } from "react";
import type { AdminQuestionItem } from "@/lib/admin-api";
import type { Issue } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface AdminQuestionsTabProps {
  questions: AdminQuestionItem[];
  issues: Issue[];
  onReviewQuestion: (questionId: string, decision: "approve" | "reject") => Promise<void>;
  onResetQuestion: (questionId: string) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
  processingQuestionId: string | null;
}

export function AdminQuestionsTab({
  questions,
  issues,
  onReviewQuestion,
  onResetQuestion,
  onDeleteQuestion,
  processingQuestionId,
}: AdminQuestionsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const status = q.moderation_status || "pending";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const textMatch = q.question.toLowerCase().includes(query);
        const issueMatch = (q.issue_title || "").toLowerCase().includes(query);
        const submitterMatch = (q.submitter_name || "").toLowerCase().includes(query);
        if (!textMatch && !issueMatch && !submitterMatch) return false;
      }
      return true;
    });
  }, [questions, search, statusFilter]);

  const pendingCount = questions.filter(
    (q) => !q.moderation_status || q.moderation_status === "pending"
  ).length;

  const approvedCount = questions.filter((q) => q.moderation_status === "approved").length;
  const rejectedCount = questions.filter((q) => q.moderation_status === "rejected").length;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold font-display text-slate-900">
                Student Questions Moderation
              </h2>
              <span className="badge bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5">
                {pendingCount} pending
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Screen student submissions before they appear publicly on campus issue pages
            </p>
          </div>
          {/* Stat pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              Total: <strong className="text-slate-900">{questions.length}</strong>
            </span>
            <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              Approved: <strong>{approvedCount}</strong>
            </span>
            <span className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700">
              Rejected: <strong>{rejectedCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search question text or submitter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{filteredQuestions.length}</strong> of {questions.length}
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-emerald-500 mb-2" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-slate-800">No questions found</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {statusFilter === "pending"
              ? "All student questions have been moderated!"
              : "No questions match the current filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredQuestions.map((q) => {
            const isProcessing = processingQuestionId === q.id;
            const status = q.moderation_status || "pending";
            const isConfirmingDelete = confirmDeleteId === q.id;

            return (
              <div
                key={q.id}
                className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs space-y-3 transition ${
                  isConfirmingDelete
                    ? "border-rose-300 bg-rose-50"
                    : "border-slate-200"
                }`}
              >
                {/* Top row: issue label + status badge + meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60">
                      {q.issue_title || "General Issue"}
                    </span>
                    <span
                      className={`badge text-[10px] font-bold ${
                        status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {q.submitter_name && (
                      <span>By <strong className="text-slate-600">{q.submitter_name}</strong></span>
                    )}
                    {q.created_at && <span>• {formatDateTime(q.created_at)}</span>}
                  </div>
                </div>

                {/* Question text */}
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  "{q.question}"
                </p>

                {/* Delete confirmation inline */}
                {isConfirmingDelete ? (
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-rose-200 bg-rose-50 rounded-b-xl -mx-5 -mb-5 px-5 py-3">
                    <p className="text-xs font-semibold text-rose-800">
                      Permanently delete this question?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isProcessing}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          await onDeleteQuestion(q.id);
                          setConfirmDeleteId(null);
                        }}
                        disabled={isProcessing}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60"
                      >
                        {isProcessing ? "Deleting…" : "Yes, Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {/* Left: status change actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {status !== "approved" && (
                        <button
                          onClick={() => onReviewQuestion(q.id, "approve")}
                          disabled={isProcessing}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                          {isProcessing ? "…" : "✓ Approve"}
                        </button>
                      )}
                      {status !== "rejected" && (
                        <button
                          onClick={() => onReviewQuestion(q.id, "reject")}
                          disabled={isProcessing}
                          className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 transition disabled:opacity-60 border border-rose-200"
                        >
                          {isProcessing ? "…" : "✕ Reject"}
                        </button>
                      )}
                      {status !== "pending" && (
                        <button
                          onClick={() => onResetQuestion(q.id)}
                          disabled={isProcessing}
                          className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition disabled:opacity-60 border border-amber-200"
                        >
                          {isProcessing ? "…" : "↺ Reset to Pending"}
                        </button>
                      )}
                    </div>

                    {/* Right: delete */}
                    <button
                      onClick={() => setConfirmDeleteId(q.id)}
                      disabled={isProcessing}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 disabled:opacity-60"
                      title="Delete question"
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
