import { z } from "zod";

import { slugify } from "@/lib/slugify";
import { getSession } from "./auth";
import {
  addReadPermissions,
  adminOnlyPermissions,
  buildEqualQuery,
  createRow,
  deleteRow,
  getRow,
  listRows,
  publicReadPermissions,
  updateRow,
} from "./appwriteClient";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { requireAdmin, requireAssignedChapter, requireChapterHead } from "./rbac";
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
  published: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(3).optional(),
  facebookUrl: z.string().url().optional(),
  chapterHeadUserId: z.string().min(1).nullable().optional(),
  published: z.boolean().optional(),
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
  published?: boolean;
};

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
    published: row.published ?? undefined,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function buildChapterPermissions(published: boolean): string[] {
  const base = adminOnlyPermissions();
  if (!published) {
    return base;
  }
  return addReadPermissions(base, ["read(\"any\")"]);
}

export async function listChapters(): Promise<Chapter[]> {
  const rows = await listRows<ChapterRow>(TABLE_ID);
  return rows.map(mapChapter);
}

export async function adminListChapters(): Promise<Chapter[]> {
  const session = await getSession();
  requireAdmin(session);
  const rows = await listRows<ChapterRow>(TABLE_ID);
  return rows.map(mapChapter);
}

export async function listPublicChapters(): Promise<Chapter[]> {
  const rows = await listRows<ChapterRow>(TABLE_ID, [
    buildEqualQuery("published", true),
  ]);
  return rows.map(mapChapter);
}

export async function createChapter(input: {
  name: string;
  slug?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  chapterHeadUserId?: string;
  published?: boolean;
}): Promise<Chapter> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid chapter input");
  }

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);

  const published = parsed.data.published ?? false;
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
      published,
    },
    buildChapterPermissions(published)
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
    published: boolean;
  }>
): Promise<Chapter> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid chapter update");
  }

  const current = await getRow<ChapterRow>(TABLE_ID, id);
  const nextPublished = parsed.data.published ?? current.published ?? false;
  const row = await updateRow<ChapterRow>(
    TABLE_ID,
    id,
    parsed.data,
    buildChapterPermissions(nextPublished)
  );
  return mapChapter(row);
}

export async function deleteChapter(id: string): Promise<void> {
  const session = await getSession();
  requireAdmin(session);
  await deleteRow(TABLE_ID, id);
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

const PROFILES_TABLE_ID = "user_profiles";

type ProfileRoleRow = {
  userId: string;
  role: string;
  assignedChapterId?: string;
};

export async function transferChapterOwnership(newOwnerUserId: string): Promise<void> {
  const session = await getSession();
  requireChapterHead(session);
  const chapterId = requireAssignedChapter(session);

  if (newOwnerUserId === session!.userId) {
    throw new ValidationError("You are already the chapter head");
  }

  // Verify new owner is a member of this chapter
  const memberRows = await listRows<{ userId: string; chapterId: string; status: string }>(
    "chapter_memberships",
    [
      buildEqualQuery("userId", newOwnerUserId),
      buildEqualQuery("chapterId", chapterId),
      buildEqualQuery("status", "active"),
    ]
  );
  if (memberRows.length === 0) {
    throw new ForbiddenError("New owner must be an active member of this chapter");
  }

  // Update chapter's chapterHeadUserId
  await updateRow<ChapterRow>(TABLE_ID, chapterId, {
    chapterHeadUserId: newOwnerUserId,
  }, publicReadPermissions());

  // Update new owner's profile: role → chapter_head, assignedChapterId → chapterId
  const newOwnerProfiles = await listRows<ProfileRoleRow>(PROFILES_TABLE_ID, [
    buildEqualQuery("userId", newOwnerUserId),
  ]);
  if (newOwnerProfiles[0]) {
    await updateRow(PROFILES_TABLE_ID, newOwnerProfiles[0].$id, {
      role: "chapter_head",
      assignedChapterId: chapterId,
    });
  }

  // Update old owner's profile: role → member, clear assignedChapterId
  const oldOwnerProfiles = await listRows<ProfileRoleRow>(PROFILES_TABLE_ID, [
    buildEqualQuery("userId", session!.userId),
  ]);
  if (oldOwnerProfiles[0]) {
    await updateRow(PROFILES_TABLE_ID, oldOwnerProfiles[0].$id, {
      role: "member",
      assignedChapterId: "",
    });
  }
}
