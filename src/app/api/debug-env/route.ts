import { NextResponse } from "next/server";

// Temporary debug route — remove after fixing OAuth
export function GET() {
  return NextResponse.json({
    AUTH_URL: process.env.AUTH_URL ?? "(not set)",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "(not set)",
    NODE_ENV: process.env.NODE_ENV,
  });
}
