import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const PUBLIC_PATHS = ["/login"];

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { isAdmin: true } } },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico$|[^/]+\\.(?:png|svg|ico)$).*)"],
};
