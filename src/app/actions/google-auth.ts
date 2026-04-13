"use server";

import { signIn } from "@/lib/auth";

// Kick off Google OAuth. After Google redirects back, NextAuth will
// land on /api/auth/complete?type=... which reads the JWT, looks up
// the user in our DB, and creates an iron-session.
export async function signInWithGoogle(type: "admin" | "teacher" | "super") {
  await signIn("google", {
    redirectTo: `/api/auth/complete?type=${type}`,
  });
}
