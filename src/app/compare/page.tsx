import type { Metadata } from "next";
import Link from "next/link";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ShareButton } from "@/components/ShareButton";
import { findAnswer, getDataset } from "@/lib/data";
import { absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Compare AMUSU election candidates",
  description: "Compare AMU Students' Union (AMUSU) election 2026 candidates side by side. AMU Pulse presents their published answers equally.",
};

// `candidates=a,b` is the shareable form; `pick=a&pick=b` comes from the checkbox form.
type SearchParams = Promise<{ position?: string; candidates?: string; pick?: string | string[] }>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ds = await getDataset();
  const position = ds.positions.find((p) => p.slug === params.position) ?? ds.positions[0];
  const inPosition = position ? ds.candidates.filter((c) => c.position_id === position.id) : [];
  const picked = params.pick === undefined ? [] : [params.pick].flat();
  const requested = picked.length ? picked : params.candidates?.split(",").filter(Boolean);
  const selected = requested?.length ? inPosition.filter((c) => requested.includes(c.slug)) : inPosition;

  const query = new URLSearchParams();
  if (position) query.set("position", position.slug);
  if (requested?.length) query.set("candidates", selected.map((c) => c.slug).join(","));
  const shareUrl = `${absoluteUrl("/compare")}?${query.toString()}`;

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Compare candidates</h1>
        <p className="text-slate-600">
          Candidates appear in official ballot serial order with identical layout. Nothing here is ranked or scored.
        </p>
      </header>

      <nav aria-label="Positions" className="flex flex-wrap gap-2">
        {ds.positions.map((p) => (
          <Link
            key={p.id}
            href={`/compare?position=${p.slug}`}
            className={`badge px-3 py-1 ${p.id === position?.id ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            {p.title}
          </Link>
        ))}
      </nav>

      {inPosition.length > 1 && (
        <form className="card space-y-3">
          <input type="hidden" name="position" value={position?.slug} />
          <fieldset>
            <legend className="label">Choose candidates to compare</legend>
            <div className="flex flex-wrap gap-3">
              {inPosition.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={c.slug} name="pick" defaultChecked={selected.includes(c)} className="h-4 w-4 accent-brand-600" />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="btn-secondary">Update comparison</button>
        </form>
      )}

      {selected.length === 0 ? (
        <p className="text-slate-600">No verified candidates for this position yet.</p>
      ) : (
        <>
          <ShareButton url={shareUrl} title="Compare candidates on AMU Pulse" text={`Compare ${position?.title} candidates side by side`} />
          <ComparisonTable
            candidates={selected}
            issues={ds.issues}
            answerFor={(candidateId, issueId) => findAnswer(ds, candidateId, issueId)}
          />
        </>
      )}
    </div>
  );
}