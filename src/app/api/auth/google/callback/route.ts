import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=google_failed", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=google_failed", request.url));
  }

  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/login?error=google_failed", request.url));
  }

  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=google_failed", request.url));
  }

  const profile = (await userInfoResponse.json()) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (!profile.email || !profile.email_verified) {
    return NextResponse.redirect(new URL("/login?error=google_failed", request.url));
  }

  const email = profile.email.toLowerCase();

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: profile.name ?? undefined },
    create: { email, name: profile.name },
  });

  await createSession(user.id);
  return NextResponse.redirect(new URL("/", request.url));
}
