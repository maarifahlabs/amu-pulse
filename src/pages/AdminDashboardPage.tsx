import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDataset } from "@/hooks/useDataset";
import {
  fetchAdminCandidates,
  fetchAdminClaims,
  fetchAdminQuestions,
  fetchAdminUsers,
  fetchAdminAuditLogs,
  adminCreateCandidate,
  adminUpdateCandidate,
  adminToggleVerifyCandidate,
  adminDeleteCandidate,
  reviewAdminClaim,
  reviewAdminQuestion,
  updateAdminUserRole,
  type AdminCandidateItem,
  type AdminClaimItem,
  type AdminQuestionItem,
  type AdminUserItem,
  type AdminAuditLogItem,
} from "@/lib/admin-api";
import type { VerificationStatus } from "@/lib/types";
import { AdminSidebar, type AdminTab } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminCandidatesTab } from "@/components/admin/AdminCandidatesTab";
import { AdminClaimsTab } from "@/components/admin/AdminClaimsTab";
import { AdminQuestionsTab } from "@/components/admin/AdminQuestionsTab";
import { AdminPositionsTab } from "@/components/admin/AdminPositionsTab";
import { AdminIssuesTab } from "@/components/admin/AdminIssuesTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminAuditTab } from "@/components/admin/AdminAuditTab";

