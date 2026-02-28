import { redirect } from "next/navigation";

export type SearchParams = Record<string, string | string[] | undefined>;

export type StatusType = "success" | "error";

/**
 * Safely read a single string value from a search-params bag.
 */
export function readParam(
  searchParams: SearchParams,
  key: string
): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Returns a `buildRedirect` function scoped to a specific base path.
 *
 * Usage:
 *   const buildRedirect = createRedirectBuilder("/admin/programs");
 *   buildRedirect("success", "Program created.");
 */
export function createRedirectBuilder(basePath: string) {
  return function buildRedirect(
    status: StatusType,
    message: string
  ): never {
    const encoded = encodeURIComponent(message);
    redirect(`${basePath}?status=${status}&message=${encoded}`);
  };
}
