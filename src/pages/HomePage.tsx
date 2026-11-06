import { useState } from "react";
import { Link } from "react-router-dom";
import { WinnerCard } from "@/components/WinnerCard";
import { IssueCard } from "@/components/IssueCard";
import { HomeQuestionsSection } from "@/components/HomeQuestionsSection";
import { issueResponseCount } from "@/lib/data";
import { useDataset } from "@/hooks/useDataset";
import type { Candidate, Position } from "@/lib/types";

export function HomePage() {
  const { dataset: ds, loading } = useDataset();
  const [selectedCourtSlug, setSelectedCourtSlug] = useState<string>("all");

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading election results…</p>
      </div>
    );
  }

  // Position lookup map
  const posMap = new Map<string, Position>();
  for (const p of ds.positions) {
    posMap.set(p.id, p);
  }

  // Executive Chair Winners: highest official_votes for each post
  const getTopCandidateForPosition = (slug: string) => {
    return ds.candidates
      .filter((c) => posMap.get(c.position_id)?.slug === slug && c.official_votes != null)
      .sort((a, b) => (b.official_votes ?? 0) - (a.official_votes ?? 0))[0];
  };

  const presidentWinner = getTopCandidateForPosition("president");
  const vpWinner = getTopCandidateForPosition("vice-president");
  const secWinner = getTopCandidateForPosition("honorary-secretary");

  // Cabinet Member Winners: Top 10 by official_votes DESC
  const cabinetWinners = ds.candidates
    .filter((c) => posMap.get(c.position_id)?.slug === "cabinet-member" && c.official_votes != null)
    .sort((a, b) => (b.official_votes ?? 0) - (a.official_votes ?? 0))
    .slice(0, 10);

  // University Court Winners: Top 1 (highest votes) for each faculty court position
  const courtPositions = ds.positions.filter((p) => p.slug.startsWith("court-"));
  const courtWinners = courtPositions
    .map((pos) => getTopCandidateForPosition(pos.slug))
    .filter((c): c is Candidate => Boolean(c))
    .sort((a, b) => (b.official_votes ?? 0) - (a.official_votes ?? 0));

  const filteredCourtWinners = selectedCourtSlug === "all"
    ? courtWinners
    : courtWinners.filter((c) => posMap.get(c.position_id)?.slug === selectedCourtSlug);

  const featured = ds.issues.slice(0, 6);

  return (
    <>
      {/* Hero Announcement Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-950 text-white border-b border-amber-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,196,0,0.15),transparent_50%)] pointer-events-none" />
        <div className="container-page relative py-12 sm:py-16 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-1.5 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            Official Results Declared · AMUSU 2026-27
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-extrabold sm:text-5xl font-display tracking-tight text-white">
              AMUSU Election 2026-27 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                Official Election Results
              </span>
            </h1>
            <p className="text-base sm:text-lg text-brand-100 max-w-2xl leading-relaxed">
              Counting has concluded and the official results have been notified by the Office of the Chief Election Officer,
              Aligarh Muslim University. Meet your newly elected Students&apos; Union representatives and University Court members.
            </p>
          </div>
        </div>
      </section>

      {/* Main Winners Showcase */}
      <main className="container-page py-10 space-y-12">
        {/* 1. Executive Union Chairs (Top 3) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Executive Leadership</span>
              <h2 className="text-2xl font-bold font-display text-slate-900">
                Union Office Bearers
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Elected across university-wide polling
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {presidentWinner && (
              <WinnerCard
                candidate={presidentWinner}
                position={posMap.get(presidentWinner.position_id)}
                highlightChair
              />
            )}
            {vpWinner && (
              <WinnerCard
                candidate={vpWinner}
                position={posMap.get(vpWinner.position_id)}
                highlightChair
              />
            )}
            {secWinner && (
              <WinnerCard
                candidate={secWinner}
                position={posMap.get(secWinner.position_id)}
                highlightChair
              />
            )}
          </div>
        </section>

        {/* 2. AMUSU Cabinet 2026-27 (10 Members) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                10 Elected Cabinet Members
              </span>
              <h2 className="text-2xl font-bold font-display text-slate-900">
                AMUSU Cabinet 2026–27
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
              Ranked by official votes secured
            </span>
          </div>

          {cabinetWinners.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cabinetWinners.map((candidate) => (
                <WinnerCard
                  key={candidate.id}
                  candidate={candidate}
                  position={posMap.get(candidate.position_id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
              No cabinet winners recorded yet. Add official winners in Admin Dashboard.
            </div>
          )}
        </section>

        {/* 3. University Court Members (By Faculty) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Faculty Representation</span>
              <h2 className="text-2xl font-bold font-display text-slate-900">
                University Court Members
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Representatives elected from each AMU faculty to the University Court
            </p>
          </div>

          {/* Faculty filter pills */}
          {courtPositions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCourtSlug("all")}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  selectedCourtSlug === "all"
                    ? "bg-brand-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Faculties ({courtWinners.length})
              </button>
              {courtPositions.map((pos) => {
                const count = courtWinners.filter((c) => c.position_id === pos.id).length;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setSelectedCourtSlug(pos.slug)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      selectedCourtSlug === pos.slug
                        ? "bg-brand-700 text-white font-bold shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pos.title.replace("University Court — ", "")} {count > 0 ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>
          )}

          {filteredCourtWinners.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourtWinners.map((candidate) => (
                <WinnerCard
                  key={candidate.id}
                  candidate={candidate}
                  position={posMap.get(candidate.position_id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
              <p className="font-semibold text-slate-700">No Court Member winners listed for this faculty yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Admin can add elected court representatives from the Admin Candidates tab.
              </p>
            </div>
          )}
        </section>

        {/* 4. Link to Full Candidate List */}
        <section className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-900">Looking for all contestants & full vote tallies?</h3>
            <p className="text-xs text-slate-500">
              Explore the complete roster of contestants, official notifications, and candidate manifestos.
            </p>
          </div>
          <Link
            to="/candidates"
            className="btn-primary py-2.5 px-6 text-xs font-bold shrink-0 shadow-sm"
          >
            View All Candidates & Ballot Roster →
          </Link>
        </section>

        {/* 5. Campus Issues & Student Voices */}
        <section className="space-y-4 pt-4">
          <div className="flex items-end justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Campus Priorities</span>
              <h2 className="text-xl font-bold font-display text-slate-900">Campus Issues Addressed</h2>
            </div>
            <Link to="/issues" className="text-xs font-bold text-brand-700 hover:underline">
              View all issues →
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

        {/* 6. Questions Section */}
        <HomeQuestionsSection issues={ds.issues} />
      </main>
    </>
  );
}
