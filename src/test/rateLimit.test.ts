import { describe, expect, it, vi } from "vitest";

import { extractClientIp, takeRateLimit } from "../../app/api/auth/_lib/rateLimit";

describe("takeRateLimit", () => {
  it("allows requests up to the configured limit", () => {
    const key = `test-limit-${Date.now()}`;

    expect(takeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(takeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(takeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed).toBe(false);
  });

  it("resets after the window", () => {
    vi.useFakeTimers();
    const now = new Date("2026-02-14T00:00:00.000Z");
    vi.setSystemTime(now);
    const key = "test-reset-window";

    expect(takeRateLimit({ key, limit: 1, windowMs: 1_000 }).allowed).toBe(true);
    expect(takeRateLimit({ key, limit: 1, windowMs: 1_000 }).allowed).toBe(false);

    vi.setSystemTime(new Date(now.getTime() + 1_100));
    expect(takeRateLimit({ key, limit: 1, windowMs: 1_000 }).allowed).toBe(true);
    vi.useRealTimers();
  });
});

describe("extractClientIp", () => {
  it("prefers x-forwarded-for first value", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.5, 198.51.100.7",
      },
    });

    expect(extractClientIp(request)).toBe("203.0.113.5");
  });
});
