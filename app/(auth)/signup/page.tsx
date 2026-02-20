import { Suspense } from "react";

import { listPublicChapters } from "@/services/chapters";

import SignupClient from "./SignupClient";

export default async function SignupPage() {
  let chapters: { id: string; name: string }[] = [];
  try {
    const all = await listPublicChapters();
    chapters = all.map((c) => ({ id: c.id, name: c.name }));
  } catch {
    // Proceed with empty chapters — user will see a disabled select
  }

  return (
    <Suspense fallback={<div className="auth-frame" />}>
      <SignupClient chapters={chapters} />
    </Suspense>
  );
}
