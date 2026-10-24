"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ComparisonTable } from "@/components/ComparisonTable";
import { NameWithBadge } from "@/components/NameWithBadge";
import { ShareButton } from "@/components/ShareButton";
import { absoluteUrl } from "@/lib/env";
import type { Candidate, CandidateAnswer, Issue } from "@/lib/types";

interface CompareCandidate {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  positionId: string;
  ballot: number | null;
  claimed: boolean;
}

interface CompareIssue {
  id: string;
  slug: string;
  title: string;
}

interface ComparePosition {
  id: string;
  slug: string;
  title: string;
}

export function CompareExplorer({
  positions,
  candidates,
  issues,
  answers,
}: {
  positions: ComparePosition[];
  candidates: CompareCandidate[];
  issues: CompareIssue[];
  answers: Record<string, string>;
}) {
  const params = useSearchParams();
  const [positionSlug, setPositionSlug] = useState(positions[0]?.slug ?? "");
  const [picked, setPicked] = useState<string[] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromUrl = params.get("position");
    if (fromUrl && positions.some((position) => position.slug === fromUrl)) setPositionSlug(fromUrl);
    const requested = params.get("candidates")?.split(",").filter(Boolean) ?? [];
    setPicked(requested.length ? requested : null);
    setReady(true);
  }, [params, positions]);

  const position = positions.find((item) => item.slug === positionSlug) ?? positions[0];
  const inPosition = useMemo(
    () => candidates.filter((candidate) => candidate.positionId === position?.id),
    [candidates, position?.id],
  );
  const selected = picked?.length ? inPosition.filter((candidate) => picked.includes(candidate.slug)) : inPosition;

  useEffect(() => {
    if (!ready || !position) return;
    const chosen = picked?.length ? inPosition.filter((candidate) => picked.includes(candidate.slug)) : inPosition;
    const url = new URL(window.location.href);
    url.searchParams.set("position", position.slug);
    if (picked?.length) url.searchParams.set("candidates", chosen.map((candidate) => candidate.slug).join(","));
    else url.searchParams.delete("candidates");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [position, picked, ready, inPosition]);

  function toggle(slug: string) {
    setPicked((current) => {
      const base = current ?? inPosition.map((candidate) => candidate.slug);
      return base.includes(slug) ? base.filter((item) => item !== slug) : [...base, slug];
    });
  }

  const shareUrl = `${absoluteUrl("/compare")}?position=${position?.slug ?? ""}${picked?.length ? `&candidates=${selected.map((candidate) => candidate.slug).join(",")}` : ""}`;
  const tableCandidates: Candidate[] = selected.map((candidate) => ({
    id: candidate.id,
    slug: candidate.slug,
    name: candidate.name,
    photo_url: candidate.photoUrl,
    position_id: candidate.positionId,
    ballot_number: candidate.ballot,
    profile_id: candidate.claimed ? candidate.id : null,
    department: null,
    faculty: null,
    bio: null,
    verification_status: "verified",
    official_source_url: null,
  }));
  const tableIssues: Issue[] = issues.map((issue) => ({
    id: issue.id,
    slug: issue.slug,
    title: issue.title,
    description: null,
    context: null,
    category: "",
    published_at: null,
  }));

  return (
    <>
      <nav aria-label="Positions" className="flex flex-wrap gap-2">
        {positions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setPositionSlug(item.slug);
              setPicked(null);
            }}
            className={`badge px-3 py-1 ${item.id === position?.id ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            {item.title}
          </button>
        ))}
      </nav>

      {inPosition.length > 1 && (
        <form className="card space-y-3" onSubmit={(event) => event.preventDefault()}>
          <fieldset>
            <legend className="label">Choose candidates to compare</legend>
            <div className="flex flex-wrap gap-3">
              {inPosition.map((candidate) => (
                <label key={candidate.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={candidate.slug}
                    checked={selected.some((item) => item.id === candidate.id)}
                    onChange={() => toggle(candidate.slug)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <NameWithBadge id={candidate.id} name={candidate.name} claimed={candidate.claimed} />
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      )}

      {selected.length === 0 ? (
        <p className="text-slate-600">No verified candidates for this position yet.</p>
      ) : (
        <>
          <ShareButton url={shareUrl} title="Compare candidates on AMU Pulse" text={`Compare ${position?.title} candidates side by side`} />
          <ComparisonTable
            candidates={tableCandidates}
            issues={tableIssues}
            answerFor={(candidateId, issueId): CandidateAnswer | null => {
              const answer = answers[`${candidateId}:${issueId}`];
              return answer
                ? { id: "", candidate_id: candidateId, issue_id: issueId, answer, source_url: null, updated_at: "" }
                : null;
            }}
          />
        </>
      )}
    </>
  );
}
