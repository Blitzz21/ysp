type Bucket = {
  count: number;
  resetAt: number;
};

type LimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

type LimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

const globalBuckets = globalThis as typeof globalThis & {
  __yspRateLimitBuckets?: Map<string, Bucket>;
};

function getBuckets(): Map<string, Bucket> {
  if (!globalBuckets.__yspRateLimitBuckets) {
    globalBuckets.__yspRateLimitBuckets = new Map<string, Bucket>();
  }
  return globalBuckets.__yspRateLimitBuckets;
}

export function takeRateLimit(input: LimitInput): LimitResult {
  const now = Date.now();
  const buckets = getBuckets();
  const existing = buckets.get(input.key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true };
  }

  if (existing.count >= input.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return { allowed: true };
}

export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}
