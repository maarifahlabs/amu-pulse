import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const viewer = await getViewer();
    if (!viewer) return NextResponse.json({ signedIn: false });
    return NextResponse.json({
      signedIn: true,
      email: viewer.email,
      name: viewer.displayName,
      role: viewer.role,
    });
  } catch {
    return NextResponse.json({ signedIn: false });
  }
}
