import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(__dirname, "../../..");

const ACTION_CASES: Array<{ file: string; actionName: string }> = [
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updateProfileAction" },
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updateAvatarAction" },
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updateEmailAction" },
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updatePasswordAction" },
  { file: "app/(dashboard)/dashboard/member/chapters/page.tsx", actionName: "joinChapterAction" },
  { file: "app/(dashboard)/dashboard/member/chapters/page.tsx", actionName: "leaveChapterAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/page.tsx", actionName: "createRoleAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/page.tsx", actionName: "updateRoleAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/page.tsx", actionName: "assignOfficerAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/page.tsx", actionName: "removeOfficerAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/page.tsx", actionName: "removeMemberAction" },
];

function readSource(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), "utf8");
}

describe("dashboard action redirect flow", () => {
  it.each(ACTION_CASES)(
    "$actionName in $file redirects error in catch and success after catch",
    ({ file, actionName }) => {
      const source = readSource(file);
      const safeFlowRegex = new RegExp(
        `async function ${actionName}[\\s\\S]*?try\\s*\\{[\\s\\S]*?\\}\\s*catch\\s*\\(error\\)\\s*\\{[\\s\\S]*?buildRedirect\\("error",[\\s\\S]*?\\}[\\s\\S]*?buildRedirect\\("success",`,
        "m"
      );

      expect(source).toMatch(safeFlowRegex);
    }
  );
});
