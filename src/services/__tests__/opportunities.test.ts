import { describe, expect, it, vi, beforeEach } from "vitest";

import { setSessionForTesting } from "../auth";
import { ForbiddenError } from "../errors";

vi.mock("../appwriteClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../appwriteClient")>();
  return {
    ...actual,
    listRows: vi.fn(),
    createRow: vi.fn(),
    getRow: vi.fn(),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
  };
});

import {
  createMyChapterOpportunity,
  deleteOpportunity,
  listPublishedOpportunities,
  updateOpportunity,
} from "../opportunities";
import { listRows, buildEqualQuery, getRow, createRow } from "../appwriteClient";

const baseRow = {
  $id: "opp1",
  $createdAt: "2026-02-08T00:00:00.000Z",
  $updatedAt: "2026-02-08T00:00:00.000Z",
  title: "Opportunity",
  eventData: "2026-02-08T00:00:00.000Z",
  chapterId: "chapter-1",
  description: "desc",
  sdgs: "sdg1",
  pubished: false,
};
type OpportunityRow = typeof baseRow;

describe("opportunities service RBAC", () => {
  beforeEach(() => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "chapter-1" });
    vi.clearAllMocks();
    process.env.APPWRITE_ENDPOINT = "https://example.appwrite.io/v1";
    process.env.APPWRITE_PROJECT_ID = "project";
    process.env.APPWRITE_API_KEY = "key";
    process.env.APPWRITE_DATABASE_ID = "db";
    process.env.APPWRITE_BUCKET_ID = "bucket";
  });

  it("filters public opportunity listings to published only", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([]);
    await listPublishedOpportunities();

    expect(listRows).toHaveBeenCalledWith("volunteer_opportunities", [
      buildEqualQuery("pubished", true),
    ]);
  });

  it("prevents chapter head updates outside assigned chapter", async () => {
    vi.mocked(getRow).mockResolvedValueOnce({ ...baseRow, chapterId: "other" } as OpportunityRow);

    await expect(updateOpportunity("opp1", { title: "new" })).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("prevents chapter head deletes outside assigned chapter", async () => {
    vi.mocked(getRow).mockResolvedValueOnce({ ...baseRow, chapterId: "other" } as OpportunityRow);

    await expect(deleteOpportunity("opp1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows chapter head create only for assigned chapter", async () => {
    vi.mocked(createRow).mockResolvedValueOnce({
      ...baseRow,
      chapterId: "chapter-1",
      pubished: false,
    } as OpportunityRow);

    await expect(
      createMyChapterOpportunity({
        title: "Opp",
        eventDate: new Date(),
        description: "desc",
        sdgs: ["sdg1"],
      })
    ).resolves.toBeDefined();
  });
});
