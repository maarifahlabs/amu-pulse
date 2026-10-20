import Link from "next/link";
import { joinedField } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

export async function YourVotes({ profileId }: { profileId: string }) {
  const { data, error } = await createAdminClient()
    .from("student_votes")
    .select("candidate_id, candidates(name, slug, ballot_number, positions(title, sort_order))")
    .eq("profile_id", profileId);

  const votes = (data ?? [])
    .map((row) => {
      const candidate = Array.isArray(row.candidates) ? row.candidates[0] : row.candidates;
      if (!candidate) return null;
      const serial = candidate.ballot_number == null ? "" : String(candidate.ballot_number).padStart(2, "0");
      return {
        id: row.candidate_id as string,
        name: candidate.name as string,
        slug: candidate.slug as string,
        serial,
        post: joinedField(candidate.positions, "title") || "Candidate",
        order: joinedNumber(candidate.positions, "sort_order"),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.order - b.order || a.serial.localeCompare(b.serial) || a.name.localeCompare(b.name));

  return (
    <section id="votes" className="card scroll-mt-20 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Your votes</h2>
        <Link href="/vote" className="btn-secondary">{votes.length ? "Update vote" : "Vote"}</Link>
      </div>
      {error ? (
        <p className="text-sm text-slate-600">Your votes will show here after the voting list is turned on.</p>
      ) : votes.length === 0 ? (
        <p className="text-sm text-slate-600">You have not chosen any candidates yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {votes.map((vote) => (
            <li key={vote.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">{vote.post}</span>
                <Link href={`/candidates/${vote.slug}`} className="font-semibold hover:underline">{vote.name}</Link>
              </span>
              {vote.serial && <span className="shrink-0 text-slate-500">Serial {vote.serial}</span>}
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
