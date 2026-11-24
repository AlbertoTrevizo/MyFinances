// Run: npx tsx src/lib/app-url.check.ts
import { appRedirect, appUrl } from "./app-url";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
async function main() {
  const environment: Record<string, string | undefined> = process.env;
  // RF-5/RF-10 require links; configuration details below characterize the existing helper.
  const cases = [
    { env: "development", url: undefined, base: "http://localhost:3000" },
    { env: "test", url: "", base: "http://localhost:3000" },
    { env: undefined, url: "   ", base: "http://localhost:3000" },
    { env: "production", url: undefined, base: null },
    { env: "production", url: "", base: null },
    { env: "production", url: "   ", base: null },
    { env: "production", url: "https://finances.example", base: "https://finances.example" },
    { env: "development", url: "  https://finances.example///  ", base: "https://finances.example" },
    { env: "production", url: "not a URL", base: "not a URL" },
  ];
  for (const { env, url, base } of cases) {
    const savedUrl = process.env.APP_URL;
    const savedMode = process.env.NODE_ENV;
    try {
      if (url === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = url;
      if (env === undefined) delete environment.NODE_ENV;
      else environment.NODE_ENV = env;
      assert(appUrl() === base, `RF-5/RF-10: current link base for ${env}, ${JSON.stringify(url)}`);
      if (url === "not a URL") {
        let thrown: unknown;
        try { appRedirect("/login"); } catch (error) { thrown = error; }
        assert(thrown instanceof TypeError, "RF-5/RF-10: current invalid base throws during redirect construction");
      } else {
        const response = appRedirect("/login?confirmed=1");
        if (base === null) {
          assert(response.status === 500, "RF-5/RF-10: missing production base returns 500");
          assert(response.headers.get("location") === null, "RF-5/RF-10: missing base does not redirect");
          assert(await response.text() === "APP_URL is not configured", "RF-5/RF-10: missing base explains configuration failure");
        } else {
          assert(response.status === 307, "RF-5/RF-10: configured base produces a temporary redirect");
          assert(response.headers.get("location") === `${base}/login?confirmed=1`, "RF-5/RF-10: redirect preserves path and query on the configured origin");
        }
      }
    } finally {
      if (savedUrl === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = savedUrl;
      if (savedMode === undefined) delete environment.NODE_ENV;
      else environment.NODE_ENV = savedMode;
    }
  }
  console.log("app-url ok");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
