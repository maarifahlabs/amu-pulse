import type { Metadata } from "next";
import { ElectionTimeline } from "@/components/ElectionTimeline";
import { getDataset } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AMUSU election 2026 dates",
  description: "Published dates for the AMU Students' Union (AMUSU) election 2026, from voter lists through polling on 5 November.",
};

export default async function ElectionGuidePage() {
  const ds = await getDataset();

  return (
    <div className="container-page space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Election guide</h1>
        <p className="text-slate-600">
          This is the published 2026–27 schedule. The AMU Registrar&apos;s notices remain the authoritative source if a date changes.
        </p>
      </header>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Key dates</h2>
        <ElectionTimeline events={ds.events} />
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Positions</h2>
        <dl className="space-y-3">
          {ds.positions.map((p) => (
            <div key={p.id}>
              <dt className="font-semibold">{p.title}</dt>
              {p.description && <dd className="text-sm text-slate-600">{p.description}</dd>}
            </div>
          ))}
        </dl>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">About AMU Pulse</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Independent and nonpartisan. Not affiliated with or endorsed by AMU or the Students&apos; Union.</li>
          <li>We do not run voting, polls or predictions, and we never ask who you will vote for.</li>
          <li>Every candidate gets the same questions and the same layout. Candidates are listed in official ballot serial order.</li>
          <li>Candidate content is published only after identity verification and moderation.</li>
          <li>Student questions are moderated, and submitters are never identified publicly.</li>
          <li>Browsing requires no login. Login is only needed to submit a question or manage a candidate profile.</li>
        </ul>
      </section>
    </div>
  );
}
