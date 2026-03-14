import { z } from "zod";

import { getSession } from "./auth";
import {
  addReadPermissions,
  adminOnlyPermissions,
  buildEqualQuery,
  buildGreaterThanEqualQuery,
  buildLessThanEqualQuery,
  buildOrderAsc,
  buildSearchQuery,
  createRow,
  deleteRow,
  getRow,
  listRows,
  publicReadPermissions,
  updateFilePermissions,
  updateRow,
  uploadFile,
  userReadPermissions,
  userReadWritePermissions,
} from "./appwriteClient";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { requireAdmin, requireAssignedChapter, requireChapterHead, requireSession } from "./rbac";
import type { OpportunitySignup, VolunteerOpportunity } from "./types";

const TABLE_ID = "volunteer_opportunities";
const SIGNUPS_TABLE_ID = "opportunity_signups";
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
  capacity: z.number().int().nonnegative().optional(),
  currentVolunteers: z.number().int().nonnegative().optional(),
  waitlistEnabled: z.boolean().optional(),
  published: z.boolean().optional(),
});

const updateSchema = createSchema.partial();
const publicListSchema = z
  .object({
    chapterId: z.string().min(1).optional(),
    fromDate: z.date().optional(),
    toDate: z.date().optional(),
    sdg: z.string().min(1).optional(),
    status: z.enum(["all", "upcoming", "past"]).optional(),
  })
  .refine(
    (value) => {
      if (!value.fromDate || !value.toDate) return true;
      return value.fromDate.getTime() <= value.toDate.getTime();
    },
    { message: "fromDate must be before or equal to toDate" }
  );

type OpportunityRow = {
  title: string;
  eventData: string;
  chapterId: string;
  description: string;
  sdgs: string;
  signupContactName?: string;
  signupContactEmail?: string;
  signupContactPhone?: string;
  capacity?: number;
  currentVolunteers?: number;
  imageFileId?: string;
  waitlistEnabled?: boolean;
  pubished: boolean;
};

type OpportunitySignupRow = {
  userId: string;
  opportunityId: string;
  status: "joined" | "cancelled" | "waitlisted";
  joinedAt: string;
};

function serializeFileIds(values: string[]): string {
  return values.filter(Boolean).join(",");
}

