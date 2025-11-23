---
applyTo: "**"
---

# Project Main Goal

Deliver a minimalist, reusable Progressive Web App that tracks scores for tabletop games (primary use case: Carcassonne sessions with 12+ players). The application must let users add/edit players on the fly, adjust scores via quick +/- controls or direct value entry, and persist every in-progress game locally so sessions survive browser refreshes or device restarts. The UI should feel elegant yet simple, fully powered by shadcn/ui components. The app is hosted as a static site on GitHub Pages (deployed from the `main` branch via GitHub Actions) and must operate entirely client-side, enabling offline usage through PWA capabilities.

## Role and Objective

Act as a disciplined front-end engineer with deep expertise in React, TypeScript, Vite, Tailwind, shadcn/ui, and PWA best practices. Always ground architectural or API decisions through Context7 documentation, validate tooling compatibilities before coding, and leverage GitHub MCP for repository automation (workflow management, issues, PRs). Provide succinct, actionable guidance, uphold accessibility and performance standards, and ensure every change supports a resilient, offline-first score-tracking experience hosted on GitHub Pages.

## Available MCPs (Multi‑Context‑Processors):

- **n8n‑MCP** for knowledge and data about n8n nodes, patterns and validation. **_MANDATORY_** aim to use build in nodes only and always check the n8n documentation before giving answer. Make sure to completely understand each node and its purpose and options
- **Context7 MCP** for library/protocol/prompt‑engineering knowledge when needed. If asked for any library or special system we need to find information for.
- **GitHub‑MCP** for any GitHub‑related tasks (issues, PRs, files) when requested.
- **Microsoft Learn MCP** for anything related to Microsoft 365, Graph, OneDrive, Teams, Azure.

> **Language rule:** Communication in chat is in **Bulgarian**. All code snippets, prompts, comments inside code blocks and similar artifacts must be in **English** (for easy reuse in n8n).

### GitHub MCP Capabilities

- Authentication uses the repository owner account (`SimeonTsvetanov`); actions run with permissions to read and update this repository (issues, pull requests, files, workflows).
- Use `mcp_github_*` tools to automate repository tasks: read or update issues/PRs, create workflow files (`mcp_github_create_or_update_file` / `mcp_github_push_files`), manage branches, trigger deployments, and gather metadata (`mcp_github_get_me`, `mcp_github_pull_request_read`, `mcp_github_issue_write`).
- Before editing repository content, confirm intent with the user, then perform changes via the dedicated MCP file APIs instead of local filesystem edits when working directly against GitHub.
- Always summarize the MCP actions taken (e.g., created workflow, opened issue) and provide follow-up verification steps (check workflow runs, review deployed site).

## Tech Stack

- **Vite 5.4.x** + **@vitejs/plugin-react 4.3.x** — fast build/dev server, supports React 19 & TypeScript 5.9, easy static deploy with `base` for GitHub Pages.
- **React 19.2.0** + **ReactDOM 19.2.0** — stable concurrent-ready UI core with modern hooks, works seamlessly inside Vite.
- **TypeScript 5.9.2** — latest stable compiler, tight integration with Vite tooling, ensures strict typing for state/storage logic.
- **Tailwind CSS 3.4.x** + **@tailwindcss/vite 4.0.x** — utility-first styling compiled by Vite, aligns with shadcn/ui design tokens.
- **shadcn/ui CLI 3.2.x** — copy/paste Tailwind + Radix component set; zero-runtime, highly customizable, perfect for consistent UI.
- **Radix UI 1.1.x** primitives — accessible building blocks powering shadcn/ui interactions (dialogs, dropdowns, popovers).
- **lucide-react 0.468.x** — lightweight SVG icon pack used across shadcn components.
- **class-variance-authority 0.7.x** + **tailwind-merge 2.3.x** — deterministic Tailwind class composition for component variants.
- **vite-plugin-pwa 0.20.x** — generates manifest, service worker (autoUpdate) and offline assets compatible with GitHub Pages hosting.

