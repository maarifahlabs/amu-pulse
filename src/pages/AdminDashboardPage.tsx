import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export function AdminDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login?next=/admin/dashboard");
      } else if (profile && profile.role !== "admin") {
        navigate("/candidate/dashboard");
      }
    }
  }, [user, profile, authLoading, navigate]);

  async function loadPendingItems() {
    setLoading(true);
    try {
      const [claimsRes, questionsRes] = await Promise.all([
        supabase
          .from("candidate_claims")
          .select("id, evidence, created_at, candidate_id, candidates(name)")
          .eq("status", "pending")
          .order("created_at"),
        supabase
          .from("questions")
          .select("id, question, created_at, issues(title)")
          .eq("moderation_status", "pending")
          .order("created_at"),
      ]);

      setClaims(claimsRes.data || []);
      setQuestions(questionsRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile?.role === "admin") {
      loadPendingItems();
    }
  }, [profile?.role]);

  async function handleClaimDecision(claimId: string, decision: "approve" | "reject") {
    setActionMessage(null);
    try {
      const { data, error } = await supabase.rpc("admin_review_claim", {
        p_claim_id: claimId,
        p_decision: decision,
      });

      if (error || (data && !data.success)) {
        setActionMessage(error?.message || data?.error || "Review action failed.");
      } else {
        setActionMessage(`Claim ${decision === "approve" ? "approved" : "rejected"} successfully.`);
        loadPendingItems();
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Action failed.");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Checking admin credentials…</p>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="container-page py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-slate-600">You must have an administrative role to access this portal.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="container-page space-y-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Admin Dashboard</h1>
          <p className="text-sm text-slate-600">Signed in as administrator <span className="font-semibold text-slate-900">{user?.email}</span></p>
        </div>
        <div className="flex gap-2">
          <Link to="/candidate/dashboard" className="btn-secondary">
            User Account
          </Link>
          <button onClick={() => signOut()} className="btn-secondary">
            Sign out
          </button>
        </div>
      </header>

      {actionMessage && (
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 text-sm font-medium text-brand-900">
          {actionMessage}
        </div>
      )}

      {/* Pending Candidate Claims */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display">Pending Candidate Claims</h2>
          <span className="badge bg-amber-100 text-amber-800 font-semibold">{claims.length}</span>
        </div>

        {claims.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">No pending candidate claims.</p>
        ) : (
          <div className="space-y-4 divide-y divide-slate-100">
            {claims.map((claim) => (
              <div key={claim.id} className="pt-3 first:pt-0 space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  Claim for candidate: <span className="text-brand-700">{claim.candidates?.name || "Unknown"}</span>
                </p>
                <div className="bg-slate-50 rounded-xl p-3 text-xs font-mono whitespace-pre-wrap border border-slate-200">
                  {claim.evidence}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleClaimDecision(claim.id, "approve")}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Approve Claim
                  </button>
                  <button
                    onClick={() => handleClaimDecision(claim.id, "reject")}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Student Questions */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display">Pending Student Questions</h2>
          <span className="badge bg-amber-100 text-amber-800 font-semibold">{questions.length}</span>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">No student questions waiting for moderation.</p>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {questions.map((q) => (
              <div key={q.id} className="pt-3 first:pt-0 space-y-1 text-sm">
                <span className="text-xs font-semibold text-slate-500">{q.issues?.title}</span>
                <p className="text-slate-800">{q.question}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
