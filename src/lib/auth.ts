import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// NextAuth v5 configuration.
// We use NextAuth solely to handle the Google OAuth flow (redirect,
// callback, token verification). After a successful sign-in we look
// up the user in our database and create an iron-session (see
// src/app/api/auth/complete/route.ts).
//
// NextAuth's own session is stored as a short-lived JWT — just a
// carrier for the verified email until we can create the real
// iron-session.

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          redirect_uri: process.env.AUTH_URL
            ? `${process.env.AUTH_URL}/api/auth/callback/google`
            : undefined,
        },
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 5 * 60, // 5 minutes — just long enough to complete the iron-session handoff
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Only allow Google sign-in with verified emails
      if (account?.provider === "google") {
        return !!profile?.email_verified;
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email;
      }
      return token;
    },
  },
});
