import { handlers } from "@/lib/auth";

// NextAuth v5 route handler. This only handles the Google OAuth dance —
// the actual app session (iron-session) is created in /api/auth/complete.
export const { GET, POST } = handlers;
