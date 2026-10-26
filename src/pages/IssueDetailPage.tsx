import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { NameWithBadge } from "@/components/NameWithBadge";
import { QuestionForm } from "@/components/QuestionForm";
import { ShareButton } from "@/components/ShareButton";
import { issueResponseCount, issueResponsesByPosition } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useDataset } from "@/hooks/useDataset";
import { supabase } from "@/lib/supabase";
import type { Question } from "@/lib/types";

export function IssueDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { dataset: ds, loading } = useDataset();
  const [questions, setQuestions] = useState<Question[]>([]);

  const issue = ds?.issues.find((i) => i.slug === slug);

  useEffect(() => {
    async function loadQuestions() {
      if (!issue?.id) return;
      const { data, error } = await supabase
        .from("questions")
        .select("id, issue_id, question, created_at")
        .eq("issue_id", issue.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setQuestions(data as Question[]);
      }
    }

    loadQuestions();
  }, [issue?.id]);

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading issue details…</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container-page py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Issue Not Found</h1>
        <p className="text-slate-600">The campus issue you are looking for does not exist or has not been published yet.</p>
        <Link to="/issues" className="btn-primary">Browse All Issues</Link>
      </div>
    );
  }

  const groups = issueResponsesByPosition(ds, issue.id);
  const responded = issueResponseCount(ds, issue.id);
  const number = String(ds.issues.length - ds.issues.indexOf(issue)).padStart(3, "0");

  return (
    <article className="container-page space-y-8 py-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Campus Issue #{number} · <span className="text-brand-700 font-bold">{issue.category}</span>
        </p>
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl font-display">{issue.title}</h1>
        {issue.description && <p className="text-lg text-slate-700">{issue.description}</p>}
        {issue.context && (
          <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
            <span className="font-semibold">Context: </span>
            {issue.context}
          </p>
        )}
        <p className="text-sm text-slate-500">
          {responded} of {ds.candidates.length} candidates responded · Published {formatDate(issue.published_at)}
        </p>
        <ShareButton
          url={window.location.href}
          title={issue.title}
          text={`Campus Issue: ${issue.title} — see every candidate's response on AMU Pulse`}
        />
      </header>

      {groups.length === 0 && <p className="text-slate-600">The verified candidate list hasn&apos;t been published yet.</p>}

      {groups.map(({ position, rows }) => (
        <section key={position.id} aria-labelledby={`pos-${position.id}`} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id={`pos-${position.id}`} className="text-lg font-bold font-display">{position.title}</h2>
            <Link to={`/compare?position=${position.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
              Compare all →
            </Link>
          </div>
          <ul className="space-y-3">
            {rows.map(({ candidate, answer }) => (
              <li key={candidate.id} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={candidate.name} photoUrl={candidate.photo_url} size={40} />
                  <div className="flex-1">
                    <Link to={`/candidates/${candidate.slug}`} className="font-semibold hover:underline">
                      <NameWithBadge id={candidate.id} name={candidate.name} claimed={candidate.profile_id !== null} />
                    </Link>
                  </div>
                  <span className={`badge ${answer ? "bg-brand-50 text-brand-700 font-medium" : "bg-slate-100 text-slate-500"}`}>
                    {answer ? "Responded" : "Awaiting response"}
                  </span>
                </div>
                {answer ? (
                  <>
                    <p className="prose-text text-sm">{answer.answer}</p>
                    <p className="text-xs text-slate-500">
                      Updated {formatDate(answer.updated_at)}
                      {answer.source_url && (
                        <>
                          {" · "}
                          <a href={answer.source_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">Source</a>
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-sm italic text-slate-400">No published response to this issue yet.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="questions" className="card space-y-4">
        <h2 id="questions" className="text-lg font-bold font-display">Student questions</h2>
        {questions.length > 0 ? (
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p>{q.question}</p>
                <p className="mt-1 text-xs text-slate-500">Asked {formatDate(q.created_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">No approved questions yet.</p>
        )}
        <QuestionForm issueId={issue.id} issueSlug={issue.slug} />
      </section>
    </article>
  );
}
