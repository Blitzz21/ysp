import { NextResponse } from "next/server";

import { getSession } from "@/services/auth";
import { getAppwriteConfig } from "@/services/appwriteClient";
import { getMyProfile } from "@/services/profiles";

export const dynamic = "force-dynamic";

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await getMyProfile();
  if (!profile.avatarFileId) {
    return NextResponse.json({ error: "Avatar not set" }, { status: 404 });
  }

  const config = getAppwriteConfig();
  const url = `${normalizeEndpoint(config.endpoint)}/storage/buckets/${config.bucketId}/files/${profile.avatarFileId}/view`;

  const response = await fetch(url, {
    headers: {
      "X-Appwrite-Project": config.projectId,
      "X-Appwrite-Key": config.apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "Avatar unavailable" }, { status: 404 });
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
