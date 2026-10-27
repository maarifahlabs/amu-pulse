import { supabase } from "@/lib/supabase";
import type { Candidate, Issue, Position, VerificationStatus } from "@/lib/types";

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

// -------------------------------------------------------------
// CANDIDATES API
// -------------------------------------------------------------

export async function fetchAdminCandidates(): Promise<AdminCandidateItem[]> {
  // Try custom RPC first
  try {
    const { data, error } = await supabase.rpc("admin_get_all_candidates");
    if (!error && Array.isArray(data)) {
      return data as AdminCandidateItem[];
    }
  } catch {
    // Fall back below
  }

  // Fallback: direct table select
  const { data, error } = await supabase
    .from("candidates")
    .select(`
      id, slug, profile_id, position_id, ballot_number, name, department, faculty,
      bio, photo_url, verification_status, official_source_url, created_at, updated_at,
      positions:position_id (id, title, slug),
      profiles:profile_id (id, display_name)
    `)
    .order("ballot_number", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch candidates.");
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    profile_id: row.profile_id,
    position_id: row.position_id,
    ballot_number: row.ballot_number,
    name: row.name,
    department: row.department,
    faculty: row.faculty,
    bio: row.bio,
    photo_url: row.photo_url,
    verification_status: row.verification_status,
    official_source_url: row.official_source_url,
    position_title: row.positions?.title,
    position_slug: row.positions?.slug,
    claimed_display_name: row.profiles?.display_name,
  }));
}

export async function adminCreateCandidate(candidate: {
  name: string;
  position_id: string;
  ballot_number?: number | null;
  department?: string | null;
  faculty?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  source_url?: string | null;
  verification_status?: VerificationStatus;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  // Try RPC
  try {
    const { data, error } = await supabase.rpc("admin_create_candidate", {
      p_name: candidate.name,
      p_position_id: candidate.position_id,
      p_ballot_number: candidate.ballot_number || null,
      p_department: candidate.department || null,
      p_faculty: candidate.faculty || null,
      p_bio: candidate.bio || null,
      p_photo_url: candidate.photo_url || null,
      p_source_url: candidate.source_url || null,
      p_verification_status: candidate.verification_status || "verified",
    });

    if (!error && data) {
      if (data.success) return { success: true, id: data.id };
      if (data.error) return { success: false, error: data.error };
    }
  } catch {
    // Fall back to direct insert
  }

  // Fallback: direct table insert
  const slug = candidate.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) + "-" + Date.now().toString().slice(-4);

  const { data: insData, error: insErr } = await supabase
    .from("candidates")
    .insert({
      id: crypto.randomUUID(),
      slug,
      name: candidate.name,
      position_id: candidate.position_id,
      ballot_number: candidate.ballot_number || null,
      department: candidate.department || null,
      faculty: candidate.faculty || null,
      bio: candidate.bio || null,
      photo_url: candidate.photo_url || null,
      official_source_url: candidate.source_url || null,
      verification_status: candidate.verification_status || "verified",
    })
    .select("id")
    .single();

  if (insErr) {
    return { success: false, error: insErr.message };
  }
  return { success: true, id: insData?.id };
}

