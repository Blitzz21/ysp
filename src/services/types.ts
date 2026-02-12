export type Role = "admin" | "chapter_head" | null;

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageFileId?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  name: string;
  slug: string;
  location?: string;
  chapterHeadUserId?: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  published?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  eventDate: string;
  chapterId: string;
  description: string;
  sdgs: string[];
  signupContactName?: string;
  signupContactEmail?: string;
  signupContactPhone?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  email?: string;
  facebookUrl?: string;
  mobile?: string;
  membershipFormUrl?: string;
  createChapterFormUrl?: string;
}

export interface SiteStats {
  projectsCount: number;
  chaptersCount: number;
  membersCount: number;
  livesImpactedCount: number;
}
