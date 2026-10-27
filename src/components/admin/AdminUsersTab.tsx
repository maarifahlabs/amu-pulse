import React, { useState, useMemo } from "react";
import type { AdminUserItem } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";

interface AdminUsersTabProps {
  users: AdminUserItem[];
  onUpdateRole: (userId: string, newRole: "student" | "candidate" | "admin") => Promise<void>;
}

export function AdminUsersTab({ users, onUpdateRole }: AdminUsersTabProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch = (u.display_name || "").toLowerCase().includes(q);
        const idMatch = u.id.toLowerCase().includes(q);
        const candMatch = (u.linked_candidate_name || "").toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !candMatch) return false;
      }
      return true;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: "student" | "candidate" | "admin") => {
    setUpdatingUserId(userId);
    try {
      await onUpdateRole(userId, newRole);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-display text-slate-900">
              Student & User Accounts Directory
            </h2>
            <span className="badge bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5">
              {users.length} accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated student profiles, candidate linkages, and administrative access privileges
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search by display name or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="candidate">Candidates</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{filteredUsers.length}</strong> accounts
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-3 px-4">User</th>
                <th scope="col" className="py-3 px-4">User ID</th>
                <th scope="col" className="py-3 px-4">Linked Candidate</th>
                <th scope="col" className="py-3 px-4">Role</th>
                <th scope="col" className="py-3 px-4">Registered Date</th>
                <th scope="col" className="py-3 px-4 text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    No student accounts found matching filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUpdating = updatingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u.display_name || "AMU Student"}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {u.id.slice(0, 8)}…{u.id.slice(-4)}
                      </td>

                      <td className="py-3 px-4">
                        {u.linked_candidate_name ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60">
                            {u.linked_candidate_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`badge text-[10px] font-bold ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-900 font-extrabold"
                              : u.role === "candidate"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {u.created_at ? formatDateTime(u.created_at) : "—"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <select
                          disabled={isUpdating}
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as "student" | "candidate" | "admin")
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                        >
                          <option value="student">Student</option>
                          <option value="candidate">Candidate</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
