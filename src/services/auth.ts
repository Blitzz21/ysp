import "server-only";

import { cookies } from "next/headers";

import { buildEqualQuery, listRows } from "./appwriteClient";
import { UnexpectedError } from "./errors";
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

type AccountResponse = { $id: string };

type UserProfileRow = {
  userId: string;
  role: Role;
  assignedChapterId?: string;
};

function requirePublicEnv(name: string, value?: string): string {
  if (!value) {
    throw new UnexpectedError(`${name} is not configured`);
  }
  return value;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function getCookieHeader(): string | null {
  const store = cookies();
  const pairs = store.getAll().map(({ name, value }) => `${name}=${value}`);
  return pairs.length ? pairs.join("; ") : null;
}

async function fetchAccount(): Promise<AccountResponse | null> {
  const endpoint = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  );
  const projectId = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  );
  const cookieHeader = getCookieHeader();
  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${normalizeEndpoint(endpoint)}/account`, {
    headers: {
      "X-Appwrite-Project": projectId,
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AccountResponse;
  return data?.$id ? data : null;
}

async function fetchUserProfile(userId: string): Promise<UserProfileRow | null> {
  const rows = await listRows<UserProfileRow>("user_profiles", [
    buildEqualQuery("userId", userId),
  ]);
  return rows[0] ?? null;
}

export async function signIn(email: string, password: string): Promise<void> {
  void email;
  void password;
  throw new Error("Use the client login page to create Appwrite sessions.");
}

export async function signOut(): Promise<void> {
  const endpoint = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  );
  const projectId = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  );
  const cookieHeader = getCookieHeader();
  if (!cookieHeader) return;

  await fetch(`${normalizeEndpoint(endpoint)}/account/sessions/current`, {
    method: "DELETE",
    headers: {
      "X-Appwrite-Project": projectId,
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
}

export async function getSession(): Promise<SessionInfo> {
  if (sessionOverride) {
    return sessionOverride;
  }

  const account = await fetchAccount();
  if (!account) {
    return null;
  }

  const profile = await fetchUserProfile(account.$id);
  return {
    userId: account.$id,
    role: profile?.role ?? null,
    assignedChapterId: profile?.assignedChapterId,
  };
}
