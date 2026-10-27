import React from "react";
import { Link } from "react-router-dom";
import type { AdminTab } from "./AdminSidebar";

interface AdminTopbarProps {
  activeTab: AdminTab;
  onOpenMobile: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  userEmail?: string;
  onSignOut?: () => void;
}

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Executive Overview",
    subtitle: "High-level election pulse, key metrics, and urgent moderation tasks.",
  },
  candidates: {
    title: "Registered Candidates Management",
    subtitle: "Manage, verify, edit, and organize all official candidate profiles.",
  },
  claims: {
    title: "Profile Claims Moderation",
    subtitle: "Verify identity proofs submitted by students claiming candidate profiles.",
  },
  questions: {
    title: "Student Questions Moderation",
    subtitle: "Screen and approve questions submitted by students on campus issues.",
  },
  positions: {
    title: "Electoral Posts & Quotas",
    subtitle: "Overview of contesting positions, quotas, and candidate distribution.",
  },
  issues: {
    title: "Campus Issues & Agendas",
    subtitle: "Monitor student election issues and candidate stance coverage.",
  },
  users: {
    title: "Student & User Accounts",
    subtitle: "Directory of registered student accounts, credentials, and access roles.",
  },
  audit: {
    title: "Audit & Security Activity",
    subtitle: "Immutable log of all administrative actions, votes, and moderation events.",
  },
};

export function AdminTopbar({
  activeTab,
  onOpenMobile,
  onRefresh,
  isRefreshing,
  userEmail,
  onSignOut,
}: AdminTopbarProps) {
  const current = TAB_TITLES[activeTab] || {
    title: "Admin Dashboard",
    subtitle: "Management Console",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Toggle & Tab Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden -ml-1.5 p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          aria-label="Open sidebar navigation"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-slate-400">
              Admin Portal /
            </span>
            <h1 className="text-base sm:text-lg font-bold font-display text-slate-900 leading-tight">
              {current.title}
            </h1>
          </div>
          <p className="hidden md:block text-[11px] text-slate-500 leading-none mt-0.5">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions: Refresh, Voter Site, Logout, User Indicator */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-98 transition disabled:opacity-50"
          title="Refresh all admin data from database"
        >
          <svg
            className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.047a1 1 0 011.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.608-1.286z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">{isRefreshing ? "Syncing…" : "Refresh"}</span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Voter Site Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 active:scale-98 transition"
          title="Return to voter site"
        >
          <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="hidden md:inline">Voter Site</span>
        </Link>

        {/* Logout Button */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 active:scale-98 transition"
            title="Sign out of admin session"
          >
            <svg className="h-3.5 w-3.5 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        )}

        {/* Admin Avatar "A" */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200" title={userEmail || "Admin User"}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs ring-2 ring-emerald-500/20 shadow-xs">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "A"}
          </div>
          {userEmail && (
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight max-w-[130px] truncate">
                {userEmail}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold leading-none">Super Admin</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

