import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth";

// Redirects the browser to Google's OAuth consent screen.
// Called as: /api/auth/google-start?type=admin|teacher|super
export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const baseUrl = process.env.AUTH_URL || url.origin;

  if (type !== "admin" && type !== "teacher" && type !== "super") {
    return NextResponse.redirect(`${baseUrl}/admin/login?error=InvalidType`);
  }

  return NextResponse.redirect(getGoogleAuthUrl(type));
}
