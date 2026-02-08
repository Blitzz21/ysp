import type { SiteSettings } from "./types";

export async function getSiteSettings(): Promise<SiteSettings> {
  throw new Error("Not implemented");
}

export async function updateSiteSettings(input: Partial<SiteSettings>): Promise<SiteSettings> {
  throw new Error("Not implemented");
}
