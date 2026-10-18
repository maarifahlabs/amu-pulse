import type { Metadata } from "next";
import Link from "next/link";
import { ClaimSteps } from "@/components/ClaimSteps";
import { getDataset } from "@/lib/data";
import type { Candidate, Position } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim a candidate profile",
  description: "Find your candidate profile and submit verification so you can publish your bio, manifesto and answers.",
};

function matches(candidate: Candidate, position: Position | undefined, query: string) {
  const q = query.toLowerCase();
  const byNameOrPost =
    candidate.name.toLowerCase().includes(q) || (position?.title.toLowerCase().includes(q) ?? false);
  if (!/^\d+$/.test(query) || candidate.ballot_number == null) return byNameOrPost;
  const serial = String(candidate.ballot_number);
  const padded = serial.padStart(2, "0");
  const bare = query.replace(/^0+/, "") || "0";
  return byNameOrPost || padded === query || serial === bare;
}

export default async function ClaimSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const ds = await getDataset();
  const results = query
    ? ds.candidates.filter((candidate) => matches(candidate, ds.positions.find((p) => p.id === candidate.position_id), query))
    : [];

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Claim your candidate profile</h1>
        <p className="text-slate-600">
          Find the profile created from the official list, then submit your contact details and proof of candidacy.
          A moderator checks your identity before the profile is linked to you.
        </p>
      </header>
      <ClaimSteps current={1} />

      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">Search by name, post, or serial number</label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Name, election post, or serial number"
          className="input"
        />
        <button className="btn-primary">Search</button>
      </form>

      {!query ? (
        <p className="text-sm text-slate-600">Search to see matching profiles. Claim is available only when a profile has not been claimed.</p>
      ) : results.length === 0 ? (
        <p className="text-slate-600">No candidate matches “{query}”.</p>
      ) : (
        <ul className="space-y-3">
          {results.map((candidate) => {
            const position = ds.positions.find((p) => p.id === candidate.position_id);
            const claimed = candidate.profile_id !== null;
            return (
              <li key={candidate.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {position?.title}
                    {candidate.ballot_number != null && ` · No. ${String(candidate.ballot_number).padStart(2, "0")}`}
                  </p>
                  <p className="font-semibold">{candidate.name}</p>
                </div>
                {claimed ? (
                  <span className="badge bg-slate-100 text-slate-600">Already claimed</span>
                ) : (
                  <Link href={`/claim/${candidate.slug}`} className="btn-primary">Claim this profile</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
