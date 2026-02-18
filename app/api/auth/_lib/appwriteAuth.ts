import { cookies } from "next/headers";

const SESSION_COOKIE = "ysp_session";

export function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

/**
 * Resolve the public-facing origin of this app for use in email links
 * (verification, password reset, etc).
 *
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL env var (most reliable — set once, works everywhere)
 *  2. x-forwarded-host + x-forwarded-proto headers (works behind reverse proxies)
 *  3. Fallback to request.url (only correct in dev)
 */
export function resolveAppOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (fwdHost) {
    return `${fwdProto}://${fwdHost}`;
  }

  const parsed = new URL(request.url);
  return parsed.origin;
}

function isJwt(value: string): boolean {
  return value.split(".").length === 3;
}

type AppwriteSessionPayload = {
  secret?: string;
  token?: string;
  expire?: string;
  session?: {
    secret?: string;
    token?: string;
    expire?: string;
  };
};

type AppwriteJwtPayload = {
  jwt?: string;
};

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export type ResolvedSessionToken = {
  token: string;
  expire?: string;
  source: "session_secret" | "session_token" | "jwt";
};

export function buildTokenHeaders(
  projectId: string,
  token: string,
  contentType?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Appwrite-Project": projectId,
    [isJwt(token) ? "X-Appwrite-JWT" : "X-Appwrite-Session"]: token,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

function readTokenFromSessionPayload(
  payload: AppwriteSessionPayload | null
): Omit<ResolvedSessionToken, "source"> | null {
  if (!payload) {
    return null;
  }

  const token =
    payload.secret ??
    payload.session?.secret ??
    payload.token ??
    payload.session?.token ??
    null;

  if (!token) {
    return null;
  }

  return {
    token,
    expire: payload.expire ?? payload.session?.expire,
  };
}

function extractCookiePair(value: string): string | null {
  const match = value.match(/^\s*([^=;,\s]+)=([^;]*)/);
  if (!match) {
    return null;
  }
  const [, name, cookieValue] = match;
  if (!name || !cookieValue) {
    return null;
  }
  return `${name}=${cookieValue}`;
}

function extractCookieHeader(response: Response): string | null {
  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values =
    typeof headersWithSetCookie.getSetCookie === "function"
      ? headersWithSetCookie.getSetCookie()
      : [];

  if (!values.length) {
    const single = response.headers.get("set-cookie");
    if (single) {
      values.push(single);
    }
  }

  const cookiePairs = values
    .map((value) => extractCookiePair(value))
    .filter((value): value is string => Boolean(value));

  if (!cookiePairs.length) {
    return null;
  }

  return cookiePairs.join("; ");
}

async function createJwtFromCookie(
  endpoint: string,
  projectId: string,
  cookieHeader: string
): Promise<ResolvedSessionToken | null> {
  const jwtResponse = await fetch(`${normalizeEndpoint(endpoint)}/account/jwt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!jwtResponse.ok) {
    return null;
  }

  const payload = (await jwtResponse.json().catch(() => null)) as AppwriteJwtPayload | null;
  if (typeof payload?.jwt !== "string" || payload.jwt.length === 0) {
    return null;
  }

  return {
    token: payload.jwt,
    source: "jwt",
  };
}

export function parseSessionExpiry(expire?: string): Date | undefined {
  if (!expire) {
    return undefined;
  }
  const parsed = new Date(expire);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

export async function resolveSessionToken(
  response: Response,
  endpoint: string,
  projectId: string
): Promise<ResolvedSessionToken | null> {
  const payload = (await response.json().catch(() => null)) as AppwriteSessionPayload | null;
  const sessionToken = readTokenFromSessionPayload(payload);
  if (sessionToken) {
    return {
      ...sessionToken,
      source: payload?.secret || payload?.session?.secret ? "session_secret" : "session_token",
    };
  }

  const cookieHeader = extractCookieHeader(response);
  if (!cookieHeader) {
    return null;
  }

  return createJwtFromCookie(endpoint, projectId, cookieHeader);
}

export async function buildSessionHeaders(
  projectId: string,
  contentType = "application/json"
): Promise<Record<string, string> | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return buildTokenHeaders(projectId, token, contentType);
}
