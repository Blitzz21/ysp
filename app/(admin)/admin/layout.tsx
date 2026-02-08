"use client";

import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // TODO: add admin auth guard + shell
  return <section>{children}</section>;
}
