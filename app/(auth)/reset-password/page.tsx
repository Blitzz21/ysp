import { Suspense } from "react";

import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-frame" />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
