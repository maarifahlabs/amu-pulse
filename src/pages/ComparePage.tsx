import { useSearchParams } from "react-router-dom";
import { ComparisonTable } from "@/components/ComparisonTable";
import { NameWithBadge } from "@/components/NameWithBadge";
import { ShareButton } from "@/components/ShareButton";
import { findAnswer } from "@/lib/data";
import { useDataset } from "@/hooks/useDataset";

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dataset: ds, loading } = useDataset();

  const positionSlug = searchParams.get("position");
  const candidatesParam = searchParams.get("candidates");

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading comparison data…</p>
      </div>
    );
  }

  const position = ds.positions.find((p) => p.slug === positionSlug) ?? ds.positions[0];
  const inPosition = position ? ds.candidates.filter((c) => c.position_id === position.id) : [];

  const requested = candidatesParam ? candidatesParam.split(",").filter(Boolean) : [];
  const selected = requested.length ? inPosition.filter((c) => requested.includes(c.slug)) : inPosition;

  function setPosition(slug: string) {
    const next = new URLSearchParams(searchParams);
    next.set("position", slug);
    next.delete("candidates");
    setSearchParams(next);
  }

  function toggleCandidate(slug: string) {
    const current = selected.map((c) => c.slug);
    let updated: string[];
    if (current.includes(slug)) {
      updated = current.filter((s) => s !== slug);
    } else {
      updated = [...current, slug];
    }
    const next = new URLSearchParams(searchParams);
    if (updated.length === 0 || updated.length === inPosition.length) {
      next.delete("candidates");
    } else {
      next.set("candidates", updated.join(","));
    }
    setSearchParams(next);
  }

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl font-display">Compare candidates</h1>
        <p className="text-slate-600">
          Candidates appear in official ballot serial order with identical layout. Nothing here is ranked or scored.
        </p>
      </header>

      <nav aria-label="Positions" className="flex flex-wrap gap-2">
        {ds.positions.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPosition(p.slug)}
            className={`badge px-3 py-1 cursor-pointer transition ${
              p.id === position?.id ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.title}
          </button>
        ))}
      </nav>

      {inPosition.length > 1 && (
        <div className="card space-y-3">
          <p className="label font-semibold">Choose candidates to compare</p>
          <div className="flex flex-wrap gap-3">
            {inPosition.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  value={c.slug}
                  checked={selected.some((s) => s.id === c.id)}
                  onChange={() => toggleCandidate(c.slug)}
                  className="h-4 w-4 accent-brand-600"
                />
                <NameWithBadge id={c.id} name={c.name} claimed={c.profile_id !== null} className="font-medium text-slate-700" />
              </label>
            ))}
          </div>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="card text-center py-12 text-slate-600">
          <p className="text-base font-semibold">No verified candidates found for this position.</p>
        </div>
      ) : (
        <>
          <ShareButton
            url={window.location.href}
            title="Compare candidates on AMU Pulse"
            text={`Compare ${position?.title} candidates side by side`}
          />
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
