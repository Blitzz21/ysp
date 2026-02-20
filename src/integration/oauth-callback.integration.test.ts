// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore, cookieJar } = vi.hoisted(() => {
    const jar = new Map<string, string>();
    const store = {
        get: vi.fn((name: string) => {
            const value = jar.get(name);
            return value ? { name, value } : undefined;
        }),
        set: vi.fn((name: string, value: string) => {
            jar.set(name, value);
        }),
        delete: vi.fn((name: string) => {
            jar.delete(name);
        }),
        getAll: vi.fn(() =>
            Array.from(jar.entries()).map(([name, value]) => ({ name, value }))
        ),
    };

    return { cookieStore: store, cookieJar: jar };
});

vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => cookieStore),
}));

import { GET as oauthCallback } from "../../app/api/auth/oauth/callback/route";

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
    });
}

describe("oauth callback route integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cookieJar.clear();
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = "https://appwrite.test/v1";
        process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = "project-test";
        process.env.APPWRITE_API_KEY = "admin-secret-key";
        process.env.APPWRITE_DATABASE_ID = "db-test";
    });

    function createMockRequest(urlStr: string) {
        return new Request(urlStr, {
            headers: { host: "localhost:3000" },
        });
    }

    it("gets Google account info (name, email) and creates a new user profile via Tables API", async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || "GET";

            if (url.endsWith("/account/sessions/token") && method === "POST") {
                return jsonResponse({ userId: "google_123", secret: "secret_123", expire: "2030-01-01T00:00:00.000Z" });
            }

            if (url.endsWith("/account") && method === "GET") {
                return jsonResponse({ $id: "google_123", name: "John Google Doe", email: "johndoe@gmail.com" });
            }

            if (url.includes("/tablesdb/db-test/tables/user_profiles/rows") && method === "GET") {
                return jsonResponse({ total: 0, rows: [] });
            }

            if (url.includes("/tablesdb/db-test/tables/user_profiles/rows") && method === "POST") {
                const body = JSON.parse(init?.body as string);
                expect(body.data.name).toBe("John Google Doe");
                expect(body.data.firstName).toBe("John");
                expect(body.data.lastName).toBe("Google Doe");
                expect(body.data.email).toBe("johndoe@gmail.com");
                expect(body.data.role).toBe("member");
                expect(init?.headers).toMatchObject({
                    "X-Appwrite-Key": "admin-secret-key"
                });

                return jsonResponse({ $id: "new_profile_123" }, 201);
            }

            throw new Error(`Unexpected fetch URL: ${method} ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        const request = createMockRequest("http://localhost:3000/api/auth/oauth/callback?userId=google_123&secret=secret_123&flow=login");
        const response = await oauthCallback(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
        expect(fetchMock).toHaveBeenCalledTimes(4); // token exchange + account + list + create
    });

    it("updates an existing profile with missing data (name, email) via Tables API", async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || "GET";

            if (url.endsWith("/account/sessions/token") && method === "POST") {
                return jsonResponse({ userId: "google_123", secret: "secret_123", expire: "2030-01-01T00:00:00.000Z" });
            }

            if (url.endsWith("/account") && method === "GET") {
                return jsonResponse({ $id: "google_123", name: "John Google Doe", email: "johndoe@gmail.com" });
            }

            if (url.includes("/tablesdb/db-test/tables/user_profiles/rows") && !url.includes("existing_profile_123") && method === "GET") {
                return jsonResponse({
                    total: 1,
                    rows: [{ $id: "existing_profile_123", userId: "google_123" }]
                });
            }

            if (url.includes("/tablesdb/db-test/tables/user_profiles/rows/existing_profile_123") && method === "PATCH") {
                const body = JSON.parse(init?.body as string);
                expect(body.data.name).toBe("John Google Doe");
                expect(body.data.email).toBe("johndoe@gmail.com");

                return jsonResponse({ $id: "existing_profile_123" }, 200);
            }

            throw new Error(`Unexpected fetch URL: ${method} ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        const request = createMockRequest("http://localhost:3000/api/auth/oauth/callback?userId=google_123&secret=secret_123&flow=login");
        const response = await oauthCallback(request);

        expect(response.status).toBe(307);
    });
});
