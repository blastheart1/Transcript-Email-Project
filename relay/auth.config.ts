import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no DB / bcrypt). Used by middleware and shared into the
 * full Node config in auth.ts. The `authorized` callback gates every route.
 */
export default {
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [Google],
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl, cookies } = request;
      const p = nextUrl.pathname;
      const isPublic =
        p.startsWith("/login") || p.startsWith("/api/auth") || p.startsWith("/api/ingest");
      if (isPublic) return true;
      const isGuest = cookies.get("relay_guest")?.value === "1";
      return !!auth?.user || isGuest;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = String(token.id);
        session.user.role = token.role ? String(token.role) : undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
