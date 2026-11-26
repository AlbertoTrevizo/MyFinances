// Run: node --import tsx src/proxy.check.ts
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import proxy from "./proxy";

for (const route of [
  "/login", "/register", "/confirm-email", "/forgot-password", "/reset-password",
  "/api/auth/google", "/api/auth/google/callback",
]) {
  const response = proxy(new NextRequest(`https://example.com${route}`));
  assert.equal(response.headers.get("x-middleware-next"), "1", route);
}

for (const route of ["/", "/expenses", "/users", "/complete-profile", "/login/private"]) {
  for (const cookie of ["", "session="]) {
    const response = proxy(new NextRequest(`https://example.com${route}`, {
      headers: { cookie },
    }));
    assert.equal(response.headers.get("location"), "https://example.com/login", route);
  }

  const response = proxy(new NextRequest(`https://example.com${route}`, {
    headers: { cookie: "session=unvalidated-token" },
  }));
  assert.equal(response.headers.get("x-middleware-next"), "1", route);
}

console.log("proxy ok");
