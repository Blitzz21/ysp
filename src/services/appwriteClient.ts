import "server-only";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
} from "./errors";

export type AppwriteRow<T> = T & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

type AppwriteListResponse<T> = {
  total: number;
  rows: T[];
};

type AppwriteConfig = {
  endpoint: string;
  projectId: string;
  apiKey: string;
  databaseId: string;
  bucketId: string;
  adminTeamId: string;
};

const DEFAULT_ADMIN_TEAM_ID = "6988c6360007b573db93";

function requireEnv(name: string, value?: string): string {
  if (!value) {
    throw new UnexpectedError(`${name} is not configured`);
  }
  return value;
}

export function getAppwriteConfig(): AppwriteConfig {
  const endpoint =
    process.env.APPWRITE_ENDPOINT ?? process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId =
    process.env.APPWRITE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const bucketId = process.env.APPWRITE_BUCKET_ID;
  const adminTeamId =
    process.env.APPWRITE_ADMIN_TEAM_ID ?? DEFAULT_ADMIN_TEAM_ID;

  return {
    endpoint: requireEnv("APPWRITE_ENDPOINT", endpoint),
    projectId: requireEnv("APPWRITE_PROJECT_ID", projectId),
    apiKey: requireEnv("APPWRITE_API_KEY", apiKey),
    databaseId: requireEnv("APPWRITE_DATABASE_ID", databaseId),
    bucketId: requireEnv("APPWRITE_BUCKET_ID", bucketId),
    adminTeamId,
  };
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function buildQueryString(queries?: string[], options?: { limit?: number; offset?: number }) {
  const params: string[] = [];
  if (queries?.length) {
    for (const query of queries) {
      params.push(`queries[]=${encodeURIComponent(query)}`);
    }
  }
  if (options?.limit !== undefined) {
    params.push(`limit=${options.limit}`);
  }
  if (options?.offset !== undefined) {
    params.push(`offset=${options.offset}`);
  }
  return params.length ? `?${params.join("&")}` : "";
}

function mapAppwriteError(status: number, message: string): Error {
  switch (status) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 409:
      return new ConflictError(message);
    case 429:
      return new RateLimitError(message);
    default:
      return new UnexpectedError(message);
  }
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function appwriteRequest<T>(
  path: string,
  options: { method?: string; body?: BodyInit; headers?: Record<string, string> } = {}
): Promise<T> {
  const config = getAppwriteConfig();
  const url = `${normalizeEndpoint(config.endpoint)}${path}`;
  const headers: Record<string, string> = {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-Key": config.apiKey,
    ...options.headers,
  };

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
  });

  const data = await parseJson<T & { message?: string }>(response);
  if (!response.ok) {
    const message = data?.message ?? "Appwrite request failed";
    throw mapAppwriteError(response.status, message);
  }
  return data as T;
}

export function adminOnlyPermissions(adminTeamId?: string): string[] {
  const config = getAppwriteConfig();
  const teamId = adminTeamId ?? config.adminTeamId;
  return [
    `read("team:${teamId}")`,
    `update("team:${teamId}")`,
    `delete("team:${teamId}")`,
  ];
}

export function publicReadPermissions(adminTeamId?: string): string[] {
  return [`read("any")`, ...adminOnlyPermissions(adminTeamId)];
}

export function userReadPermissions(userId: string, adminTeamId?: string): string[] {
  return [`read("user:${userId}")`, ...adminOnlyPermissions(adminTeamId)];
}

export function userReadWritePermissions(userId: string, adminTeamId?: string): string[] {
  return [
    `read("user:${userId}")`,
    `update("user:${userId}")`,
    `delete("user:${userId}")`,
    ...adminOnlyPermissions(adminTeamId),
  ];
}

export function addReadPermissions(permissions: string[], reads: string[]): string[] {
  const merged = new Set(permissions);
  for (const read of reads) {
    merged.add(read);
  }
  return Array.from(merged);
}

export async function listRows<T>(
  tableId: string,
  queries?: string[],
  options?: { limit?: number; offset?: number }
): Promise<AppwriteRow<T>[]> {
  const config = getAppwriteConfig();
  const queryString = buildQueryString(queries, options);
  const data = await appwriteRequest<AppwriteListResponse<AppwriteRow<T>>>(
    `/tablesdb/${config.databaseId}/tables/${tableId}/rows${queryString}`
  );
  return data.rows;
}

export async function getRow<T>(tableId: string, rowId: string): Promise<AppwriteRow<T>> {
  const config = getAppwriteConfig();
  return appwriteRequest<AppwriteRow<T>>(
    `/tablesdb/${config.databaseId}/tables/${tableId}/rows/${rowId}`
  );
}

export async function createRow<T>(
  tableId: string,
  data: Record<string, unknown>,
  permissions?: string[],
  rowId?: string
): Promise<AppwriteRow<T>> {
  const config = getAppwriteConfig();
  // Appwrite Tables variants differ on accepted row id field names.
  // Send both camelCase and snake_case with an explicit generated id.
  const resolvedRowId =
    rowId ??
    (globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 32) ??
      `${Date.now()}${Math.random().toString(36).slice(2, 10)}`);
  return appwriteRequest<AppwriteRow<T>>(
    `/tablesdb/${config.databaseId}/tables/${tableId}/rows`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rowId: resolvedRowId,
        row_id: resolvedRowId,
        data,
        permissions,
      }),
    }
  );
}

export async function updateRow<T>(
  tableId: string,
  rowId: string,
  data: Record<string, unknown>,
  permissions?: string[]
): Promise<AppwriteRow<T>> {
  const config = getAppwriteConfig();
  const payload: Record<string, unknown> = { data };
  if (permissions) {
    payload.permissions = permissions;
  }
  return appwriteRequest<AppwriteRow<T>>(
    `/tablesdb/${config.databaseId}/tables/${tableId}/rows/${rowId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteRow(tableId: string, rowId: string): Promise<void> {
  const config = getAppwriteConfig();
  await appwriteRequest(
    `/tablesdb/${config.databaseId}/tables/${tableId}/rows/${rowId}`,
    { method: "DELETE" }
  );
}

export async function uploadFile(
  file: File,
  permissions?: string[]
): Promise<{ $id: string }>
{
  const config = getAppwriteConfig();
  const form = new FormData();
  form.append("fileId", "unique()");
  form.append("file", file);
  if (permissions?.length) {
    for (const permission of permissions) {
      form.append("permissions[]", permission);
    }
  }

  return appwriteRequest<{ $id: string }>(
    `/storage/buckets/${config.bucketId}/files`,
    {
      method: "POST",
      body: form,
    }
  );
}

export function buildEqualQuery(field: string, value: string | boolean): string {
  return JSON.stringify({
    method: "equal",
    attribute: field,
    values: [value],
  });
}

export function buildSearchQuery(field: string, value: string): string {
  return JSON.stringify({
    method: "search",
    attribute: field,
    values: [value],
  });
}

export function buildGreaterThanEqualQuery(field: string, value: string): string {
  return JSON.stringify({
    method: "greaterThanEqual",
    attribute: field,
    values: [value],
  });
}

export function buildLessThanEqualQuery(field: string, value: string): string {
  return JSON.stringify({
    method: "lessThanEqual",
    attribute: field,
    values: [value],
  });
}

export function buildOrderDesc(field: string): string {
  return JSON.stringify({
    method: "orderDesc",
    attribute: field,
  });
}

export function buildOrderAsc(field: string): string {
  return JSON.stringify({
    method: "orderAsc",
    attribute: field,
  });
}
