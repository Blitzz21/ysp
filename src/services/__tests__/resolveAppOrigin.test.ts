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

import { resolveAppOrigin } from "../../../app/api/auth/_lib/appwriteAuth";

describe("resolveAppOrigin", () => {
    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_APP_URL;
    });

    it("returns NEXT_PUBLIC_APP_URL when set (highest priority)", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network";
        const request = new Request("http://localhost:3000/api/auth/verify/start");
        expect(resolveAppOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });

    it("strips trailing slash from NEXT_PUBLIC_APP_URL", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://youthservicephilippines.appwrite.network/";
        const request = new Request("http://localhost:3000/api/auth/verify/start");
        expect(resolveAppOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });

    it("uses x-forwarded-host + x-forwarded-proto when no env var", () => {
        const request = new Request("http://localhost:3000/api/auth/verify/start", {
            headers: {
                "x-forwarded-host": "youthservicephilippines.appwrite.network",
                "x-forwarded-proto": "https",
            },
        });
        expect(resolveAppOrigin(request)).toBe("https://youthservicephilippines.appwrite.network");
    });

    it("defaults to https when x-forwarded-proto is absent but x-forwarded-host is set", () => {
        const request = new Request("http://localhost:3000/api/auth/verify/start", {
            headers: {
                "x-forwarded-host": "example.com",
            },
        });
        expect(resolveAppOrigin(request)).toBe("https://example.com");
    });

    it("falls back to request.url origin when no env var and no forwarded headers", () => {
        const request = new Request("http://localhost:3000/api/auth/verify/start");
        expect(resolveAppOrigin(request)).toBe("http://localhost:3000");
    });

    it("env var takes precedence over forwarded headers", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://production.example.com";
        const request = new Request("http://localhost:3000/api/auth/verify/start", {
            headers: {
                "x-forwarded-host": "staging.example.com",
                "x-forwarded-proto": "https",
            },
        });
        expect(resolveAppOrigin(request)).toBe("https://production.example.com");
    });

    it("forwarded headers take precedence over request.url", () => {
        const request = new Request("http://localhost:3000/api/auth/verify/start", {
            headers: {
                "x-forwarded-host": "proxy.example.com",
                "x-forwarded-proto": "https",
            },
        });
        expect(resolveAppOrigin(request)).toBe("https://proxy.example.com");
    });
});
