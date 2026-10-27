import React, { useState } from "react";
import type { AdminAuditLogItem } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";

interface AdminAuditTabProps {
  logs: AdminAuditLogItem[];
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function AdminAuditTab({ logs, onRefresh, isRefreshing }: AdminAuditTabProps) {
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const actionMatch = log.action.toLowerCase().includes(q);
    const actorMatch = (log.actor_name || "").toLowerCase().includes(q);
    const entityMatch = log.entity_type.toLowerCase().includes(q);
    return actionMatch || actorMatch || entityMatch;
  });

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900">
            System Security & Audit Activity Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of voting activity, administrative decisions, candidate changes, and moderation actions
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-secondary text-xs py-2 px-3 font-semibold"
        >
          {isRefreshing ? "Refreshing…" : "Sync Audit Logs"}
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs flex items-center justify-between">
        <input
          type="text"
          placeholder="Filter by action (e.g. claim.approve, candidate.admin_create)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{filteredLogs.length}</strong> events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-3 px-4">Action</th>
                <th scope="col" className="py-3 px-4">Entity</th>
                <th scope="col" className="py-3 px-4">Actor</th>
                <th scope="col" className="py-3 px-4">Timestamp</th>
                <th scope="col" className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="ml-1 text-[10px] text-slate-400 font-mono">
                          ({log.entity_id.slice(0, 8)}…)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.actor_name || "System Actor"}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.created_at ? formatDateTime(log.created_at) : "—"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          View Payload
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Event Payload: {selectedLog.action}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged at {formatDateTime(selectedLog.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <pre className="rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 p-4 text-xs font-mono overflow-x-auto max-h-80">
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-secondary text-xs py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
