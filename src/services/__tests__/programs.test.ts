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

import { listPublishedPrograms, adminListPrograms } from "../programs";
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
});
