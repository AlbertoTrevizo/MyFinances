// One JSON line per event. Never pass passwords, tokens or links.
export function logEvent(event: string, data: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ event, ...data }));
}
