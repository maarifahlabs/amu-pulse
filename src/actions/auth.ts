"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured, SITE_URL } from "@/lib/env";
import { messageHref } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { firstError, formToObject, passwordAuthSchema } from "@/lib/validations";

const OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function authFailure(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login")) return "Email or password is incorrect.";
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "That email already has an account. Sign in with the password. If this account was created by a login link and has no password, delete it under Supabase Authentication → Users and create it again.";
  }
  if (text.includes("not confirmed") || text.includes("sending") || text.includes("smtp") || text.includes("confirmation")) {
    return "Turn off Confirm email under Supabase Authentication → Providers → Email, then sign in with the password.";
  }
  const detail = message.replace(/\s+/g, " ").trim().slice(0, 160);
  return detail || "Could not sign in. Please try again.";
}

async function readPasswordForm(formData: FormData) {
  if (!isSupabaseConfigured) redirect(messageHref("/login", "error", "Login is disabled in demo mode."));
  const parsed = passwordAuthSchema.safeParse(formToObject(formData));
  if (!parsed.success) redirect(messageHref("/login", "error", firstError(parsed.error)));
  return { ...parsed.data, next: safeNext(parsed.data.next) };
}

export async function signIn(formData: FormData) {
  const { email, password, next } = await readPasswordForm(formData);
  const sb = await createSessionClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) redirect(messageHref("/login", "error", authFailure(error.message)));
  redirect(next);
}

const AUTH_HOSTS = new Set(["amu-pulse.maarifahlabs.com", "amupulse.maarifahlabs.com", "localhost:3000"]);

async function requestOrigin() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return AUTH_HOSTS.has(host) ? `${proto}://${host}` : SITE_URL;
}

export async function signInWithGoogle(formData: FormData) {
  if (!isSupabaseConfigured) redirect(messageHref("/login", "error", "Login is disabled in demo mode."));
  const next = safeNext(String(formData.get("next") ?? ""));
  const cookieStore = await cookies();
  cookieStore.set("amu_auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  const origin = await requestOrigin();
  const sb = await createSessionClient();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    redirect(messageHref("/login", "error", "Google sign-in is not available yet. In Supabase, enable the Google provider and allow this site's /auth/callback URL."));
  }
  redirect(data.url);
}

export async function signUp(formData: FormData) {
  const { email, password, next } = await readPasswordForm(formData);
  const sb = await createSessionClient();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) redirect(messageHref("/login", "error", authFailure(error.message)));
  if (!data.session) {
    redirect(messageHref("/login", "error", "Turn off Confirm email under Supabase Authentication → Providers → Email, then sign in with this password."));
  }
  redirect(next);
}

export async function completeMagicLink(formData: FormData) {
  if (!isSupabaseConfigured) redirect(messageHref("/login", "error", "Login is disabled in demo mode."));

  const next = safeNext(String(formData.get("next") ?? ""));
  const code = String(formData.get("code") ?? "");
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "");
  const sb = await createSessionClient();

  const otpType = OTP_TYPES.find((item) => item === type);
  let failed = true;
  if (tokenHash && otpType) {
    const { error } = await sb.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
    failed = Boolean(error);
  } else if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  }

  if (failed) {
    redirect(messageHref("/login", "error", "That login link is invalid or has expired. Sign in with your email and password."));
  }
  redirect(next);
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const sb = await createSessionClient();
    await sb.auth.signOut();
  }
  redirect("/");
}
