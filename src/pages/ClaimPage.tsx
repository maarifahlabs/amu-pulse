import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { NameWithBadge } from "@/components/NameWithBadge";
import { useAuth } from "@/context/AuthContext";
import { useDataset } from "@/hooks/useDataset";
import { supabase } from "@/lib/supabase";

export function ClaimPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { dataset: ds, loading } = useDataset();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading candidate…</p>
      </div>
    );
  }

  const candidate = ds.candidates.find((c) => c.slug === slug);
  if (!candidate) {
    return (
      <div className="container-page py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Candidate Not Found</h1>
        <Link to="/candidates" className="btn-primary">Browse Candidates</Link>
      </div>
    );
  }

  const position = ds.positions.find((p) => p.id === candidate.position_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const evidence = `Email: ${email || user.email}\nPhone: ${phone}\nProof of candidacy:\n${proof}`;

    try {
      const { data, error: rpcError } = await supabase.rpc("submit_candidate_claim", {
        p_candidate_id: candidate!.id,
        p_evidence: evidence,
      });

      if (rpcError || (data && !data.success)) {
        setError(rpcError?.message || data?.error || "Could not submit your claim.");
      } else {
        navigate("/candidate/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {position?.title}
          {candidate.ballot_number != null && ` · No. ${String(candidate.ballot_number).padStart(2, "0")}`}
        </p>
        <h1 className="text-2xl font-bold font-display">
          <NameWithBadge id={candidate.id} name={candidate.name} claimed={candidate.profile_id !== null} />
        </h1>
      </header>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      {candidate.profile_id ? (
        <div className="card text-sm text-slate-700">
          This profile has already been claimed and verified. If you are this candidate and need access, please contact the administrators.
        </div>
      ) : !user ? (
        <div className="card space-y-3">
          <p className="text-sm text-slate-700">
            Please sign in to submit your proof of candidacy.
          </p>
          <Link to={`/login?next=/claim/${candidate.slug}`} className="btn-primary">
            Sign in to continue
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="email" className="label">Contact Email</label>
            <input
              id="email"
              type="email"
              required
              defaultValue={user.email ?? ""}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="phone" className="label">Mobile Phone Number</label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="proof" className="label">Proof of Candidacy / Verification Details</label>
            <textarea
              id="proof"
              required
              rows={4}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              className="input"
              placeholder="Enrolment number, faculty serial, official nomination receipt number, or reference."
            />
            <p className="mt-1 text-xs text-slate-500">Only visible to administrators.</p>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
            {submitting ? "Submitting proof…" : "Submit for Verification"}
          </button>
        </form>
      )}

      <Link to="/candidates" className="inline-block text-sm font-semibold text-brand-700 hover:underline">
        ← Back to candidates
      </Link>
    </div>
  );
}
