import { ForbiddenError, UnauthorizedError } from "./errors";
import type { SessionInfo } from "./auth";

export function requireSession(session: SessionInfo): NonNullable<SessionInfo> {
  if (!session) {
    throw new UnauthorizedError("Authentication required");
  }
  if (session.emailVerified === false) {
    throw new ForbiddenError("Email verification required");
  }
  return session;
}

export function requireAdmin(session: SessionInfo): NonNullable<SessionInfo> {
  const active = requireSession(session);
  if (active.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return active;
}

export function requireChapterHead(session: SessionInfo): NonNullable<SessionInfo> {
  const active = requireSession(session);
  if (active.role !== "chapter_head") {
    throw new ForbiddenError("Chapter head access required");
  }
  return active;
}

export function requireAssignedChapter(session: SessionInfo): string {
  const active = requireChapterHead(session);
  if (!active.assignedChapterId) {
    throw new ForbiddenError("Chapter assignment required");
  }
  return active.assignedChapterId;
}
