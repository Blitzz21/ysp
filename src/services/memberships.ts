import { z } from "zod";

import { getSession } from "./auth";
import {
  buildEqualQuery,
  createRow,
  listRows,
  updateRow,
  userReadPermissions,
} from "./appwriteClient";
import { NotFoundError, ValidationError } from "./errors";
import { requireSession } from "./rbac";
import type { ChapterMembership, MembershipRole, MembershipStatus } from "./types";

const TABLE_ID = "chapter_memberships";

const joinSchema = z.object({
  chapterId: z.string().min(1),
});

type MembershipRow = {
  userId: string;
  chapterId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string;
};

function mapMembership(
  row: MembershipRow & { $id: string; $createdAt: string; $updatedAt: string }
): ChapterMembership {
  return {
    id: row.$id,
    userId: row.userId,
    chapterId: row.chapterId,
    role: row.role,
    status: row.status,
    joinedAt: row.joinedAt,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
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

  const existing = await listRows<MembershipRow>(TABLE_ID, [
    buildEqualQuery("userId", session.userId),
    buildEqualQuery("chapterId", parsed.data.chapterId),
  ]);

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
