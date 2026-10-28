import React, { createContext, useContext, useEffect, useState } from "react";
import { api, auth, type SessionUser } from "@/lib/api";

export interface Profile {
  id: string;
  display_name: string | null;
  role: "student" | "candidate" | "admin";
  created_at?: string;
}

interface AuthContextType {
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    try {
      const { profile: data } = await api.get<{ profile: Profile | null }>("/auth/me");
      setProfile(data ?? { id: userId, display_name: null, role: "student" });
    } catch {
      // Fallback default student profile
      setProfile({ id: userId, display_name: null, role: "student" });
    }
  }

  useEffect(() => {
    const currentUser = auth.getSession()?.user ?? null;
    setUser(currentUser);
    if (currentUser) {
      fetchProfile(currentUser.id).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const unsubscribe = auth.onChange((session) => {
      const nextUser = session?.user ?? null;
      setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
      if (nextUser) {
        fetchProfile(nextUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (next?: string) => {
    auth.signInWithGoogle(next);
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
