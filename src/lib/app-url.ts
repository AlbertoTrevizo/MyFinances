import { NextResponse } from "next/server";

// Never derive links from the Host header or request.url: a forged Host could point reset links elsewhere.
export function appUrl(): string | null {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
}

export function appRedirect(path: string): Response {
  const base = appUrl();
  if (!base) return new Response("APP_URL is not configured", { status: 500 });
  return NextResponse.redirect(new URL(path, base));
}
