const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;

type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();

function prune(hits: number[], now: number): number[] {
  return hits.filter((ts) => now - ts < WINDOW_MS);
}

export function consumeAuditRateLimit(
  key: string,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  const existing = buckets.get(key);
  const hits = prune(existing?.hits ?? [], now);
  if (hits.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = hits[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    buckets.set(key, { hits });
    return { ok: false, retryAfterSec };
  }
  hits.push(now);
  buckets.set(key, { hits });
  return { ok: true };
}

export function resetAuditRateLimit(): void {
  buckets.clear();
}

export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "anonymous";
}
