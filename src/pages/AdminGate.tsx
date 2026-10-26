import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Smart gate for /admin — redirects to login or dashboard based on auth state.
 */
export function AdminGate() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (user && profile?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate("/admin/login", { replace: true });
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="admin-login-bg">
      <div className="admin-login-card" style={{ alignItems: "center" }}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-r-transparent" />
      </div>
    </div>
  );
}
