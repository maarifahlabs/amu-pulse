import { useState } from "react";

export function MaintenancePage() {
  const [checking, setChecking] = useState(false);

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5 font-bold tracking-tight text-white">
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-base text-white font-black shadow-lg shadow-brand-500/20"
            >
              P
            </span>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight">AMU Pulse</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Maarifah Labs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            <span>Maintenance Mode</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        {/* Background ambient lighting effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden blur-3xl opacity-20 -z-10"
        >
          <div className="h-[450px] w-[500px] rounded-full bg-gradient-to-tr from-brand-600 via-emerald-500 to-amber-500" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          {/* Icon Badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-emerald-950/40">
            <svg
              className="h-10 w-10 text-emerald-400 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.07a4.5 4.5 0 004.486-6.32l-3.276 3.277a1.5 1.5 0 01-2.122 0l-1.06-1.06a1.5 1.5 0 010-2.122l3.277-3.276a4.5 4.5 0 00-6.32 4.486c.118.58.094 1.193-.07 1.743"
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            System Upgrades in Progress
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white font-display">
            We’ll be back shortly
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            <strong className="text-white font-semibold">AMU Pulse</strong> is undergoing scheduled
            maintenance, system optimizations, and database sync. All public services and voting
            modules will resume once updates complete.
          </p>

          {/* Feature Grid */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5 font-semibold text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Speed & Caching
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Upgrading platform performance for peak traffic during election queries.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5 font-semibold text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Data Integrity
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Verifying database consistency, candidate records, and security assertions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5 font-semibold text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Automated processes are running. Expected return in a short window.
              </p>
            </div>
          </div>

          {/* Call to action / Reload button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 hover:from-brand-500 hover:to-emerald-500 transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              <svg
                className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              {checking ? "Checking Status..." : "Check Status Again"}
            </button>

            <a
              href="mailto:contact@maarifahlabs.com"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} AMU Pulse. Independent student initiative developed by Maarifah
          Labs.
        </p>
      </footer>
    </div>
  );
}
