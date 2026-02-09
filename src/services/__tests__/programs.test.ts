import { describe, expect, it, vi, beforeEach } from "vitest";

import { setSessionForTesting } from "../auth";
import { ForbiddenError, UnauthorizedError } from "../errors";

vi.mock("../appwriteClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../appwriteClient")>();
  return {
    ...actual,
    listRows: vi.fn(),
  };
});

import {
  adminListPrograms,
  createProgram,
  deleteProgram,
  listPublishedPrograms,
  updateProgram,
} from "../programs";
import { listRows, buildEqualQuery } from "../appwriteClient";

describe("programs service RBAC", () => {
  beforeEach(() => {
    setSessionForTesting(null);
    vi.clearAllMocks();
  });

  it("filters public program listings to published only", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([]);
    await listPublishedPrograms();

    expect(listRows).toHaveBeenCalledWith("programs", [
      buildEqualQuery("published", true),
    ]);
  });

  it("requires admin for adminListPrograms", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });

    await expect(adminListPrograms()).rejects.toBeInstanceOf(ForbiddenError);

    setSessionForTesting(null);
    await expect(adminListPrograms()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("requires admin for createProgram", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
    await expect(
      createProgram({ title: "Program", description: "Desc" })
    ).rejects.toBeInstanceOf(ForbiddenError);

    setSessionForTesting(null);
    await expect(
      createProgram({ title: "Program", description: "Desc" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("requires admin for updateProgram", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
    await expect(updateProgram("p1", { title: "New" })).rejects.toBeInstanceOf(
      ForbiddenError
    );

    setSessionForTesting(null);
    await expect(updateProgram("p1", { title: "New" })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
  });

  it("requires admin for deleteProgram", async () => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
    await expect(deleteProgram("p1")).rejects.toBeInstanceOf(ForbiddenError);

    setSessionForTesting(null);
    await expect(deleteProgram("p1")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
