import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { CandidateCampaignHub } from "@/components/CandidateCampaignHub";
import { NameWithBadge } from "@/components/NameWithBadge";
import { VoteCount } from "@/components/CandidateCard";
import { CompletenessIndicator } from "@/components/CompletenessIndicator";
import { ProfileViews } from "@/components/ProfileViews";
import { ShareButton } from "@/components/ShareButton";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { completeness, findAnswer, latestManifesto } from "@/lib/data";
import { candidatePlace, formatDate } from "@/lib/format";
import { useDataset } from "@/hooks/useDataset";

export function CandidateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { dataset: ds, voteCounts, loading, refresh } = useDataset();

  const [isEditingSerial, setIsEditingSerial] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [savingSerial, setSavingSerial] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);
  const [serialSuccess, setSerialSuccess] = useState<string | null>(null);

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading candidate profile…</p>
      </div>
    );
  }

  const candidate = ds.candidates.find((c) => c.slug === slug);
  if (!candidate) {
    return (
      <div className="container-page py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Candidate Not Found</h1>
        <p className="text-slate-600">The candidate profile you are looking for does not exist or has not been verified.</p>
        <Link to="/candidates" className="btn-primary">Browse All Candidates</Link>
      </div>
    );
  }

  const position = ds.positions.find((p) => p.id === candidate.position_id);
  const manifesto = latestManifesto(ds, candidate.id);
  const stats = completeness(ds, candidate);
  const votes = voteCounts[candidate.id] ?? 0;

  const isOwner = Boolean(user?.id && candidate.profile_id === user.id);
  const rawSerial = candidate.ballot_number;
  const hasSerial =
    rawSerial !== null &&
    rawSerial !== undefined &&
    String(rawSerial).trim() !== "" &&
    Number(rawSerial) > 0;

  async function handleSaveSerial(e: React.FormEvent) {
    e.preventDefault();
    setSavingSerial(true);
    setSerialError(null);
    setSerialSuccess(null);
    try {
      const trimmed = serialInput.trim();
      const parsed = trimmed === "" ? null : parseInt(trimmed, 10);
      if (parsed !== null && (isNaN(parsed) || parsed < 1)) {
        setSerialError("Please enter a valid positive integer (e.g. 1, 2, 3...).");
        setSavingSerial(false);
        return;
      }
      await api.put<{ success: boolean; ballot_number: number | null }>("/me/candidate/ballot-number", {
        ballot_number: parsed,
      });
      setSerialSuccess("Ballot serial number updated!");
      await refresh();
      setTimeout(() => {
        setSerialSuccess(null);
        setIsEditingSerial(false);
      }, 1500);
    } catch (err: any) {
      setSerialError(err instanceof Error ? err.message : "Failed to update serial number.");
    } finally {
      setSavingSerial(false);
    }
  }

  return (
    <article className="container-page space-y-8 py-8">
      <header className="card relative flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* Official Ballot Serial Number Square Box at Top Right with Green Background */}
        {hasSerial ? (
          <div
            className="sm:absolute sm:top-5 sm:right-5 self-start flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-brand-600 text-white shadow-md border border-brand-700/80 shrink-0 select-none z-10"
            title={`Official Ballot Serial Number: ${rawSerial}`}
          >
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-100 leading-none">
              SL NO.
            </span>
            <span className="text-xl font-black font-mono leading-none mt-1 text-white">
              {String(rawSerial).padStart(2, "0")}
            </span>
          </div>
        ) : isOwner ? (
          <div className="sm:absolute sm:top-5 sm:right-5 self-start">
            <button
              onClick={() => {
                setSerialInput(rawSerial != null ? String(rawSerial) : "");
                setIsEditingSerial(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors cursor-pointer"
            >
              <span>+ Add Serial Number</span>
            </button>
          </div>
        ) : null}

        <Avatar name={candidate.name} photoUrl={candidate.photo_url} size={96} />
        <div className={`flex-1 space-y-2 ${hasSerial ? "sm:pr-18" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{position?.title}</p>
            {isOwner && (
              <button
                onClick={() => {
                  setSerialInput(rawSerial != null ? String(rawSerial) : "");
                  setIsEditingSerial((prev) => !prev);
                }}
                className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 underline ml-2 cursor-pointer"
              >
                {hasSerial ? "Edit Serial Number" : "+ Set Ballot Serial Number"}
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold font-display">
            <NameWithBadge
              id={candidate.id}
              name={candidate.name}
              claimed={candidate.profile_id !== null}
              initialVotes={votes}
            />
          </h1>
          <ProfileViews slug={candidate.slug} />
          <VoteCount votes={votes} large />
          {candidatePlace(candidate) && <p className="text-sm text-slate-600">{candidatePlace(candidate)}</p>}
          <CompletenessIndicator data={stats} />
          {!stats.claimed && (
            <Link to={`/claim/${candidate.slug}`} className="btn-primary inline-flex">Claim this profile</Link>
          )}
          {candidate.official_source_url && (
            <a href={candidate.official_source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline block">
              Official candidature notice
            </a>
          )}
        </div>
      </header>

      {/* Owner Serial Number Edit Card (if opened directly on profile) */}
      {isOwner && isEditingSerial && (
        <div className="card border-2 border-brand-300 bg-brand-50/50 p-5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-950 uppercase tracking-wide flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white font-bold">
                #
              </span>
              Update Official Ballot Serial Number (نمبر شمار)
            </h3>
            <button
              onClick={() => setIsEditingSerial(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Enter your official ballot serial number for this post. It will display immediately in the top right green square box on your candidate card.
          </p>
          {serialError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {serialError}
            </div>
          )}
          {serialSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {serialSuccess}
            </div>
          )}
          <form onSubmit={handleSaveSerial} className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min="1"
              max="999"
              placeholder="e.g. 58"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              className="input font-mono font-bold w-36 text-base"
              autoFocus
            />
            <button
              type="submit"
              disabled={savingSerial}
              className="btn-primary cursor-pointer text-xs py-2 px-4"
            >
              {savingSerial ? "Saving..." : "Save Serial Number"}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ShareButton
          url={window.location.href}
          title={candidate.name}
          text={`See ${candidate.name}'s manifesto and answers to campus issues on AMU Pulse`}
        />
        {position && (
          <Link to={`/compare?position=${position.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
            Compare with other {position.title} candidates →
          </Link>
        )}
      </div>

      <CandidateCampaignHub
        candidate={candidate}
        position={position}
        manifesto={manifesto}
        votes={votes}
      />

      <section className="card space-y-2">
        <h2 className="text-lg font-bold font-display">About</h2>
        {candidate.bio ? <p className="prose-text">{candidate.bio}</p> : <p className="text-sm italic text-slate-400">No bio submitted yet.</p>}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold font-display">Manifesto</h2>
        {manifesto ? (
          <>
            <p className="prose-text">{manifesto.content}</p>
            <p className="text-xs text-slate-500">
              Published {formatDate(manifesto.published_at)}
              {manifesto.source_url && (
                <>
                  {" · "}
                  <a href={manifesto.source_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">Source</a>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm italic text-slate-400">No manifesto published yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold font-display">Responses to campus issues</h2>
        <ul className="space-y-3">
          {ds.issues.map((issue) => {
            const answer = findAnswer(ds, candidate.id, issue.id);
            return (
              <li key={issue.id} className="card space-y-2">
                <Link to={`/issues/${issue.slug}`} className="font-semibold text-brand-900 hover:underline">
                  {issue.title}
                </Link>
                {answer ? (
                  <p className="prose-text text-sm">{answer.answer}</p>
                ) : (
                  <p className="text-sm italic text-slate-400">Awaiting response</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
