import { cookies } from "next/headers";

const SESSION_COOKIE = "ysp_session";

export function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function isJwt(value: string): boolean {
  return value.split(".").length === 3;
}

type AppwriteSessionPayload = {
  $id?: string;
  secret?: string;
  sessionId?: string;
  token?: string;
  session?: {
    $id?: string;
    secret?: string;
    sessionId?: string;
    token?: string;
  };
};

type AppwriteJwtPayload = {
  jwt?: string;
};

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

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

function readTokenFromSessionPayload(payload: AppwriteSessionPayload | null): string | null {
  if (!payload) {
    return null;
  }

  return (
    payload.secret ??
    payload.$id ??
    payload.sessionId ??
    payload.token ??
    payload.session?.secret ??
    payload.session?.$id ??
    payload.session?.sessionId ??
    payload.session?.token ??
    null
  );
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
): Promise<string | null> {
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
  return typeof payload?.jwt === "string" && payload.jwt.length > 0 ? payload.jwt : null;
}

export async function resolveSessionToken(
  response: Response,
  endpoint: string,
  projectId: string
): Promise<string | null> {
  const payload = (await response.json().catch(() => null)) as AppwriteSessionPayload | null;
  const tokenFromBody = readTokenFromSessionPayload(payload);
  if (tokenFromBody) {
    return tokenFromBody;
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
