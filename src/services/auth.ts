import type { Role } from "./types";

export type SessionInfo = {
  userId: string;
  role: Role;
  assignedChapterId?: string;
} | null;

let sessionOverride: SessionInfo = null;

export function setSessionForTesting(session: SessionInfo): void {
  sessionOverride = session;
}

export async function signIn(email: string, password: string): Promise<void> {
  void email;
  void password;
  throw new Error("Not implemented");
}

export async function signOut(): Promise<void> {
  throw new Error("Not implemented");
}

export async function getSession(): Promise<SessionInfo> {
  return sessionOverride;
}
