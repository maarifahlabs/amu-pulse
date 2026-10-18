import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextParam = request.nextUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const sb = await createSessionClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(absoluteUrl(next));
  }

  return NextResponse.redirect(absoluteUrl(`/login?error=${encodeURIComponent("That login link is invalid or has expired.")}`));
}
