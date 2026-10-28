import { API_URL } from "@/lib/env";

/** Signed-in session, kept in localStorage like supabase-js did. */
export interface Session {
  access_token: string;
  refresh_token: string;
  /** Unix seconds when the access token expires. */
  expires_at: number;
  user: SessionUser;
}

export interface SessionUser {
  id: string;
  email: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const STORAGE_KEY = "amu-pulse.session";
/** Refresh this many seconds before the access token actually expires. */
const REFRESH_MARGIN_SECONDS = 60;

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

let session: Session | null = readStoredSession();
let refreshing: Promise<Session | null> | null = null;

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setSession(next: Session | null) {
  session = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the session still lives in memory for this tab.
  }
  for (const listener of listeners) listener(next);
}

// Another tab signed in or out: follow it.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    session = readStoredSession();
    for (const listener of listeners) listener(session);
  });
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new ApiError(message || `Request failed (${res.status}).`, res.status);
  }
  return body as T;
}

async function refreshSession(): Promise<Session | null> {
  // One refresh at a time: refresh tokens are single-use, so parallel refreshes would log the user out.
  refreshing ??= (async () => {
    const current = session;
    if (!current) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      });
      const next = await parse<Session>(res);
      setSession(next);
      return next;
    } catch (err) {
      // Only a rejected token ends the session; a network blip keeps it for the next attempt.
      if (err instanceof ApiError && err.status === 401) setSession(null);
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function accessToken(): Promise<string | null> {
  if (!session) return null;
  if (session.expires_at - REFRESH_MARGIN_SECONDS > Date.now() / 1000) return session.access_token;
  return (await refreshSession())?.access_token ?? null;
}

async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // Token rejected (e.g. server restarted with a new secret): refresh once and retry.
  if (res.status === 401 && token && !retried) {
    if (await refreshSession()) return request<T>(method, path, body, true);
  }
  return parse<T>(res);
}

async function uploadForm<T>(path: string, form: FormData, retried = false): Promise<T> {
  const token = await accessToken();
  // No Content-Type header: the browser sets the multipart boundary itself.
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401 && token && !retried) {
    if (await refreshSession()) return uploadForm<T>(path, form, true);
  }
  return parse<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload: <T>(path: string, form: FormData) => uploadForm<T>(path, form),
};

export const auth = {
  getSession: () => session,

  onChange(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Full-page redirect to Google via the API. Returns to /auth/callback?code=…&next=… */
  signInWithGoogle(next?: string) {
    const params = new URLSearchParams(next ? { next } : {});
    window.location.assign(`${API_URL}/auth/google?${params}`);
  },

  async exchangeCode(code: string) {
    const res = await fetch(`${API_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setSession(await parse<Session>(res));
  },

  async signInWithPassword(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const next = await parse<Session>(res);
    setSession(next);
    return next;
  },

  async signOut() {
    const current = session;
    setSession(null);
    if (current) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      }).catch(() => undefined);
    }
  },
};
