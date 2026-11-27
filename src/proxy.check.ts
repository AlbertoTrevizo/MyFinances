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

const invitationPath = `/invitations?token=${"a1".repeat(32)}`;
for (const cookie of ["", "session=unvalidated-token"]) {
  for (const route of [invitationPath, "/invitations", "/invitations?token=bad", `/invitations?token=${"A".repeat(64)}`, `${invitationPath}&extra=1`, `/books?token=${"a1".repeat(32)}`]) {
    const response = proxy(new NextRequest(`https://example.com${route}`, { headers: { cookie } }));
    const saved = response.cookies.get("invitation_return");
    assert.equal(saved?.value, route === invitationPath ? invitationPath : undefined, route);
    if (saved) {
      assert.equal(saved.httpOnly, true);
      assert.equal(saved.sameSite, "lax");
      assert.equal(saved.path, "/");
      assert.equal(saved.maxAge, 86400);
      assert.equal(Boolean(saved.secure), process.env.NODE_ENV === "production");
    }
    assert.equal(response.headers.get(cookie ? "x-middleware-next" : "location"), cookie ? "1" : "https://example.com/login");
  }
}

console.log("proxy ok");
