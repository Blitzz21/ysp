import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";

export default async function ChapterLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/chapter");
  }
  if (session.emailVerified === false) {
    redirect("/verify-email?next=/chapter");
  }

  const isAdmin = session.role === "admin";
  const isChapterHead = session.role === "chapter_head";

  if (!isAdmin && !isChapterHead) {
    redirect("/dashboard/member?status=error&message=Chapter%20access%20required");
  }

  if (!session.assignedChapterId) {
    return (
      <section className="mx-auto w-[92%] max-w-5xl py-12">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Chapter assignment required</p>
          <p className="mt-2">
            This dashboard needs an assigned chapter to load data. Update your
            profile assignment before continuing.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/member"
              className="rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-800"
            >
              Back to member dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-800"
              >
                Go to admin console
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return <section>{children}</section>;
}
