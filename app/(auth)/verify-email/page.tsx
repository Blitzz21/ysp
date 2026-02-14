import { Suspense } from "react";

import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="auth-frame" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
