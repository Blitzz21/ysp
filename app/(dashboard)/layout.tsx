import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession, signOut } from "@/services/auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }
  if (session.emailVerified === false) {
    redirect("/verify-email?next=/dashboard");
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
  const navItems: DashboardNavItem[] = [
    { href: "/dashboard/member", label: "Overview", icon: "member", exact: true },
    { href: "/dashboard/member/chapters", label: "Chapters", icon: "chapter" },
    { href: "/dashboard/member/opportunities", label: "Opportunities", icon: "opportunities" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  if (isChapterHead || isAdmin) {
    navItems.push({
      href: "/dashboard/chapter-head",
      label: "Chapter head dashboard",
      icon: "chapter",
    });
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
