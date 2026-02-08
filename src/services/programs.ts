import type { Program } from "./types";

export async function listPublishedPrograms(): Promise<Program[]> {
  throw new Error("Not implemented");
}

export async function getProgramBySlug(slug: string): Promise<Program> {
  throw new Error("Not implemented");
}

export async function adminListPrograms(params?: { includeDrafts?: boolean }): Promise<Program[]> {
  throw new Error("Not implemented");
}

export async function createProgram(input: {
  title: string;
  slug?: string;
  description: string;
  published?: boolean;
  imageFile?: File;
}): Promise<Program> {
  throw new Error("Not implemented");
}

export async function updateProgram(
  id: string,
  input: Partial<{ title: string; slug: string; description: string; published: boolean; imageFile: File | null }>
): Promise<Program> {
  throw new Error("Not implemented");
}

export async function deleteProgram(id: string): Promise<void> {
  throw new Error("Not implemented");
}
