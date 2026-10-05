# CLAUDE.md

## Project

Home Appliance Manager is a responsive web app where homeowners manage the lifecycle of their home assets, and service centers and technicians handle service requests. Read `docs/PRODUCT_VISION.md` first.

## Source of truth

- Product scope and rules: `docs/` — especially `docs/DECISIONS.md`.
- Unresolved items: `docs/OPEN_QUESTIONS.md`.

## Rules

- **Don't add features or make product decisions that aren't in `docs/DECISIONS.md`.** If something is unclear, ask the product owner, then record the answer in `docs/DECISIONS.md` and update the relevant doc.
- Keep the docs in sync with the code when behavior changes.

## Stack

React + TypeScript (Vite) frontend, Node.js + TypeScript (Express) backend, Drizzle ORM, PGlite. Local development only; no hosting yet. See `docs/TECH_STACK.md`.
