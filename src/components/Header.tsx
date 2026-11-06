import { Link } from "react-router-dom";
import { AccountMenu } from "@/components/AccountMenu";

const NAV = [
  { href: "/issues", label: "Issues" },
  { href: "/candidates", label: "Candidates" },
  { href: "/compare", label: "Compare" },
  { href: "/election-guide", label: "Election guide" },
  { href: "/create", label: "Create profile" },
];

function VoteNow() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-400 border border-slate-200 select-none cursor-not-allowed"
      title="Voting concluded on 5 November 2026. Official results have been announced."
    >
      <span className="h-2 w-2 rounded-full bg-slate-400" />
      VOTING CONCLUDED
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex min-h-14 items-center justify-between gap-3 py-2">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-brand-900">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-sm text-white font-black shadow-sm">
            P
          </span>
          AMU Pulse
        </Link>
        <div className="flex items-center gap-2">
          <nav aria-label="Main" className="hidden gap-1 lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} to={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                {item.label}
              </Link>
            ))}
          </nav>
          <VoteNow />
          <AccountMenu />
        </div>
      </div>
      <nav aria-label="Main mobile" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 lg:hidden">
        {NAV.map((item) => (
          <Link key={item.href} to={item.href} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
