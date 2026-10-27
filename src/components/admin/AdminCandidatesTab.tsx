import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Position, VerificationStatus } from "@/lib/types";
import type { AdminCandidateItem } from "@/lib/admin-api";
import { initials } from "@/lib/format";
import { CandidateModal } from "./CandidateModal";
import { DeleteCandidateModal } from "./DeleteCandidateModal";

interface AdminCandidatesTabProps {
  candidates: AdminCandidateItem[];
  positions: Position[];
  onSaveCandidate: (data: {
    id?: string;
    name: string;
    position_id: string;
    ballot_number?: number | null;
    department?: string | null;
    faculty?: string | null;
    bio?: string | null;
    photo_url?: string | null;
    source_url?: string | null;
    verification_status: VerificationStatus;
  }) => Promise<void>;
  onToggleVerify: (id: string, currentStatus: VerificationStatus) => Promise<void>;
  onDeleteCandidate: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
}

export function AdminCandidatesTab({
  candidates,
  positions,
  onSaveCandidate,
  onToggleVerify,
  onDeleteCandidate,
  isAddModalOpen,
  onCloseAddModal,
  onOpenAddModal,
}: AdminCandidatesTabProps) {
  // Filters & Search
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [claimFilter, setClaimFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"ballot" | "name" | "post">("ballot");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state
  const [editingCandidate, setEditingCandidate] = useState<AdminCandidateItem | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<AdminCandidateItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Position lookup map
  const positionMap = useMemo(() => {
    const map = new Map<string, Position>();
    for (const p of positions) {
      map.set(p.id, p);
    }
    return map;
  }, [positions]);

  // Filtered & Sorted candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((cand) => {
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const nameMatch = cand.name.toLowerCase().includes(q);
          const deptMatch = (cand.department || "").toLowerCase().includes(q);
          const facMatch = (cand.faculty || "").toLowerCase().includes(q);
          const ballotMatch = cand.ballot_number ? String(cand.ballot_number).includes(q) : false;
          if (!nameMatch && !deptMatch && !facMatch && !ballotMatch) {
            return false;
          }
        }

        // Position filter
        if (positionFilter !== "all" && cand.position_id !== positionFilter) {
          return false;
        }

        // Verification filter
        if (verificationFilter !== "all" && cand.verification_status !== verificationFilter) {
          return false;
        }

        // Claim filter
        if (claimFilter === "claimed" && !cand.profile_id) return false;
        if (claimFilter === "unclaimed" && cand.profile_id) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "ballot") {
          const aNum = a.ballot_number ?? 9999;
          const bNum = b.ballot_number ?? 9999;
          if (aNum !== bNum) return aNum - bNum;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "post") {
          const aPost = a.position_title || positionMap.get(a.position_id)?.title || "";
          const bPost = b.position_title || positionMap.get(b.position_id)?.title || "";
          const postDiff = aPost.localeCompare(bPost);
          if (postDiff !== 0) return postDiff;
          return (a.ballot_number ?? 9999) - (b.ballot_number ?? 9999);
        }
        return 0;
      });
  }, [candidates, search, positionFilter, verificationFilter, claimFilter, sortBy, positionMap]);

  // Pagination calculation
  const totalItems = filteredCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Current page records
  const currentRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, page, pageSize]);

  // Reset page when filters change
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Ballot Number",
      "Full Name",
      "Contesting Post",
      "Department",
      "Faculty",
      "Verification Status",
      "Claimed Account",
      "Slug",
    ];

    const rows = filteredCandidates.map((c) => [
      c.id,
      c.ballot_number ?? "",
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.position_title || positionMap.get(c.position_id)?.title || "").replace(/"/g, '""')}"`,
      `"${(c.department || "").replace(/"/g, '""')}"`,
      `"${(c.faculty || "").replace(/"/g, '""')}"`,
      c.verification_status,
      `"${(c.claimed_display_name || (c.profile_id ? "Claimed" : "Unclaimed")).replace(/"/g, '""')}"`,
      c.slug,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amu_pulse_candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle verify handler
  const handleToggle = async (cand: AdminCandidateItem) => {
    setTogglingId(cand.id);
    try {
      await onToggleVerify(cand.id, cand.verification_status);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Stats Pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900">
            Registered Candidates Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full roster of official contestants across all executive union posts and university court faculties
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary text-xs py-2 px-3 shadow-2xs font-semibold"
            title="Download CSV report of candidate directory"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export CSV
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="btn-primary text-xs py-2 px-3.5 shadow-xs font-bold"
          >
            + Register Candidate
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs">
          Total: <strong className="text-slate-900">{candidates.length}</strong>
        </span>
        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-2xs">
          Verified: <strong className="text-emerald-950">
            {candidates.filter((c) => c.verification_status === "verified").length}
          </strong>
        </span>
        <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 shadow-2xs">
          Unverified: <strong className="text-amber-950">
            {candidates.filter((c) => c.verification_status === "unverified").length}
          </strong>
        </span>
        <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-800 shadow-2xs">
          Claimed: <strong className="text-indigo-950">
            {candidates.filter((c) => Boolean(c.profile_id)).length}
          </strong>
        </span>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
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
              placeholder="Search candidate name, department, ballot #..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {search && (
              <button
                onClick={() => handleFilterChange(setSearch, "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Position Filter */}
          <div>
            <select
              value={positionFilter}
              onChange={(e) => handleFilterChange(setPositionFilter, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Positions ({candidates.length})</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Filter */}
          <div>
            <select
              value={verificationFilter}
              onChange={(e) => handleFilterChange(setVerificationFilter, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>

          {/* Claim Filter & Sort */}
          <div className="flex items-center gap-2">
            <select
              value={claimFilter}
              onChange={(e) => handleFilterChange(setClaimFilter, e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Claims</option>
              <option value="claimed">Claimed</option>
              <option value="unclaimed">Unclaimed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ballot">Ballot #</option>
              <option value="name">Name A-Z</option>
              <option value="post">Post</option>
            </select>
          </div>
        </div>

        {/* Filter count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{currentRecords.length}</strong> of{" "}
            <strong className="text-slate-800">{totalItems}</strong> matching candidates
            {totalItems !== candidates.length && ` (filtered from ${candidates.length} total)`}
          </span>

          {(search || positionFilter !== "all" || verificationFilter !== "all" || claimFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setPositionFilter("all");
                setVerificationFilter("all");
                setClaimFilter("all");
                setPage(1);
              }}
              className="font-semibold text-emerald-700 hover:text-emerald-900 underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Candidate Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {currentRecords.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 space-y-2">
            <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-slate-300" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="font-medium text-slate-700">No candidates found matching the active criteria.</p>
            <button
              onClick={() => {
                setSearch("");
                setPositionFilter("all");
                setVerificationFilter("all");
                setClaimFilter("all");
              }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3 px-3 w-12 text-center">#</th>
                  <th scope="col" className="py-3 px-4 min-w-[200px]">Candidate</th>
                  <th scope="col" className="py-3 px-4 min-w-[170px]">Contesting Post</th>
                  <th scope="col" className="py-3 px-4 min-w-[170px]">Department / Faculty</th>
                  <th scope="col" className="py-3 px-4 w-32 whitespace-nowrap">Status</th>
                  <th scope="col" className="py-3 px-4 w-32 whitespace-nowrap">Profile Link</th>
                  <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((cand, index) => {
                  const itemIndex = (page - 1) * pageSize + index + 1;
                  const isToggling = togglingId === cand.id;
                  const postTitle = cand.position_title || positionMap.get(cand.position_id)?.title || "Candidate";

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ballot Serial # */}
                      <td className="py-3 px-3 text-center">
                        {cand.ballot_number ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-slate-100 font-mono font-bold text-slate-800 text-[11px] shadow-2xs">
                            {cand.ballot_number}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400 text-[11px]">#{itemIndex}</span>
                        )}
                      </td>

                      {/* Candidate Avatar & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {cand.photo_url ? (
                            <img
                              src={cand.photo_url}
                              alt={cand.name}
                              className="h-8 w-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                              {initials(cand.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 leading-tight truncate">
                              {cand.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              /candidates/{cand.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Post */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                          {postTitle}
                        </span>
                      </td>

                      {/* Dept & Faculty */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800 text-[11px] truncate">
                            {cand.department || "—"}
                          </div>
                          {cand.faculty && (
                            <div className="text-[10px] text-slate-500 truncate">
                              {cand.faculty}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`badge text-[10px] font-bold ${
                            cand.verification_status === "verified"
                              ? "bg-emerald-100 text-emerald-800"
                              : cand.verification_status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {cand.verification_status.toUpperCase()}
                        </span>
                      </td>

                      {/* Claimed Account */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {cand.claimed_display_name ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {cand.claimed_display_name}
                          </span>
                        ) : cand.profile_id ? (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                            Claimed
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Unclaimed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Verify */}
                          <button
                            type="button"
                            onClick={() => handleToggle(cand)}
                            disabled={isToggling}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                              cand.verification_status === "verified"
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                            title={cand.verification_status === "verified" ? "Mark unverified" : "Mark verified"}
                          >
                            {isToggling ? "..." : cand.verification_status === "verified" ? "Unverify" : "Verify"}
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => setEditingCandidate(cand)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                            title="Edit candidate profile"
                          >
                            Edit
                          </button>

                          {/* View public */}
                          <Link
                            to={`/candidates/${cand.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                            title="View public candidate profile page"
                          >
                            ↗
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingCandidate(cand)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 transition"
                            title="Delete candidate"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 p-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-500 font-medium ml-2">
                Page <strong className="text-slate-800">{page}</strong> of{" "}
                <strong className="text-slate-800">{totalPages}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                Prev
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Modal (Create or Edit) */}
      {(isAddModalOpen || editingCandidate) && (
        <CandidateModal
          isOpen={isAddModalOpen || Boolean(editingCandidate)}
          onClose={() => {
            onCloseAddModal();
            setEditingCandidate(null);
          }}
          candidate={editingCandidate}
          positions={positions}
          isSubmitting={isSubmitting}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await onSaveCandidate(data);
              setEditingCandidate(null);
              onCloseAddModal();
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}

      {/* Delete Candidate Modal */}
      {deletingCandidate && (
        <DeleteCandidateModal
          isOpen={Boolean(deletingCandidate)}
          onClose={() => setDeletingCandidate(null)}
          candidate={deletingCandidate}
          isDeleting={isDeleting}
          onConfirm={async (id) => {
            setIsDeleting(true);
            try {
              await onDeleteCandidate(id);
              setDeletingCandidate(null);
            } finally {
              setIsDeleting(false);
            }
          }}
        />
      )}
    </div>
  );
}
