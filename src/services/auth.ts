import "server-only";

import { cookies, headers } from "next/headers";

import { buildEqualQuery, listRows } from "./appwriteClient";
import { UnexpectedError } from "./errors";
import type { Role } from "./types";

const SESSION_COOKIE = "ysp_session";

function isJwt(value: string): boolean {
  return value.split(".").length === 3;
}

export type SessionInfo = {
  userId: string;
  role: Role;
  assignedChapterId?: string;
} | null;

let sessionOverride: SessionInfo | undefined;

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

async function getCookieHeader(): Promise<string | null> {
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie");
  if (cookieHeader) {
    return cookieHeader;
  }
  const cookieStore = await cookies();
  const cookieList = cookieStore.getAll();
  if (!cookieList.length) {
    return null;
  }
  return cookieList.map(({ name, value }) => `${name}=${value}`).join("; ");
}

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
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
  const token = await getSessionToken();
  const headersInit: Record<string, string> = {
    "X-Appwrite-Project": projectId,
  };
  if (token) {
    headersInit[isJwt(token) ? "X-Appwrite-JWT" : "X-Appwrite-Session"] = token;
  } else {
    const cookieHeader = await getCookieHeader();
    if (!cookieHeader) {
      return null;
    }
    headersInit.cookie = cookieHeader;
  }

  const response = await fetch(`${normalizeEndpoint(endpoint)}/account`, {
    headers: headersInit,
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
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  const endpoint = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  );
  const projectId = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  );
  const token = await getSessionToken();
  const headersInit: Record<string, string> = {
    "X-Appwrite-Project": projectId,
  };
  if (token) {
    headersInit[isJwt(token) ? "X-Appwrite-JWT" : "X-Appwrite-Session"] = token;
  } else {
    const cookieHeader = await getCookieHeader();
    if (cookieHeader) {
      headersInit.cookie = cookieHeader;
    } else {
      return;
    }
  }

  await fetch(`${normalizeEndpoint(endpoint)}/account/sessions/current`, {
    method: "DELETE",
    headers: headersInit,
    cache: "no-store",
  });
}

export async function getSession(): Promise<SessionInfo> {
  if (sessionOverride !== undefined) {
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
