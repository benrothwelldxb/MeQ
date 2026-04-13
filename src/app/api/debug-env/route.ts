import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Temporary debug route — remove after fixing OAuth
export async function GET(req: NextRequest) {
  const hdrs = await headers();
  return NextResponse.json({
    AUTH_URL: process.env.AUTH_URL ?? "(not set)",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "(not set)",
    NODE_ENV: process.env.NODE_ENV,
    reqUrl: req.url,
    host: hdrs.get("host"),
    xForwardedHost: hdrs.get("x-forwarded-host"),
    xForwardedProto: hdrs.get("x-forwarded-proto"),
    xForwardedFor: hdrs.get("x-forwarded-for"),
  });
}
