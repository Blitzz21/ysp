import { z } from "zod";

import { getSession } from "./auth";
import {
  addReadPermissions,
  adminOnlyPermissions,
  buildEqualQuery,
  buildGreaterThanEqualQuery,
  buildLessThanEqualQuery,
  buildSearchQuery,
  createRow,
  deleteRow,
  getRow,
  listRows,
  updateRow,
  userReadWritePermissions,
} from "./appwriteClient";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { requireAdmin, requireAssignedChapter, requireChapterHead } from "./rbac";
import type { VolunteerOpportunity } from "./types";

const TABLE_ID = "volunteer_opportunities";
const PUBLISHED_FIELD = "pubished";

const createSchema = z.object({
  title: z.string().min(1),
  eventDate: z.date(),
  chapterId: z.string().min(1),
  description: z.string().min(1),
  sdgs: z.array(z.string().min(1)),
  signupContactName: z.string().min(1).optional(),
  signupContactEmail: z.string().email().optional(),
  signupContactPhone: z.string().min(3).optional(),
  published: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

type OpportunityRow = {
  title: string;
  eventData: string;
  chapterId: string;
  description: string;
  sdgs: string;
  signupContactName?: string;
  signupContactEmail?: string;
  signupContactPhone?: string;
  pubished: boolean;
};

function serializeSdgs(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(",");
}

function parseSdgs(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mapOpportunity(
  row: OpportunityRow & { $id: string; $createdAt: string; $updatedAt: string }
): VolunteerOpportunity {
  return {
    id: row.$id,
    title: row.title,
    eventDate: row.eventData,
    chapterId: row.chapterId,
    description: row.description,
    sdgs: parseSdgs(row.sdgs),
    signupContactName: row.signupContactName ?? undefined,
    signupContactEmail: row.signupContactEmail ?? undefined,
    signupContactPhone: row.signupContactPhone ?? undefined,
    published: row.pubished,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function buildOpportunityPermissions(published: boolean, userId?: string): string[] {
  const base = userId ? userReadWritePermissions(userId) : adminOnlyPermissions();
  if (!published) {
    return base;
  }
  return addReadPermissions(base, ["read(\"any\")"]);
}

export async function listPublishedOpportunities(params?: {
  chapterId?: string;
  fromDate?: Date;
  toDate?: Date;
  sdg?: string;
}): Promise<VolunteerOpportunity[]> {
  const queries = [buildEqualQuery(PUBLISHED_FIELD, true)];
  if (params?.chapterId) {
    queries.push(buildEqualQuery("chapterId", params.chapterId));
  }
  if (params?.fromDate) {
    queries.push(buildGreaterThanEqualQuery("eventData", params.fromDate.toISOString()));
  }
  if (params?.toDate) {
    queries.push(buildLessThanEqualQuery("eventData", params.toDate.toISOString()));
  }
  if (params?.sdg) {
    queries.push(buildSearchQuery("sdgs", params.sdg));
  }

  const rows = await listRows<OpportunityRow>(TABLE_ID, queries);
  return rows.map(mapOpportunity);
}

export async function adminListOpportunities(params?: {
  chapterId?: string;
  includeDrafts?: boolean;
}): Promise<VolunteerOpportunity[]> {
  const session = await getSession();
  requireAdmin(session);

  const queries: string[] = [];
  if (!params?.includeDrafts) {
    queries.push(buildEqualQuery(PUBLISHED_FIELD, true));
  }
  if (params?.chapterId) {
    queries.push(buildEqualQuery("chapterId", params.chapterId));
  }

  const rows = await listRows<OpportunityRow>(TABLE_ID, queries);
  return rows.map(mapOpportunity);
}

export async function createOpportunity(input: {
  title: string;
  eventDate: Date;
  chapterId: string;
  description: string;
  sdgs: string[];
  signupContactName?: string;
  signupContactEmail?: string;
  signupContactPhone?: string;
  published?: boolean;
}): Promise<VolunteerOpportunity> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity input");
  }

  const published = parsed.data.published ?? false;

  const row = await createRow<OpportunityRow>(
    TABLE_ID,
    {
      title: parsed.data.title,
      eventData: parsed.data.eventDate.toISOString(),
      chapterId: parsed.data.chapterId,
      description: parsed.data.description,
      sdgs: serializeSdgs(parsed.data.sdgs),
      signupContactName: parsed.data.signupContactName,
      signupContactEmail: parsed.data.signupContactEmail,
      signupContactPhone: parsed.data.signupContactPhone,
      [PUBLISHED_FIELD]: published,
    },
    buildOpportunityPermissions(published)
  );

  return mapOpportunity(row);
}

export async function createMyChapterOpportunity(
  input: Omit<Parameters<typeof createOpportunity>[0], "chapterId">
): Promise<VolunteerOpportunity> {
  const session = await getSession();
  requireChapterHead(session);
  const chapterId = requireAssignedChapter(session);

  const parsed = createSchema.safeParse({ ...input, chapterId });
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity input");
  }

  const published = parsed.data.published ?? false;
  const row = await createRow<OpportunityRow>(
    TABLE_ID,
    {
      title: parsed.data.title,
      eventData: parsed.data.eventDate.toISOString(),
      chapterId: parsed.data.chapterId,
      description: parsed.data.description,
      sdgs: serializeSdgs(parsed.data.sdgs),
      signupContactName: parsed.data.signupContactName,
      signupContactEmail: parsed.data.signupContactEmail,
      signupContactPhone: parsed.data.signupContactPhone,
      [PUBLISHED_FIELD]: published,
    },
    buildOpportunityPermissions(published, session?.userId)
  );

  return mapOpportunity(row);
}

export async function updateOpportunity(
  id: string,
  input: Partial<Parameters<typeof createOpportunity>[0]>
): Promise<VolunteerOpportunity> {
  const session = await getSession();
  if (session?.role === "admin") {
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("Invalid opportunity update");
    }
    const current = await getRow<OpportunityRow>(TABLE_ID, id);
    const published = parsed.data.published ?? current.pubished;
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.eventDate) {
      data.eventData = parsed.data.eventDate.toISOString();
      delete data.eventDate;
    }
    if (parsed.data.sdgs) {
      data.sdgs = serializeSdgs(parsed.data.sdgs);
    }
    if (parsed.data.published !== undefined) {
      data[PUBLISHED_FIELD] = parsed.data.published;
      delete data.published;
    }
    const row = await updateRow<OpportunityRow>(
      TABLE_ID,
      id,
      data,
      buildOpportunityPermissions(published)
    );
    return mapOpportunity(row);
  }

  const chapterId = requireAssignedChapter(session);
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity update");
  }

  const current = await getRow<OpportunityRow>(TABLE_ID, id);
  if (current.chapterId !== chapterId) {
    throw new ForbiddenError("Cannot edit opportunities outside your chapter");
  }

  const published = parsed.data.published ?? current.pubished;
  const data: Record<string, unknown> = { ...parsed.data };
  delete data.chapterId;
  if (parsed.data.eventDate) {
    data.eventData = parsed.data.eventDate.toISOString();
    delete data.eventDate;
  }
  if (parsed.data.sdgs) {
    data.sdgs = serializeSdgs(parsed.data.sdgs);
  }
  if (parsed.data.published !== undefined) {
    data[PUBLISHED_FIELD] = parsed.data.published;
    delete data.published;
  }

  const row = await updateRow<OpportunityRow>(
    TABLE_ID,
    id,
    data,
    buildOpportunityPermissions(published, session?.userId)
  );
  return mapOpportunity(row);
}

export async function deleteOpportunity(id: string): Promise<void> {
  const session = await getSession();
  if (session?.role === "admin") {
    await deleteRow(TABLE_ID, id);
    return;
  }

  const chapterId = requireAssignedChapter(session);
  const current = await getRow<OpportunityRow>(TABLE_ID, id);
  if (!current) {
    throw new NotFoundError("Opportunity not found");
  }
  if (current.chapterId !== chapterId) {
    throw new ForbiddenError("Cannot delete opportunities outside your chapter");
  }
  await deleteRow(TABLE_ID, id);
}
