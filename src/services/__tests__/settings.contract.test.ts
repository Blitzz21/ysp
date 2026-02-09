import { beforeEach, describe, expect, it, vi } from "vitest";

import { setSessionForTesting } from "../auth";
import { ValidationError } from "../errors";

vi.mock("../appwriteClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../appwriteClient")>();
  return {
    ...actual,
    listRows: vi.fn(),
    createRow: vi.fn(),
    updateRow: vi.fn(),
  };
});

import { createRow, listRows, updateRow } from "../appwriteClient";
import { getSiteSettings, updateSiteSettings } from "../settings";

const baseRow = {
  $id: "settings-1",
  $createdAt: "2026-02-09T00:00:00.000Z",
  $updatedAt: "2026-02-09T00:00:00.000Z",
  email: "team@ysp.org",
  mobile: "+63 900 000 0000",
  facebookUrl: "https://facebook.com/ysp",
  membershipFormUrl: "https://docs.google.com/forms/d/example/viewform",
  createChapterFormUrl: "https://docs.google.com/forms/d/chapter/viewform",
};

describe("settings service contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSessionForTesting({ userId: "admin-1", role: "admin" });
    process.env.APPWRITE_ENDPOINT = "https://example.appwrite.io/v1";
    process.env.APPWRITE_PROJECT_ID = "project";
    process.env.APPWRITE_API_KEY = "key";
    process.env.APPWRITE_DATABASE_ID = "db";
    process.env.APPWRITE_BUCKET_ID = "bucket";
  });

  it("maps mobile in public settings reads", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([baseRow]);

    const settings = await getSiteSettings();

    expect(settings.mobile).toBe(baseRow.mobile);
    expect(settings.email).toBe(baseRow.email);
  });

  it("rejects invalid mobile updates", async () => {
    await expect(updateSiteSettings({ mobile: "12" })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("persists mobile when creating first settings row", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([]);
    vi.mocked(createRow).mockResolvedValueOnce(baseRow);

    const result = await updateSiteSettings({ mobile: baseRow.mobile });

    expect(createRow).toHaveBeenCalledWith(
      "site_settings",
      { mobile: baseRow.mobile },
      expect.any(Array)
    );
    expect(result.mobile).toBe(baseRow.mobile);
  });

  it("persists mobile when updating existing settings row", async () => {
    vi.mocked(listRows).mockResolvedValueOnce([baseRow]);
    vi.mocked(updateRow).mockResolvedValueOnce(
      {
        ...baseRow,
        mobile: "+63 910 111 2222",
      } as unknown as Awaited<ReturnType<typeof updateRow>>
    );

    const result = await updateSiteSettings({ mobile: "+63 910 111 2222" });

    expect(updateRow).toHaveBeenCalledWith(
      "site_settings",
      "settings-1",
      { mobile: "+63 910 111 2222" },
      expect.any(Array)
    );
    expect(result.mobile).toBe("+63 910 111 2222");
  });
});
