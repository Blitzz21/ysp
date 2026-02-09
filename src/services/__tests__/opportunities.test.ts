import { describe, expect, it, vi, beforeEach } from "vitest";

import { setSessionForTesting } from "../auth";
import { ForbiddenError, ValidationError } from "../errors";

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
  listPublicOpportunities,
  listPublishedOpportunities,
  updateOpportunity,
} from "../opportunities";
import {
  listRows,
  buildEqualQuery,
  buildGreaterThanEqualQuery,
  buildLessThanEqualQuery,
  buildOrderAsc,
  getRow,
  createRow,
} from "../appwriteClient";

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
      buildOrderAsc("eventData"),
      buildOrderAsc("$createdAt"),
    ]);
  });

  it("rejects invalid public date ranges", async () => {
    await expect(
      listPublicOpportunities({
        fromDate: new Date("2026-02-11T00:00:00.000Z"),
        toDate: new Date("2026-02-10T00:00:00.000Z"),
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("applies status=upcoming at query level", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T00:00:00.000Z"));
    vi.mocked(listRows).mockResolvedValueOnce([]);

    await listPublicOpportunities({ status: "upcoming" });

    expect(listRows).toHaveBeenCalledWith("volunteer_opportunities", [
      buildEqualQuery("pubished", true),
      buildGreaterThanEqualQuery("eventData", "2026-02-10T00:00:00.000Z"),
      buildOrderAsc("eventData"),
      buildOrderAsc("$createdAt"),
    ]);
    vi.useRealTimers();
  });

  it("applies status=past at query level", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T00:00:00.000Z"));
    vi.mocked(listRows).mockResolvedValueOnce([]);

    await listPublicOpportunities({ status: "past" });

    expect(listRows).toHaveBeenCalledWith("volunteer_opportunities", [
      buildEqualQuery("pubished", true),
      buildLessThanEqualQuery("eventData", "2026-02-10T00:00:00.000Z"),
      buildOrderAsc("eventData"),
      buildOrderAsc("$createdAt"),
    ]);
    vi.useRealTimers();
  });

  it("sorts opportunities deterministically by event date then creation", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([
      {
        ...baseRow,
        $id: "b",
        eventData: "2026-02-11T00:00:00.000Z",
        $createdAt: "2026-02-09T00:00:00.000Z",
      } as OpportunityRow,
      {
        ...baseRow,
        $id: "a",
        eventData: "2026-02-10T00:00:00.000Z",
        $createdAt: "2026-02-10T00:00:00.000Z",
      } as OpportunityRow,
    ]);

    const items = await listPublicOpportunities();

    expect(items.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("falls back to in-memory filtering when Appwrite rejects query syntax", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T00:00:00.000Z"));

    vi.mocked(listRows)
      .mockRejectedValueOnce(new ValidationError("Invalid query"))
      .mockResolvedValueOnce([
        {
          ...baseRow,
          $id: "p1",
          pubished: true,
          chapterId: "chapter-1",
          eventData: "2026-02-11T00:00:00.000Z",
          sdgs: "Climate Action,Life Below Water",
          $createdAt: "2026-02-09T00:00:00.000Z",
        } as OpportunityRow,
        {
          ...baseRow,
          $id: "d1",
          pubished: false,
          chapterId: "chapter-1",
          eventData: "2026-02-12T00:00:00.000Z",
          sdgs: "Climate Action",
        } as OpportunityRow,
        {
          ...baseRow,
          $id: "p2",
          pubished: true,
          chapterId: "chapter-2",
          eventData: "2026-02-13T00:00:00.000Z",
          sdgs: "Quality Education",
        } as OpportunityRow,
      ]);

    const items = await listPublicOpportunities({
      chapterId: "chapter-1",
      status: "upcoming",
      sdg: "Climate",
    });

    expect(listRows).toHaveBeenNthCalledWith(
      1,
      "volunteer_opportunities",
      expect.any(Array)
    );
    expect(listRows).toHaveBeenNthCalledWith(2, "volunteer_opportunities");
    expect(items.map((item) => item.id)).toEqual(["p1"]);

    vi.useRealTimers();
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
