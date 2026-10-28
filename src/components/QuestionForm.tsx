import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function QuestionForm({ issueId, issueSlug }: { issueId: string; issueSlug: string }) {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  if (status === "ok") {
    return (
      <div role="status" className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-900 font-medium">
        {message}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (question.trim().length < 10) {
      setStatus("error");
      setMessage("Question must be at least 10 characters.");
      return;
    }

    setPending(true);
    setStatus("idle");
    setMessage("");

    try {
      await api.post("/questions", { issue_id: issueId, question: question.trim() });
      setStatus("ok");
      setMessage("Thanks! Your question has been submitted for moderation.");
      setQuestion("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setPending(false);
    }
  }

  if (!user) {
    return (
      <div className="card bg-slate-50 border-slate-200 space-y-2 text-sm text-slate-700">
        <p className="font-medium">Have a question about this issue?</p>
        <p className="text-slate-600">
          Sign in to submit your question. Your identity is strictly anonymous and never shown publicly.
        </p>
        <Link
          to={`/login?next=${encodeURIComponent(`/issues/${issueSlug}`)}`}
          className="btn-secondary text-sm inline-flex mt-2"
        >
          Sign in to ask
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="question" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          Ask candidates a question about this issue
          <span className="text-rose-500" aria-hidden>*</span>
          <span className="ml-auto text-[10px] font-normal text-slate-400">
            Min 10 · Max 500 characters
          </span>
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setStatus("idle");
          }}
          required
          aria-required="true"
          minLength={10}
          maxLength={500}
          rows={3}
          className={`input text-sm w-full resize-none ${
            question.length > 0 && question.trim().length < 10
              ? "border-rose-400 focus:ring-rose-400"
              : question.trim().length >= 10
              ? "border-emerald-400"
              : ""
          }`}
          placeholder="Keep it respectful and specific. Questions are moderated before appearing publicly."
        />
        <div className="flex items-center justify-between text-xs">
          {question.length > 0 && question.trim().length < 10 ? (
            <p className="text-rose-600 font-medium">
              Too short — need at least {10 - question.trim().length} more character{10 - question.trim().length !== 1 ? "s" : ""}.
            </p>
          ) : (
            <span className="text-slate-400 text-[11px]">Max 5 submissions per 24h · Anonymous</span>
          )}
          <p
            className={`font-medium tabular-nums ml-auto ${
              question.length >= 480
                ? "text-rose-600"
                : question.length >= 400
                ? "text-amber-600"
                : "text-slate-400"
            }`}
          >
            {question.length} / 500
          </p>
        </div>
      </div>

      {status === "error" && message && (
        <p role="alert" className="text-sm text-rose-700 font-medium bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-start gap-2">
          <span className="text-rose-500 font-bold shrink-0 mt-0.5">!</span>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || question.trim().length < 10 || question.trim().length > 500}
        className="btn-primary w-full sm:w-auto text-sm py-2 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
            Submitting…
          </span>
        ) : (
          "Submit question for moderation"
        )}
      </button>
    </form>
  );
}
