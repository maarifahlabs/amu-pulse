import Link from "next/link";
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
    <Link href="/vote" prefetch={false} className="vote-now">
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      VOTE NOW
      <span className="vote-live">
        <span className="vote-live-dot" />
        LIVE
      </span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex min-h-14 items-center justify-between gap-3 py-2">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-brand-900">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-sm text-white">P</span>
          AMU Pulse
        </Link>
        <div className="flex items-center gap-2">
          <nav aria-label="Main" className="hidden gap-1 lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} prefetch={item.href === "/create" ? false : undefined} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                {item.label}
              </Link>
            ))}
          </nav>
          <VoteNow />
          <AccountMenu />
        </div>
      </div>
      <div className="site-marquee border-t border-slate-200 bg-[#f5c400] text-slate-950" role="region" aria-label="Notice for contesting candidates">
        <div className="site-marquee-track">
          <p>
            Contesting candidate pls mail us at{" "}
            <a href="mailto:contact@maarifahlabs.com" className="underline">contact@maarifahlabs.com</a>
            {" "}to get <strong>verified badge(No charges)</strong>
          </p>
          <p aria-hidden="true">
            Contesting candidate pls mail us at{" "}
            <a href="mailto:contact@maarifahlabs.com" className="underline" tabIndex={-1}>contact@maarifahlabs.com</a>
            {" "}to get <strong>verified badge(No charges)</strong>
          </p>
        </div>
      </div>
      <nav aria-label="Main mobile" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 lg:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} prefetch={item.href === "/create" ? false : undefined} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
