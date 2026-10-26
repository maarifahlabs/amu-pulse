import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NameWithBadge } from "@/components/NameWithBadge";
import { supabase } from "@/lib/supabase";
import { joinedField } from "@/lib/format";

export function YourVotes({ profileId }: { profileId: string }) {
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVotes() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("student_votes")
          .select("candidate_id, candidates(name, slug, ballot_number, profile_id, positions(title, sort_order))")
          .eq("profile_id", profileId);

        if (!error && data) {
          const parsed = data
            .map((row: any) => {
              const candidate = Array.isArray(row.candidates) ? row.candidates[0] : row.candidates;
              if (!candidate) return null;
              const serial = candidate.ballot_number == null ? "" : String(candidate.ballot_number).padStart(2, "0");
              return {
                id: row.candidate_id as string,
                name: candidate.name as string,
                claimed: candidate.profile_id != null,
                slug: candidate.slug as string,
                serial,
                post: joinedField(candidate.positions, "title") || "Candidate",
                order: joinedNumber(candidate.positions, "sort_order"),
              };
            })
            .filter((row: any) => row !== null)
            .sort((a: any, b: any) => a.order - b.order || a.serial.localeCompare(b.serial) || a.name.localeCompare(b.name));

          setVotes(parsed);
        }
      } finally {
        setLoading(false);
      }
    }

    if (profileId) {
      loadVotes();
    }
  }, [profileId]);

  return (
    <section id="votes" className="card scroll-mt-20 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Your votes</h2>
        <Link to="/vote" className="btn-secondary">
          {votes.length ? "Update vote" : "Vote"}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading your votes…</p>
      ) : votes.length === 0 ? (
        <p className="text-sm text-slate-600">You have not chosen any candidates yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {votes.map((vote) => (
            <li key={vote.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">{vote.post}</span>
                <Link to={`/candidates/${vote.slug}`} className="font-semibold text-brand-700 hover:underline">
                  <NameWithBadge id={vote.id} name={vote.name} claimed={vote.claimed} />
                </Link>
              </span>
              {vote.serial && <span className="shrink-0 text-slate-500 font-mono text-xs">Serial {vote.serial}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function joinedNumber(value: unknown, field: string) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return 0;
  const result = (row as Record<string, unknown>)[field];
  return typeof result === "number" ? result : 0;
}
