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
import type { SiteStats } from "./types";

const TABLE_ID = "site_stats";

const updateSchema = z.object({
  projectsCount: z.number().int().optional(),
  chaptersCount: z.number().int().optional(),
  membersCount: z.number().int().optional(),
  livesImpactedCount: z.number().int().optional(),
});

type StatsRow = {
  projectsCount: number;
  chaptersCount: number;
  membersCount: number;
  livesImpactedCount?: number;
};

function mapStats(row?: StatsRow): SiteStats {
  return {
    projectsCount: row?.projectsCount ?? 0,
    chaptersCount: row?.chaptersCount ?? 0,
    membersCount: row?.membersCount ?? 0,
    livesImpactedCount: row?.livesImpactedCount ?? 0,
  };
}

async function getStatsRow(): Promise<(StatsRow & { $id: string }) | null> {
  const rows = await listRows<StatsRow>(TABLE_ID, [buildOrderAsc("$createdAt")], {
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function getSiteStats(): Promise<SiteStats> {
  const row = await getStatsRow();
  return mapStats(row ?? undefined);
}

export async function updateSiteStats(input: Partial<SiteStats>): Promise<SiteStats> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid site stats update");
  }

  const existing = await getStatsRow();
  if (!existing) {
    const created = await createRow<StatsRow>(
      TABLE_ID,
      parsed.data,
      publicReadPermissions()
    );
    return mapStats(created);
  }

  const updated = await updateRow<StatsRow>(
    TABLE_ID,
    existing.$id,
    parsed.data,
    publicReadPermissions()
  );
  return mapStats(updated);
}
