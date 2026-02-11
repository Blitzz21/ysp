import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession, signOut } from "@/services/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?next=/admin");
  }

  async function signOutAction() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return <AdminShell signOutAction={signOutAction}>{children}</AdminShell>;
}
