import { cookies } from "next/headers";

const SESSION_COOKIE = "ysp_session";

export function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function isJwt(value: string): boolean {
  return value.split(".").length === 3;
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function buildSessionHeaders(
  projectId: string,
  contentType = "application/json"
): Promise<Record<string, string> | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return {
    "Content-Type": contentType,
    "X-Appwrite-Project": projectId,
    [isJwt(token) ? "X-Appwrite-JWT" : "X-Appwrite-Session"]: token,
  };
}
