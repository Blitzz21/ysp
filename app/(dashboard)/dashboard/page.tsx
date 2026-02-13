import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function DashboardEntryPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }
  if (session.role === "chapter_head") {
    redirect("/chapter");
  }

  redirect("/dashboard/member");
}
