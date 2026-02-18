import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore, cookieJar } = vi.hoisted(() => {
  const jar = new Map<string, string>();
  const store = {
    get: vi.fn((name: string) => {
      const value = jar.get(name);
      return value ? { name, value } : undefined;
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

vi.mock("../appwriteClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../appwriteClient")>();
  return {
    ...actual,
    buildEqualQuery: vi.fn((field: string, value: string) => `${field}=${value}`),
    listRows: vi.fn(),
  };
});

import { getSession, setSessionForTesting } from "../auth";
import { listRows } from "../appwriteClient";
import { UnexpectedError } from "../errors";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("auth session resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieJar.clear();
    setSessionForTesting(undefined);
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = "https://appwrite.test/v1";
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = "project-test";
  });

  it("returns null on unauthenticated account responses", async () => {
    cookieJar.set("ysp_session", "session-secret");

    const fetchMock = vi.fn(async () => jsonResponse({ message: "Unauthorized" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSession()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(listRows).not.toHaveBeenCalled();
  });

  it("retries transient account failures before succeeding", async () => {
    cookieJar.set("ysp_session", "session-secret");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "temporary outage" }, 500))
      .mockResolvedValueOnce(jsonResponse({ $id: "user-1", emailVerification: true }, 200));
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(listRows).mockResolvedValueOnce([]);

    const session = await getSession();
    expect(session).toEqual({
      userId: "user-1",
      role: null,
      assignedChapterId: undefined,
      emailVerified: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws on repeated transient account failures instead of forcing logout", async () => {
    cookieJar.set("ysp_session", "session-secret");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "temporary outage" }, 503))
      .mockResolvedValueOnce(jsonResponse({ message: "still down" }, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSession()).rejects.toBeInstanceOf(UnexpectedError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
