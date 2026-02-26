# Claude Agent Guidelines & Project Context

Welcome to the Youth Service Philippines (YSP) project! This document outlines how AI coding agents (Claude, cursor, etc.) should operate within this codebase, providing structural context, guidelines, and rules to ensure clean, consistent, and maintainable software delivery.

---

## 1. Project Context
**Project Name:** Youth Service Philippines (YSP) Website + Admin & Chapter Head Portal
**Mission:** A modern web app to present YSP programs, publish volunteer opportunities with SDGs impacted, and provide role-based access for Admins and Chapter Heads to manage content dynamically.
**Core Technologies:** Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, Zustand, Appwrite (Auth, Database, Storage, Functions).
**Key Entities:** Programs, Chapters, Volunteer Opportunities, Site Stats, Site Settings.

---

## 2. When to Use Agents
Engage specific agent personas via slash commands (e.g. `/senior-software-engineer`) or provide prompt contexts based on the task:
- **Feature Implementation & Refactoring:** Use `/senior-software-engineer` or general coding agents to build new features, integrate APIs, or perform structural refactoring.
- **Frontend Architecture & Styling:** Use `/frontend-architect` to implement complex UI components, ensuring state, styling (Tailwind/shadcn), and accessibility comply with our standard.
- **Testing & QA:** Use `/qa-test-engineer` to draft, fix, or expand Playwright E2E tests, Vitest unit tests, and integration coverage.
- **Infrastructure & Deployments:** Use `/devops-release-engineer` for modifying CI/CD pipelines, package management, or deployment scripts.

---

## 3. How to Use Agents
### Expected Prompting Pattern
1. **Persona Activation:** Start prompts with a specific role if needed (e.g. `/frontend-architect`).
2. **Clear Intent & Acceptance Criteria:** Clearly state what needs to change and provide constraints (e.g. "Create a responsive Landing form using shadcn/ui. Must use react-hook-form and zod for validation.").
3. **Artifact Generation:** For high-impact or complex tasks, ask the agent to first write an `implementation_plan.md` outlining expected changes before modifying the codebase.
4. **Scope Constraint:** Keep the agent focused on one micro-feature at a time rather than huge multi-file changes to prevent cascading errors.

---

## 4. Files Used for Reference
Agents must orient themselves using the project's documentation before making architectural decisions or modifying API contracts:
- `docs/YSP_PRD.md`: Primary reference for functional requirements and user stories.
- `docs/SYSTEM_ARCHITECTURE.md`: High-level system design and Appwrite configuration rules.
- `docs/YSP_API_Contracts.md`: Interfaces definitions separating the client from backend logic.
- `docs/YSP_Architecture_Folder_Structure.md`: Rules on how features, components, and pages should be organized.
- `docs/YSP_TDD.md`: Guidelines for testing strategies (unit, integration, E2E).
- `.agent/workflows/*.md`: Specific pre-defined operational workflows for the project.

---

## 5. Documentation Rules
- **Markdown standard:** Ensure all architectural or API-based decisions are documented in the `docs/` folder using standard Markdown.
- **Up-to-Date Contracts:** If a database schema or API interface changes, the agent must update `docs/YSP_API_Contracts.md` and related documents immediately.
- **Component Docs:** Use JSDoc for complex utility functions and React components, clearly labeling properties and expected inputs/outputs.
- **Environment Variables & Secrets:** Document any new environment configurations inside the `.env.example` file and the `README.md`. NEVER commit real API keys or secrets to code. If a new environment variable is required, add a placeholder to `.env.example` and explicitly ask the user to add the real value to their local `.env.local` file.

---

