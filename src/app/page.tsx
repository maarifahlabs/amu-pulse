import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { ElectionTimeline } from "@/components/ElectionTimeline";
import { IssueCard } from "@/components/IssueCard";
import { getDataset, issueResponseCount, pollingEvent } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

const STEPS = [
  { title: "Discover", text: "Browse the campus issues students care about and who is contesting." },
  { title: "Question", text: "Read candidates' published responses and submit your own questions." },
  { title: "Compare", text: "See every candidate's answer side by side, presented equally." },
];

export default async function HomePage() {
  const ds = await getDataset();
  const polling = pollingEvent(ds);
  const featured = ds.issues.slice(0, 6);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="container-page grid gap-8 py-12 sm:py-16 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">AMU Students&apos; Union Election 2026</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              Your Campus. Your Questions. Your Choice.
            </h1>
            <p className="max-w-xl text-brand-50">
              Don&apos;t just know who is contesting. Know what they stand for. A neutral space to explore issues,
              question candidates and make informed decisions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/issues" className="btn-primary bg-white text-brand-900 hover:bg-brand-50">Explore issues</Link>
              <Link href="/compare" className="btn-secondary border-white/40 bg-transparent text-white hover:bg-white/10">
                Compare candidates
              </Link>
            </div>
          </div>
          {polling && (
            <div className="space-y-3 rounded-2xl bg-white/10 p-5">
              <p className="text-sm font-semibold">Polling day · {formatDate(polling.starts_at)}</p>
              <Countdown target={polling.starts_at} />
              <a href={polling.source_url} target="_blank" rel="noopener noreferrer" className="block text-xs text-brand-100 underline">
                {polling.verified_at ? "Official source" : "Unverified sample date. Check the official notice"}
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="container-page grid gap-4 py-10 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="card">
            <p className="text-sm font-bold text-brand-600">0{i + 1}</p>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="text-sm text-slate-600">{step.text}</p>
          </div>
        ))}
      </section>

      <section className="container-page space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Campus issues</h2>
          <Link href="/issues" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((issue) => (
            <IssueCard key={issue.id} issue={issue} responses={issueResponseCount(ds, issue.id)} total={ds.candidates.length} />
          ))}
        </div>
      </section>

      <section className="container-page grid gap-6 pt-12 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Key dates</h2>
          <ElectionTimeline events={ds.events} />
          <Link href="/election-guide" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Read the election guide
          </Link>
        </div>
        <div className="card space-y-3">
          <h2 className="text-xl font-bold">At a glance</h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              ["Issues", ds.issues.length],
              ["Candidates", ds.candidates.length],
              ["Answers", ds.answers.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-2xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-slate-600">
            Are you a candidate? <Link href="/candidate/dashboard" className="font-semibold text-brand-700 underline">Claim your profile</Link>{" "}
            to publish your bio, manifesto and answers.
          </p>
        </div>
      </section>
    </>
  );
}
