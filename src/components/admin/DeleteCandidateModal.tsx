import React from "react";
import type { AdminCandidateItem } from "@/lib/admin-api";

interface DeleteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: AdminCandidateItem | null;
  onConfirm: (candidateId: string) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteCandidateModal({
  isOpen,
  onClose,
  candidate,
  onConfirm,
  isDeleting,
}: DeleteCandidateModalProps) {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-red-100 p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Delete Candidate Record?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              This action permanently removes the candidate from the election platform.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 text-xs">
          <div>
            <span className="text-slate-500">Candidate: </span>
            <strong className="text-slate-900">{candidate.name}</strong>
          </div>
          <div>
            <span className="text-slate-500">Post: </span>
            <span className="text-slate-800 font-medium">{candidate.position_title || "N/A"}</span>
          </div>
          {candidate.ballot_number && (
            <div>
              <span className="text-slate-500">Ballot #: </span>
              <span className="font-mono font-semibold text-slate-800">{candidate.ballot_number}</span>
            </div>
          )}
          {candidate.claimed_display_name && (
            <div className="text-amber-700 font-medium">
              ⚠️ Note: This candidate profile is claimed by{" "}
              <strong>{candidate.claimed_display_name}</strong>.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary text-xs py-2 px-3.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(candidate.id)}
            disabled={isDeleting}
            className="btn-danger text-xs py-2 px-4 bg-red-600 text-white hover:bg-red-700 border-red-600 font-bold"
          >
            {isDeleting ? "Deleting..." : "Confirm & Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
