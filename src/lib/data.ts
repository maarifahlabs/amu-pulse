import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { sampleDataset } from "@/lib/sample-data";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Candidate, CandidateAnswer, Dataset, ElectionEvent, Issue, Manifesto, Position, Question,
} from "@/lib/types";

// Must match the column grants in the migration; `*` is not readable by anon.
const CANDIDATE_COLUMNS =
  "id, slug, profile_id, position_id, ballot_number, name, department, faculty, bio, photo_url, verification_status, official_source_url";

/**
 * Loads all public content in one go. At student-union scale (dozens of
 * candidates, ~15 issues) this is cheaper and simpler than per-page queries,
 * and RLS guarantees only published, verified rows come back.
 */
export const getDataset = cache(async (): Promise<Dataset> => {
  if (!isSupabaseConfigured) return sampleDataset;
  const sb = createPublicClient();

  const [positions, candidates, manifestos, issues, answers, events] = await Promise.all([
    sb.from("positions").select("id, slug, title, description, sort_order").order("sort_order"),
    sb.from("candidates").select(CANDIDATE_COLUMNS).order("ballot_number").order("name"),
    sb.from("manifestos").select("id, candidate_id, content, source_url, published_at").order("published_at", { ascending: false }),
    sb.from("issues").select("id, slug, title, description, context, category, published_at").order("published_at", { ascending: false }),
    sb.from("candidate_answers").select("id, candidate_id, issue_id, answer, source_url, updated_at"),
    sb.from("election_events").select("id, title, description, kind, starts_at, source_url, verified_at").order("starts_at"),
  ]);

  for (const result of [positions, candidates, manifestos, issues, answers, events]) {
    if (result.error) throw new Error(`Failed to load public data: ${result.error.message}`);
  }

  const positionRows = (positions.data ?? []) as Position[];
  const positionOrder = new Map(positionRows.map((p, i) => [p.id, i]));
  const candidateRows = ((candidates.data ?? []) as Candidate[]).sort(
    (a, b) => (positionOrder.get(a.position_id) ?? 0) - (positionOrder.get(b.position_id) ?? 0),
  );

  return {
    isSample: false,
    positions: positionRows,
    candidates: candidateRows,
    manifestos: (manifestos.data ?? []) as Manifesto[],
    issues: (issues.data ?? []) as Issue[],
    answers: (answers.data ?? []) as CandidateAnswer[],
    events: (events.data ?? []) as ElectionEvent[],
  };
});

export function latestManifesto(ds: Dataset, candidateId: string) {
  return ds.manifestos.find((m) => m.candidate_id === candidateId) ?? null;
}

export function findAnswer(ds: Dataset, candidateId: string, issueId: string) {
  return ds.answers.find((a) => a.candidate_id === candidateId && a.issue_id === issueId) ?? null;
}

export function filterCandidates(ds: Dataset, opts: { position?: string; q?: string }) {
  const position = opts.position ? ds.positions.find((p) => p.slug === opts.position) : undefined;
  const q = opts.q?.trim().toLowerCase();
  return ds.candidates.filter((c) => {
    if (position && c.position_id !== position.id) return false;
    if (q && ![c.name, c.department, c.faculty].some((v) => v?.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function filterIssues(ds: Dataset, opts: { category?: string; q?: string }) {
  const q = opts.q?.trim().toLowerCase();
  return ds.issues.filter((i) => {
    if (opts.category && i.category !== opts.category) return false;
    if (q && ![i.title, i.description, i.category].some((v) => v?.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function issueCategories(ds: Dataset) {
  return [...new Set(ds.issues.map((i) => i.category))].sort();
}

/** Candidates grouped by position, each paired with their answer (or null) to one issue. */
export function issueResponsesByPosition(ds: Dataset, issueId: string) {
  return ds.positions
    .map((position) => ({
      position,
      rows: ds.candidates
        .filter((c) => c.position_id === position.id)
        .map((candidate) => ({ candidate, answer: findAnswer(ds, candidate.id, issueId) })),
    }))
    .filter((g) => g.rows.length > 0);
}

export function issueResponseCount(ds: Dataset, issueId: string) {
  return ds.answers.filter((a) => a.issue_id === issueId).length;
}

/** Profile completeness only: never a judgement of positions or a ranking. */
export function completeness(ds: Dataset, candidate: Candidate) {
  const answered = ds.answers.filter((a) => a.candidate_id === candidate.id).length;
  return {
    claimed: candidate.profile_id !== null,
    bio: Boolean(candidate.bio),
    photo: Boolean(candidate.photo_url),
    manifesto: Boolean(latestManifesto(ds, candidate.id)),
    answered,
    totalIssues: ds.issues.length,
  };
}

export function pollingEvent(ds: Dataset) {
  return ds.events.find((e) => e.kind === "polling") ?? null;
}

export async function getApprovedQuestions(issueId: string): Promise<Question[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("questions")
    .select("id, issue_id, question, created_at")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to load questions: ${error.message}`);
  return (data ?? []) as Question[];
}
