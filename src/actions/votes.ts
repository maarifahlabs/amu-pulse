"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireViewer } from "@/lib/auth";
import { joinedField, messageHref } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { voteLimit } from "@/lib/voting";

const VOTE = "/vote";

function fail(message: string): never {
  redirect(messageHref(VOTE, "error", message));
}

export async function saveVote(formData: FormData) {
  const viewer = await requireViewer(VOTE);

  const ids = [...new Set(formData.getAll("candidateId").filter((value): value is string => typeof value === "string" && value.length > 0))];
  if (ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) fail("Choose candidates from the list.");

  const db = createAdminClient();
  let rows: { id: string; position_id: string; positions: unknown }[] = [];
  if (ids.length > 0) {
    const { data, error } = await db
      .from("candidates")
      .select("id, position_id, positions(slug, title)")
      .in("id", ids)
      .eq("verification_status", "verified");
    if (error || !data || data.length !== ids.length) fail("Choose candidates from the published list.");
    rows = data;

    const counts = new Map<string, { slug: string; title: string; count: number }>();
    for (const row of rows) {
      const slug = joinedField(row.positions, "slug");
      const title = joinedField(row.positions, "title") || "this post";
      const current = counts.get(row.position_id) ?? { slug, title, count: 0 };
      current.count += 1;
      counts.set(row.position_id, current);
    }
    for (const group of counts.values()) {
      const limit = voteLimit(group.slug);
      if (group.count > limit) {
        fail(limit === 1
          ? `Choose only 1 candidate for ${group.title}.`
          : `Choose up to ${limit} candidates for ${group.title}.`);
      }
    }
  }

  const { error: deleteError } = await db.from("student_votes").delete().eq("profile_id", viewer.id);
  if (deleteError) fail("Could not save your vote. If this is the first time, run the student votes SQL in Supabase.");

  if (rows.length > 0) {
    const { error: insertError } = await db.from("student_votes").insert(
      rows.map((row) => ({
        profile_id: viewer.id,
        candidate_id: row.id,
        position_id: row.position_id,
        updated_at: new Date().toISOString(),
      })),
    );
    if (insertError) fail("Could not save your vote.");
  }

  revalidateTag("vote-counts", { expire: 0 });
  await audit(viewer.id, "vote.save", "profile", viewer.id, { count: rows.length });
  redirect(`${messageHref("/candidate/dashboard", "ok", "Your vote was saved. You can change it any time.")}#votes`);
}
