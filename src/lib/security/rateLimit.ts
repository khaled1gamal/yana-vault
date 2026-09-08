type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Best-effort in-memory limiter for a single server instance.
 * On multi-instance hosting, put a Redis/Upstash limiter in front of these routes.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
