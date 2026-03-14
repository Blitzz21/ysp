import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession, signOut } from "@/services/auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import { getProfileByUserId, isProfileComplete } from "@/services/profiles";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }
  if (session.emailVerified === false) {
    redirect("/verify-email?next=/dashboard");
  }

  // Redirect to onboarding if profile is incomplete (e.g. Google OAuth users).
  // Skip when running E2E tests — the synthetic "e2e-admin" user has no Appwrite profile.
  if (process.env.E2E_ADMIN_BYPASS !== "1") {
    const profile = await getProfileByUserId(session.userId);
    if (!isProfileComplete(profile)) {
      redirect("/onboarding");
    }
  }

  async function signOutAction() {
    "use server";
    await signOut();
    redirect("/login");
  }

  const roleLabel =
    session.role === "admin"
      ? "Admin"
      : session.role === "chapter_head"
        ? "Chapter Head"
        : session.role === "officer"
          ? "Officer"
          : "Member";
  const isAdmin = session.role === "admin";
  const isChapterHead = session.role === "chapter_head";

  let navItems: DashboardNavItem[];

  if (isChapterHead) {
    navItems = [
      { href: "/dashboard/chapter-head", label: "Overview", icon: "overview", exact: true },
      {
        href: "/dashboard/chapter-head/manage",
        label: "Manage",
        icon: "manage",
        children: [
          { href: "/dashboard/chapter-head/opportunities", label: "Opportunities", icon: "opportunities" },
          { href: "/dashboard/chapter-head/members", label: "Members", icon: "member" },
        ],
      },
      { href: "/dashboard/chapter-head/settings", label: "Chapter Settings", icon: "settings" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ];
  } else {
    navItems = [
      { href: "/dashboard/member", label: "Overview", icon: "member", exact: true },
      { href: "/dashboard/member/chapters", label: "Chapters", icon: "chapter" },
      { href: "/dashboard/member/opportunities", label: "Opportunities", icon: "opportunities" },
      { href: "/dashboard/member/my-opportunities", label: "My Opportunities", icon: "programs" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ];
  }

  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Admin console", icon: "admin" });
  }

  return (
    <DashboardShell
      productLabel="Dashboard"
      title={`YSP ${roleLabel}`}

      navItems={navItems}
      signOutAction={signOutAction}
    >
      {children}
    </DashboardShell>
  );
}
