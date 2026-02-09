import { beforeEach, describe, expect, it, vi } from "vitest";

import { setSessionForTesting } from "../auth";
import { ForbiddenError, UnauthorizedError } from "../errors";

vi.mock("../appwriteClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../appwriteClient")>();
  return {
    ...actual,
    listRows: vi.fn(),
    deleteRow: vi.fn(),
  };
});

import {
  adminListChapters,
  createChapter,
  deleteChapter,
  listChapters,
  updateChapter,
} from "../chapters";
import { deleteRow, listRows } from "../appwriteClient";

describe("chapters service RBAC", () => {
  beforeEach(() => {
    setSessionForTesting(null);
    vi.clearAllMocks();
  });

  it("lists chapters without auth for public access", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([]);
    await listChapters();
    expect(listRows).toHaveBeenCalledWith("chapters");
  });

  it("requires admin for adminListChapters", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
    await expect(adminListChapters()).rejects.toBeInstanceOf(ForbiddenError);

    setSessionForTesting(null);
    await expect(adminListChapters()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("requires admin for deleteChapter", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
    await expect(deleteChapter("c1")).rejects.toBeInstanceOf(ForbiddenError);

    setSessionForTesting(null);
    await expect(deleteChapter("c1")).rejects.toBeInstanceOf(UnauthorizedError);

    setSessionForTesting({ userId: "admin-1", role: "admin" });
    vi.mocked(deleteRow).mockResolvedValueOnce(undefined);
    await deleteChapter("c1");
    expect(deleteRow).toHaveBeenCalledWith("chapters", "c1");
  });

  it("requires admin for createChapter", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
    await expect(createChapter({ name: "Manila" })).rejects.toBeInstanceOf(ForbiddenError);

    setSessionForTesting(null);
    await expect(createChapter({ name: "Manila" })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("requires admin for updateChapter", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
    await expect(updateChapter("c1", { name: "New" })).rejects.toBeInstanceOf(
      ForbiddenError
    );

    setSessionForTesting(null);
    await expect(updateChapter("c1", { name: "New" })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
  });
});
