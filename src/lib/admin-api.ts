import { api } from "@/lib/api";
import type { Candidate, VerificationStatus } from "@/lib/types";

export interface AdminCandidateItem extends Candidate {
  position_title?: string;
  position_slug?: string;
  claimed_display_name?: string | null;
  claim_count?: number;
}

export interface AdminClaimItem {
  id: string;
  evidence: string;
  created_at: string;
  candidate_id: string;
  candidate_name?: string;
  profile_id?: string;
  status?: string;
}

export interface AdminQuestionItem {
  id: string;
  question: string;
  created_at: string;
  issue_id?: string | null;
  issue_title?: string | null;
  moderation_status?: "pending" | "approved" | "rejected";
  submitter_id?: string | null;
  submitter_name?: string | null;
}

export interface AdminUserItem {
  id: string;
  display_name: string | null;
  role: "student" | "candidate" | "admin";
  created_at: string;
  linked_candidate_name?: string | null;
}

export interface AdminAuditLogItem {
  id: string;
  actor_id: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

/** Runs an admin action; failures come back as { success: false, error } like the old RPCs. */
async function action<T = unknown>(run: () => Promise<T>) {
  type Result = { success: boolean; error?: string } & Partial<T>;
  try {
    return { ...((await run()) as object), success: true } as Result;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Request failed." } as Result;
  }
}

interface CandidateInput {
  name: string;
  position_id: string;
  ballot_number?: number | null;
  department?: string | null;
  faculty?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  source_url?: string | null;
  verification_status?: VerificationStatus;
}

function candidateBody(c: CandidateInput) {
  return {
    name: c.name,
    position_id: c.position_id,
    ballot_number: c.ballot_number || null,
    department: c.department || null,
    faculty: c.faculty || null,
    bio: c.bio || null,
    photo_url: c.photo_url || null,
    source_url: c.source_url || null,
    verification_status: c.verification_status || "verified",
  };
}

// -------------------------------------------------------------
// CANDIDATES API
// -------------------------------------------------------------

export function fetchAdminCandidates(): Promise<AdminCandidateItem[]> {
  return api.get<AdminCandidateItem[]>("/admin/candidates");
}

export function adminCreateCandidate(
  candidate: CandidateInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  return action(() => api.post<{ id: string }>("/admin/candidates", candidateBody(candidate)));
}

export function adminUpdateCandidate(
  id: string,
  candidate: CandidateInput,
): Promise<{ success: boolean; error?: string }> {
  return action(() => api.put(`/admin/candidates/${id}`, candidateBody(candidate)));
}

export function adminToggleVerifyCandidate(
  id: string,
  newStatus: VerificationStatus,
): Promise<{ success: boolean; error?: string }> {
  return action(() => api.patch(`/admin/candidates/${id}/verification`, { status: newStatus }));
}

export function adminDeleteCandidate(id: string): Promise<{ success: boolean; error?: string }> {
  return action(() => api.delete(`/admin/candidates/${id}`));
}

// -------------------------------------------------------------
// CLAIMS API
// -------------------------------------------------------------

export function fetchAdminClaims(): Promise<AdminClaimItem[]> {
  return api.get<AdminClaimItem[]>("/admin/claims");
}

export function reviewAdminClaim(
  claimId: string,
  decision: "approve" | "reject",
): Promise<{ success: boolean; error?: string }> {
  return action(() => api.post(`/admin/claims/${claimId}/review`, { decision }));
}

// -------------------------------------------------------------
// QUESTIONS API
// -------------------------------------------------------------

export function fetchAdminQuestions(): Promise<AdminQuestionItem[]> {
  return api.get<AdminQuestionItem[]>("/admin/questions");
}

export function reviewAdminQuestion(
  questionId: string,
  decision: "approve" | "reject",
): Promise<{ success: boolean; error?: string }> {
  return action(() => api.post(`/admin/questions/${questionId}/review`, { decision }));
}

export function resetAdminQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  return action(() => api.post(`/admin/questions/${questionId}/reset`));
}

export function deleteAdminQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  return action(() => api.delete(`/admin/questions/${questionId}`));
}

// -------------------------------------------------------------
// USERS & ROLES API
// -------------------------------------------------------------

export function fetchAdminUsers(): Promise<AdminUserItem[]> {
  return api.get<AdminUserItem[]>("/admin/users");
}

export function updateAdminUserRole(
  userId: string,
  newRole: "student" | "candidate" | "admin",
): Promise<{ success: boolean; error?: string }> {
  return action(() => api.patch(`/admin/users/${userId}/role`, { role: newRole }));
}

// -------------------------------------------------------------
// AUDIT LOGS API
// -------------------------------------------------------------

export async function fetchAdminAuditLogs(limit = 60): Promise<AdminAuditLogItem[]> {
  try {
    return await api.get<AdminAuditLogItem[]>(`/admin/audit-logs?limit=${limit}`);
  } catch {
    return [];
  }
}