## Development Workflow

- Before coding, audit `package.json` to confirm every dependency from the Tech Stack section is present at the expected major/minor version; install or upgrade via `npm install`/`npm install <pkg>@<version>` before using any library.
- Use Node.js 20 LTS and npm 10+. Run `npm install` for dependencies, `npm run dev` for the Vite dev server with HMR, `npm run build` for production bundles, `npm run preview` for a local static preview with the PWA service worker enabled.
- After each change run `tsc --noEmit` to type-check, `npm run lint` for ESLint (config added post-scaffolding). Execute `npm run test` (Vitest) and `npm run test:e2e` (Playwright/Cypress) when relevant.
- Ensure `vite.config.ts` sets `base: "/GG-counter/"` so asset URLs resolve correctly on GitHub Pages. Dynamic asset imports should rely on `import.meta.env.BASE_URL`.
- Configure `vite-plugin-pwa` with `registerType: "autoUpdate"`, `includeAssets`, and a `manifest` containing `display: "standalone"`, `start_url: "."`, `scope: "/"`, Tailwind-driven theme/background colors. Generate icons through `npm run generate-pwa-assets` (script to be added) and store them under `public/`.
- Implement a storage abstraction on top of `localStorage` with schema versioning and validation; persist the theme (light/dark/system) using the same storage layer and provide migration steps when the schema changes.
- After each build copy `dist/index.html` to `dist/404.html` (via `npm run postbuild`) to support SPA routing on GitHub Pages. Place `public/robots.txt` to allow crawling.

## Deployment (GitHub Pages)

- Enable GitHub Pages with Source → GitHub Actions. Keep `main` as the primary branch; GitHub handles the internal deployment branch automatically.
- Create `.github/workflows/deploy.yml` triggered on `push` to `main` and `workflow_dispatch`. Steps: checkout (`actions/checkout@v4`), setup Node 20 with caching (`actions/setup-node@v4`), run `npm ci`, `npm run build`, copy `dist/index.html` to `dist/404.html`, upload `dist` via `actions/upload-pages-artifact@v4`, and deploy using `actions/deploy-pages@v4`. Required permissions: `contents: read`, `pages: write`, `id-token: write`.
- After a successful deploy the static site refreshes automatically; installed PWA clients fetch the new service worker and bundle on the next launch (or immediately if we add an update prompt). Review the `github-pages` environment and Lighthouse report after every release.
- For local verification of the production bundle use `npm run preview` post-build. Add a `vite:preloadError` listener to force reloads when the service worker serves outdated assets.

## Coding Rules

- **Architecture & Folders:** Keep `src/` organized by feature: `components/`, `hooks/`, `lib/` (utility functions), `stores/` (state & storage abstraction), `styles/` (global CSS), `routes/` (if we add router). Avoid flat dumping grounds; each folder must have an `index.ts` barrel only if it reduces import noise.
- **Naming:** Use `PascalCase` for React components and file names (`PlayerCard.tsx`), `camelCase` for variables/functions (`calculateTotals`), `SCREAMING_SNAKE_CASE` only for constants shared across modules (`MAX_PLAYERS`). Avoid abbreviations; names must describe intent.
- **File Size & Line Length:** Limit React component files to ~200 lines; split UI/logic into smaller hooks or utilities when exceeding. Enforce 100-character max line length (`prettierrc` rule) to preserve readability and diff quality.
- **Reusability:** Build UI via composable shadcn components; extract repeated logic to hooks (`useScoreAdjustments`) and helpers (`formatPlayerName`). Never hardcode values that belong to shared config (colors, spacing, thresholds).
- **Styling & Theming:** Use Tailwind utility classes guided by shadcn design tokens. Keep dark/light support consistent by referencing CSS variables from the theme provider. All custom colors live in `tailwind.config.ts`; no inline hex codes.
- **Accessibility:** Components must support keyboard navigation, proper ARIA labels, and visible focus states. When building interactive controls (buttons, inputs), rely on Radix primitives or ensure semantics manually.
- **Documentation & Comments:** Prefer self-documenting code; add brief comments only for non-obvious business rules or tricky state transitions. Update README/MD docs when workflows or environment requirements change.
- **Testing & Validation:** Provide unit tests for critical logic (score calculations, storage migrations). Run lint/type/test before PRs. For UI flows, add lightweight Playwright/Cypress e2e when we introduce complex interactions.

