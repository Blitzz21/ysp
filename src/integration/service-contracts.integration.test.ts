// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

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

import { server } from "../test/msw/server";
import { setSessionForTesting } from "../services/auth";
import { createProgram } from "../services/programs";
import { joinChapter } from "../services/memberships";
import {
  updateAccountEmail,
  updateAccountPassword,
  updateProfile,
} from "../services/profiles";
import { UnauthorizedError, ValidationError } from "../services/errors";

describe("service integration contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieJar.clear();
    setSessionForTesting(null);

    process.env.APPWRITE_ENDPOINT = "https://appwrite.test/v1";
    process.env.APPWRITE_PROJECT_ID = "project-test";
    process.env.APPWRITE_API_KEY = "api-key";
    process.env.APPWRITE_DATABASE_ID = "db-test";
    process.env.APPWRITE_BUCKET_ID = "bucket-test";

    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = "https://appwrite.test/v1";
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = "project-test";
  });

  it("updateProfile persists name updates through appwrite client contract", async () => {
    setSessionForTesting({ userId: "user-1", role: "member", emailVerified: true });

    server.use(
      http.get("https://appwrite.test/v1/tablesdb/db-test/tables/user_profiles/rows", () =>
        HttpResponse.json({
          total: 1,
          rows: [
            {
              $id: "profile-1",
              $createdAt: "2026-02-14T00:00:00.000Z",
              $updatedAt: "2026-02-14T00:00:00.000Z",
              userId: "user-1",
              role: "member",
              name: "Old Name",
              email: "member@example.com",
            },
          ],
        })
      ),
      http.patch(
        "https://appwrite.test/v1/tablesdb/db-test/tables/user_profiles/rows/profile-1",
        async ({ request }) => {
          const payload = (await request.json()) as {
            data: { name?: string };
          };
          expect(payload.data.name).toBe("Updated Name");
          return HttpResponse.json({
            $id: "profile-1",
            $createdAt: "2026-02-14T00:00:00.000Z",
            $updatedAt: "2026-02-14T00:01:00.000Z",
            userId: "user-1",
            role: "member",
            name: payload.data.name,
            email: "member@example.com",
          });
        }
      )
    );

    const profile = await updateProfile({ name: "Updated Name" });
    expect(profile.name).toBe("Updated Name");
  });

  it("updateProfile rejects invalid inputs before network calls", async () => {
    setSessionForTesting({ userId: "user-1", role: "member", emailVerified: true });
    await expect(updateProfile({ age: 999 })).rejects.toBeInstanceOf(ValidationError);
  });

  it("updateAccountEmail maps 401 responses to UnauthorizedError", async () => {
    cookieJar.set("ysp_session", "session-secret");
    server.use(
      http.patch("https://appwrite.test/v1/account/email", () =>
        HttpResponse.json({ message: "Invalid credentials" }, { status: 401 })
      )
    );

    await expect(
      updateAccountEmail({
        email: "new@example.com",
        password: "password123",
      })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("updateAccountPassword validates payload before Appwrite request", async () => {
    await expect(
      updateAccountPassword({
        currentPassword: "short",
        nextPassword: "new-password123",
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("joinChapter creates a pending membership when none exists", async () => {
    setSessionForTesting({ userId: "member-1", role: "member", emailVerified: true });

    server.use(
      http.get("https://appwrite.test/v1/tablesdb/db-test/tables/chapter_memberships/rows", () =>
        HttpResponse.json({ total: 0, rows: [] })
      ),
      http.post(
        "https://appwrite.test/v1/tablesdb/db-test/tables/chapter_memberships/rows",
        async ({ request }) => {
          const payload = (await request.json()) as {
            data: { chapterId: string; status: string; userId: string };
          };
          expect(payload.data.chapterId).toBe("chapter-1");
          expect(payload.data.status).toBe("pending");
          return HttpResponse.json({
            $id: "membership-1",
            $createdAt: "2026-02-14T00:00:00.000Z",
            $updatedAt: "2026-02-14T00:00:00.000Z",
            ...payload.data,
            role: "member",
            joinedAt: "2026-02-14T00:00:00.000Z",
          });
        }
      )
    );

    const membership = await joinChapter("chapter-1");
    expect(membership.status).toBe("pending");
    expect(membership.chapterId).toBe("chapter-1");
  });

  it("joinChapter rejects empty chapter ids", async () => {
    setSessionForTesting({ userId: "member-1", role: "member", emailVerified: true });
    await expect(joinChapter("")).rejects.toBeInstanceOf(ValidationError);
  });

  it("createProgram persists admin create requests through service contract", async () => {
    setSessionForTesting({ userId: "admin-1", role: "admin", emailVerified: true });

    server.use(
      http.post("https://appwrite.test/v1/tablesdb/db-test/tables/programs/rows", async ({ request }) => {
        const payload = (await request.json()) as {
          data: { title: string; slug: string; description: string; published: boolean };
        };
        expect(payload.data.title).toBe("Service Program");
        expect(payload.data.slug).toBe("service-program");
        return HttpResponse.json({
          $id: "program-1",
          $createdAt: "2026-02-14T00:00:00.000Z",
          $updatedAt: "2026-02-14T00:00:00.000Z",
          title: payload.data.title,
          slug: payload.data.slug,
          description: payload.data.description,
          published: payload.data.published,
        });
      })
    );

    const program = await createProgram({
      title: "Service Program",
      description: "Integration test create",
      published: true,
    });
    expect(program.slug).toBe("service-program");
    expect(program.published).toBe(true);
  });

  it("createProgram blocks unauthenticated users", async () => {
    setSessionForTesting(null);
    await expect(
      createProgram({ title: "No Admin", description: "Should fail" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