export function AdminDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { dataset: ds, voteCounts, refresh: refreshDataset } = useDataset();
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("amu_admin_active_tab") : null;
    return (saved as AdminTab) || "overview";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [candidates, setCandidates] = useState<AdminCandidateItem[]>([]);
  const [claims, setClaims] = useState<AdminClaimItem[]>([]);
  const [questions, setQuestions] = useState<AdminQuestionItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);

  // UI state
  const [pageLoading, setPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);

  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);
  const [processingQuestionId, setProcessingQuestionId] = useState<string | null>(null);

  // Save active tab
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem("amu_admin_active_tab", tab);
    } catch {
      // Ignore storage errors in incognito
    }
  };

  // Auth Gate
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/admin/login");
      } else if (profile && profile.role !== "admin") {
        navigate("/candidate/dashboard");
      }
    }
  }, [user, profile, authLoading, navigate]);

  // Load All Admin Data
  const loadAllData = useCallback(async (isBackground = false) => {
    if (!isBackground) setPageLoading(true);
    else setIsRefreshing(true);

    try {
      const [candRes, claimsRes, questRes, usersRes, logsRes] = await Promise.allSettled([
        fetchAdminCandidates(),
        fetchAdminClaims(),
        fetchAdminQuestions(),
        fetchAdminUsers(),
        fetchAdminAuditLogs(60),
      ]);

      if (candRes.status === "fulfilled") {
        setCandidates(candRes.value);
      } else if (ds?.candidates) {
        // Fallback to dataset candidates if fetch failed
        setCandidates(
          ds.candidates.map((c) => ({
            ...c,
            position_title: ds.positions.find((p) => p.id === c.position_id)?.title,
          }))
        );
      }

      if (claimsRes.status === "fulfilled") {
        setClaims(claimsRes.value);
      }
      if (questRes.status === "fulfilled") {
        setQuestions(questRes.value);
      }
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value);
      }
      if (logsRes.status === "fulfilled") {
        setAuditLogs(logsRes.value);
      }
    } catch (err) {
      console.error("Admin data loading error:", err);
    } finally {
      setPageLoading(false);
      setIsRefreshing(false);
    }
  }, [ds?.candidates, ds?.positions]);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadAllData();
    }
  }, [profile?.role, loadAllData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Total student votes count
  const totalVotesCount = React.useMemo(() => {
    let sum = 0;
    for (const count of Object.values(voteCounts)) {
      sum += Number(count || 0);
    }
    return sum;
  }, [voteCounts]);

  // Candidate Actions
  const handleSaveCandidate = async (data: {
    id?: string;
    name: string;
    position_id: string;
    ballot_number?: number | null;
    department?: string | null;
    faculty?: string | null;
    bio?: string | null;
    photo_url?: string | null;
    source_url?: string | null;
    verification_status: VerificationStatus;
  }) => {
    if (data.id) {
      // Edit Candidate
      const res = await adminUpdateCandidate(data.id, data);
      if (!res.success) {
        setToast({ type: "error", text: res.error || "Failed to update candidate." });
      } else {
        setToast({ type: "success", text: `Candidate ${data.name} updated successfully!` });
        // Optimistically update candidate in state
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === data.id
              ? {
                  ...c,
                  name: data.name,
                  position_id: data.position_id,
                  ballot_number: data.ballot_number ?? null,
                  department: data.department ?? null,
                  faculty: data.faculty ?? null,
                  bio: data.bio ?? null,
                  photo_url: data.photo_url ?? null,
                  official_source_url: data.source_url ?? null,
                  verification_status: data.verification_status,
                }
              : c
          )
        );
        refreshDataset();
      }
    } else {
      // Create Candidate
      const res = await adminCreateCandidate(data);
      if (!res.success) {
        setToast({ type: "error", text: res.error || "Failed to create candidate." });
      } else {
        setToast({ type: "success", text: `Candidate ${data.name} registered successfully!` });
        await loadAllData(true);
        refreshDataset();
      }
    }
  };

  const handleToggleVerify = async (id: string, currentStatus: VerificationStatus) => {
    const newStatus: VerificationStatus = currentStatus === "verified" ? "unverified" : "verified";
    const res = await adminToggleVerifyCandidate(id, newStatus);
    if (!res.success) {
      setToast({ type: "error", text: res.error || "Failed to toggle status." });
    } else {
      setToast({
        type: "success",
        text: `Candidate marked as ${newStatus.toUpperCase()}.`,
      });
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, verification_status: newStatus } : c))
      );
      refreshDataset();
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    const res = await adminDeleteCandidate(id);
    if (!res.success) {
      setToast({ type: "error", text: res.error || "Failed to delete candidate." });
    } else {
      setToast({ type: "success", text: "Candidate record deleted." });
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      refreshDataset();
    }
  };

  // Claims Actions
  const handleReviewClaim = async (claimId: string, decision: "approve" | "reject") => {
    setProcessingClaimId(claimId);
    try {
      const res = await reviewAdminClaim(claimId, decision);
      if (!res.success) {
        setToast({ type: "error", text: res.error || "Claim review failed." });
      } else {
        setToast({
          type: "success",
          text: `Claim ${decision === "approve" ? "approved" : "rejected"} successfully!`,
        });
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
        await loadAllData(true);
        refreshDataset();
      }
    } finally {
      setProcessingClaimId(null);
    }
  };

  // Questions Actions
  const handleReviewQuestion = async (questionId: string, decision: "approve" | "reject") => {
    setProcessingQuestionId(questionId);
    try {
      const res = await reviewAdminQuestion(questionId, decision);
      if (!res.success) {
        setToast({ type: "error", text: res.error || "Question moderation failed." });
      } else {
        setToast({
          type: "success",
          text: `Question ${decision === "approve" ? "approved" : "rejected"} successfully!`,
        });
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, moderation_status: decision === "approve" ? "approved" : "rejected" } : q))
        );
      }
    } finally {
      setProcessingQuestionId(null);
    }
  };

  // User Role Actions
  const handleUpdateUserRole = async (userId: string, newRole: "student" | "candidate" | "admin") => {
    const res = await updateAdminUserRole(userId, newRole);
    if (!res.success) {
      setToast({ type: "error", text: res.error || "Failed to update role." });
    } else {
      setToast({ type: "success", text: `User role updated to ${newRole.toUpperCase()}.` });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
  };

  if (authLoading || (pageLoading && !candidates.length)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-r-transparent" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-display text-white">Loading Admin Portal</h2>
            <p className="text-xs text-slate-400">Verifying executive credentials and syncing election data…</p>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-900">Access Restricted</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account ({user?.email}) does not possess executive administrative rights for AMU Pulse.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/" className="btn-primary text-xs py-2">
              Return to Voter Portal
            </Link>
            <button onClick={() => signOut()} className="btn-secondary text-xs py-2">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 antialiased font-sans">
      {/* Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingClaimsCount={claims.length}
        pendingQuestionsCount={questions.filter((q) => !q.moderation_status || q.moderation_status === "pending").length}
        totalCandidatesCount={candidates.length}
        userEmail={user?.email}
        onSignOut={() => signOut()}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-72">
        {/* Topbar */}
        <AdminTopbar
          activeTab={activeTab}
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onRefresh={() => loadAllData(true)}
          isRefreshing={isRefreshing}
          userEmail={user?.email}
          onSignOut={() => signOut()}
        />

        {/* Global Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-xl border-slate-200 animate-slide-in">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                toast.type === "success"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {toast.type === "success" ? "✓" : "✕"}
            </div>
            <div className="text-xs font-semibold text-slate-800">{toast.text}</div>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "overview" && (
            <AdminOverviewTab
              candidates={candidates}
              claims={claims}
              questions={questions}
              positions={ds?.positions || []}
              issues={ds?.issues || []}
              auditLogs={auditLogs}
              totalVotesCount={totalVotesCount}
              onTabChange={handleTabChange}
              onOpenAddCandidate={() => setIsAddCandidateOpen(true)}
            />
          )}

          {activeTab === "candidates" && (
            <AdminCandidatesTab
              candidates={candidates}
              positions={ds?.positions || []}
              onSaveCandidate={handleSaveCandidate}
              onToggleVerify={handleToggleVerify}
              onDeleteCandidate={handleDeleteCandidate}
              isAddModalOpen={isAddCandidateOpen}
              onOpenAddModal={() => setIsAddCandidateOpen(true)}
              onCloseAddModal={() => setIsAddCandidateOpen(false)}
            />
          )}

          {activeTab === "claims" && (
            <AdminClaimsTab
              claims={claims}
              onReviewClaim={handleReviewClaim}
              processingClaimId={processingClaimId}
            />
          )}

          {activeTab === "questions" && (
            <AdminQuestionsTab
              questions={questions}
              issues={ds?.issues || []}
              onReviewQuestion={handleReviewQuestion}
              processingQuestionId={processingQuestionId}
            />
          )}

          {activeTab === "positions" && (
            <AdminPositionsTab
              positions={ds?.positions || []}
              candidates={candidates}
              onTabChange={handleTabChange}
            />
          )}

          {activeTab === "issues" && (
            <AdminIssuesTab issues={ds?.issues || []} />
          )}

          {activeTab === "users" && (
            <AdminUsersTab users={users} onUpdateRole={handleUpdateUserRole} />
          )}

          {activeTab === "audit" && (
            <AdminAuditTab
              logs={auditLogs}
              onRefresh={() => loadAllData(true)}
              isRefreshing={isRefreshing}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
