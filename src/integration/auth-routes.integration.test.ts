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

vi.mock("@/services/appwriteClient", () => ({
  createRow: vi.fn(async () => ({ $id: "profile-1" })),
  userReadPermissions: vi.fn(() => ['read("user:123")']),
}));

vi.mock("@/services/auth", () => ({
  getSession: vi.fn(),
}));

import { POST as loginPost } from "../../app/api/auth/login/route";
import { POST as signupPost } from "../../app/api/auth/signup/route";
import { POST as verifyStartPost } from "../../app/api/auth/verify/start/route";
import { GET as verifyStatusGet } from "../../app/api/auth/verify/status/route";
import { getSession } from "@/services/auth";

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("auth route integration contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieJar.clear();
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = "https://appwrite.test/v1";
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = "project-test";
    process.env.APPWRITE_AUTH_AUDIT_TABLE_ID = "";
    (
      globalThis as typeof globalThis & {
        __yspRateLimitBuckets?: Map<string, { count: number; resetAt: number }>;
      }
    ).__yspRateLimitBuckets = new Map();
  });

  it("login success sets cookie and returns verification state", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/account/sessions/email")) {
        return jsonResponse({ secret: "session-secret" }, 201);
      }
      if (url.endsWith("/account")) {
        expect(init?.headers).toMatchObject({
          "X-Appwrite-Project": "project-test",
          "X-Appwrite-Session": "session-secret",
        });
        return jsonResponse({ $id: "user-1", emailVerification: true }, 200);
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify({
        email: "member@example.com",
        password: "password123",
      }),
    });
    const response = await loginPost(request);
    const payload = (await response.json()) as { ok: boolean; emailVerified: boolean };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, emailVerified: true });
    expect(cookieStore.set).toHaveBeenCalledWith(
      "ysp_session",
      "session-secret",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" })
    );
  });

  it("login fails with unexpected error when no session token is returned", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/account/sessions/email")) {
        return jsonResponse({}, 201);
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "member@example.com",
        password: "password123",
      }),
    });
    const response = await loginPost(request);
    const payload = (await response.json()) as { code: string; error: string };

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      code: "unexpected",
      error: "Session token missing",
    });
  });

  it("signup maps Appwrite 409 to conflict contract", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/account")) {
        return jsonResponse({ message: "User already exists" }, 409);
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Member",
        email: "member@example.com",
        password: "password123",
        confirmPassword: "password123",
      }),
    });
    const response = await signupPost(request);
    const payload = (await response.json()) as { code: string; error: string };

    expect(response.status).toBe(409);
    expect(payload).toEqual({
      code: "conflict",
      error: "This record already exists or conflicts with existing data.",
    });
  });

  it("verify-start returns unauthorized without a session cookie", async () => {
    const response = await verifyStartPost(
      new Request("http://localhost/api/auth/verify/start", { method: "POST" })
    );
    const payload = (await response.json()) as { code: string; error: string };

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      code: "unauthorized",
      error: "Authentication required",
    });
  });

  it("verify-start succeeds with an active session token", async () => {
    cookieJar.set("ysp_session", "session-secret");
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/account/verification")) {
        expect(init?.headers).toMatchObject({
          "X-Appwrite-Project": "project-test",
          "X-Appwrite-Session": "session-secret",
        });
        return jsonResponse({}, 201);
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await verifyStartPost(
      new Request("http://localhost/api/auth/verify/start", { method: "POST" })
    );
    const payload = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
  });

  it("verify-status reflects authenticated verification state", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      userId: "user-1",
      role: "member",
      emailVerified: true,
    });

    const response = await verifyStatusGet();
    const payload = (await response.json()) as { ok: boolean; emailVerified: boolean };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, emailVerified: true });
  });
});
