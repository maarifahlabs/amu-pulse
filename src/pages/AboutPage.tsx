import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="container-page max-w-3xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl font-display">About AMU Pulse</h1>
        <p className="text-slate-600">Your Campus. Your Questions. Your Choice.</p>
      </header>
      <section className="card space-y-3">
        <h2 className="text-lg font-bold font-display">What this site is</h2>
        <p className="text-sm leading-relaxed text-slate-700">
          AMU Pulse is an independent guide to the AMU Students&apos; Union (AMUSU) election 2026 at Aligarh Muslim University.
          It publishes the candidate list, campus issues, candidate answers, and the election dates that have been released publicly.
          Candidates are shown equally, in ballot order, with no ranking and no endorsement.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          Students can record a personal choice on AMU Pulse. That choice is not the official ballot. Voting in the election is still in person on the published polling day.
        </p>
      </section>
      <section className="card space-y-3">
        <h2 className="text-lg font-bold font-display">Who runs it</h2>
        <p className="text-sm leading-relaxed text-slate-700">
          AMU Pulse is a project of <a href="https://www.maarifahlabs.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">Maarifah Labs</a>.
          It is not affiliated with, endorsed by, or operated by Aligarh Muslim University or the AMU Students&apos; Union.
          Official dates and rules should always be confirmed with the AMU Registrar&apos;s notices.
        </p>
      </section>
      <section className="card space-y-3">
        <h2 className="text-lg font-bold font-display">Explore</h2>
        <ul className="space-y-2 text-sm font-semibold text-brand-700">
          <li><Link to="/candidates" className="underline">AMUSU election candidates 2026</Link></li>
          <li><Link to="/issues" className="underline">Campus issues</Link></li>
          <li><Link to="/election-guide" className="underline">Election dates</Link></li>
          <li><Link to="/contact" className="underline">Contact us</Link></li>
        </ul>
      </section>
    </div>
  );
}
