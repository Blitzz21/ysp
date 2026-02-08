import type { SiteStats } from "./types";

export async function getSiteStats(): Promise<SiteStats> {
  throw new Error("Not implemented");
}

export async function updateSiteStats(input: Partial<SiteStats>): Promise<SiteStats> {
  throw new Error("Not implemented");
}
