import { describe, expect, it, vi, beforeEach } from "vitest";

import { setSessionForTesting } from "../auth";
import { updateOpportunity } from "../opportunities";

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

import { getRow, updateRow, deleteRow } from "../appwriteClient";
import type { AppwriteRow } from "../appwriteClient";

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

describe("opportunities service - edit safety", () => {
    beforeEach(() => {
        setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "chapter-1" });
        vi.clearAllMocks();
        process.env.APPWRITE_ENDPOINT = "https://example.appwrite.io/v1";
        process.env.APPWRITE_PROJECT_ID = "project";
        process.env.APPWRITE_API_KEY = "key";
        process.env.APPWRITE_DATABASE_ID = "db";
        process.env.APPWRITE_BUCKET_ID = "bucket";
    });

    it("never touches the opportunity_signups table when updating an opportunity", async () => {
        // Mock the opportunity lookup
        vi.mocked(getRow).mockResolvedValueOnce({
            ...baseRow,
            chapterId: "chapter-1",
        } as OpportunityRow);

        // Mock the successful update
        vi.mocked(updateRow).mockResolvedValueOnce({
            ...baseRow,
            title: "Updated Title",
        } as OpportunityRow);

        const result = await updateOpportunity("opp1", {
            title: "Updated Title",
            description: "Updated Description",
            capacity: 50,
            waitlistEnabled: true,
            published: true,
            // Change image simulation
            imageFiles: undefined,
            existingImageFileIds: ["new-image-123"],
        });

        expect(result.id).toBe("opp1");

        // The core assertion: updateRow should ONLY be called for the volunteer_opportunities table
        expect(updateRow).toHaveBeenCalledTimes(1);
        expect(updateRow).toHaveBeenCalledWith(
            "volunteer_opportunities",
            "opp1",
            expect.objectContaining({
                title: "Updated Title",
                description: "Updated Description",
                capacity: 50,
                waitlistEnabled: true,
                pubished: true,
                imageFileId: "new-image-123",
            }),
            expect.any(Array)
        );

        // Verify deleteRow was NEVER called (signups shouldn't be deleted)
        expect(deleteRow).not.toHaveBeenCalled();
    });
});
