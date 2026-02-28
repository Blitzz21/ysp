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
  uploadFile,
} from "./appwriteClient";
import { NotFoundError, ValidationError } from "./errors";
import { requireAdmin } from "./rbac";
import type { Program } from "./types";

const TABLE_ID = "programs";

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().min(1),
  published: z.boolean().optional(),
  imageFile: z.any().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  published: z.boolean().optional(),
  imageFile: z.any().optional(),
});

type ProgramRow = {
  title: string;
  slug: string;
  description: string;
  imageField?: string | null;
  published: boolean;
};

function mapProgram(row: ProgramRow & { $id: string; $createdAt: string; $updatedAt: string }): Program {
  return {
    id: row.$id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    imageFileId: row.imageField ?? undefined,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function buildProgramPermissions(published: boolean): string[] {
  const base = adminOnlyPermissions();
  if (!published) {
    return base;
  }
  return addReadPermissions(base, ["read(\"any\")"]);
}

export async function listPublishedPrograms(): Promise<Program[]> {
  const rows = await listRows<ProgramRow>(TABLE_ID, [
    buildEqualQuery("published", true),
  ]);
  return rows.map(mapProgram);
}

export async function listPublicPrograms(): Promise<Program[]> {
  return listPublishedPrograms();
}

export async function getProgramBySlug(slug: string): Promise<Program> {
  const rows = await listRows<ProgramRow>(TABLE_ID, [
    buildEqualQuery("slug", slug),
    buildEqualQuery("published", true),
  ]);
  const row = rows[0];
  if (!row) {
    throw new NotFoundError("Program not found");
  }
  return mapProgram(row);
}

export async function getPublicProgramBySlug(slug: string): Promise<Program> {
  return getProgramBySlug(slug);
}

export async function adminListPrograms(params?: { includeDrafts?: boolean }): Promise<Program[]> {
  const session = await getSession();
  requireAdmin(session);
  const queries = params?.includeDrafts
    ? []
    : [buildEqualQuery("published", true)];
  const rows = await listRows<ProgramRow>(TABLE_ID, queries);
  return rows.map(mapProgram);
}

export async function createProgram(input: {
  title: string;
  slug?: string;
  description: string;
  published?: boolean;
  imageFile?: File;
}): Promise<Program> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid program input");
  }

  const title = parsed.data.title;
  const slug = parsed.data.slug?.trim() || slugify(title);
  const published = parsed.data.published ?? false;

  let imageField: string | null | undefined;
  if (parsed.data.imageFile) {
    const filePermissions = published
      ? publicReadPermissions()
      : adminOnlyPermissions();
    const uploaded = await uploadFile(parsed.data.imageFile as File, filePermissions);
    imageField = uploaded.$id;
  }

  const data: Record<string, unknown> = {
    title,
    slug,
    description: parsed.data.description,
    published,
  };
  if (imageField !== undefined) {
    data.imageField = imageField;
  }

  const row = await createRow<ProgramRow>(
    TABLE_ID,
    data,
    buildProgramPermissions(published)
  );
  return mapProgram(row);
}

export async function updateProgram(
  id: string,
  input: Partial<{ title: string; slug: string; description: string; published: boolean; imageFile: File | null }>
): Promise<Program> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid program update");
  }

  const current = await getRow<ProgramRow>(TABLE_ID, id);
  const nextPublished = parsed.data.published ?? current.published;

  let imageField: string | null | undefined = current.imageField ?? undefined;
  if (parsed.data.imageFile === null) {
    imageField = null;
  } else if (parsed.data.imageFile) {
    const filePermissions = nextPublished
      ? publicReadPermissions()
      : adminOnlyPermissions();
    const uploaded = await uploadFile(parsed.data.imageFile as File, filePermissions);
    imageField = uploaded.$id;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.slug !== undefined) data.slug = parsed.data.slug;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.published !== undefined) data.published = parsed.data.published;
  if (parsed.data.imageFile !== undefined) data.imageField = imageField;

  const row = await updateRow<ProgramRow>(
    TABLE_ID,
    id,
    data,
    buildProgramPermissions(nextPublished)
  );
  return mapProgram(row);
}

export async function deleteProgram(id: string): Promise<void> {
  const session = await getSession();
  requireAdmin(session);
  await deleteRow(TABLE_ID, id);
}
