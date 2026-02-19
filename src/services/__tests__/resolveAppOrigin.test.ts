// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// We need to mock next/headers before importing
vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => []),
    })),
    headers: vi.fn(async () => new Headers()),
}));

import {
    resolveAppOrigin,
    resolveCanonicalOrigin,
    resolveRequestOrigin,
} from "../../../app/api/auth/_lib/appwriteAuth";

/* ------------------------------------------------------------------ */
/*  resolveRequestOrigin — used for BROWSER redirects (OAuth callback) */
/* ------------------------------------------------------------------ */
describe("resolveRequestOrigin", () => {
    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_APP_URL;
    });

    it("ignores NEXT_PUBLIC_APP_URL and returns request origin", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network";
        const request = new Request("http://localhost:3000/api/auth/oauth/callback");
        expect(resolveRequestOrigin(request)).toBe("http://localhost:3000");
    });

    it("uses x-forwarded-host + x-forwarded-proto when present", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network";
        const request = new Request("http://localhost:3000/api/auth/oauth/callback", {
            headers: {
                "x-forwarded-host": "staging.example.com",
                "x-forwarded-proto": "https",
            },
        });
        expect(resolveRequestOrigin(request)).toBe("https://staging.example.com");
    });

    it("defaults x-forwarded-proto to https when absent but x-forwarded-host is set", () => {
        const request = new Request("http://localhost:3000/api/auth/oauth/callback", {
            headers: {
                "x-forwarded-host": "example.com",
            },
        });
        expect(resolveRequestOrigin(request)).toBe("https://example.com");
    });

    it("falls back to request.url origin when no forwarded headers", () => {
        const request = new Request("http://localhost:3000/api/auth/oauth/callback");
        expect(resolveRequestOrigin(request)).toBe("http://localhost:3000");
    });

    it("forwarded headers take precedence over request.url", () => {
        const request = new Request("http://localhost:3000/api/auth/oauth/callback", {
            headers: {
                "x-forwarded-host": "proxy.example.com",
                "x-forwarded-proto": "https",
            },
        });
        expect(resolveRequestOrigin(request)).toBe("https://proxy.example.com");
    });
});

/* ------------------------------------------------------------------ */
/*  resolveCanonicalOrigin — used for EMAIL links (verify, recovery)   */
/* ------------------------------------------------------------------ */
describe("resolveCanonicalOrigin", () => {
    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_APP_URL;
    });

    it("returns NEXT_PUBLIC_APP_URL when set (highest priority)", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network";
        const request = new Request("http://localhost:3000/api/auth/verify/start");
        expect(resolveCanonicalOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });

    it("strips trailing slash from NEXT_PUBLIC_APP_URL", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network/";
        const request = new Request("http://localhost:3000/api/auth/verify/start");
        expect(resolveCanonicalOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });

    it("env var takes precedence over forwarded headers", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://production.example.com";
        const request = new Request("http://localhost:3000/api/auth/verify/start", {
            headers: {
                "x-forwarded-host": "staging.example.com",
                "x-forwarded-proto": "https",
            },
        });
        expect(resolveCanonicalOrigin(request)).toBe("https://production.example.com");
    });

    it("falls back to x-forwarded-host when no env var", () => {
        const request = new Request("http://localhost:3000/api/auth/verify/start", {
            headers: {
                "x-forwarded-host": "youthservicephilippines.appwrite.network",
                "x-forwarded-proto": "https",
            },
        });
        expect(resolveCanonicalOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });

    it("falls back to request.url origin when no env var and no forwarded headers", () => {
        const request = new Request("http://localhost:3000/api/auth/verify/start");
        expect(resolveCanonicalOrigin(request)).toBe("http://localhost:3000");
    });
});

/* ------------------------------------------------------------------ */
/*  resolveAppOrigin (deprecated alias) — backward compat             */
/* ------------------------------------------------------------------ */
describe("resolveAppOrigin (deprecated alias)", () => {
    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_APP_URL;
    });

    it("is an alias for resolveCanonicalOrigin", () => {
        expect(resolveAppOrigin).toBe(resolveCanonicalOrigin);
    });

    it("returns NEXT_PUBLIC_APP_URL when set", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network";
        const request = new Request("http://localhost:3000/api/auth/verify/start");
        expect(resolveAppOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });
});

/* ------------------------------------------------------------------ */
/*  Integration-style: both functions with the same request            */
/* ------------------------------------------------------------------ */
describe("resolveRequestOrigin vs resolveCanonicalOrigin (split behavior)", () => {
    it("gives different results when env var is set and request is from localhost", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network";
        const request = new Request("http://localhost:3000/api/auth/oauth/callback");

        // OAuth callback should redirect back to localhost
        expect(resolveRequestOrigin(request)).toBe("http://localhost:3000");
        // Email links should still point to production
        expect(resolveCanonicalOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });

    it("gives the same result when env var is NOT set", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        const request = new Request("http://localhost:3000/api/auth/oauth/callback");

        expect(resolveRequestOrigin(request)).toBe("http://localhost:3000");
        expect(resolveCanonicalOrigin(request)).toBe("http://localhost:3000");
    });

    it("gives the same result when request comes from production", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network";
        const request = new Request("https://youthservicephilippines.appwrite.network/api/auth/oauth/callback");

        expect(resolveRequestOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
        expect(resolveCanonicalOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });
});