export async function adminUpdateCandidate(
  id: string,
  candidate: {
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
): Promise<{ success: boolean; error?: string }> {
  // Try RPC
  try {
    const { data, error } = await supabase.rpc("admin_update_candidate", {
      p_id: id,
      p_name: candidate.name,
      p_position_id: candidate.position_id,
      p_ballot_number: candidate.ballot_number || null,
      p_department: candidate.department || null,
      p_faculty: candidate.faculty || null,
      p_bio: candidate.bio || null,
      p_photo_url: candidate.photo_url || null,
      p_source_url: candidate.source_url || null,
      p_verification_status: candidate.verification_status || "verified",
    });

    if (!error && data) {
      if (data.success) return { success: true };
      if (data.error) return { success: false, error: data.error };
    }
  } catch {
    // Fall back to direct update
  }

  // Fallback: direct table update
  const { error: updErr } = await supabase
    .from("candidates")
    .update({
      name: candidate.name,
      position_id: candidate.position_id,
      ballot_number: candidate.ballot_number || null,
      department: candidate.department || null,
      faculty: candidate.faculty || null,
      bio: candidate.bio || null,
      photo_url: candidate.photo_url || null,
      official_source_url: candidate.source_url || null,
      verification_status: candidate.verification_status || "verified",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updErr) {
    return { success: false, error: updErr.message };
  }
  return { success: true };
}

export async function adminToggleVerifyCandidate(
  id: string,
  newStatus: VerificationStatus
): Promise<{ success: boolean; error?: string }> {
  // Try RPC
  try {
    const { data, error } = await supabase.rpc("admin_toggle_verify_candidate", {
      p_id: id,
      p_status: newStatus,
    });

    if (!error && data) {
      if (data.success) return { success: true };
      if (data.error) return { success: false, error: data.error };
    }
  } catch {
    // Fall back
  }

  const { error } = await supabase
    .from("candidates")
    .update({ verification_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function adminDeleteCandidate(id: string): Promise<{ success: boolean; error?: string }> {
  // Try RPC
  try {
    const { data, error } = await supabase.rpc("admin_delete_candidate", { p_id: id });
    if (!error && data) {
      if (data.success) return { success: true };
      if (data.error) return { success: false, error: data.error };
    }
  } catch {
    // Fall back
  }

  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// -------------------------------------------------------------
// CLAIMS API
// -------------------------------------------------------------

export async function fetchAdminClaims(): Promise<AdminClaimItem[]> {
  const { data, error } = await supabase.rpc("admin_get_pending_claims");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function reviewAdminClaim(
  claimId: string,
  decision: "approve" | "reject"
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("admin_review_claim", {
    p_claim_id: claimId,
    p_decision: decision,
  });

  if (error || (data && !data.success)) {
    return { success: false, error: error?.message || data?.error || "Claim action failed." };
  }
  return { success: true };
}

// -------------------------------------------------------------
// QUESTIONS API
// -------------------------------------------------------------

export async function fetchAdminQuestions(): Promise<AdminQuestionItem[]> {
  try {
    const { data, error } = await supabase.rpc("admin_get_all_questions");
    if (!error && Array.isArray(data)) {
      return data as AdminQuestionItem[];
    }
  } catch {
    // Fall back
  }

  // Fallback: pending questions RPC
  const { data, error } = await supabase.rpc("admin_get_pending_questions");
  if (error) throw new Error(error.message);
  return (data || []).map((q: any) => ({
    id: q.id,
    question: q.question,
    created_at: q.created_at,
    issue_title: q.issue_title,
    moderation_status: "pending",
  }));
}

export async function reviewAdminQuestion(
  questionId: string,
  decision: "approve" | "reject"
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("admin_review_question", {
    p_question_id: questionId,
    p_decision: decision,
  });

  if (error || (data && !data.success)) {
    return { success: false, error: error?.message || data?.error || "Question moderation failed." };
  }
  return { success: true };
}

// -------------------------------------------------------------
// USERS & ROLES API
// -------------------------------------------------------------

export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  try {
    const { data, error } = await supabase.rpc("admin_get_users");
    if (!error && Array.isArray(data)) {
      return data as AdminUserItem[];
    }
  } catch {
    // Fall back
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateAdminUserRole(
  userId: string,
  newRole: "student" | "candidate" | "admin"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("admin_update_user_role", {
      p_user_id: userId,
      p_role: newRole,
    });
    if (!error && data) {
      if (data.success) return { success: true };
      if (data.error) return { success: false, error: data.error };
    }
  } catch {
    // Fall back
  }

  const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// -------------------------------------------------------------
// AUDIT LOGS API
// -------------------------------------------------------------

export async function fetchAdminAuditLogs(limit = 60): Promise<AdminAuditLogItem[]> {
  try {
    const { data, error } = await supabase.rpc("admin_get_audit_logs", { p_limit: limit });
    if (!error && Array.isArray(data)) {
      return data as AdminAuditLogItem[];
    }
  } catch {
    // Fall back
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}
