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

import { adminListChapters, deleteChapter, listChapters } from "../chapters";
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
});
