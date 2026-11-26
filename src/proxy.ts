import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/confirm-email",
  "/forgot-password",
  "/reset-password",
  "/api/auth/google",
  "/api/auth/google/callback",
];

// Only check cookie presence here; pages and actions validate the session.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico$|[^/]+\\.(?:png|svg|ico)$).*)"],
};
