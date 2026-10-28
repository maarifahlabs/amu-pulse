import { api } from "@/lib/api";
import type { Candidate, Dataset, Question } from "@/lib/types";

export function latestManifesto(ds: Dataset, candidateId: string) {
  return ds.manifestos.find((m) => m.candidate_id === candidateId) ?? null;
}

export function findAnswer(ds: Dataset, candidateId: string, issueId: string) {
  return ds.answers.find((a) => a.candidate_id === candidateId && a.issue_id === issueId) ?? null;
}

/** Highest vote count first. Equal counts stay alphabetical, matching the home page. */
export function sortByVotes<T extends { id: string; name: string }>(rows: T[], voteCounts: Record<string, number>) {
  return [...rows].sort(
    (a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0) || a.name.localeCompare(b.name),
  );
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
  return api.get<Question[]>(`/questions?${new URLSearchParams({ issue_id: issueId, limit: "50" })}`);
}

export async function getRecentApprovedQuestions(limit = 8): Promise<Question[]> {
  try {
    return await api.get<Question[]>(`/questions?limit=${limit}`);
  } catch {
    return [];
  }
}
