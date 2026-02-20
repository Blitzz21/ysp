export type Role = "admin" | "chapter_head" | "officer" | "member" | null;

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
  capacity: number;
  currentVolunteers: number;
  imageFileId?: string;
  waitlistEnabled: boolean;
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


export type MembershipStatus = "active" | "pending" | "removed";
export type MembershipRole = "member" | "officer" | "chapter_head";

export interface ChapterMembership {
  id: string;
  userId: string;
  chapterId: string;
  role: MembershipRole;
  officerRoleId?: string;
  status: MembershipStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterOfficerRole {
  id: string;
  roleId: string;
  chapterId: string;
  label: string;
  permissions: string;
  createdAt: string;
  updatedAt: string;
}

export type OpportunitySignupStatus = "joined" | "cancelled" | "waitlisted";

export interface OpportunitySignup {
  id: string;
  userId: string;
  opportunityId: string;
  status: OpportunitySignupStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type Sector = "Youth" | "PWD" | "Farmers" | "Indigenous People" | "TODA" | "Others";

export interface UserProfile {
  id: string;
  userId: string;
  role: Role;
  assignedChapterId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  avatarFileId?: string;
  email?: string;
  phone?: string;
  bio?: string;
  gender?: Gender;
  birthdate?: string;
  facebookUrl?: string;
  registeredVoter?: boolean;
  householdSize?: number;
  householdVoters?: number;
  sector?: Sector;
  sectorOther?: string;
  newsletterSubscribed?: boolean;
  privacyConsent?: boolean;
  createdAt: string;
  updatedAt: string;
}

