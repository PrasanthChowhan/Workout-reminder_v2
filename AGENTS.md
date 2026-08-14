# Agent Instructions
This App will one day be used by consumers. So keep in mind about security, perfomance, scalability and most importantaly,  maintainability.
If you are confident that there is a better way to implement something suggest the dev.

## Stack Context
Tauri v2 · Rust 1.75+ · React 18 · Vite · Vanilla CSS Modules.
DO NOT use Tailwind, Create React App, or Next.js patterns.

## Commands
- Dev: `npm run tauri:dev` (Default: launches isolated development build with grayscaled icons)
  > [!IMPORTANT]
  > Do not use `npm run tauri dev` for regular development. For warnings, risks, and app path separation details, see [ADR 0005: Environment Isolation](docs/adr/0005-environment-isolation-for-dev-vs-prod.md).
- Install: `npm install`
- Build: `npm run tauri build`
- Rust check: `cd src-tauri && cargo check && cargo clippy`

## Boundary Rules (Ask First)
- RULE-A1: **Ask before** modifying `tauri.conf.json`, `package.json`, or `Cargo.toml`. Never install dependencies autonomously.
- RULE-A2: **Ask before** creating new top-level components or pages. Verify placement in `ARCHITECTURE.md` first.
- RULE-A3: **Ask before** adding new root-level documentation files. Use `docs/` or update existing files.
- RULE-A4: **Ask before** commiting the code.

## Shared Rules
- RULE-D1: Never duplicate utility functions. Check `src/utils/` or existing Rust modules first.
- RULE-D2: Never duplicate information across docs. Write once, link to it.
- RULE-F1: Enforce strictly one responsibility per file. Use size (>250 lines for React, >300 lines for Rust) as a diagnostic signal to review for split, not a hard barrier.
    * React: Extract nested UI (modals), static data, and complex hooks.
    * Rust: Isolate strictly by domain (e.g., DB, network, I/O).
    * CSS: When working with CSS, read [css_rules.md](docs/agents/css_rules.md).

## Key Docs (read on-demand, not every turn)
- Domain & glossary: [CONTEXT.md](CONTEXT.md)
- Design system: [DESIGN.md](DESIGN.md)
- Component map: [ARCHITECTURE.md](ARCHITECTURE.md)
- Schemas: [docs/schemas/](docs/schemas/)
- ADRs: [docs/adr/](docs/adr/)
- Frontend Agent Rules: [src/AGENTS.md](src/AGENTS.md)
- Rust Backend Agent Rules: [src-tauri/AGENTS.md](src-tauri/AGENTS.md)
