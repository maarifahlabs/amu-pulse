const getEnv = (viteKey: string, fallback = "") => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  return fallback;
};

/** Base URL of the AMU Pulse NestJS API (amu-pulse-api). */
export const API_URL = String(getEnv("VITE_API_URL", "http://localhost:3000")).replace(/\/$/, "");
export const SITE_URL = (getEnv("VITE_SITE_URL", typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")).replace(/\/$/, "");
export const BASE_PATH = "";

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
