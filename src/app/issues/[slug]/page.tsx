import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { QuestionForm } from "@/components/QuestionForm";
import { ShareButton } from "@/components/ShareButton";
import { getApprovedQuestions, getDataset, issueResponseCount, issueResponsesByPosition } from "@/lib/data";
import { absoluteUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const ds = await getDataset();
  const issue = ds.issues.find((i) => i.slug === slug);
  return issue ? { ds, issue } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return {};
  const card = absoluteUrl(`/api/card/issue/${slug}`);
  return {
    title: data.issue.title,
    description: data.issue.description ?? undefined,
    openGraph: { title: data.issue.title, description: data.issue.description ?? undefined, images: [card] },
    twitter: { card: "summary_large_image", images: [card] },
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { ds, issue } = data;

  const groups = issueResponsesByPosition(ds, issue.id);
  const responded = issueResponseCount(ds, issue.id);
  const questions = await getApprovedQuestions(issue.id);
  const url = absoluteUrl(`/issues/${issue.slug}`);
  const number = String(ds.issues.length - ds.issues.indexOf(issue)).padStart(3, "0");

  return (
    <article className="container-page space-y-8 py-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Campus Issue #{number} · <span className="text-brand-700">{issue.category}</span>
        </p>
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{issue.title}</h1>
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
          url={url}
          title={issue.title}
          text={`Campus Issue: ${issue.title} — see every candidate's response on AMU Pulse`}
          cardUrl={absoluteUrl(`/api/card/issue/${issue.slug}`)}
        />
      </header>

      {groups.length === 0 && <p className="text-slate-600">The verified candidate list hasn&apos;t been published yet.</p>}

      {groups.map(({ position, rows }) => (
        <section key={position.id} aria-labelledby={`pos-${position.id}`} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id={`pos-${position.id}`} className="text-lg font-bold">{position.title}</h2>
            <Link href={`/compare?position=${position.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
              Compare all
            </Link>
          </div>
          <ul className="space-y-3">
            {rows.map(({ candidate, answer }) => (
              <li key={candidate.id} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={candidate.name} photoUrl={candidate.photo_url} size={40} />
                  <div className="flex-1">
                    <Link href={`/candidates/${candidate.slug}`} className="font-semibold hover:underline">{candidate.name}</Link>
                  </div>
                  <span className={`badge ${answer ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
                    {answer ? "Responded" : "Awaiting response"}
                  </span>
                </div>
                {answer ? (
                  <>
                    <p className="prose-text">{answer.answer}</p>
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
        <h2 id="questions" className="text-lg font-bold">Student questions</h2>
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
