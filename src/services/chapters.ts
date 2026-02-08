import type { Chapter } from "./types";

export async function listChapters(): Promise<Chapter[]> {
  throw new Error("Not implemented");
}

export async function createChapter(input: {
  name: string;
  slug?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  chapterHeadUserId?: string;
}): Promise<Chapter> {
  throw new Error("Not implemented");
}

export async function updateChapter(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    location: string;
    contactEmail: string;
    contactPhone: string;
    facebookUrl: string;
    chapterHeadUserId: string | null;
  }>
): Promise<Chapter> {
  throw new Error("Not implemented");
}

export async function getMyChapter(): Promise<Chapter> {
  throw new Error("Not implemented");
}

export async function updateMyChapterContact(input: {
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
}): Promise<Chapter> {
  throw new Error("Not implemented");
}
