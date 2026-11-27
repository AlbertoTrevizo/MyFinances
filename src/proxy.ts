import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { invitationReturnPath } from "./lib/book-rules";

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
  const response = !token
    ? NextResponse.redirect(new URL("/login", request.url))
    : NextResponse.next();
  const returnPath = pathname === "/invitations"
    ? invitationReturnPath(pathname + request.nextUrl.search)
    : null;
  if (returnPath) {
    response.cookies.set("invitation_return", returnPath, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico$|[^/]+\\.(?:png|svg|ico)$).*)"],
};
