import { getStudentSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getStudentSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
