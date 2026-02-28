import "server-only";

import { cookies, headers } from "next/headers";

import { buildEqualQuery, listRows } from "./appwriteClient";
import { UnexpectedError } from "./errors";
import type { Role } from "./types";

const SESSION_COOKIE = "ysp_session";

export function isJwt(value: string): boolean {
  return value.split(".").length === 3;
}

export type SessionInfo = {
  userId: string;
  role: Role;
  assignedChapterId?: string;
  emailVerified?: boolean;
} | null;

let sessionOverride: SessionInfo | undefined;

export function setSessionForTesting(session: SessionInfo | undefined): void {
  sessionOverride = session;
}

type AccountResponse = { $id: string; emailVerification?: boolean };

type UserProfileRow = {
  userId: string;
  role: Role;
  assignedChapterId?: string;
};

export function requirePublicEnv(name: string, value?: string): string {
  if (!value) {
    throw new UnexpectedError(`${name} is not configured`);
  }
  return value;
}

export function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

export async function getCookieHeader(): Promise<string | null> {
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

  const requestAccount = () =>
    fetch(`${normalizeEndpoint(endpoint)}/account`, {
      headers: headersInit,
      cache: "no-store",
    });

  async function readAccount(response: Response): Promise<AccountResponse | null> {
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as AccountResponse;
    return data?.$id ? data : null;
  }

  function isUnauthenticatedStatus(status: number): boolean {
    return status === 401 || status === 403;
  }

  function isTransientStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  let response: Response;
  try {
    response = await requestAccount();
  } catch {
    try {
      response = await requestAccount();
    } catch {
      throw new UnexpectedError("Authentication service is temporarily unavailable");
    }
  }

  if (response.ok) {
    return readAccount(response);
  }

  if (isUnauthenticatedStatus(response.status)) {
    return null;
  }

  if (isTransientStatus(response.status)) {
    let retryResponse: Response;
    try {
      retryResponse = await requestAccount();
    } catch {
      throw new UnexpectedError("Authentication service is temporarily unavailable");
    }

    if (retryResponse.ok) {
      return readAccount(retryResponse);
    }
    if (isUnauthenticatedStatus(retryResponse.status)) {
      return null;
    }
    if (isTransientStatus(retryResponse.status)) {
      throw new UnexpectedError(
        `Authentication service returned ${retryResponse.status} during session validation`
      );
    }
    return null;
  }

  return null;
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
  if (process.env.E2E_ADMIN_BYPASS === "1") {
    return {
      userId: "e2e-admin",
      role: "admin",
      emailVerified: true,
    };
  }

  let account: AccountResponse | null;
  try {
    account = await fetchAccount();
  } catch (error) {
    if (error instanceof UnexpectedError && /not configured/i.test(error.message)) {
      return null;
    }
    throw error;
  }
  if (!account) {
    return null;
  }

  const profile = await fetchUserProfile(account.$id);
  return {
    userId: account.$id,
    role: profile?.role ?? null,
    assignedChapterId: profile?.assignedChapterId,
    emailVerified: account.emailVerification === true,
  };
}
