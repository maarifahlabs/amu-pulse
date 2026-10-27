import React, { useState, useEffect } from "react";
import type { Position, VerificationStatus } from "@/lib/types";
import type { AdminCandidateItem } from "@/lib/admin-api";

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
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
  candidate?: AdminCandidateItem | null;
  positions: Position[];
  isSubmitting: boolean;
}

export function CandidateModal({
  isOpen,
  onClose,
  onSubmit,
  candidate,
  positions,
  isSubmitting,
}: CandidateModalProps) {
  const isEdit = Boolean(candidate);

  const [name, setName] = useState("");
  const [positionId, setPositionId] = useState("");
  const [ballotNumber, setBallotNumber] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("verified");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (candidate) {
      setName(candidate.name || "");
      setPositionId(candidate.position_id || "");
      setBallotNumber(candidate.ballot_number ? String(candidate.ballot_number) : "");
      setDepartment(candidate.department || "");
      setFaculty(candidate.faculty || "");
      setBio(candidate.bio || "");
      setPhotoUrl(candidate.photo_url || "");
      setSourceUrl(candidate.official_source_url || "");
      setVerificationStatus(candidate.verification_status || "verified");
    } else {
      setName("");
      setPositionId(positions[0]?.id || "");
      setBallotNumber("");
      setDepartment("");
      setFaculty("");
      setBio("");
      setPhotoUrl("");
      setSourceUrl("");
      setVerificationStatus("verified");
    }
    setFormError(null);
  }, [candidate, positions, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Candidate full name is required.");
      return;
    }
    if (!positionId) {
      setFormError("Please select an election position.");
      return;
    }

    const ballotNum = ballotNumber.trim() ? Number(ballotNumber.trim()) : null;
    if (ballotNumber.trim() && (isNaN(Number(ballotNumber)) || Number(ballotNumber) < 1)) {
      setFormError("Ballot number must be a valid positive integer (e.g., 1, 2, 3).");
      return;
    }

    try {
      await onSubmit({
        id: candidate?.id,
        name: name.trim(),
        position_id: positionId,
        ballot_number: ballotNum,
        department: department.trim() || null,
        faculty: faculty.trim() || null,
        bio: bio.trim() || null,
        photo_url: photoUrl.trim() || null,
        source_url: sourceUrl.trim() || null,
        verification_status: verificationStatus,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save candidate.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900">
              {isEdit ? "Edit Candidate Details" : "Register New Candidate"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? `Updating official record for ${candidate?.name}`
                : "Add an official contestant to the AMUSU ballot roster"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800">
              {formError}
            </div>
          )}

          {/* Full Name & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cand-name" className="label text-xs">
                Candidate Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cand-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mohammad Bilal"
                className="input text-xs"
              />
            </div>

            <div>
              <label htmlFor="cand-pos" className="label text-xs">
                Contesting Post <span className="text-red-500">*</span>
              </label>
              <select
                id="cand-pos"
                required
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                className="input text-xs font-medium"
              >
                <option value="" disabled>Select post</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ballot Number & Verification Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cand-ballot" className="label text-xs">
                Official Ballot Serial # <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="cand-ballot"
                type="number"
                min="1"
                max="999"
                value={ballotNumber}
                onChange={(e) => setBallotNumber(e.target.value)}
                placeholder="e.g. 1, 2, 3..."
                className="input text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used for neutral ballot ordering on public lists.
              </p>
            </div>

            <div>
              <label htmlFor="cand-status" className="label text-xs">
                Verification Status
              </label>
              <select
                id="cand-status"
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className="input text-xs font-semibold"
              >
                <option value="verified">Verified (Official Ballot)</option>
                <option value="unverified">Unverified (Pending Review)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Department & Faculty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cand-dept" className="label text-xs">
                Academic Department
              </label>
              <input
                id="cand-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Dept of Computer Science"
                className="input text-xs"
              />
            </div>

            <div>
              <label htmlFor="cand-fac" className="label text-xs">
                Faculty
              </label>
              <input
                id="cand-fac"
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="e.g. Faculty of Science"
                className="input text-xs"
              />
            </div>
          </div>

          {/* Bio / Agenda */}
          <div>
            <label htmlFor="cand-bio" className="label text-xs">
              Candidate Statement / Bio
            </label>
            <textarea
              id="cand-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Candidate background, qualifications, priorities, and vision..."
              className="input text-xs"
            />
          </div>

          {/* Photo URL & Official Source URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cand-photo" className="label text-xs">
                Photo URL <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="cand-photo"
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="input text-xs"
              />
            </div>

            <div>
              <label htmlFor="cand-source" className="label text-xs">
                Official Notification URL <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="cand-source"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://amu.ac.in/..."
                className="input text-xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-2 px-5 font-bold"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                ? "Save Candidate Changes"
                : "Create Candidate Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