## 6. Codebase Change Rules
### 6.1 Frontend (Next.js & React)
- **App Router Conventions:** Favor Server Components. Add `"use client"` **only** at the top of files that require interactivity (hooks, state, DOM access).
- **Styling & Components:** Use TailwindCSS utility classes. Do not write custom CSS unless strictly required. Favor `shadcn/ui` preset components for common patterns. When adding a new `shadcn/ui` component, always attempt to run `npx shadcn-ui@latest add [component]` via the terminal rather than writing the component manually, to ensure it receives all standard accessibility and animation presets.
- **State Management:** Keep state local whenever possible. Use Zustand for application-wide global state. Avoid the Context API except for dependency injection.
- **Routing:** Do not use legacy Next.js `pages/` routing paradigms. Stick to the App Router (`app/` directory).

### 6.2 Backend (Appwrite)
- **Security First:** Enforce Role-Based Access Control (RBAC) securely on the Appwrite Server level. Client-side route guards are for UX, not security.
- **Service Layering:** Do not perform direct database calls inside React components. Extrapolate all Appwrite data fetching and mutations into a dedicated service layer/hooks (e.g. `src/services/` or `src/lib/appwrite.ts`).
- **Validation:** Always validate and sanitize user input before passing it to Appwrite, using libraries like `zod`.
- **Appwrite Configuration & MCP:** To configure anything regarding Appwrite (collections, attributes, indexes, permissions), engage the `/backend-appwrite-engineer` workflow. The agent MUST use the Appwrite MCP server tools to interact directly with the database schema and structure context. Before modifying backend functions or queries, review the true schema via the MCP rather than guessing or assuming.

### 6.3 Maintenance & Best Practices
- **No Console Logs:** Remove all debug `console.log` statements before finalizing a feature.
- **Type Safety:** Ensure strict TypeScript typing. Avoid `any` types; prefer `unknown` if a type cannot be strictly inferred, then narrow the type.

---

## 7. UX, Design & Accessibility
### 7.1 Error Handling & User Feedback
- **Backend Errors:** Parse Appwrite exceptions gracefully. Do not show raw stack traces to the user.
- **User Feedback:** Utilize toast components (`sonner` or `shadcn/ui` toast) to display form submissions, success states, and errors.
- **Loading States:** Provide skeleton loaders or spinner/disabled states for all asynchronous data fetching and form submissions to ensure a responsive feel.

### 7.2 Accessibility (a11y) & SEO
- **Semantic HTML:** Enforce native tags (`<button>`, `<dialog>`) instead of slapping `onClick` on a `<div>`.
- **Screen Readers:** Require `aria-label` or `sr-only` utility classes for icon-only buttons or ambiguous action links.
- **Metadata:** Ensure all new `app/*/page.tsx` routes properly construct standard Next.js metadata and dynamic OpenGraph tags where appropriate.

### 7.3 UI Design System
- **Token Usage:** Always use CSS variables/Tailwind config colors (e.g., `bg-primary`, `text-muted-foreground`) rather than hardcoding hex codes. This ensures dark mode compatibility.
- **Brand Rules:** Ensure visual elements align with the YSP "touch of orange" theme and respect consistent corner rounding (e.g. `rounded-md`, `rounded-full`).

---

## 8. Package Management & Dependencies
- **Strict Additions:** Do not arbitrarily install new libraries (e.g., `moment` over standard native `Date`, or `framer-motion` if a simple CSS transition suffices) without explicitly asking for permission first.
- **Package Manager:** Exclusively use the project's chosen package manager (e.g. `npm` or `pnpm` as indicated by the lockfile) when installing new dependencies.
- **Dependency Resolution:** If encountering dependency resolution errors during installation (like React 19 typings conflicts), examine `package.json` for version mismatches and attempt to resolve them logically rather than blindly using `--force` or `--legacy-peer-deps` without explanation.

---

## 9. Testing & CI
### 9.1 Locators for E2E Tests
- **Data-TestIDs:** When constructing interactive components that will be heavily tested via Playwright, always include `data-testid="..."` properties to prevent brittle selectors.
- **Scope:** Ensure every new UI component interacting with state or the backend is reasonably covered by Vitest prior to integration.

