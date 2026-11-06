import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { appRedirect, appUrl } from "@/lib/app-url";
import { normalizeEmail } from "@/lib/user-validation";
import { logEvent } from "@/lib/log";

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
};

async function fetchProfile(code: string, redirectUri: string): Promise<GoogleProfile | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  try {
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
      signal: AbortSignal.timeout(5000),
    });
    if (!tokenResponse.ok) return null;
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token) return null;

    const infoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!infoResponse.ok) return null;
    return (await infoResponse.json()) as GoogleProfile;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  // Cancelling at Google arrives without a code.
  if (!code || !state || !expectedState || state !== expectedState) {
    return appRedirect("/login?error=google_failed");
  }
  const base = appUrl();
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !base) {
    return appRedirect("/login?error=google_not_configured");
  }

  const profile = await fetchProfile(code, `${base}/api/auth/google/callback`);
  if (!profile?.sub || !profile.email) return appRedirect("/login?error=google_failed");
  if (profile.email_verified !== true) return appRedirect("/login?error=google_unverified");

  const googleId = profile.sub;
  const email = normalizeEmail(profile.email);
  const given = profile.given_name?.trim().slice(0, 100) || null;
  const family = profile.family_name?.trim().slice(0, 100) || null;

  try {
    // The Google id first, so an account whose email was changed keeps working.
    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (!byEmail) {
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            name: given,
            lastName: family,
            emailVerifiedAt: new Date(),
            profileIncomplete: !given || !family,
          },
        });
        logEvent("registration", { userId: user.id, method: "google" });
      } else if (byEmail.googleId) {
        // Already linked to a different Google account.
        return appRedirect("/login?error=google_failed");
      } else if (byEmail.emailVerifiedAt) {
        user = await prisma.user.update({ where: { id: byEmail.id }, data: { googleId } });
      } else {
        // Pending: Google proves the email, so confirm it and retire the password and links.
        user = await prisma.$transaction(async (tx) => {
          await tx.userToken.deleteMany({ where: { userId: byEmail.id } });
          return tx.user.update({
            where: { id: byEmail.id },
            data: {
              emailVerifiedAt: new Date(),
              passwordHash: null,
              passwordSalt: null,
              googleId,
            },
          });
        });
        logEvent("confirmation", { userId: user.id, method: "google" });
      }
    }

    await createSession(user.id);
    return appRedirect(user.profileIncomplete ? "/complete-profile" : "/");
  } catch (error) {
    // A simultaneous sign-in may have created the account first; sending the person back to retry is enough.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
    return appRedirect("/login?error=google_failed");
  }
}