function parseFileIds(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

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
    capacity: Math.max(0, row.capacity ?? 0),
    currentVolunteers: Math.max(0, row.currentVolunteers ?? 0),
    imageFileIds: parseFileIds(row.imageFileId),
    waitlistEnabled: row.waitlistEnabled ?? false,
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

function sortDeterministically(values: VolunteerOpportunity[]): VolunteerOpportunity[] {
  return values.sort((a, b) => {
    const eventA = new Date(a.eventDate).getTime();
    const eventB = new Date(b.eventDate).getTime();
    if (eventA !== eventB) {
      return eventA - eventB;
    }
    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    if (createdA !== createdB) {
      return createdA - createdB;
    }
    return a.id.localeCompare(b.id);
  });
}

type DateBounds = { fromDate?: Date; toDate?: Date };

function resolveDateBounds(
  status: "all" | "upcoming" | "past",
  fromDate?: Date,
  toDate?: Date
): DateBounds {
  const now = new Date();
  const resolved: DateBounds = { fromDate, toDate };
  if (status === "upcoming") {
    resolved.fromDate = fromDate && fromDate.getTime() > now.getTime() ? fromDate : now;
  } else if (status === "past") {
    resolved.toDate = toDate && toDate.getTime() < now.getTime() ? toDate : now;
  }
  return resolved;
}

function matchesOpportunityFilter(
  item: VolunteerOpportunity,
  chapterId?: string,
  normalizedSdg?: string,
  fromTime?: number,
  toTime?: number
): boolean {
  if (!item.published) return false;
  if (chapterId && item.chapterId !== chapterId) return false;
  if (normalizedSdg && !item.sdgs.some((tag) => tag.toLowerCase().includes(normalizedSdg))) {
    return false;
  }
  const eventTime = new Date(item.eventDate).getTime();
  if (Number.isNaN(eventTime)) return false;
  if (fromTime !== undefined && eventTime < fromTime) return false;
  if (toTime !== undefined && eventTime > toTime) return false;
  return true;
}

function buildPublishedQueries(
  chapterId?: string,
  fromDate?: Date,
  toDate?: Date,
  sdg?: string
): string[] {
  const queries = [buildEqualQuery(PUBLISHED_FIELD, true)];
  if (chapterId) queries.push(buildEqualQuery("chapterId", chapterId));
  if (fromDate) queries.push(buildGreaterThanEqualQuery("eventData", fromDate.toISOString()));
  if (toDate) queries.push(buildLessThanEqualQuery("eventData", toDate.toISOString()));
  if (sdg) queries.push(buildSearchQuery("sdgs", sdg));
  queries.push(buildOrderAsc("eventData"));
  queries.push(buildOrderAsc("$createdAt"));
  return queries;
}

export async function listPublishedOpportunities(params?: {
  chapterId?: string;
  fromDate?: Date;
  toDate?: Date;
  sdg?: string;
  status?: "all" | "upcoming" | "past";
}): Promise<VolunteerOpportunity[]> {
  const parsed = publicListSchema.safeParse(params ?? {});
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity query");
  }

  const status = parsed.data.status ?? "all";
  const { fromDate, toDate } = resolveDateBounds(status, parsed.data.fromDate, parsed.data.toDate);

  if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
    return [];
  }

  const queries = buildPublishedQueries(parsed.data.chapterId, fromDate, toDate, parsed.data.sdg);

  try {
    const rows = await listRows<OpportunityRow>(TABLE_ID, queries);
    return sortDeterministically(rows.map(mapOpportunity));
  } catch (error) {
    // Appwrite query syntax can vary across TablesDB versions.
    // Fallback keeps behavior deterministic and public-safe.
    if (!(error instanceof ValidationError)) {
      throw error;
    }

    const rows = await listRows<OpportunityRow>(TABLE_ID);
    const normalizedSdg = parsed.data.sdg?.toLowerCase();
    const fromTime = fromDate?.getTime();
    const toTime = toDate?.getTime();

    return sortDeterministically(
      rows
        .map(mapOpportunity)
        .filter((item) => matchesOpportunityFilter(item, parsed.data.chapterId, normalizedSdg, fromTime, toTime))
    );
  }
}

export async function listPublicOpportunities(params?: {
  chapterId?: string;
  fromDate?: Date;
  toDate?: Date;
  sdg?: string;
  status?: "all" | "upcoming" | "past";
}): Promise<VolunteerOpportunity[]> {
  return listPublishedOpportunities(params);
}

export async function listMyChapterOpportunities(): Promise<VolunteerOpportunity[]> {
  const session = await getSession();
  requireChapterHead(session);
  const chapterId = requireAssignedChapter(session);

  const queries = [
    buildEqualQuery("chapterId", chapterId),
    buildOrderAsc("eventData"),
    buildOrderAsc("$createdAt"),
  ];

  const rows = await listRows<OpportunityRow>(TABLE_ID, queries);
  return sortDeterministically(rows.map(mapOpportunity));
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
  capacity?: number;
  currentVolunteers?: number;
  waitlistEnabled?: boolean;
  published?: boolean;
  imageFiles?: File[];
}): Promise<VolunteerOpportunity> {
  const session = await getSession();
  requireAdmin(session);

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity input");
  }

  const published = parsed.data.published ?? false;
  const capacity = parsed.data.capacity ?? 0;
  const currentVolunteers = parsed.data.currentVolunteers ?? 0;
  const waitlistEnabled = parsed.data.waitlistEnabled ?? false;

  if (capacity > 0 && currentVolunteers > capacity) {
    throw new ValidationError("Current volunteers cannot exceed capacity");
  }

  const fileIds: string[] = [];
  if (input.imageFiles?.length) {
    const filePermissions = published ? publicReadPermissions() : adminOnlyPermissions();
    for (const file of input.imageFiles) {
      const uploaded = await uploadFile(file, filePermissions);
      fileIds.push(uploaded.$id);
    }
  }

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
      capacity,
      currentVolunteers,
      waitlistEnabled,
      imageFileId: fileIds.length ? serializeFileIds(fileIds) : undefined,
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
  const capacity = parsed.data.capacity ?? 0;
  const currentVolunteers = parsed.data.currentVolunteers ?? 0;
  const waitlistEnabled = parsed.data.waitlistEnabled ?? false;

  if (capacity > 0 && currentVolunteers > capacity) {
    throw new ValidationError("Current volunteers cannot exceed capacity");
  }

  const fileIds: string[] = [];
  if (input.imageFiles?.length) {
    const filePermissions = published
      ? [...userReadWritePermissions(session!.userId), 'read("any")']
      : userReadWritePermissions(session!.userId);
    for (const file of input.imageFiles) {
      const uploaded = await uploadFile(file, filePermissions);
      fileIds.push(uploaded.$id);
    }
  }

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
      capacity,
      currentVolunteers,
      waitlistEnabled,
      imageFileId: fileIds.length ? serializeFileIds(fileIds) : undefined,
      [PUBLISHED_FIELD]: published,
    },
    buildOpportunityPermissions(published, session?.userId)
  );

  return mapOpportunity(row);
}

