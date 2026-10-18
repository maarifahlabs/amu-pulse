"use server";

import { audit, getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { firstError, formToObject, questionSchema } from "@/lib/validations";

export interface QuestionFormState {
  status: "idle" | "ok" | "error" | "login";
  message: string;
}

const DAILY_LIMIT = 5;

export async function submitQuestion(_prev: QuestionFormState, formData: FormData): Promise<QuestionFormState> {
  if (!isSupabaseConfigured) return { status: "error", message: "Question submission is disabled in demo mode." };

  const viewer = await getViewer();
  if (!viewer) return { status: "login", message: "Please log in to submit a question. Your identity is never shown publicly." };

  const parsed = questionSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const db = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("submitter_id", viewer.id)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return { status: "error", message: `You can submit up to ${DAILY_LIMIT} questions per day.` };
  }

  const { data: issue } = await db
    .from("issues")
    .select("id")
    .eq("id", parsed.data.issueId)
    .eq("status", "published")
    .maybeSingle();
  if (!issue) return { status: "error", message: "This issue is not open for questions." };

  const { data, error } = await db
    .from("questions")
    .insert({ issue_id: issue.id, submitter_id: viewer.id, question: parsed.data.question })
    .select("id")
    .single();
  if (error) return { status: "error", message: "Could not submit your question. Please try again." };

  await audit(viewer.id, "question.submit", "question", data.id);
  return { status: "ok", message: "Thanks! Your question will appear after moderation." };
}
