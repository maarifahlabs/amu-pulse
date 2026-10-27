import React, { useState, useMemo } from "react";
import type { AdminQuestionItem } from "@/lib/admin-api";
import type { Issue } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface AdminQuestionsTabProps {
  questions: AdminQuestionItem[];
  issues: Issue[];
  onReviewQuestion: (questionId: string, decision: "approve" | "reject") => Promise<void>;
  processingQuestionId: string | null;
}

export function AdminQuestionsTab({
  questions,
  issues,
  onReviewQuestion,
  processingQuestionId,
}: AdminQuestionsTabProps) {
  const [search, setSearch] = useState("");
  const [issueFilter, setIssueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Status filter
      const status = q.moderation_status || "pending";
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      // Issue filter
      if (issueFilter !== "all" && q.issue_id !== issueFilter) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const textMatch = q.question.toLowerCase().includes(query);
        const issueMatch = (q.issue_title || "").toLowerCase().includes(query);
        const submitterMatch = (q.submitter_name || "").toLowerCase().includes(query);
        if (!textMatch && !issueMatch && !submitterMatch) return false;
      }

      return true;
    });
  }, [questions, search, issueFilter, statusFilter]);

  const pendingCount = questions.filter(
    (q) => !q.moderation_status || q.moderation_status === "pending"
  ).length;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
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

        {/* Status Pills */}
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              statusFilter === "pending"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              statusFilter === "approved"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              statusFilter === "rejected"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rejected
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search question text or submitter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">All Campus Issues</option>
            {issues.map((issue) => (
              <option key={issue.id} value={issue.id}>
                {issue.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{filteredQuestions.length}</strong> questions
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-emerald-500 mb-2" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-slate-800">No questions to moderate</p>
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

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
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

                <p className="text-sm font-medium text-slate-800 leading-relaxed font-sans">
                  "{q.question}"
                </p>

                {/* Moderation Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  {status !== "approved" && (
                    <button
                      onClick={() => onReviewQuestion(q.id, "approve")}
                      disabled={isProcessing}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      {isProcessing ? "Processing…" : "Approve Question"}
                    </button>
                  )}

                  {status !== "rejected" && (
                    <button
                      onClick={() => onReviewQuestion(q.id, "reject")}
                      disabled={isProcessing}
                      className="btn-danger text-xs py-1.5 px-3"
                    >
                      {isProcessing ? "Processing…" : "Reject"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
