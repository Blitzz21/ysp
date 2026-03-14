/**
 * Shared Appwrite storage URL builder.
 * Safe to import from both client ("use client") and server components.
 *
 * Uses the `/view` endpoint with `mode=any`, which serves the original file
 * for any file that has `read("any")` permissions (i.e. published content).
 */
export function getFileViewUrl(fileId: string): string {
  const endpoint = (
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? ""
  ).replace(/\/$/, "");
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "";
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&mode=any`;
}
