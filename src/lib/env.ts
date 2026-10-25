const getEnv = (viteKey: string, fallback = "") => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  return fallback;
};

export const SUPABASE_URL = getEnv("VITE_SUPABASE_URL", "https://movhilslxqbpzghykqty.supabase.co");
export const SUPABASE_ANON_KEY = getEnv("VITE_SUPABASE_ANON_KEY", "sb_publishable_W7czbsr1qMatgxyxe2lgdw_tX1EdRkw");
export const SITE_URL = (getEnv("VITE_SITE_URL", typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")).replace(/\/$/, "");
export const BASE_PATH = "";

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
