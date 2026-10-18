"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { messageHref } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { emailSchema, firstError, formToObject } from "@/lib/validations";

const OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/candidate/dashboard";
}

/** Callback must return to the same host that stored the login cookie. */
async function callbackUrl(next: string) {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]?.trim();
  const proto = h.get("x-forwarded-proto") ?? "https";
  let origin = SITE_URL;
  if (host) {
    const candidate = `${proto}://${host}`.replace(/\/$/, "");
    try {
      const url = new URL(candidate);
      const hostname = url.hostname;
      const sameSite = candidate === SITE_URL;
      const preview = hostname === "amu-pulse.vercel.app" || (hostname.startsWith("amu-pulse") && hostname.endsWith(".vercel.app"));
      const local = hostname === "localhost" || hostname === "127.0.0.1";
      if (sameSite || preview || local) origin = candidate;
    } catch {
      origin = SITE_URL;
    }
  }
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function sendMagicLink(formData: FormData) {
  if (!isSupabaseConfigured) redirect(messageHref("/login", "error", "Login is disabled in demo mode."));

  const parsed = emailSchema.safeParse(formToObject(formData));
  if (!parsed.success) redirect(messageHref("/login", "error", firstError(parsed.error)));

  const next = safeNext(parsed.data.next);
  const sb = await createSessionClient();
  const { error } = await sb.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: await callbackUrl(next) },
  });

  if (error) redirect(messageHref("/login", "error", "Could not send the login link. Please try again shortly."));
  redirect(messageHref("/login", "ok", "Check your email. Open the latest link, then press Continue."));
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
    redirect(messageHref("/login", "error", "That login link is invalid or has expired. Request a new one and open the latest email."));
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
