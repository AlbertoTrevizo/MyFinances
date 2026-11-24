// Run: npx tsx src/lib/timing.check.ts
import { setTimeout as sleep } from "node:timers/promises";
import { withMinimumDuration } from "./timing";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
async function main() {
  const minimum = 50;
  const tolerance = 5;
  const value = { ok: true };
  const start = performance.now();
  assert(await withMinimumDuration(minimum, async () => value) === value, "RNF-1: duration wrapper preserves the result");
  assert(performance.now() - start >= minimum - tolerance, "RNF-1: fast success waits for the minimum duration (5ms tolerance)");

  const failure = new Error("expected failure");
  const failedAt = performance.now();
  let thrown: unknown;
  try { await withMinimumDuration(minimum, async () => { throw failure; }); } catch (error) { thrown = error; }
  assert(thrown === failure, "RNF-1: fast failure preserves the original error");
  assert(performance.now() - failedAt >= minimum - tolerance, "RNF-1: fast failure also waits for the minimum duration (5ms tolerance)");

  // Observe extra sleeps instead of imposing a flaky wall-clock upper bound on a busy runner.
  const originalTimeout = globalThis.setTimeout;
  let extraSleeps = 0;
  try {
    globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
      extraSleeps++;
      return originalTimeout(...args);
    }) as typeof setTimeout;
    assert(await withMinimumDuration(minimum, async () => { await sleep(80); return value; }) === value, "RNF-1: slow success preserves the result");
    assert(extraSleeps === 0, "RNF-1: slow success adds no sleep after the minimum has elapsed");
    thrown = undefined;
    try {
      await withMinimumDuration(minimum, async () => { await sleep(80); throw failure; });
    } catch (error) { thrown = error; }
    assert(thrown === failure && extraSleeps === 0, "RNF-1: slow failure preserves the error without an extra sleep");
  } finally {
    globalThis.setTimeout = originalTimeout;
  }
  console.log("timing ok");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
