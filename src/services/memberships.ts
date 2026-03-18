import { z } from "zod";

import { slugify } from "@/lib/slugify";
import { getSession } from "./auth";
import {
  buildEqualQuery,
  createRow,
  listRows,
  updateRow,
  adminOnlyPermissions,
  userReadPermissions,
} from "./appwriteClient";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { requireAssignedChapter, requireSession } from "./rbac";
import type {
  ChapterMembership,
  ChapterOfficerRole,
  MembershipRole,
  MembershipStatus,
} from "./types";

const TABLE_ID = "chapter_memberships";
const OFFICER_TABLE_ID = "chapter_officer_roles";

const joinSchema = z.object({
  chapterId: z.string().min(1),
});

const roleSchema = z.object({
  roleId: z.string().min(1).max(128).optional(),
  label: z.string().min(1).max(128),
  permissions: z.string().min(1).max(2048),
});

const assignOfficerSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  chapterId: z.string().min(1).optional(),
});

const chapterScopeSchema = z.object({
  chapterId: z.string().min(1).optional(),
});

type MembershipRow = {
  userId: string;
  chapterId: string;
  role: MembershipRole;
  officerRoleId?: string;
  status: MembershipStatus;
  joinedAt: string;
};

type OfficerRoleRow = {
  roleId: string;
  chapterId: string;
  label: string;
  permissions: string;
};

function mapMembership(
  row: MembershipRow & { $id: string; $createdAt: string; $updatedAt: string }
): ChapterMembership {
  return {
    id: row.$id,
    userId: row.userId,
    chapterId: row.chapterId,
    role: row.role,
    officerRoleId: row.officerRoleId ?? undefined,
    status: row.status,
    joinedAt: row.joinedAt,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function mapOfficerRole(
  row: OfficerRoleRow & { $id: string; $createdAt: string; $updatedAt: string }
): ChapterOfficerRole {
  return {
    id: row.$id,
    roleId: row.roleId,
    chapterId: row.chapterId,
    label: row.label,
    permissions: row.permissions,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireChapterLeader(session: Awaited<ReturnType<typeof getSession>>) {
  const active = requireSession(session);
  if (active.role !== "chapter_head" && active.role !== "admin") {
    throw new ForbiddenError("Chapter head access required");
  }
  return active;
}

function resolveChapterId(
  session: Awaited<ReturnType<typeof getSession>>,
  chapterId?: string
): string {
  const active = requireChapterLeader(session);
  if (active.role === "admin") {
    if (!chapterId) {
      throw new ValidationError("Chapter id is required for admin actions");
    }
    return chapterId;
  }
  return requireAssignedChapter(active);
}

export async function listMyMemberships(): Promise<ChapterMembership[]> {
  const session = requireSession(await getSession());
  const rows = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", session.userId),
  ]);
  return rows.map(mapMembership);
}

export async function joinChapter(chapterId: string): Promise<ChapterMembership> {
  const session = requireSession(await getSession());
  const parsed = joinSchema.safeParse({ chapterId });
  if (!parsed.success) {
    throw new ValidationError("Invalid chapter join request");
  }

  // Prevent joining multiple chapters — check ALL memberships for this user
  const allMemberships = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", session.userId),
  ]);
  const activeOrPending = allMemberships.find(
    (m) =>
      (m.status === "active" || m.status === "pending") &&
      m.chapterId !== parsed.data.chapterId
  );
  if (activeOrPending) {
    throw new ValidationError(
      "You already have an active or pending chapter membership. Leave your current chapter first."
    );
  }

  const existing = allMemberships.filter(
    (m) => m.chapterId === parsed.data.chapterId
  );

  const current = existing[0];
  if (current && current.status !== "removed") {
    return mapMembership(current);
  }

  const joinedAt = new Date().toISOString();
  if (current) {
    const updated = await updateRow<MembershipRow>(
      TABLE_ID,
      current.$id,
      { status: "pending", joinedAt }
    );
    return mapMembership(updated);
  }

  const row = await createRow<MembershipRow>(
    TABLE_ID,
    {
      userId: session.userId,
      chapterId: parsed.data.chapterId,
      role: "member",
      status: "pending",
      joinedAt,
    },
    userReadPermissions(session.userId)
  );

  return mapMembership(row);
}

export async function leaveChapter(chapterId: string): Promise<ChapterMembership> {
  const session = requireSession(await getSession());
  const parsed = joinSchema.safeParse({ chapterId });
  if (!parsed.success) {
    throw new ValidationError("Invalid chapter leave request");
  }

  const existing = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", session.userId),
    buildEqualQuery("chapterId", parsed.data.chapterId),
  ]);
  const current = existing[0];
  if (!current) {
    throw new NotFoundError("Membership not found");
  }
  if (current.status === "removed") {
    return mapMembership(current);
  }

  const updated = await updateRow<MembershipRow>(
    TABLE_ID,
    current.$id,
    { status: "removed" }
  );
  return mapMembership(updated);
}

export async function listChapterMembers(
  chapterId?: string
): Promise<ChapterMembership[]> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, chapterId);
  const rows = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("chapterId", targetChapterId),
  ]);
  return rows.map(mapMembership);
}

export async function listOfficerRoles(
  chapterId?: string
): Promise<ChapterOfficerRole[]> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, chapterId);
  const rows = await listRows<OfficerRoleRow>(OFFICER_TABLE_ID, [
    buildEqualQuery("chapterId", targetChapterId),
  ]);
  return rows.map(mapOfficerRole);
}

