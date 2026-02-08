import { describe, expect, it, beforeEach } from "vitest";

import { setSessionForTesting } from "../auth";
import { ForbiddenError } from "../errors";

import { updateSiteSettings } from "../settings";
import { updateSiteStats } from "../stats";

describe("settings and stats RBAC", () => {
  beforeEach(() => {
    setSessionForTesting({ userId: "u1", role: "chapter_head", assignedChapterId: "c1" });
  });

  it("blocks non-admin updates to site settings", async () => {
    await expect(updateSiteSettings({ email: "test@example.com" })).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("blocks non-admin updates to site stats", async () => {
    await expect(updateSiteStats({ projectsCount: 10 })).rejects.toBeInstanceOf(ForbiddenError);
  });
});
