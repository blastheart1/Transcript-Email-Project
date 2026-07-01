import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

// Edge-safe middleware. `req.auth` is populated by the wrapper from the JWT.
const { auth } = NextAuth(authConfig);

const PUBLIC = ["/login", "/automation-flow", "/api/auth", "/api/ingest", "/api/providers"];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  if (PUBLIC.some((p) => path.startsWith(p))) return;

  const isGuest = req.cookies.get("relay_guest")?.value === "1";
  if (req.auth || isGuest) return;

  // Unauthenticated: APIs get 401 JSON, pages redirect to the login screen.
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", nextUrl));
});

export const config = {
  matcher: ["/((?!api/auth|api/ingest|api/providers|_next/static|_next/image|favicon.ico).*)"],
};