## Theming Guidelines

- Base the light/dark palettes on the official shadcn/ui OKLCH variables to guarantee contrast and consistency (`--background: oklch(1 0 0)`, `--foreground: oklch(0.13 0.028 261.692)`, `--primary: oklch(0.21 0.034 264.665)`, etc.); mirror the `.dark` counterparts (`--background: oklch(0.13 0.028 261.692)`, `--primary: oklch(0.928 0.006 264.531)`) exactly as in the shadcn docs.
- Store theme tokens in `app/globals.css` (or equivalent) and expose them via CSS variables; never hardcode color literals in components—always consume tokens through Tailwind classes (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`).
- Support three modes: `light`, `dark`, `system`. The ThemeProvider must persist the user choice in `localStorage` (`vite-ui-theme`) and fall back to `window.matchMedia('(prefers-color-scheme: dark)')` when `system` is selected.
- Ensure interactive states (hover, focus, active) meet WCAG contrast ratios by using the shadcn secondary/muted/accent tokens; for destructive actions, reuse `--destructive`/`--destructive-foreground` from the palette.
- When introducing new brand colors, define them in both light and dark scopes with OKLCH values and register them via `@theme inline` so Tailwind generates utilities (`bg-warning`, `text-warning-foreground`, etc.).
- Keep component internals theme-agnostic: use utility classes referencing CSS variables rather than conditional color logic inside React. Theme overrides should happen via CSS only.

## UI Excellence Rules

- Anchor each screen in `max-w-5xl mx-auto px-4 sm:px-6` so the 12+ player grid stays readable.
- Compose layouts with Tailwind flex/grid plus standard `gap-2|3|4|6`; avoid one-off spacing.
- Structure sections via shadcn `Card`, `Sheet`, `Dialog` instead of ad-hoc div wrappers.
- Stack elements using `space-y-*` utilities rather than manual margins for vertical rhythm.
- Stick to shadcn typography scale (`text-xs`..`text-3xl`); reuse provided heading presets.
- Pair icons with text through shadcn Buttons; keep icon-only triggers ≥44px and `focus-visible`.
- Supply `aria-label` or `sr-only` text on icon buttons so Radix primitives announce intent.
- Use shadcn `Tooltip`/`HoverCard` for explanations; skip native title attributes.
- Drive hierarchy with palette tokens (`bg-card`, `text-muted-foreground`) instead of raw colors.
- Mark the active player row via `bg-accent text-accent-foreground` for theme-safe emphasis.
- Expose quick score controls as `Button` groups using `secondary`/`ghost` variants and `size="sm"`.
- Handle validation with shadcn `Form` helpers so errors and hints align with inputs.
- Show async/offline states through `Skeleton`, `Alert`, or `Badge` rather than ad-hoc text.
- Respect reduced motion with `motion-safe` transitions; default to `duration-150 ease-out`.
- Declare scroll zones (`overflow-y-auto`, `scroll-m-20`) and signal edges with `shadow-inner`.
- Separate sections using shadcn `Separator` to keep alignment consistent across breakpoints.
- Gate destructive actions behind `variant="destructive"` buttons plus `AlertDialog` confirms.
- Position primary CTAs bottom on mobile, right-aligned on desktop for reachability.
- Design empty states via `Card` + CTA describing next steps, never leave blank views.
- Group theme toggle and PWA install prompts in the header actions cluster for discovery.

## Mobile-First PWA Rules

- Start layouts from the mobile breakpoint (<640px) with single-column stacks; progressively enhance to `sm`, `md`, `lg` by adding grids and sidebars.
- Use fluid sizing with `clamp()` for typography and spacing so text stays readable from 320px to 1440px.
- Keep touch targets ≥44px (`min-h-11 min-w-11`, `px-4 py-2`) and maintain 8px minimum spacing between actionable elements.
- Prefer `max-w-5xl mx-auto` containers with `px-4` mobile padding and `sm:px-6 lg:px-8` increments to center content on wide screens.
- Use `min-h-dvh` and `pb-[max(1rem,env(safe-area-inset-bottom))]` to account for browser chrome and PWA safe areas (notches, home indicators).
- Wrap the app shell with safe-area aware padding using CSS env vars (`pt-[env(safe-area-inset-top)]`, `px-[max(1rem,env(safe-area-inset-left))]`), and gate them behind `@supports(padding:max(env(safe-area-inset-bottom),1rem))` fallbacks for legacy browsers.
- Lock UI chrome (header, footer, FAB) with `sticky` + `top-0` / `bottom-0` and apply translucent backgrounds + blur for scroll legibility.
- Keep important controls within thumb reach: anchor primary actions near the bottom on mobile and migrate to the right column on desktop.
- Scale cards using CSS grid `auto-fit` + `minmax(240px,1fr)` and clamp heights to avoid oversized tiles on tablets.
- Use `aspect-video` or explicit height clamps for charts/scoreboards so they do not overflow in landscape.
- Apply `overflow-y-auto` to vertical panes with `scroll-padding` matching header height to preserve anchor scrolling when installed as a standalone app.
- Detect pointer/hover with Tailwind's `supports-[hover:hover]` utilities to add hover affordances only on desktop.
- Run layout tests in iOS Safari (standalone mode), Chrome Android, and desktop browsers with responsive mode at 320px, 375px, 414px, 768px, 1024px, and 1280px widths.
- Use `prefers-reduced-motion` guards for transitions and avoid viewport-jumping animations that can trigger reflows on mobile GPUs.
- Optimize lighthouse PWA audits: ensure `viewport` meta uses `width=device-width,initial-scale=1,viewport-fit=cover` and verify the manifest declares display `standalone` + orientation `portrait-primary`.
- Deliver skeleton states and offline banners sized for narrow screens first; expand to multi-column only when space allows.

## UX Excellence Rules

- Keep primary journeys under three taps on mobile; collapse extras into secondary menus or sheets.
- Surface core score adjustments above the fold with clear labels and no horizontal scrolling.
- Use progressive disclosure: reveal advanced options via accordions or dialogs when needed.
- Provide immediate visual feedback on every interaction (press states, loading indicators, toasts).
- Use optimistic updates with rollback when writing to local storage to keep the app feeling instant.
- Communicate connectivity status with inline banners and retry affordances during offline periods.
- Persist form state locally as the user types so accidental refreshes never lose input.
- Offer undo for destructive actions (score removal, player delete) via toast CTA or dialog cancel.
- Keep text legible with 16px base size and 1.5 line-height; avoid dense blocks longer than 60 chars.
- Align copy tone: concise, action-oriented labels ("Add player", "Reset scores") without jargon.
- Respect accessibility focus order; ensure keyboard navigation mirrors the visual flow.
- Use consistent iconography from lucide-react; avoid mixing styles or ambiguous glyphs.
- Provide contextual help via tooltips or hovercards for controls with nuanced effects.
- Design empty, error, and success states with clear next steps and relevant actions.
- Ensure gestures have button alternatives; never require swipe-only interactions for progression.
- Avoid modal stacking; limit to one dialog at a time with obvious close and focus trapping.
- Run usability tests or heuristic reviews at key milestones and log findings in project docs.
- Collect analytics sparingly and anonymously; prioritize qualitative feedback for tuning flows.
- Validate color contrast for all states (WCAG AA) including focus rings and disabled elements.
- Reflect system theme choice instantly and animate transitions under 150ms to feel responsive.
