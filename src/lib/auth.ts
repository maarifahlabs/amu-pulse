import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { messageHref } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export interface Viewer {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

export async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured) return null;
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
    role: (profile?.role as UserRole) ?? "student",
  };
}

export async function requireViewer(next: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireAdmin() {
  const viewer = await requireViewer("/admin/dashboard");
  if (viewer.role !== "admin") {
    redirect(messageHref("/", "error", "This account is not an admin yet. Grant the admin role in Supabase, then sign in again."));
  }
  return viewer;
}

/** Records who changed what. Failures are logged but never block the action. */
export async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>,
) {
  const { error } = await createAdminClient()
    .from("audit_logs")
    .insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, details: details ?? null });
  if (error) console.error("audit log failed", error.message);
}
