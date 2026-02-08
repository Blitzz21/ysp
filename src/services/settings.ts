import { z } from "zod";

import { getSession } from "./auth";
import {
  buildOrderAsc,
  createRow,
  listRows,
  publicReadPermissions,
  updateRow,
} from "./appwriteClient";
import { ValidationError } from "./errors";
import { requireAdmin } from "./rbac";
import type { SiteSettings } from "./types";

const TABLE_ID = "site_settings";

const updateSchema = z.object({
  email: z.string().email().optional(),
  facebookUrl: z.string().url().optional(),
  membershipFormUrl: z.string().url().optional(),
  createChapterFormUrl: z.string().url().optional(),
});

type SettingsRow = {
  email?: string;
  facebookUrl?: string;
  membershipFormUrl?: string;
  createChapterFormUrl?: string;
};

function mapSettings(row?: SettingsRow): SiteSettings {
  return {
    email: row?.email,
    facebookUrl: row?.facebookUrl,
    membershipFormUrl: row?.membershipFormUrl,
    createChapterFormUrl: row?.createChapterFormUrl,
  };
}

async function getSettingsRow(): Promise<(SettingsRow & { $id: string }) | null> {
  const rows = await listRows<SettingsRow>(TABLE_ID, [buildOrderAsc("$createdAt")], {
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await getSettingsRow();
  return mapSettings(row ?? undefined);
}

export async function updateSiteSettings(input: Partial<SiteSettings>): Promise<SiteSettings> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid site settings update");
  }

  const existing = await getSettingsRow();
  if (!existing) {
    const created = await createRow<SettingsRow>(
      TABLE_ID,
      parsed.data,
      publicReadPermissions()
    );
    return mapSettings(created);
  }

  const updated = await updateRow<SettingsRow>(
    TABLE_ID,
    existing.$id,
    parsed.data,
    publicReadPermissions()
  );
  return mapSettings(updated);
}
