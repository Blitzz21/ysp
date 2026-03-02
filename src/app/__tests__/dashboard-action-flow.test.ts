import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(__dirname, "../../..");

/** Actions that return { ok, message } with try/catch error handling. */
const TOAST_ACTION_CASES: Array<{ file: string; actionName: string }> = [
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updateProfileAction" },
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updateEmailAction" },
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updatePasswordAction" },
  { file: "app/(dashboard)/dashboard/member/chapters/page.tsx", actionName: "joinChapterAction" },
  { file: "app/(dashboard)/dashboard/member/chapters/page.tsx", actionName: "leaveChapterAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/members/page.tsx", actionName: "createRoleAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/members/page.tsx", actionName: "updateRoleAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/members/page.tsx", actionName: "assignOfficerAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/members/page.tsx", actionName: "removeOfficerAction" },
  { file: "app/(dashboard)/dashboard/chapter-head/members/page.tsx", actionName: "removeMemberAction" },
];

/** Actions that are void but still wrap work in try/catch. */
const VOID_ACTION_CASES: Array<{ file: string; actionName: string }> = [
  { file: "app/(dashboard)/settings/page.tsx", actionName: "updateAvatarAction" },
];

function readSource(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), "utf8");
}

describe("dashboard action error handling", () => {
  it.each(TOAST_ACTION_CASES)(
    "$actionName in $file returns ok:false in catch and ok:true on success",
    ({ file, actionName }) => {
      const source = readSource(file);
      const safeFlowRegex = new RegExp(
        `async function ${actionName}[\\s\\S]*?try\\s*\\{[\\s\\S]*?ok:\\s*true[\\s\\S]*?\\}\\s*catch[\\s\\S]*?\\{[\\s\\S]*?ok:\\s*false`,
        "m"
      );

      expect(source).toMatch(safeFlowRegex);
    }
  );

  it.each(VOID_ACTION_CASES)(
    "$actionName in $file wraps work in try/catch",
    ({ file, actionName }) => {
      const source = readSource(file);
      const tryCatchRegex = new RegExp(
        `async function ${actionName}[\\s\\S]*?try\\s*\\{[\\s\\S]*?\\}\\s*catch`,
        "m"
      );

      expect(source).toMatch(tryCatchRegex);
    }
  );
});
