import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DatasetProvider } from "@/context/DatasetContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Pages
import { HomePage } from "@/pages/HomePage";
import { IssuesPage } from "@/pages/IssuesPage";
import { IssueDetailPage } from "@/pages/IssueDetailPage";
import { CandidatesPage } from "@/pages/CandidatesPage";
import { CandidateDetailPage } from "@/pages/CandidateDetailPage";
import { ComparePage } from "@/pages/ComparePage";
import { VotePage } from "@/pages/VotePage";
import { ElectionGuidePage } from "@/pages/ElectionGuidePage";
import { LoginPage } from "@/pages/LoginPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CreateProfilePage } from "@/pages/CreateProfilePage";
import { ClaimPage } from "@/pages/ClaimPage";
import { PosterPage } from "@/pages/PosterPage";
import { AboutPage } from "@/pages/AboutPage";
import { ContactPage } from "@/pages/ContactPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminGate } from "@/pages/AdminGate";
import { MaintenancePage } from "@/pages/MaintenancePage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const { pathname, search } = location;

  // Check if maintenance mode is active (enabled by default or via VITE_MAINTENANCE_MODE)
  const isMaintenanceConfigured = import.meta.env.VITE_MAINTENANCE_MODE !== "false";
  
  // Optional admin bypass via URL ?bypass=amuadmin or stored preview flag
  const searchParams = new URLSearchParams(search);
  if (searchParams.get("bypass") === "amuadmin") {
    localStorage.setItem("amu_maintenance_bypass", "true");
  }
  const isBypassed = localStorage.getItem("amu_maintenance_bypass") === "true";

  if (isMaintenanceConfigured && !isBypassed) {
    return <MaintenancePage />;
  }

  const isAdminDashboard = pathname.startsWith("/admin/dashboard");
  const isAdminLogin = pathname.startsWith("/admin/login") || pathname === "/admin";

  if (isAdminDashboard) {
    return (
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {!isAdminLogin && <Header />}
      <main id="main" className={`flex-1 ${isAdminLogin ? "" : "pb-16"}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/:slug" element={<IssueDetailPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/:slug" element={<CandidateDetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/election-guide" element={<ElectionGuidePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/candidate/dashboard" element={<DashboardPage />} />
          <Route path="/create" element={<CreateProfilePage />} />
          <Route path="/claim/:slug" element={<ClaimPage />} />
          <Route path="/claim" element={<CandidatesPage />} />
          <Route path="/poster" element={<PosterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminGate />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="*"
            element={
              <div className="container-page py-20 text-center space-y-4">
                <h1 className="text-3xl font-bold font-display">404 — Page Not Found</h1>
                <p className="text-slate-600">The page you were looking for does not exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
      {!isAdminLogin && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <AppContent />
        </BrowserRouter>
      </DatasetProvider>
    </AuthProvider>
  );
}

export default App;
