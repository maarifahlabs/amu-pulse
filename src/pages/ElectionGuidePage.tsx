import { ElectionTimeline } from "@/components/ElectionTimeline";
import { useDataset } from "@/hooks/useDataset";

export function ElectionGuidePage() {
  const { dataset: ds, loading } = useDataset();

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading election guide…</p>
      </div>
    );
  }

  return (
    <div className="container-page space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl font-display">Election guide</h1>
        <p className="text-slate-600">
          This is the published 2026–27 schedule. The AMU Registrar&apos;s notices remain the authoritative source if a date changes.
        </p>
      </header>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold font-display">Key dates</h2>
        <ElectionTimeline events={ds.events} />
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold font-display">Positions</h2>
        <dl className="space-y-3">
          {ds.positions.map((p) => (
            <div key={p.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <dt className="font-semibold text-slate-800">{p.title}</dt>
              {p.description && <dd className="text-sm text-slate-600 mt-0.5">{p.description}</dd>}
            </div>
          ))}
        </dl>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold font-display">About AMU Pulse</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>Independent and nonpartisan. Not affiliated with or endorsed by AMU or the Students&apos; Union.</li>
          <li>We do not run official voting, polls or predictions, and we never ask who you will vote for in the real election.</li>
          <li>Every candidate gets the same questions and the same layout. Candidates are listed in official ballot serial order.</li>
          <li>Candidate content is published only after identity verification and moderation.</li>
          <li>Student questions are moderated, and submitters are never identified publicly.</li>
          <li>Browsing requires no login. Login is only needed to submit a question, save a personal ballot choice, or manage a candidate profile.</li>
        </ul>
      </section>
    </div>
  );
}
