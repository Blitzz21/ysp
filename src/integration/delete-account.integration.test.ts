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
    headers: vi.fn(async () => new Headers()),
}));

import { DELETE as deleteAccount } from "../../app/api/auth/delete-account/route";

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
    });
}

describe("delete account route integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cookieJar.clear();
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = "https://appwrite.test/v1";
        process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = "project-test";
    });

    it("returns 401 if not authenticated (no session token)", async () => {
        const response = await deleteAccount();
        const payload = (await response.json()) as { message: string };

        expect(response.status).toBe(401);
        expect(payload.message).toBe("Not authenticated.");
    });

    it("deletes account and clears session cookie on success", async () => {
        cookieJar.set("ysp_session", "session-secret");

        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            if (url.endsWith("/account")) {
                expect(init?.method).toBe("DELETE");
                expect(init?.headers).toMatchObject({
                    "X-Appwrite-Project": "project-test",
                    "X-Appwrite-Session": "session-secret",
                });
                return jsonResponse({ result: "deleted" }, 200);
            }
            throw new Error(`Unexpected fetch URL: ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        const response = await deleteAccount();
        const payload = (await response.json()) as { ok: boolean };

        expect(response.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(cookieStore.delete).toHaveBeenCalledWith("ysp_session");
    });

    it("handles upstream error when deleting account", async () => {
        cookieJar.set("ysp_session", "session-secret");

        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.endsWith("/account")) {
                return jsonResponse({ message: "Server error" }, 500);
            }
            throw new Error(`Unexpected fetch URL: ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        const response = await deleteAccount();
        const payload = (await response.json()) as { message: string };

        expect(response.status).toBe(500);
        expect(payload.message).toBe("Server error");
        expect(cookieStore.delete).not.toHaveBeenCalled();
    });
});
