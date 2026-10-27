import React from "react";
import { Link } from "react-router-dom";
import type { Issue } from "@/lib/types";

interface AdminIssuesTabProps {
  issues: Issue[];
}

export function AdminIssuesTab({ issues }: AdminIssuesTabProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900">
            Campus Issues & Agendas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key student priority issues tracked across the 2026 election cycle
          </p>
        </div>

        <Link
          to="/issues"
          target="_blank"
          className="btn-secondary text-xs py-2 px-3 font-semibold"
        >
          View Public Issues Page ↗
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  {issue.category}
                </span>
                <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  Published
                </span>
              </div>

              <h3 className="text-base font-bold font-display text-slate-900 leading-snug">
                {issue.title}
              </h3>

              {issue.description && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {issue.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">
                /issues/{issue.slug}
              </span>
              <Link
                to={`/issues/${issue.slug}`}
                target="_blank"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                Open discussion ↗
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
