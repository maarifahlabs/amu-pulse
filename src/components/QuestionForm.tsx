"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitQuestion, type QuestionFormState } from "@/actions/questions";

const initial: QuestionFormState = { status: "idle", message: "" };

export function QuestionForm({ issueId, issueSlug }: { issueId: string; issueSlug: string }) {
  const [state, action, pending] = useActionState(submitQuestion, initial);

  if (state.status === "ok") {
    return <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">{state.message}</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="issueId" value={issueId} />
      <div aria-hidden className="hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label htmlFor="question" className="label">Ask candidates a question about this issue</label>
      <textarea
        id="question"
        name="question"
        required
        minLength={10}
        maxLength={500}
        rows={3}
        className="input"
        placeholder="Keep it respectful and specific. Questions are moderated before appearing."
      />
      {state.status === "error" && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
      {state.status === "login" && (
        <p role="alert" className="text-sm text-slate-700">
          {state.message}{" "}
          <Link href={`/login?next=${encodeURIComponent(`/issues/${issueSlug}`)}`} className="font-semibold text-brand-700 underline">
            Log in
          </Link>
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Submitting…" : "Submit question"}
      </button>
    </form>
  );
}
