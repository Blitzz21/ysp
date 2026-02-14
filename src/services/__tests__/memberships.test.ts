import { beforeEach, describe, expect, it, vi } from "vitest";

import { setSessionForTesting } from "../auth";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";

vi.mock("../appwriteClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../appwriteClient")>();
  return {
    ...actual,
    listRows: vi.fn(),
    createRow: vi.fn(),
    updateRow: vi.fn(),
  };
});

import {
  assignOfficer,
  joinChapter,
  leaveChapter,
  listChapterMembers,
  listMyMemberships,
  removeMember,
} from "../memberships";
import {
  AppwriteRow,
  buildEqualQuery,
  createRow,
  listRows,
  updateRow,
} from "../appwriteClient";

type MembershipRow = {
  userId: string;
  chapterId: string;
  role: "member" | "officer" | "chapter_head";
  officerRoleId?: string;
  status: "pending" | "active" | "removed";
  joinedAt: string;
};

const baseRow: AppwriteRow<MembershipRow> = {
  $id: "m1",
  $createdAt: "2026-02-13T00:00:00.000Z",
  $updatedAt: "2026-02-13T00:00:00.000Z",
  userId: "u1",
  chapterId: "c1",
  role: "member",
  status: "pending",
  joinedAt: "2026-02-13T00:00:00.000Z",
};

describe("membership service", () => {
  beforeEach(() => {
    setSessionForTesting({ userId: "u1", role: "member" });
    vi.clearAllMocks();
    process.env.APPWRITE_ENDPOINT = "https://example.appwrite.io/v1";
    process.env.APPWRITE_PROJECT_ID = "project";
    process.env.APPWRITE_API_KEY = "key";
    process.env.APPWRITE_DATABASE_ID = "db";
    process.env.APPWRITE_BUCKET_ID = "bucket";
  });

  it("lists memberships for current user", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([baseRow]);

    const rows = await listMyMemberships();

    expect(listRows).toHaveBeenCalledWith("chapter_memberships", [
      buildEqualQuery("userId", "u1"),
    ]);
    expect(rows[0]?.chapterId).toBe("c1");
  });

  it("joins chapter when no existing membership", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([]);
    vi.mocked(createRow).mockResolvedValueOnce(baseRow);

    const membership = await joinChapter("c1");

    expect(createRow).toHaveBeenCalled();
    expect(membership.status).toBe("pending");
  });

  it("returns existing membership if not removed", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([baseRow]);

    const membership = await joinChapter("c1");

    expect(membership.id).toBe("m1");
    expect(createRow).not.toHaveBeenCalled();
  });

  it("reactivates a removed membership", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([
      { ...baseRow, status: "removed" } as AppwriteRow<MembershipRow>,
    ]);
    vi.mocked(updateRow).mockResolvedValueOnce(
      { ...baseRow, status: "pending" } as AppwriteRow<MembershipRow>
    );

    const membership = await joinChapter("c1");

    expect(updateRow).toHaveBeenCalled();
    expect(membership.status).toBe("pending");
  });

  it("leaves a chapter by marking membership removed", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([baseRow]);
    vi.mocked(updateRow).mockResolvedValueOnce(
      { ...baseRow, status: "removed" } as AppwriteRow<MembershipRow>
    );

    const membership = await leaveChapter("c1");

    expect(updateRow).toHaveBeenCalled();
    expect(membership.status).toBe("removed");
  });

  it("rejects invalid chapter id on join", async () => {
    await expect(joinChapter("")).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws when leaving without membership", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([]);
    await expect(leaveChapter("c1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists chapter members for chapter head", async () => {
    setSessionForTesting({ userId: "u2", role: "chapter_head", assignedChapterId: "c1" });
    vi.mocked(listRows).mockResolvedValueOnce([baseRow]);

    const rows = await listChapterMembers();

    expect(rows).toHaveLength(1);
    expect(listRows).toHaveBeenCalledWith("chapter_memberships", [
      buildEqualQuery("chapterId", "c1"),
    ]);
  });

  it("rejects chapter member listing for non chapter head", async () => {
    setSessionForTesting({ userId: "u2", role: "member" });
    await expect(listChapterMembers("c1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("assigns officer role for a member", async () => {
    setSessionForTesting({ userId: "u2", role: "chapter_head", assignedChapterId: "c1" });
    vi.mocked(listRows)
      .mockResolvedValueOnce([
        {
          $id: "role-1",
          $createdAt: "2026-02-13T00:00:00.000Z",
          $updatedAt: "2026-02-13T00:00:00.000Z",
          roleId: "ops",
          chapterId: "c1",
          label: "Ops",
          permissions: "manage_opps",
        } as AppwriteRow<{ roleId: string; chapterId: string; label: string; permissions: string }>,
      ])
      .mockResolvedValueOnce([baseRow]);
    vi.mocked(updateRow).mockResolvedValueOnce({
      ...baseRow,
      role: "officer",
      officerRoleId: "ops",
      status: "active",
    } as AppwriteRow<MembershipRow>);

    const updated = await assignOfficer({ userId: "u1", roleId: "ops" });

    expect(updated.role).toBe("officer");
    expect(updated.officerRoleId).toBe("ops");
  });

  it("removes a member by marking removed", async () => {
    setSessionForTesting({ userId: "u2", role: "chapter_head", assignedChapterId: "c1" });
    vi.mocked(listRows).mockResolvedValueOnce([baseRow]);
    vi.mocked(updateRow).mockResolvedValueOnce({
      ...baseRow,
      status: "removed",
    } as AppwriteRow<MembershipRow>);

    const updated = await removeMember({ userId: "u1" });

    expect(updated.status).toBe("removed");
  });
});
