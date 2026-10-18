export type UserRole = "student" | "candidate" | "admin";
export type VerificationStatus = "unverified" | "verified" | "rejected";
export type IssueStatus = "draft" | "published" | "archived";
export type SubmissionStatus = "pending" | "published" | "rejected";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type ElectionEventKind = "milestone" | "polling" | "notice";

export interface Position {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface Candidate {
  id: string;
  slug: string;
  profile_id: string | null;
  position_id: string;
  ballot_number: number | null;
  name: string;
  department: string | null;
  faculty: string | null;
  bio: string | null;
  photo_url: string | null;
  verification_status: VerificationStatus;
  official_source_url: string | null;
}

export interface Manifesto {
  id: string;
  candidate_id: string;
  content: string;
  source_url: string | null;
  published_at: string | null;
}

export interface Issue {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  context: string | null;
  category: string;
  published_at: string | null;
}

export interface CandidateAnswer {
  id: string;
  candidate_id: string;
  issue_id: string;
  answer: string;
  source_url: string | null;
  updated_at: string;
}

export interface Question {
  id: string;
  issue_id: string | null;
  question: string;
  created_at: string;
}

export interface ElectionEvent {
  id: string;
  title: string;
  description: string | null;
  kind: ElectionEventKind;
  starts_at: string;
  source_url: string;
  verified_at: string | null;
}

/** Everything that is publicly visible, loaded once per request. */
export interface Dataset {
  positions: Position[];
  candidates: Candidate[];
  manifestos: Manifesto[];
  issues: Issue[];
  answers: CandidateAnswer[];
  events: ElectionEvent[];
  isSample: boolean;
}
