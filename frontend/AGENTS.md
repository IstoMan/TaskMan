<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Where agent rules live in this repo

- **`AGENTS.md`** (this file) — project notes for agents; Cursor can include it via workspace rules (see your Cursor settings / project rules).
- **`.cursor/rules/*.mdc`** — Cursor rule files (e.g. `frontend/.cursor/rules/bun-tooling.mdc`). Use these for always-on or glob-scoped instructions.

## Package manager: Bun

Use **Bun** for this frontend: `bun install`, `bun run <script>`, `bunx <cli>`. Do not default to `npm`, `npx`, `pnpm`, or `yarn` in commands or docs unless explicitly requested.

