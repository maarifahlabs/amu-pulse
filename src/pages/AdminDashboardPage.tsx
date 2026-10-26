import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDateTime, initials } from "@/lib/format";

export function AdminDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Claims pagination & filter state
  const [claimsSearch, setClaimsSearch] = useState("");
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsPageSize, setClaimsPageSize] = useState(10);
  const [claimsViewMode, setClaimsViewMode] = useState<"table" | "cards">(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_claims_view_mode") : null;
    return saved === "cards" ? "cards" : "table";
  });
  const [expandedClaimIds, setExpandedClaimIds] = useState<Set<string>>(new Set());
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);
  const [processingQuestionId, setProcessingQuestionId] = useState<string | null>(null);

  const handleViewModeChange = (mode: "table" | "cards") => {
    setClaimsViewMode(mode);
    try {
      localStorage.setItem("admin_claims_view_mode", mode);
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  const toggleExpandClaim = (id: string) => {
    setExpandedClaimIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/admin/login");
      } else if (profile && profile.role !== "admin") {
        navigate("/candidate/dashboard");
      }
    }
  }, [user, profile, authLoading, navigate]);

  async function loadPendingItems() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [claimsRes, questionsRes] = await Promise.all([
        supabase.rpc("admin_get_pending_claims"),
        supabase.rpc("admin_get_pending_questions"),
      ]);

      if (claimsRes.error) {
        console.error("Error fetching claims:", claimsRes.error);
        setErrorMessage(claimsRes.error.message || "Failed to load pending claims.");
      } else {
        setClaims(claimsRes.data || []);
      }

      if (questionsRes.error) {
        console.error("Error fetching questions:", questionsRes.error);
        setErrorMessage(
          (prev) => (prev ? `${prev} | ` : "") + (questionsRes.error?.message || "Failed to load pending questions.")
        );
      } else {
        setQuestions(questionsRes.data || []);
      }
    } catch (err) {
      console.error("Error loading pending items:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to load pending items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile?.role === "admin") {
      loadPendingItems();
    }
  }, [profile?.role]);

  // Filtered claims based on search query
  const filteredClaims = useMemo(() => {
    if (!claimsSearch.trim()) return claims;
    const q = claimsSearch.toLowerCase().trim();
    return claims.filter((claim) => {
      const candidateName = (claim.candidate_name || claim.candidates?.name || "").toLowerCase();
      const evidence = (claim.evidence || "").toLowerCase();
      return candidateName.includes(q) || evidence.includes(q);
    });
  }, [claims, claimsSearch]);

  const totalClaims = filteredClaims.length;
  const totalPages = Math.max(1, Math.ceil(totalClaims / claimsPageSize));

  // Keep page within valid bounds if claims change or page size changes
  useEffect(() => {
    if (claimsPage > totalPages) {
      setClaimsPage(totalPages);
    }
  }, [totalPages, claimsPage]);

  // Sliced claims for current page
  const currentClaims = useMemo(() => {
    const start = (claimsPage - 1) * claimsPageSize;
    return filteredClaims.slice(start, start + claimsPageSize);
  }, [filteredClaims, claimsPage, claimsPageSize]);

  // Helper for smart page numbering (e.g. [1, '...', 4, 5, 6, '...', 12])
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    if (claimsPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (claimsPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", claimsPage - 1, claimsPage, claimsPage + 1, "...", totalPages);
    }
    return pages;
  }, [claimsPage, totalPages]);

  async function handleClaimDecision(claimId: string, decision: "approve" | "reject") {
    setActionMessage(null);
    setProcessingClaimId(claimId);
    try {
      const { data, error } = await supabase.rpc("admin_review_claim", {
        p_claim_id: claimId,
        p_decision: decision,
      });

      if (error || (data && !data.success)) {
        setActionMessage(error?.message || data?.error || "Review action failed.");
      } else {
        setActionMessage(`Claim ${decision === "approve" ? "approved" : "rejected"} successfully.`);
        // Optimistically remove from state so UI updates immediately
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setProcessingClaimId(null);
    }
  }

  async function handleQuestionDecision(questionId: string, decision: "approve" | "reject") {
    setActionMessage(null);
    setProcessingQuestionId(questionId);
    try {
      const { data, error } = await supabase.rpc("admin_review_question", {
        p_question_id: questionId,
        p_decision: decision,
      });

      if (error || (data && !data.success)) {
        setActionMessage(error?.message || data?.error || "Question moderation failed.");
      } else {
        setActionMessage(`Question ${decision === "approve" ? "approved" : "rejected"} successfully.`);
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setProcessingQuestionId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading admin dashboard…</p>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="container-page py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold font-display">Access Denied</h1>
        <p className="text-slate-600">You must have an administrative role to access this portal.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  const startRecord = totalClaims === 0 ? 0 : (claimsPage - 1) * claimsPageSize + 1;
  const endRecord = Math.min(claimsPage * claimsPageSize, totalClaims);

  return (
    <div className="container-page space-y-6 py-8">
      {/* Header bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-display text-slate-900">Admin Dashboard</h1>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Active Admin
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{user?.email}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPendingItems()}
            className="btn-secondary text-sm"
            title="Refresh pending items"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.047a1 1 0 011.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.608-1.286z"
                clipRule="evenodd"
              />
            </svg>
            Refresh
          </button>
          <Link to="/candidate/dashboard" className="btn-secondary text-sm">
            Candidate Portal
          </Link>
          <button onClick={() => signOut()} className="btn-secondary text-sm text-red-600 hover:text-red-700">
            Sign out
          </button>
        </div>
      </header>

      {/* Error or Success notification */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-800">
          <div>
            <p className="font-semibold">Database Error</p>
            <p className="mt-0.5 text-red-700">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {actionMessage && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-900">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* SECTION 1: Pending Candidate Claims */}
      <section className="card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-slate-900">Pending Candidate Claims</h2>
              <span className="badge bg-amber-100 text-amber-800 font-bold px-2 py-0.5">
                {claims.length} total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate profile ownership claims requiring identity verification
            </p>
          </div>

          {/* Quick controls: View Mode Toggle & Per-page selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Table vs Cards */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  claimsViewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Table view"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V9zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("cards")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  claimsViewMode === "cards"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Cards view"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Cards</span>
              </button>
            </div>

            {/* Per-page selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="page-size" className="text-xs text-slate-500 font-medium">
                Per page:
              </label>
              <select
                id="page-size"
                value={claimsPageSize}
                onChange={(e) => {
                  setClaimsPageSize(Number(e.target.value));
                  setClaimsPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search / Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="relative flex-1 min-w-[240px]">
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by candidate name or contact/evidence info..."
              value={claimsSearch}
              onChange={(e) => {
                setClaimsSearch(e.target.value);
                setClaimsPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {claimsSearch && (
              <button
                onClick={() => {
                  setClaimsSearch("");
                  setClaimsPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {totalClaims === 0 ? (
              <span>0 claims</span>
            ) : (
              <span>
                Showing <strong className="text-slate-800">{startRecord}–{endRecord}</strong> of{" "}
                <strong className="text-slate-800">{totalClaims}</strong>
                {claimsSearch && ` (filtered from ${claims.length})`}
              </span>
            )}
          </div>
        </div>

        {/* Claims List */}
        {claims.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-slate-300 mb-2" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No pending candidate claims. All caught up!
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 space-y-2">
            <p>No candidate claims match your search filter "{claimsSearch}".</p>
            <button
              onClick={() => {
                setClaimsSearch("");
                setClaimsPage(1);
              }}
              className="btn-secondary text-xs"
            >
              Clear search filter
            </button>
          </div>
        ) : claimsViewMode === "table" ? (
          /* =================== TABLE VIEW =================== */
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="py-3 px-3 w-12 text-center">#</th>
                    <th scope="col" className="py-3 px-4 min-w-[190px]">Candidate</th>
                    <th scope="col" className="py-3 px-4 min-w-[280px]">Verification Evidence</th>
                    <th scope="col" className="py-3 px-4 w-40 whitespace-nowrap">Submitted</th>
                    <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentClaims.map((claim, index) => {
                    const itemNumber = (claimsPage - 1) * claimsPageSize + index + 1;
                    const isProcessing = processingClaimId === claim.id;
                    const candName = claim.candidate_name || claim.candidates?.name || "Candidate";
                    const isExpanded = expandedClaimIds.has(claim.id);

                    return (
                      <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Number */}
                        <td className="py-3 px-3 text-center font-semibold text-slate-400">
                          {itemNumber}
                        </td>

                        {/* Candidate */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 border border-brand-200 text-[11px] font-bold text-brand-700">
                              {initials(candName)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {candName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {claim.candidate_id ? claim.candidate_id.slice(0, 8) + "…" : "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Evidence */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div
                              className={`text-slate-700 font-sans whitespace-pre-wrap leading-relaxed ${
                                isExpanded ? "" : "line-clamp-2"
                              }`}
                            >
                              {claim.evidence}
                            </div>
                            {claim.evidence && claim.evidence.length > 70 && (
                              <button
                                type="button"
                                onClick={() => toggleExpandClaim(claim.id)}
                                className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 underline underline-offset-2"
                              >
                                {isExpanded ? "Show less" : "View full evidence"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Submitted */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                          {claim.created_at ? formatDateTime(claim.created_at) : "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleClaimDecision(claim.id, "approve")}
                              disabled={isProcessing}
                              className="btn-primary text-xs py-1 px-2.5"
                              title="Approve claim"
                            >
                              {isProcessing ? (
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
                              ) : (
                                <>
                                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleClaimDecision(claim.id, "reject")}
                              disabled={isProcessing}
                              className="btn-danger text-xs py-1 px-2.5"
                              title="Reject claim"
                            >
                              {isProcessing ? (
                                "…"
                              ) : (
                                <>
                                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Reject
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* =================== CARDS VIEW =================== */
          <div className="space-y-4 divide-y divide-slate-100">
            {currentClaims.map((claim, index) => {
              const itemNumber = (claimsPage - 1) * claimsPageSize + index + 1;
              const isProcessing = processingClaimId === claim.id;
              const candName = claim.candidate_name || claim.candidates?.name || "Candidate";

              return (
                <div key={claim.id} className="pt-4 first:pt-0 space-y-3">
                  {/* Top row: Candidate Info & Submission Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700">
                        {initials(candName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">#{itemNumber}</span>
                          <h3 className="text-sm font-bold text-slate-900">{candName}</h3>
                        </div>
                        <p className="text-xs text-slate-500">
                          Candidate ID: <span className="font-mono text-[11px] text-slate-600">{claim.candidate_id || "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    {claim.created_at && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                        <svg viewBox="0 0 20 20" className="h-3 w-3 text-slate-400" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formatDateTime(claim.created_at)}
                      </span>
                    )}
                  </div>

                  {/* Evidence & Contact Information Box */}
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-800">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Submitted Verification Evidence
                    </div>
                    <pre className="font-sans text-xs whitespace-pre-wrap leading-relaxed text-slate-700">
                      {claim.evidence}
                    </pre>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() => handleClaimDecision(claim.id, "approve")}
                      disabled={isProcessing}
                      className="btn-primary text-xs py-1.5 px-3.5 shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Approve Claim
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleClaimDecision(claim.id, "reject")}
                      disabled={isProcessing}
                      className="btn-danger text-xs py-1.5 px-3.5"
                    >
                      {isProcessing ? (
                        "Processing…"
                      ) : (
                        <>
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <nav
            aria-label="Candidate Claims Pagination"
            className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
          >
            <div className="text-xs text-slate-500 font-medium">
              Page <strong className="text-slate-800">{claimsPage}</strong> of{" "}
              <strong className="text-slate-800">{totalPages}</strong>
            </div>

            <div className="flex items-center gap-1">
              {/* Previous */}
              <button
                onClick={() => setClaimsPage((p) => Math.max(1, p - 1))}
                disabled={claimsPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Prev
              </button>

              {/* Numbered Page Buttons */}
              <div className="hidden sm:flex items-center gap-1">
                {paginationRange.map((page, i) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-400 select-none">
                        …
                      </span>
                    );
                  }
                  const isActive = page === claimsPage;
                  return (
                    <button
                      key={`page-${page}`}
                      onClick={() => setClaimsPage(page as number)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition ${
                        isActive
                          ? "bg-brand-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                onClick={() => setClaimsPage((p) => Math.min(totalPages, p + 1))}
                disabled={claimsPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </nav>
        )}
      </section>

      {/* SECTION 2: Pending Student Questions */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-slate-900">Pending Student Questions</h2>
              <span className="badge bg-amber-100 text-amber-800 font-bold px-2 py-0.5">
                {questions.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Questions submitted by students awaiting content moderation before public display
            </p>
          </div>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">No student questions waiting for moderation.</p>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {questions.map((q) => {
              const isProcessing = processingQuestionId === q.id;
              return (
                <div key={q.id} className="pt-3 first:pt-0 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {q.issue_title || q.issues?.title || "General Issue"}
                    </span>
                    {q.created_at && (
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(q.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 font-medium">{q.question}</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleQuestionDecision(q.id, "approve")}
                      disabled={isProcessing}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      {isProcessing ? "Processing…" : "Approve Question"}
                    </button>
                    <button
                      onClick={() => handleQuestionDecision(q.id, "reject")}
                      disabled={isProcessing}
                      className="btn-danger text-xs py-1.5 px-3"
                    >
                      {isProcessing ? "Processing…" : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

