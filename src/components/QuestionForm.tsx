import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
      const { data, error } = await supabase.rpc("submit_student_question", {
        p_issue_id: issueId,
        p_question: question.trim(),
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else if (data && !data.success) {
        setStatus("error");
        setMessage(data.error || "Failed to submit question.");
      } else {
        setStatus("ok");
        setMessage("Thanks! Your question has been submitted for moderation.");
        setQuestion("");
      }
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="question" className="label font-semibold">
        Ask candidates a question about this issue
      </label>
      <textarea
        id="question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        required
        minLength={10}
        maxLength={500}
        rows={3}
        className="input"
        placeholder="Keep it respectful and specific. Questions are moderated before appearing."
      />
      {status === "error" && (
        <p role="alert" className="text-sm text-red-700 font-medium">
          {message}
        </p>
      )}
      <button type="submit" disabled={pending || question.trim().length < 10} className="btn-primary">
        {pending ? "Submitting…" : "Submit question"}
      </button>
    </form>
  );
}