### 9.2 Component, Visual, & P0 E2E Testing
- **Component Tests:** Exhaustive edge cases, UI interactions, and component-level states MUST be rigorously tested via Vitest and React Testing Library. Do not skip component tests.
- **Visual Tests:** Use Playwright's `expect(page).toHaveScreenshot()` on core public pages (like the Homepage) and critical forms to catch unintended stylistic changes.
- **Targeted E2E:** Focus Playwright completely on Priority 0 (P0) critical user journeys (e.g. Admin signing in, creating a program, and verifying it renders publicly) instead of replacing component tests with brittle E2E scripts.

### 9.3 Integration Tests
- **Service Integration:** Ensure backend service functions (e.g., Appwrite database calls) are tested against realistic state rather than being purely mocked. 
- **Setup/Teardown:** Properly implement database seed and teardown routines to ensure tests are isolated and repeatable.

### 9.3 Performance Testing (k6)
- **Load Profiles:** When creating or modifying critical endpoints or server components, generate `k6` load testing scripts (e.g., `tests/performance/*.js`) to verify throughput and response times.
- **Thresholds:** Ensure performance scripts include strict assertions and thresholds (e.g., 95% of requests complete under 200ms) to automatically catch performance regressions.

---

## 10. Plans and Tasks Rules
For complex objectives, agents must follow a structured approach:
1. **Planning:** Create an `implementation_plan.md` referencing affected files.
2. **Tasking:** Break down the plan into a checklist (`task.md`).
3. **Execution Mode:** Mark off tasks in `task.md` as they are successfully completed.
4. **Verification Mode:** Perform tests (TypeScript compilation, linting, tests via Vitest/Playwright).
5. **Walkthrough & Proof of Work:** Create a `walkthrough.md` mapping out the changes, what was fixed/added, and the testing methodologies used. The `walkthrough.md` MUST contain the exact terminal output showing passing Vitest or Playwright test suites to prove the implementation works locally. Provide screenshots if UI changes were made.

---

## 11. Code Reviews and Version Control
### 11.1 Senior Software Engineer Oversight
- **Workflow Activation:** Before finalizing any major feature merge or deployment, engage the `/senior-software-engineer` workflow to review the implementation against `SYSTEM_ARCHITECTURE.md` and `YSP_PRD.md`.
- **Code Reviews:** The Senior Software Engineer MUST conduct a thorough architectural code review of all changes. They are responsible for catching structural regressions, testing gaps, and security flaws (like Appwrite RBAC violations) before any code is checked into the main branch.

### 11.2 Commits & Pushes 
- **Atomic Commits:** Rather than one massive commit, agents must handle staging and committing logically grouped changes (e.g. `feat(auth): login forms` then `test(auth): e2e playwright`).
- **Pushing Code:** Following a successful review from the `/senior-software-engineer` and passing all local tests (Vitest compilation, UI checks), the agent is instructed to push changes to the remote branch automatically.

### 11.3 Agent Orchestration
- **Feature Coordination:** When resolving a complex ticket or building a full feature, the `/senior-software-engineer` must act as the primary orchestrator.
- **Handoffs:** The orchestrator should divide the work into specialized phases and advise the user to engage different personas (e.g., first invoking `/backend-appwrite-engineer` to define the database schema, followed by `/frontend-architect` to build the UI components, and finally `/qa-test-engineer` for test coverage).
- **Consolidation:** The `/senior-software-engineer` must consolidate the outputs from specialized agents, handle any integration conflicts between front and backend tiers, and conduct the final code review.

---

## 12. Agent Execution & Operations
- **Terminal Autonomy:** Agents are explicitly permitted and encouraged to run terminal commands (e.g., `npm run lint`, `npm run build`, `npx vitest`) autonomously before asking for human review to ensure code compiles and tests pass.
- **Self-Correction:** If a terminal command fails, read the error output and attempt a logical fix before escalating to the user.
