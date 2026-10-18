"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured, SITE_URL } from "@/lib/env";
import { messageHref } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { emailSchema, firstError, formToObject } from "@/lib/validations";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/candidate/dashboard";
}

export async function sendMagicLink(formData: FormData) {
  if (!isSupabaseConfigured) redirect(messageHref("/login", "error", "Login is disabled in demo mode."));

  const parsed = emailSchema.safeParse(formToObject(formData));
  if (!parsed.success) redirect(messageHref("/login", "error", firstError(parsed.error)));

  const next = safeNext(parsed.data.next);
  const sb = await createSessionClient();
  const { error } = await sb.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error) redirect(messageHref("/login", "error", "Could not send the login link. Please try again shortly."));
  redirect(messageHref("/login", "ok", "Check your email for a login link."));
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const sb = await createSessionClient();
    await sb.auth.signOut();
  }
  redirect("/");
}
