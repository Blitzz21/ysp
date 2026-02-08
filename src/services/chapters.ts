import { z } from "zod";

import { getSession } from "./auth";
import { createRow, getRow, listRows, publicReadPermissions, updateRow } from "./appwriteClient";
import { NotFoundError, ValidationError } from "./errors";
import { requireAdmin, requireAssignedChapter } from "./rbac";
import type { Chapter } from "./types";

const TABLE_ID = "chapters";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(3).optional(),
  facebookUrl: z.string().url().optional(),
  chapterHeadUserId: z.string().min(1).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(3).optional(),
  facebookUrl: z.string().url().optional(),
  chapterHeadUserId: z.string().min(1).nullable().optional(),
});

const contactSchema = z.object({
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(3).optional(),
  facebookUrl: z.string().url().optional(),
});

type ChapterRow = {
  name: string;
  slug: string;
  location?: string;
  chapterHeadUserId?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function mapChapter(row: ChapterRow & { $id: string; $createdAt: string; $updatedAt: string }): Chapter {
  return {
    id: row.$id,
    name: row.name,
    slug: row.slug,
    location: row.location ?? undefined,
    chapterHeadUserId: row.chapterHeadUserId ?? undefined,
    contactEmail: row.contactEmail ?? undefined,
    contactPhone: row.contactPhone ?? undefined,
    facebookUrl: row.facebookUrl ?? undefined,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

export async function listChapters(): Promise<Chapter[]> {
  const rows = await listRows<ChapterRow>(TABLE_ID);
  return rows.map(mapChapter);
}

export async function listPublicChapters(): Promise<Chapter[]> {
  return listChapters();
}

export async function createChapter(input: {
  name: string;
  slug?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  chapterHeadUserId?: string;
}): Promise<Chapter> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid chapter input");
  }

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);

  const row = await createRow<ChapterRow>(
    TABLE_ID,
    {
      name: parsed.data.name,
      slug,
      location: parsed.data.location,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      facebookUrl: parsed.data.facebookUrl,
      chapterHeadUserId: parsed.data.chapterHeadUserId,
    },
    publicReadPermissions()
  );

  return mapChapter(row);
}

export async function updateChapter(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    location: string;
    contactEmail: string;
    contactPhone: string;
    facebookUrl: string;
    chapterHeadUserId: string | null;
  }>
): Promise<Chapter> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid chapter update");
  }

  const row = await updateRow<ChapterRow>(TABLE_ID, id, parsed.data, publicReadPermissions());
  return mapChapter(row);
}

export async function getMyChapter(): Promise<Chapter> {
  const session = await getSession();
  const chapterId = requireAssignedChapter(session);

  const row = await getRow<ChapterRow>(TABLE_ID, chapterId);
  if (!row) {
    throw new NotFoundError("Chapter not found");
  }
  return mapChapter(row);
}

export async function updateMyChapterContact(input: {
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
}): Promise<Chapter> {
  const session = await getSession();
  const chapterId = requireAssignedChapter(session);

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid contact update");
  }

  const row = await updateRow<ChapterRow>(TABLE_ID, chapterId, parsed.data, publicReadPermissions());
  return mapChapter(row);
}
