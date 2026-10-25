import { Link } from "react-router-dom";
import { Countdown } from "@/components/Countdown";
import { ElectionTimeline } from "@/components/ElectionTimeline";
import { CandidateCard } from "@/components/CandidateCard";
import { IssueCard } from "@/components/IssueCard";
import { completeness, issueResponseCount, pollingEvent, sortByVotes } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useDataset } from "@/hooks/useDataset";

const STEPS = [
  { title: "Discover", text: "Browse the campus issues students care about and who is contesting.", href: "/candidates" },
  { title: "Question", text: "Read candidates' published responses and submit your own questions.", href: "/issues" },
  { title: "Compare", text: "See every candidate's answer side by side, presented equally.", href: "/compare" },
  { title: "Vote", text: "Choose one candidate for each post, or up to 10 for Cabinet Member.", href: "/vote" },
];

export function HomePage() {
  const { dataset: ds, voteCounts, loading } = useDataset();

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading election data from Supabase…</p>
      </div>
    );
  }

  const polling = pollingEvent(ds);
  const featured = ds.issues.slice(0, 6);
  const trending = ds.positions
    .map((position) => ({
      position,
      rows: sortByVotes(
        ds.candidates.filter((candidate) => candidate.position_id === position.id),
        voteCounts,
      )
        .slice(0, 3)
        .map((candidate) => ({ candidate, votes: voteCounts[candidate.id] ?? 0 })),
    }))
    .filter((group) => group.rows.length > 0);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="container-page grid gap-8 py-12 sm:py-16 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
              AMU Students&apos; Union (AMUSU) election 2026
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl font-display">
              AMU Pulse
              <span className="mt-2 block text-2xl font-semibold sm:text-4xl">
                Your Campus. Your Questions. Your Choice.
              </span>
            </h1>
            <p className="max-w-xl text-brand-50">
              AMU Pulse is an independent guide to the AMUSU election. Don&apos;t just know who is contesting.
              Know what they stand for, compare their answers, and check the published dates.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/issues" className="btn-primary bg-white text-brand-900 hover:bg-brand-50 shadow-md">
                Explore issues
              </Link>
              <Link to="/compare" className="btn-secondary border-white/40 bg-transparent text-white hover:bg-white/10">
                Compare candidates
              </Link>
            </div>
          </div>
          {polling && (
            <div className="space-y-3 rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/10 shadow-lg">
              <p className="text-sm font-semibold text-brand-100">Polling day · {formatDate(polling.starts_at)}</p>
              <Countdown target={polling.starts_at} />
              <p className="text-xs text-brand-100">Voting is 9 am to 5 pm, with a lunch break from 1 pm to 2 pm.</p>
            </div>
          )}
        </div>
      </section>

      <section className="container-page grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) =>
          step.href === "/vote" ? (
            <Link
              key={step.title}
              to="/vote"
              className="flex flex-col justify-between gap-4 rounded-2xl bg-brand-900 p-5 text-white shadow-sm transition hover:bg-brand-700"
            >
              <div>
                <p className="text-sm font-bold text-[#f5c400]">0{i + 1}</p>
                <h2 className="text-lg font-semibold">{step.title}</h2>
                <p className="text-sm text-brand-50">{step.text}</p>
              </div>
              <span className="vote-now self-start">
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                VOTE NOW
                <span className="vote-live">
                  <span className="vote-live-dot" />
                  LIVE
                </span>
              </span>
            </Link>
          ) : (
            <Link key={step.title} to={step.href} className="card block transition hover:border-brand-600 hover:shadow-md">
              <p className="text-sm font-bold text-brand-600">0{i + 1}</p>
              <h2 className="text-lg font-semibold">{step.title}</h2>
              <p className="text-sm text-slate-600">{step.text}</p>
            </Link>
          )
        )}
      </section>

      {trending.length > 0 && (
        <section className="container-page space-y-6 pt-2">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold font-display">Trending by votes</h2>
            <Link to="/candidates" className="text-sm font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {trending.map(({ position, rows }) => (
            <div key={position.id} className="space-y-3">
              <h3 className="text-lg font-bold text-slate-800">{position.title}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map(({ candidate, votes }) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    position={position}
                    stats={completeness(ds, candidate)}
                    votes={votes}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="container-page space-y-4 pt-10">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold font-display">Campus issues</h2>
          <Link to="/issues" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              responses={issueResponseCount(ds, issue.id)}
              total={ds.candidates.length}
            />
          ))}
        </div>
      </section>

      <section className="container-page grid gap-6 py-12 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-xl font-bold font-display">Key dates</h2>
          <ElectionTimeline events={ds.events} />
          <Link to="/election-guide" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Read the election guide →
          </Link>
        </div>
        <div className="card space-y-4">
          <h2 className="text-xl font-bold font-display">At a glance</h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              ["Issues", ds.issues.length],
              ["Candidates", ds.candidates.length],
              ["Answers", ds.answers.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                <dd className="text-2xl font-bold text-brand-700">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-slate-600">
            Are you a candidate?{" "}
            <Link to="/create" className="font-semibold text-brand-700 underline">
              Create your profile
            </Link>
            . If your name is already listed, open that page and choose Claim this profile.
          </p>
        </div>
      </section>
    </>
  );
}
