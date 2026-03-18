import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession, signOut } from "@/services/auth";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/DashboardShell";

const adminNavItems: DashboardNavItem[] = [
  { href: "/admin", label: "Overview", icon: "overview", exact: true },
  { href: "/admin/programs", label: "Programs", icon: "programs" },
  { href: "/admin/chapters", label: "Chapters", icon: "chapter" },
  { href: "/admin/opportunities", label: "Opportunities", icon: "opportunities" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/logs", label: "Activity Log", icon: "logs" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/admin");
  }
  if (session.emailVerified === false) {
    redirect("/verify-email?next=/admin");
  }
  if (session.role !== "admin") {
    redirect("/login?next=/admin");
  }

  async function signOutAction() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return (
    <DashboardShell
      productLabel="Admin Console"
      title="YSP Admin"
      
      navItems={adminNavItems}
      signOutAction={signOutAction}
    >
      {children}
    </DashboardShell>
  );
}

