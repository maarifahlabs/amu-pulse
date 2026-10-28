import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getRecentApprovedQuestions } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/format";
import type { Issue, Question } from "@/lib/types";

interface HomeQuestionsSectionProps {
  issues: Issue[];
}

export function HomeQuestionsSection({ issues }: HomeQuestionsSectionProps) {
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit form state
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submitPending, setSubmitPending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "ok" | "error">("idle");
  const [submitMsg, setSubmitMsg] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    getRecentApprovedQuestions(8)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedIssueId || questionText.trim().length < 10) return;

    setSubmitPending(true);
    setSubmitStatus("idle");
    setSubmitMsg("");

    try {
      const { data, error } = await supabase.rpc("submit_student_question", {
        p_issue_id: selectedIssueId,
        p_question: questionText.trim(),
      });

      if (error) {
        setSubmitStatus("error");
        setSubmitMsg(error.message);
      } else if (data && !data.success) {
        setSubmitStatus("error");
        setSubmitMsg(data.error || "Failed to submit question.");
      } else {
        setSubmitStatus("ok");
        setSubmitMsg("Your question has been submitted for moderation. It will appear here once approved.");
        setQuestionText("");
        setSelectedIssueId("");
        setFormOpen(false);
      }
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMsg(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitPending(false);
    }
  }

  const getIssueTitle = (issueId?: string | null) =>
    issues.find((i) => i.id === issueId)?.title ?? "Campus Issue";

  const getIssueSlug = (issueId?: string | null) =>
    issues.find((i) => i.id === issueId)?.slug ?? "";

  return (
    <section className="container-page space-y-5 pt-10">
      {/* Section header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Student Questions</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Questions from students — pending candidate responses
          </p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className={`btn-primary text-sm py-2 px-4 transition ${
            formOpen ? "bg-slate-700 hover:bg-slate-800" : ""
          }`}
        >
          {formOpen ? "✕ Cancel" : "+ Ask a question"}
        </button>
      </div>

      {/* Submit form — slide open */}
      {formOpen && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 space-y-4">
          {!user ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm font-semibold text-slate-800">Sign in to submit a question</p>
              <p className="text-xs text-slate-500">
                Your identity is kept anonymous — only your question is shown publicly after moderation.
              </p>
              <Link to="/login?next=/" className="btn-primary text-sm inline-flex">
                Sign in to ask
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-brand-900">
                Ask candidates a question about a campus issue
              </p>
              <p className="text-xs text-slate-500 -mt-2">
                Questions are reviewed before appearing publicly. Max 5 per day. Identity stays anonymous.
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Field 1: Issue (required — must be a published issue) */}
                <div className="space-y-1">
                  <label htmlFor="qs-issue" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Campus issue
                    <span className="text-rose-500" aria-hidden>*</span>
                    <span className="ml-auto text-[10px] font-normal text-slate-400">Required</span>
                  </label>
                  <select
                    id="qs-issue"
                    value={selectedIssueId}
                    onChange={(e) => { setSelectedIssueId(e.target.value); setSubmitStatus("idle"); }}
                    required
                    aria-required="true"
                    className={`input text-sm w-full ${
                      !selectedIssueId && submitStatus === "error"
                        ? "border-rose-400 focus:ring-rose-400"
                        : selectedIssueId
                        ? "border-emerald-400"
                        : ""
                    }`}
                  >
                    <option value="">— Select a campus issue —</option>
                    {issues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.title}
                      </option>
                    ))}
                  </select>
                  {!selectedIssueId && submitStatus === "error" && (
                    <p className="text-xs text-rose-600 font-medium">Please select an issue.</p>
                  )}
                </div>

                {/* Field 2: Question text (10–500 chars, DB check constraint) */}
                <div className="space-y-1">
                  <label htmlFor="qs-text" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Your question
                    <span className="text-rose-500" aria-hidden>*</span>
                    <span className="ml-auto text-[10px] font-normal text-slate-400">
                      Min 10 · Max 500 characters
                    </span>
                  </label>
                  <textarea
                    id="qs-text"
                    value={questionText}
                    onChange={(e) => { setQuestionText(e.target.value); setSubmitStatus("idle"); }}
                    rows={4}
                    maxLength={500}
                    required
                    aria-required="true"
                    aria-describedby="qs-text-hint"
                    placeholder="Keep it respectful and specific — candidates will be asked to respond."
                    className={`input text-sm w-full resize-none ${
                      questionText.length > 0 && questionText.trim().length < 10
                        ? "border-rose-400 focus:ring-rose-400"
                        : questionText.trim().length >= 10
                        ? "border-emerald-400"
                        : ""
                    }`}
                  />
                  <div id="qs-text-hint" className="flex items-center justify-between">
                    {questionText.length > 0 && questionText.trim().length < 10 ? (
                      <p className="text-xs text-rose-600 font-medium">
                        Too short — need at least {10 - questionText.trim().length} more character{10 - questionText.trim().length !== 1 ? "s" : ""}.
                      </p>
                    ) : (
                      <span />
                    )}
                    <p className={`text-xs ml-auto font-medium tabular-nums ${
                      questionText.length >= 480
                        ? "text-rose-600"
                        : questionText.length >= 400
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}>
                      {questionText.length} / 500
                    </p>
                  </div>
                </div>

                {/* Server-side error (covers: rate limit, issue not open, etc.) */}
                {submitStatus === "error" && submitMsg && (
                  <p role="alert" className="text-sm text-rose-700 font-medium bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">!</span>
                    {submitMsg}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    submitPending ||
                    !selectedIssueId ||
                    questionText.trim().length < 10 ||
                    questionText.trim().length > 500
                  }
                  className="btn-primary w-full text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      Submitting…
                    </span>
                  ) : "Submit question for moderation"}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Success toast */}
      {submitStatus === "ok" && (
        <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 font-medium flex items-start gap-2">
          <span className="text-emerald-600 font-bold mt-0.5">✓</span>
          {submitMsg}
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-r-transparent" />
          Loading questions…
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700">No approved questions yet</p>
          <p className="text-xs text-slate-500">Be the first — ask a question above!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {questions.map((q) => {
            const issueSlug = getIssueSlug(q.issue_id);
            const issueTitle = getIssueTitle(q.issue_id);
            return (
              <div
                key={q.id}
                className="card space-y-2.5 hover:border-brand-300 hover:shadow-md transition group"
              >
                {/* Issue tag */}
                <Link
                  to={issueSlug ? `/issues/${issueSlug}` : "/issues"}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-50 border border-brand-200 px-2 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 transition"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z" />
                  </svg>
                  {issueTitle.length > 48 ? issueTitle.slice(0, 48) + "…" : issueTitle}
                </Link>

                {/* Question text */}
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  "{q.question}"
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400">
                    Asked {formatDate(q.created_at)}
                  </p>
                  {issueSlug && (
                    <Link
                      to={`/issues/${issueSlug}`}
                      className="text-[11px] font-semibold text-brand-700 hover:underline opacity-0 group-hover:opacity-100 transition"
                    >
                      See responses →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View all link */}
      {questions.length >= 8 && (
        <div className="text-center pt-2">
          <Link to="/issues" className="text-sm font-semibold text-brand-700 hover:underline">
            Browse all campus issues to see more questions →
          </Link>
        </div>
      )}
    </section>
  );
}
