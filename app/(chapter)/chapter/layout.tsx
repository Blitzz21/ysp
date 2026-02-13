import type { ReactNode } from "react";

export default function ChapterLayout({ children }: { children: ReactNode }) {
  // TODO: add chapter auth guard + shell
  return <section>{children}</section>;
}
