// ponytail: floor only hides send latency up to `ms`; a provider slower than that still leaks which accounts exist.
export async function withMinimumDuration<T>(ms: number, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const left = ms - (Date.now() - start);
    if (left > 0) await new Promise((resolve) => setTimeout(resolve, left));
  }
}
