import type { VolunteerOpportunity } from "./types";

export async function listPublishedOpportunities(params?: {
  chapterId?: string;
  fromDate?: Date;
  toDate?: Date;
  sdg?: string;
}): Promise<VolunteerOpportunity[]> {
  throw new Error("Not implemented");
}

export async function adminListOpportunities(params?: {
  chapterId?: string;
  includeDrafts?: boolean;
}): Promise<VolunteerOpportunity[]> {
  throw new Error("Not implemented");
}

export async function createOpportunity(input: {
  title: string;
  eventDate: Date;
  chapterId: string;
  description: string;
  sdgs: string[];
  signupContactName?: string;
  signupContactEmail?: string;
  signupContactPhone?: string;
  published?: boolean;
}): Promise<VolunteerOpportunity> {
  throw new Error("Not implemented");
}

export async function createMyChapterOpportunity(input: Omit<
  Parameters<typeof createOpportunity>[0],
  "chapterId"
>): Promise<VolunteerOpportunity> {
  throw new Error("Not implemented");
}

export async function updateOpportunity(
  id: string,
  input: Partial<Parameters<typeof createOpportunity>[0]>
): Promise<VolunteerOpportunity> {
  throw new Error("Not implemented");
}

export async function deleteOpportunity(id: string): Promise<void> {
  throw new Error("Not implemented");
}
