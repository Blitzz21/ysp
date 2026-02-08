import type { Role } from "./types";

export type SessionInfo = {
  userId: string;
  role: Role;
  assignedChapterId?: string;
} | null;

export async function signIn(email: string, password: string): Promise<void> {
  throw new Error("Not implemented");
}

export async function signOut(): Promise<void> {
  throw new Error("Not implemented");
}

export async function getSession(): Promise<SessionInfo> {
  throw new Error("Not implemented");
}
