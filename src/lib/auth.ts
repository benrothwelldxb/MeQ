// Google OAuth helpers — replaces NextAuth which had a bug constructing
// redirect_uri on Railway (req.url contained localhost:8080 internally).

import { createHash, randomBytes } from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function getBaseUrl() {
  return process.env.AUTH_URL || "http://localhost:3000";
}

function getRedirectUri() {
  return `${getBaseUrl()}/api/auth/callback/google`;
}

/** Build the Google OAuth authorization URL. */
export function getGoogleAuthUrl(type: "admin" | "teacher" | "super") {
  const state = randomBytes(32).toString("hex");
  const nonce = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state: `${type}:${state}`,
    nonce,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchange an authorization code for tokens and return the verified email. */
export async function exchangeCodeForEmail(code: string): Promise<string | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const idToken = data.id_token as string | undefined;
  if (!idToken) return null;

  // Decode the JWT payload (Google's ID token is a signed JWT).
  // We don't need to verify the signature here because we just
  // received it directly from Google's token endpoint over HTTPS.
  const payload = JSON.parse(
    Buffer.from(idToken.split(".")[1], "base64url").toString()
  );

  if (!payload.email_verified) return null;
  return (payload.email as string).toLowerCase();
}
