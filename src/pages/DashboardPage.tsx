import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CandidateCampaignHub } from "@/components/CandidateCampaignHub";
import { CandidatePhotoUpload } from "@/components/CandidatePhotoUpload";
import { NameWithBadge } from "@/components/NameWithBadge";
import { YourVotes } from "@/components/YourVotes";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useDataset } from "@/hooks/useDataset";

export function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { dataset: ds, voteCounts, refresh } = useDataset();
  const navigate = useNavigate();

  const [linkedCandidate, setLinkedCandidate] = useState<any | null>(null);
  const [candidateClaims, setCandidateClaims] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Candidate edit state
  const [bio, setBio] = useState("");
  const [ballotNumber, setBallotNumber] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingBio, setSavingBio] = useState(false);
  const [savingBallotNumber, setSavingBallotNumber] = useState(false);
  const [savingManifesto, setSavingManifesto] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ballotError, setBallotError] = useState<string | null>(null);
  const [ballotSuccess, setBallotSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?next=/candidate/dashboard");
    }
  }, [user, authLoading, navigate]);

  async function loadCandidateDetails(userId: string) {
    setLoadingProfile(true);
    try {
      const [candidate, claims] = await Promise.all([
        api.get<any>("/me/candidate").catch(() => null),
        api.get<any[]>("/me/claims").catch(() => null),
      ]);

      if (candidate) {
        setLinkedCandidate(candidate);
        setBio(candidate.bio || "");
        setBallotNumber(candidate.ballot_number != null ? String(candidate.ballot_number) : "");
      }
      if (claims) {
        setCandidateClaims(claims);
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadCandidateDetails(user.id);
    }
  }, [user?.id]);

  async function handleSaveBallotNumber(e: React.FormEvent) {
    e.preventDefault();
    setSavingBallotNumber(true);
    setBallotError(null);
    setBallotSuccess(null);
    try {
      const trimmed = ballotNumber.trim();
      const parsed = trimmed === "" ? null : parseInt(trimmed, 10);
      if (parsed !== null && (isNaN(parsed) || parsed < 1)) {
        setBallotError("Please enter a valid positive number (e.g. 1, 2, 3...).");
        setSavingBallotNumber(false);
        return;
      }
      const res = await api.put<{ success: boolean; ballot_number: number | null }>("/me/candidate/ballot-number", {
        ballot_number: parsed,
      });
      setLinkedCandidate((prev: any) => (prev ? { ...prev, ballot_number: res.ballot_number } : prev));
      setBallotNumber(res.ballot_number != null ? String(res.ballot_number) : "");
      setBallotSuccess(
        res.ballot_number != null
          ? `Official Ballot Serial #${res.ballot_number} saved successfully!`
          : "Ballot serial number cleared.",
      );
      try {
        await refresh();
      } catch {
        // Dataset refresh non-critical
      }
      setTimeout(() => setBallotSuccess(null), 4000);
    } catch (err: any) {
      setBallotError(err instanceof Error ? err.message : "Failed to update ballot serial number.");
    } finally {
      setSavingBallotNumber(false);
    }
  }

  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault();
    setSavingBio(true);
    setMessage(null);
    try {
      await api.put("/me/candidate/bio", { bio });
      setMessage("Bio saved successfully!");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update bio.");
    } finally {
      setSavingBio(false);
    }
  }

  async function handleSaveManifesto(e: React.FormEvent) {
    e.preventDefault();
    setSavingManifesto(true);
    setMessage(null);
    try {
      await api.post("/me/candidate/manifestos", { content: manifesto });
      setMessage("Manifesto published successfully!");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit manifesto.");
    } finally {
      setSavingManifesto(false);
    }
  }

  async function handleSaveAnswer(issueId: string) {
    const text = answers[issueId];
    if (!text?.trim()) return;
    setSavingAnswer(issueId);
    setMessage(null);
    try {
      await api.put(`/me/candidate/answers/${issueId}`, { answer: text.trim() });
      setMessage("Answer submitted successfully!");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit answer.");
    } finally {
      setSavingAnswer(null);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Checking your account…</p>
      </div>
    );
  }

  return (
    <div className="container-page space-y-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Your Account</h1>
          <p className="text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-800">{user.email}</span></p>
        </div>
        <div className="flex gap-2">
          {profile?.role === "admin" && (
            <Link to="/admin/dashboard" className="btn-secondary">
              Admin Dashboard
            </Link>
          )}
          <button onClick={() => signOut()} className="btn-secondary">
            Sign out
          </button>
        </div>
      </header>

      {message && (
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 text-sm font-medium text-brand-900">
          {message}
        </div>
      )}

      {/* Student Votes Section */}
      <YourVotes profileId={user.id} />

      {/* Candidate Profile Section */}
      {loadingProfile ? (
        <div className="card text-center py-8 text-sm text-slate-500 animate-pulse">
          Loading profile details…
        </div>
      ) : linkedCandidate ? (
        <div className="space-y-6">
          {/* Campaign & Reminder Hub temporarily disabled
          <CandidateCampaignHub
            candidate={linkedCandidate}
            position={linkedCandidate.positions}
            manifesto={{ content: manifesto }}
            votes={linkedCandidate?.id ? (voteCounts[linkedCandidate.id] ?? 0) : 0}
          />
          */}

          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-brand-50 text-brand-700 font-semibold uppercase text-xs">
                    {linkedCandidate.positions?.title || "Candidate"}
                  </span>
                  {linkedCandidate.verification_status === "verified" ? (
                    <span className="badge bg-emerald-100 text-emerald-800 font-bold text-xs">
                      ✓ Verified
                    </span>
                  ) : linkedCandidate.verification_status === "rejected" ? (
                    <span className="badge bg-rose-100 text-rose-800 font-bold text-xs">
                      ✕ Rejected
                    </span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-800 font-bold text-xs">
                      ⏳ Pending Verification
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold font-display mt-1">
                  <NameWithBadge id={linkedCandidate.id} name={linkedCandidate.name} claimed />
                </h2>
              </div>
              <Link to={`/candidates/${linkedCandidate.slug}`} className="btn-secondary text-sm">
                View Public Profile →
              </Link>
            </div>

            <CandidatePhotoUpload
              name={linkedCandidate.name}
              photoUrl={linkedCandidate.photo_url ?? null}
              onUploaded={(url) => setLinkedCandidate((prev: any) => (prev ? { ...prev, photo_url: url } : prev))}
            />

            {linkedCandidate.verification_status === "unverified" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <span className="text-base leading-none">⏳</span>
                <div>
                  <span className="font-bold">Nomination Under Review: </span>
                  Your profile has been created and is awaiting official verification by election administrators against the AMU University ballot list. You can update your bio, manifesto, and stance answers below while review is pending.
                </div>
              </div>
            )}

            {/* Official Ballot Serial Number Box & Editor */}
            <div className="rounded-xl border border-brand-200/90 bg-gradient-to-br from-brand-50/60 via-white to-slate-50/50 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-brand-600 text-white font-bold text-xs uppercase tracking-wider">
                      Official Ballot
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Serial Number
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-slate-900">
                    Ballot Serial Number (نمبر شمار)
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    Set your official serial number assigned on the AMUSU election ballot. It appears in the green square box at the top right of your candidate card and on your profile.
                  </p>
                </div>

                {/* Live Preview of the Green Serial Number Box */}
                <div className="shrink-0 flex items-center sm:justify-end">
                  <div
                    className="flex flex-col items-center justify-center rounded-xl bg-brand-600 px-4 py-1.5 text-white shadow-sm border border-brand-700 min-w-[56px]"
                    title="How your serial number appears on candidate cards"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-100 leading-none">
                      Ballot
                    </span>
                    <span className="text-xl font-black font-mono leading-tight mt-0.5">
                      {linkedCandidate.ballot_number != null
                        ? `#${String(linkedCandidate.ballot_number).padStart(2, "0")}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {ballotError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 flex items-center gap-2">
                  <span className="text-base leading-none">⚠️</span>
                  <span>{ballotError}</span>
                </div>
              )}

              {ballotSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
                  <span className="text-base leading-none">✓</span>
                  <span>{ballotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveBallotNumber} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
                <div className="w-full sm:w-48">
                  <label htmlFor="ballot_number" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Enter Serial Number
                  </label>
                  <input
                    id="ballot_number"
                    type="number"
                    min="1"
                    max="999"
                    placeholder="e.g. 1, 2, 3..."
                    value={ballotNumber}
                    onChange={(e) => setBallotNumber(e.target.value)}
                    className="input font-mono font-bold text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingBallotNumber}
                  className="btn-primary shrink-0 cursor-pointer"
                >
                  {savingBallotNumber ? "Saving serial number..." : "Save Serial Number"}
                </button>
              </form>
            </div>

            <form onSubmit={handleSaveBio} className="space-y-3">
              <label htmlFor="bio" className="label font-semibold">Your Bio / Background</label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input"
                placeholder="Share your academic department, prior leadership experience, and vision."
              />
              <button type="submit" disabled={savingBio} className="btn-primary">
                {savingBio ? "Saving bio…" : "Update Bio"}
              </button>
            </form>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-bold font-display">Submit / Update Manifesto</h2>
            <form onSubmit={handleSaveManifesto} className="space-y-3">
              <label htmlFor="manifesto" className="label font-semibold">Manifesto Text</label>
              <textarea
                id="manifesto"
                rows={6}
                value={manifesto}
                onChange={(e) => setManifesto(e.target.value)}
                className="input"
                placeholder="Paste your election promises, key agenda points, and initiatives."
              />
              <button type="submit" disabled={savingManifesto} className="btn-primary">
                {savingManifesto ? "Publishing manifesto…" : "Publish Manifesto"}
              </button>
            </form>
          </div>

          {ds?.issues && ds.issues.length > 0 && (
            <div className="card space-y-4">
              <h2 className="text-lg font-bold font-display">Answer Campus Issues</h2>
              <div className="space-y-4">
                {ds.issues.map((issue) => (
                  <div key={issue.id} className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">{issue.title}</h3>
                    {issue.description && <p className="text-xs text-slate-600">{issue.description}</p>}
                    <textarea
                      rows={3}
                      className="input bg-white"
                      placeholder="Your official stance or planned action for this issue…"
                      value={answers[issue.id] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [issue.id]: e.target.value })}
                    />
                    <button
                      type="button"
                      disabled={savingAnswer === issue.id || !answers[issue.id]?.trim()}
                      onClick={() => handleSaveAnswer(issue.id)}
                      className="btn-secondary text-xs"
                    >
                      {savingAnswer === issue.id ? "Saving…" : "Save Answer"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <section className="card space-y-4">
          <h2 className="text-lg font-bold font-display">Are you contesting the election?</h2>
          <p className="text-sm text-slate-600">
            If you are a verified candidate on the official AMUSU notification, find your profile and click &quot;Claim this profile&quot; to manage your bio, photo, manifesto, and campus issue answers.
          </p>
          {candidateClaims.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your Verification Claims</p>
              <ul className="space-y-1 text-sm">
                {candidateClaims.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                    <span className="font-medium text-slate-800">{c.candidates?.name || "Candidate"}</span>
                    <span className={`badge ${
                      c.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 font-semibold"
                        : c.status === "pending"
                        ? "bg-amber-100 text-amber-800 font-semibold"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {c.status.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Link to="/candidates" className="btn-primary">
              Find Your Profile to Claim
            </Link>
            <Link to="/create" className="btn-secondary">
              Create New Candidate Listing
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