function buildUpdateData(
  parsed: { data: z.infer<typeof updateSchema> },
  current: OpportunityRow
): { data: Record<string, unknown>; published: boolean | undefined } {
  const published = parsed.data.published ?? current.pubished;
  const capacity = parsed.data.capacity ?? current.capacity ?? 0;
  const currentVolunteers =
    parsed.data.currentVolunteers ?? current.currentVolunteers ?? 0;
  if (capacity > 0 && currentVolunteers > capacity) {
    throw new ValidationError("Current volunteers cannot exceed capacity");
  }

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
  if (parsed.data.capacity !== undefined) {
    data.capacity = capacity;
  }
  if (parsed.data.currentVolunteers !== undefined) {
    data.currentVolunteers = currentVolunteers;
  }
  if (parsed.data.waitlistEnabled !== undefined) {
    data.waitlistEnabled = parsed.data.waitlistEnabled;
  }

  return { data, published };
}

export async function updateOpportunity(
  id: string,
  input: Partial<Parameters<typeof createOpportunity>[0]> & { existingImageFileIds?: string[] }
): Promise<VolunteerOpportunity> {
  const session = await getSession();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity update");
  }

  const current = await getRow<OpportunityRow>(TABLE_ID, id);
  const isAdmin = session?.role === "admin";

  if (!isAdmin) {
    const chapterId = requireAssignedChapter(session);
    if (current.chapterId !== chapterId) {
      throw new ForbiddenError("Cannot edit opportunities outside your chapter");
    }
  }

  const { data, published } = buildUpdateData(parsed, current);
  if (!isAdmin) {
    delete data.chapterId;
  }

  // Handle image file uploads and existing image IDs
  const hasImageChanges = input.imageFiles !== undefined || input.existingImageFileIds !== undefined;
  if (hasImageChanges) {
    const keptIds = input.existingImageFileIds ?? [];
    const newIds: string[] = [];
    const nextPublished = published ?? current.pubished;
    const filePermissions = nextPublished
      ? (isAdmin ? publicReadPermissions() : [...userReadWritePermissions(session!.userId), 'read("any")'])
      : (isAdmin ? adminOnlyPermissions() : userReadWritePermissions(session!.userId));
    if (input.imageFiles?.length) {
      for (const file of input.imageFiles) {
        const uploaded = await uploadFile(file, filePermissions);
        newIds.push(uploaded.$id);
      }
    }
    // Sync permissions on kept files to match current published state
    for (const keptId of keptIds) {
      await updateFilePermissions(keptId, filePermissions);
    }
    const allIds = [...keptIds, ...newIds];
    data.imageFileId = allIds.length ? serializeFileIds(allIds) : "";
  }

  const row = await updateRow<OpportunityRow>(
    TABLE_ID,
    id,
    data,
    buildOpportunityPermissions(published ?? false, isAdmin ? undefined : session?.userId)
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

export async function listOpportunitySignups(
  opportunityId: string
): Promise<OpportunitySignup[]> {
  const session = await getSession();
  requireChapterHead(session);
  const chapterId = requireAssignedChapter(session);

  const opportunity = await getRow<OpportunityRow>(TABLE_ID, opportunityId);
  if (!opportunity) {
    throw new NotFoundError("Opportunity not found");
  }
  if (opportunity.chapterId !== chapterId) {
    throw new ForbiddenError("Cannot view signups for opportunities outside your chapter");
  }

  const rows = await listRows<OpportunitySignupRow>(SIGNUPS_TABLE_ID, [
    buildEqualQuery("opportunityId", opportunityId),
  ]);

  return rows.map((row) => ({
    id: row.$id,
    userId: row.userId,
    opportunityId: row.opportunityId,
    status: row.status,
    joinedAt: row.joinedAt,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  }));
}

export async function listMemberSignups(
  userId: string
): Promise<OpportunitySignup[]> {
  const session = await getSession();
  requireChapterHead(session);

  const rows = await listRows<OpportunitySignupRow>(SIGNUPS_TABLE_ID, [
    buildEqualQuery("userId", userId),
  ]);

  return rows
    .filter((row) => row.status !== "cancelled")
    .map((row) => ({
      id: row.$id,
      userId: row.userId,
      opportunityId: row.opportunityId,
      status: row.status,
      joinedAt: row.joinedAt,
      createdAt: row.$createdAt,
      updatedAt: row.$updatedAt,
    }));
}

export async function joinOpportunity(
  opportunityId: string
): Promise<"joined" | "waitlisted"> {
  const session = requireSession(await getSession());
  const opportunity = await getRow<OpportunityRow>(TABLE_ID, opportunityId);
  if (!opportunity) {
    throw new NotFoundError("Opportunity not found");
  }
  if (!opportunity.pubished) {
    throw new ForbiddenError("Opportunity is not open for signups");
  }

  const existing = await listRows<OpportunitySignupRow>(SIGNUPS_TABLE_ID, [
    buildEqualQuery("userId", session.userId),
    buildEqualQuery("opportunityId", opportunityId),
  ]);
  const active = existing.find((row) => row.status !== "cancelled");
  if (active && active.status !== "cancelled") {
    return active.status;
  }

  const capacity = Math.max(0, opportunity.capacity ?? 0);
  const currentVolunteers = Math.max(0, opportunity.currentVolunteers ?? 0);
  const waitlistEnabled = opportunity.waitlistEnabled ?? false;

  let status: "joined" | "waitlisted" = "joined";
  if (capacity > 0 && currentVolunteers >= capacity) {
    if (!waitlistEnabled) {
      throw new ValidationError("Opportunity is full");
    }
    status = "waitlisted";
  }

  await createRow<OpportunitySignupRow>(
    SIGNUPS_TABLE_ID,
    {
      userId: session.userId,
      opportunityId,
      status,
      joinedAt: new Date().toISOString(),
    },
    userReadPermissions(session.userId)
  );

  if (status === "joined") {
    await updateRow<OpportunityRow>(TABLE_ID, opportunityId, {
      currentVolunteers: currentVolunteers + 1,
    });
  }

  return status;
}

/* ─────────────────────────────────────────────
 * Current user's signups
 * ───────────────────────────────────────────── */

/**
 * Return the current authenticated user's non-cancelled signups.
 */
export async function getMyActiveSignups(): Promise<OpportunitySignup[]> {
  const session = requireSession(await getSession());

  const rows = await listRows<OpportunitySignupRow>(SIGNUPS_TABLE_ID, [
    buildEqualQuery("userId", session.userId),
  ]);

  return rows
    .filter((row) => row.status !== "cancelled")
    .map((row) => ({
      id: row.$id,
      userId: row.userId,
      opportunityId: row.opportunityId,
      status: row.status,
      joinedAt: row.joinedAt,
      createdAt: row.$createdAt,
      updatedAt: row.$updatedAt,
    }));
}

/**
 * Return opportunities the current user has joined/waitlisted, enriched with
 * opportunity details.  Sorted by joinedAt descending (most recent first).
 */
export async function getMyJoinedOpportunities(): Promise<
  {
    opportunity: VolunteerOpportunity;
    signupStatus: "joined" | "waitlisted";
    joinedAt: string;
  }[]
> {
  const signups = await getMyActiveSignups();
  if (!signups.length) return [];

  // Batch-fetch opportunities
  const opRows = await listRows<OpportunityRow>(TABLE_ID, []);
  const opMap = new Map<string, VolunteerOpportunity>();
  for (const row of opRows) {
    opMap.set(
      row.$id,
      mapOpportunity(row as OpportunityRow & { $id: string; $createdAt: string; $updatedAt: string })
    );
  }

  return signups
    .filter((s) => opMap.has(s.opportunityId))
    .map((s) => ({
      opportunity: opMap.get(s.opportunityId)!,
      signupStatus: s.status as "joined" | "waitlisted",
      joinedAt: s.joinedAt,
    }))
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
}

/* ─────────────────────────────────────────────
 * Signup avatars (batch)
 * ───────────────────────────────────────────── */

export type SignupAvatar = {
  userId: string;
  name: string;
  avatarFileId?: string;
};

/**
 * For a list of opportunity IDs, return a map of opportunityId → SignupAvatar[]
 * (max 10 avatars per opportunity).  Single batch fetch, no N+1.
 */
export async function getBatchSignupAvatars(
  opportunityIds: string[]
): Promise<Map<string, SignupAvatar[]>> {
  if (!opportunityIds.length) return new Map();

  // 1. Fetch all signups (non-cancelled) across all requested opportunities
  const allSignups = await listRows<OpportunitySignupRow>(SIGNUPS_TABLE_ID, []);
  const idsSet = new Set(opportunityIds);

  const grouped = new Map<string, string[]>(); // oppId → userId[]
  const uniqueUserIds = new Set<string>();

  for (const row of allSignups) {
    if (row.status === "cancelled") continue;
    if (!idsSet.has(row.opportunityId)) continue;
    uniqueUserIds.add(row.userId);
    const list = grouped.get(row.opportunityId) ?? [];
    list.push(row.userId);
    grouped.set(row.opportunityId, list);
  }

  if (!uniqueUserIds.size) return new Map();

  // 2. Batch-fetch user profiles
  // Import dynamically to avoid circular dependency
  const { getProfileByUserId } = await import("./profiles");
  const profileMap = new Map<string, { name: string; avatarFileId?: string }>();

  await Promise.all(
    Array.from(uniqueUserIds).map(async (uid) => {
      try {
        const profile = await getProfileByUserId(uid);
        if (profile) {
          profileMap.set(uid, {
            name: profile.name ?? profile.firstName ?? "User",
            avatarFileId: profile.avatarFileId ?? undefined,
          });
        }
      } catch {
        // skip if profile not found
      }
    })
  );

  // 3. Build final map (max 10 avatars per opportunity)
  const result = new Map<string, SignupAvatar[]>();
  for (const oppId of opportunityIds) {
    const userIds = grouped.get(oppId) ?? [];
    const avatars: SignupAvatar[] = [];
    for (const uid of userIds.slice(0, 10)) {
      const p = profileMap.get(uid);
      avatars.push({
        userId: uid,
        name: p?.name ?? "User",
        avatarFileId: p?.avatarFileId,
      });
    }
    result.set(oppId, avatars);
  }

  return result;
}

export async function getPublishedOpportunityByImageId(
  imageFileId: string
): Promise<VolunteerOpportunity | null> {
  const rows = await listRows<OpportunityRow>(TABLE_ID, [
    buildEqualQuery(PUBLISHED_FIELD, true),
  ]);
  const opportunities = rows.map(mapOpportunity);
  return opportunities.find((op) => op.imageFileIds?.includes(imageFileId)) ?? null;
}
