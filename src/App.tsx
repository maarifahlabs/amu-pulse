import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col bg-slate-50">
          <Header />
          <main id="main" className="flex-1 pb-16">
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
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
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
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
