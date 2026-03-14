import { type NextRequest, NextResponse } from "next/server";

import { getAppwriteConfig } from "@/services/appwriteClient";
import { getSession } from "@/services/auth";
import { requireAdmin } from "@/services/rbac";

/**
 * Server-side image proxy for Appwrite storage files.
 * Requires an active admin session — never exposes the API key to the client.
 *
 * Usage: /api/file/<fileId>?w=400
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  // Auth gate — only admins can fetch arbitrary files through this proxy
  try {
    const session = await getSession();
    requireAdmin(session);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  const config = getAppwriteConfig();

  const upstreamUrl =
    `${config.endpoint.replace(/\/$/, "")}/storage/buckets/${config.bucketId}/files/${fileId}/view`;

  const upstream = await fetch(upstreamUrl, {
    headers: {
      "X-Appwrite-Project": config.projectId,
      "X-Appwrite-Key": config.apiKey,
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/webp";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Cache in browser for 5 min, CDN for 1 hour
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
