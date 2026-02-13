import "server-only";

import { cookies, headers } from "next/headers";
import { z } from "zod";

import {
  buildEqualQuery,
  createRow,
  listRows,
  uploadFile,
  updateRow,
  userReadPermissions,
  userReadWritePermissions,
} from "./appwriteClient";
import {
  ForbiddenError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
} from "./errors";
import { fromHttpStatus } from "./errorContract";
import { getSession } from "./auth";
import { requireSession } from "./rbac";
import type { Role, UserProfile } from "./types";

const TABLE_ID = "user_profiles";

type UserProfileRow = {
  userId: string;
  role: Role;
  assignedChapterId?: string;
  name?: string;
  age?: number;
  avatarUrl?: string;
  avatarFileId?: string;
  email?: string;
};

const profileSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  age: z.number().int().min(0).max(120).optional(),
  avatarUrl: z.string().url().optional(),
  avatarFileId: z.string().min(1).max(128).optional(),
  email: z.string().email().optional(),
});

const emailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  nextPassword: z.string().min(8),
});

function mapProfile(
  row: UserProfileRow & { $id: string; $createdAt: string; $updatedAt: string }
): UserProfile {
  return {
    id: row.$id,
    userId: row.userId,
    role: row.role,
    assignedChapterId: row.assignedChapterId ?? undefined,
    name: row.name ?? undefined,
    age: row.age ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    avatarFileId: row.avatarFileId ?? undefined,
    email: row.email ?? undefined,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

async function getProfileRow(userId: string) {
  const rows = await listRows<UserProfileRow>(TABLE_ID, [
    buildEqualQuery("userId", userId),
  ]);
  return rows[0] ?? null;
}

export async function getMyProfile(): Promise<UserProfile> {
  const session = requireSession(await getSession());
  const existing = await getProfileRow(session.userId);
  if (existing) {
    return mapProfile(existing);
  }
  const created = await createRow<UserProfileRow>(
    TABLE_ID,
    {
      userId: session.userId,
      role: "member",
    },
    userReadPermissions(session.userId)
  );
  return mapProfile(created);
}

export async function updateProfile(input: {
  name?: string;
  age?: number;
  avatarUrl?: string;
  avatarFileId?: string;
  email?: string;
}): Promise<UserProfile> {
  const session = requireSession(await getSession());
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid profile update");
  }

  const existing = await getProfileRow(session.userId);
  if (!existing) {
    const created = await createRow<UserProfileRow>(
      TABLE_ID,
      {
        userId: session.userId,
        role: "member",
        ...parsed.data,
      },
      userReadPermissions(session.userId)
    );
    return mapProfile(created);
  }

  const updated = await updateRow<UserProfileRow>(
    TABLE_ID,
    existing.$id,
    parsed.data
  );
  return mapProfile(updated);
}

export async function updateAvatar(file: File): Promise<UserProfile> {
  const session = requireSession(await getSession());
  if (!file || file.size === 0) {
    throw new ValidationError("Avatar file is required");
  }

  const permissions = userReadWritePermissions(session.userId);
  const uploaded = await uploadFile(file, permissions);
  return updateProfile({ avatarFileId: uploaded.$id });
}

function requirePublicEnv(name: string, value?: string): string {
  if (!value) {
    throw new UnexpectedError(`${name} is not configured`);
  }
  return value;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function isJwt(value: string): boolean {
  return value.split(".").length === 3;
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
  return cookieStore.get("ysp_session")?.value ?? null;
}

async function buildAccountHeaders(): Promise<Record<string, string>> {
  const projectId = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  );
  const headersInit: Record<string, string> = {
    "X-Appwrite-Project": projectId,
    "Content-Type": "application/json",
  };
  const token = await getSessionToken();
  if (token) {
    headersInit[isJwt(token) ? "X-Appwrite-JWT" : "X-Appwrite-Session"] = token;
  } else {
    const cookieHeader = await getCookieHeader();
    if (!cookieHeader) {
      throw new UnauthorizedError("Authentication required");
    }
    headersInit.cookie = cookieHeader;
  }
  return headersInit;
}

function throwFromDomain(code: string, message: string): never {
  switch (code) {
    case "validation":
      throw new ValidationError(message);
    case "unauthorized":
      throw new UnauthorizedError(message);
    case "forbidden":
      throw new ForbiddenError(message);
    default:
      throw new UnexpectedError(message);
  }
}

export async function updateAccountEmail(input: {
  email: string;
  password: string;
}): Promise<void> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid email update");
  }
  const endpoint = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  );
  const headersInit = await buildAccountHeaders();
  const response = await fetch(`${normalizeEndpoint(endpoint)}/account/email`, {
    method: "PATCH",
    headers: headersInit,
    body: JSON.stringify({
      email: parsed.data.email,
      password: parsed.data.password,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const normalized = fromHttpStatus(response.status, payload?.message);
    throwFromDomain(normalized.code, normalized.message);
  }
}

export async function updateAccountPassword(input: {
  currentPassword: string;
  nextPassword: string;
}): Promise<void> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid password update");
  }
  const endpoint = requirePublicEnv(
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  );
  const headersInit = await buildAccountHeaders();
  const response = await fetch(`${normalizeEndpoint(endpoint)}/account/password`, {
    method: "PATCH",
    headers: headersInit,
    body: JSON.stringify({
      password: parsed.data.nextPassword,
      oldPassword: parsed.data.currentPassword,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const normalized = fromHttpStatus(response.status, payload?.message);
    throwFromDomain(normalized.code, normalized.message);
  }
}