export async function createOfficerRole(input: {
  label: string;
  permissions: string;
  roleId?: string;
  chapterId?: string;
}): Promise<ChapterOfficerRole> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, input.chapterId);
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid officer role input");
  }

  const roleId = parsed.data.roleId?.trim() || slugify(parsed.data.label);
  const row = await createRow<OfficerRoleRow>(
    OFFICER_TABLE_ID,
    {
      roleId,
      chapterId: targetChapterId,
      label: parsed.data.label,
      permissions: parsed.data.permissions,
    },
    adminOnlyPermissions()
  );
  return mapOfficerRole(row);
}

export async function updateOfficerPermissions(input: {
  roleId: string;
  permissions: string;
  label?: string;
  chapterId?: string;
}): Promise<ChapterOfficerRole> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, input.chapterId);
  const parsed = roleSchema.safeParse({
    roleId: input.roleId,
    label: input.label ?? "Officer role",
    permissions: input.permissions,
  });
  if (!parsed.success) {
    throw new ValidationError("Invalid officer role update");
  }

  const existing = await listRows<OfficerRoleRow>(OFFICER_TABLE_ID, [
    buildEqualQuery("chapterId", targetChapterId),
    buildEqualQuery("roleId", input.roleId),
  ]);
  const current = existing[0];
  if (!current) {
    throw new NotFoundError("Officer role not found");
  }

  const updated = await updateRow<OfficerRoleRow>(OFFICER_TABLE_ID, current.$id, {
    label: input.label ?? current.label,
    permissions: input.permissions,
  });
  return mapOfficerRole(updated);
}

export async function assignOfficer(input: {
  userId: string;
  roleId: string;
  chapterId?: string;
}): Promise<ChapterMembership> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, input.chapterId);
  const parsed = assignOfficerSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid officer assignment");
  }

  const roles = await listRows<OfficerRoleRow>(OFFICER_TABLE_ID, [
    buildEqualQuery("chapterId", targetChapterId),
    buildEqualQuery("roleId", parsed.data.roleId),
  ]);
  if (!roles.length) {
    throw new NotFoundError("Officer role not found");
  }

  const existing = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", parsed.data.userId),
    buildEqualQuery("chapterId", targetChapterId),
  ]);
  const current = existing[0];
  const joinedAt = new Date().toISOString();
  if (current) {
    const updated = await updateRow<MembershipRow>(TABLE_ID, current.$id, {
      role: "officer",
      officerRoleId: parsed.data.roleId,
      status: "active",
      joinedAt,
    });
    return mapMembership(updated);
  }

  const row = await createRow<MembershipRow>(
    TABLE_ID,
    {
      userId: parsed.data.userId,
      chapterId: targetChapterId,
      role: "officer",
      officerRoleId: parsed.data.roleId,
      status: "active",
      joinedAt,
    },
    userReadPermissions(parsed.data.userId)
  );
  return mapMembership(row);
}

export async function removeOfficer(input: {
  userId: string;
  chapterId?: string;
}): Promise<ChapterMembership> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, input.chapterId);
  const parsed = chapterScopeSchema.safeParse(input);
  if (!parsed.success || !input.userId) {
    throw new ValidationError("Invalid officer removal");
  }

  const existing = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", input.userId),
    buildEqualQuery("chapterId", targetChapterId),
  ]);
  const current = existing[0];
  if (!current) {
    throw new NotFoundError("Membership not found");
  }
  const updated = await updateRow<MembershipRow>(TABLE_ID, current.$id, {
    role: "member",
    officerRoleId: null,
  });
  return mapMembership(updated);
}

export async function removeMember(input: {
  userId: string;
  chapterId?: string;
}): Promise<ChapterMembership> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, input.chapterId);
  const parsed = chapterScopeSchema.safeParse(input);
  if (!parsed.success || !input.userId) {
    throw new ValidationError("Invalid member removal");
  }

  const existing = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", input.userId),
    buildEqualQuery("chapterId", targetChapterId),
  ]);
  const current = existing[0];
  if (!current) {
    throw new NotFoundError("Membership not found");
  }
  const updated = await updateRow<MembershipRow>(TABLE_ID, current.$id, {
    status: "removed",
  });
  return mapMembership(updated);
}

export async function listPendingMembers(
  chapterId?: string
): Promise<ChapterMembership[]> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, chapterId);
  const rows = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("chapterId", targetChapterId),
    buildEqualQuery("status", "pending"),
  ]);
  return rows.map(mapMembership);
}

export async function approveMember(input: {
  userId: string;
  chapterId?: string;
}): Promise<ChapterMembership> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, input.chapterId);
  if (!input.userId) {
    throw new ValidationError("User id is required");
  }

  const existing = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", input.userId),
    buildEqualQuery("chapterId", targetChapterId),
  ]);
  const current = existing[0];
  if (!current) {
    throw new NotFoundError("Membership not found");
  }
  if (current.status !== "pending") {
    throw new ValidationError("Only pending memberships can be approved");
  }

  const updated = await updateRow<MembershipRow>(TABLE_ID, current.$id, {
    status: "active",
  });
  return mapMembership(updated);
}

export async function declineMember(input: {
  userId: string;
  chapterId?: string;
}): Promise<ChapterMembership> {
  const session = await getSession();
  const targetChapterId = resolveChapterId(session, input.chapterId);
  if (!input.userId) {
    throw new ValidationError("User id is required");
  }

  const existing = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", input.userId),
    buildEqualQuery("chapterId", targetChapterId),
  ]);
  const current = existing[0];
  if (!current) {
    throw new NotFoundError("Membership not found");
  }
  if (current.status !== "pending") {
    throw new ValidationError("Only pending memberships can be declined");
  }

  const updated = await updateRow<MembershipRow>(TABLE_ID, current.$id, {
    status: "removed",
  });
  return mapMembership(updated);
}
