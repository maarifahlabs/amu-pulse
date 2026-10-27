import React, { useState, useMemo } from "react";
import type { AdminClaimItem } from "@/lib/admin-api";
import { formatDateTime, initials } from "@/lib/format";

interface AdminClaimsTabProps {
  claims: AdminClaimItem[];
  onReviewClaim: (claimId: string, decision: "approve" | "reject") => Promise<void>;
  processingClaimId: string | null;
}

export function AdminClaimsTab({
  claims,
  onReviewClaim,
  processingClaimId,
}: AdminClaimsTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [expandedClaimIds, setExpandedClaimIds] = useState<Set<string>>(new Set());
  const [selectedEvidenceClaim, setSelectedEvidenceClaim] = useState<AdminClaimItem | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedClaimIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredClaims = useMemo(() => {
    if (!search.trim()) return claims;
    const q = search.toLowerCase().trim();
    return claims.filter((claim) => {
      const candidateName = (claim.candidate_name || "").toLowerCase();
      const evidence = (claim.evidence || "").toLowerCase();
      return candidateName.includes(q) || evidence.includes(q);
    });
  }, [claims, search]);

  const totalClaims = filteredClaims.length;
  const totalPages = Math.max(1, Math.ceil(totalClaims / pageSize));

  const currentClaims = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, page, pageSize]);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-display text-slate-900">
              Candidate Profile Claims Moderation
            </h2>
            <span className="badge bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5">
              {claims.length} pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Students requesting ownership of candidate profiles with submitted identity proof
          </p>
        </div>

        {/* View Mode Toggle & Page size */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "cards" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cards View
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
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
            placeholder="Search candidate name or evidence details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{currentClaims.length}</strong> of{" "}
          <strong className="text-slate-800">{totalClaims}</strong> claims
        </div>
      </div>

      {/* Claims Content */}
      {claims.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-emerald-500 mb-2" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-slate-800">All caught up!</p>
          <p className="text-xs text-slate-500 mt-0.5">No pending candidate profile claims waiting for verification.</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 space-y-2">
          <p>No claims match your search filter "{search}".</p>
          <button onClick={() => setSearch("")} className="btn-secondary text-xs">
            Clear filter
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3 px-3 w-12 text-center">#</th>
                  <th scope="col" className="py-3 px-4 min-w-[200px]">Candidate</th>
                  <th scope="col" className="py-3 px-4 min-w-[280px]">Verification Evidence</th>
                  <th scope="col" className="py-3 px-4 w-40 whitespace-nowrap">Submitted</th>
                  <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentClaims.map((claim, index) => {
                  const itemNumber = (page - 1) * pageSize + index + 1;
                  const isProcessing = processingClaimId === claim.id;
                  const candName = claim.candidate_name || "Candidate";
                  const isExpanded = expandedClaimIds.has(claim.id);

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-semibold text-slate-400">
                        {itemNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                            {initials(candName)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{candName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {claim.candidate_id ? claim.candidate_id.slice(0, 8) + "…" : "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div
                            className={`text-slate-700 whitespace-pre-wrap leading-relaxed ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {claim.evidence}
                          </div>
                          <div className="flex items-center gap-3">
                            {claim.evidence && claim.evidence.length > 70 && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(claim.id)}
                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                              >
                                {isExpanded ? "Show less" : "Expand in table"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedEvidenceClaim(claim)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Open in modal ↗
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {claim.created_at ? formatDateTime(claim.created_at) : "—"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onReviewClaim(claim.id, "approve")}
                            disabled={isProcessing}
                            className="btn-primary text-xs py-1 px-3"
                            title="Approve claim"
                          >
                            {isProcessing ? "…" : "Approve"}
                          </button>
                          <button
                            onClick={() => onReviewClaim(claim.id, "reject")}
                            disabled={isProcessing}
                            className="btn-danger text-xs py-1 px-3"
                            title="Reject claim"
                          >
                            {isProcessing ? "…" : "Reject"}
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
        /* CARDS VIEW */
        <div className="space-y-4">
          {currentClaims.map((claim, index) => {
            const itemNumber = (page - 1) * pageSize + index + 1;
            const isProcessing = processingClaimId === claim.id;
            const candName = claim.candidate_name || "Candidate";

            return (
              <div key={claim.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                      {initials(candName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">#{itemNumber}</span>
                        <h3 className="text-sm font-bold text-slate-900">{candName}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Candidate ID: <span className="font-mono text-slate-600">{claim.candidate_id || "N/A"}</span>
                      </p>
                    </div>
                  </div>

                  {claim.created_at && (
                    <span className="text-xs text-slate-500">
                      {formatDateTime(claim.created_at)}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Submitted Identity Verification Evidence
                  </div>
                  <pre className="font-sans whitespace-pre-wrap leading-relaxed text-slate-700">
                    {claim.evidence}
                  </pre>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={() => onReviewClaim(claim.id, "approve")}
                    disabled={isProcessing}
                    className="btn-primary text-xs py-1.5 px-3.5"
                  >
                    {isProcessing ? "Processing…" : "Approve Claim"}
                  </button>
                  <button
                    onClick={() => onReviewClaim(claim.id, "reject")}
                    disabled={isProcessing}
                    className="btn-danger text-xs py-1.5 px-3.5"
                  >
                    {isProcessing ? "Processing…" : "Reject Claim"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs">
          <span className="text-slate-500">
            Page <strong className="text-slate-800">{page}</strong> of{" "}
            <strong className="text-slate-800">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Evidence Full Modal */}
      {selectedEvidenceClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Verification Evidence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: {selectedEvidenceClaim.candidate_name || "Candidate"}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvidenceClaim(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 max-h-96 overflow-y-auto">
              <pre className="font-sans text-xs whitespace-pre-wrap leading-relaxed text-slate-800">
                {selectedEvidenceClaim.evidence}
              </pre>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Submitted: {formatDateTime(selectedEvidenceClaim.created_at)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onReviewClaim(selectedEvidenceClaim.id, "reject");
                    setSelectedEvidenceClaim(null);
                  }}
                  className="btn-danger text-xs py-1.5 px-3"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    onReviewClaim(selectedEvidenceClaim.id, "approve");
                    setSelectedEvidenceClaim(null);
                  }}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Approve Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
