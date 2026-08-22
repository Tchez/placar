# CLAUDE.md — Placar

Read `README.md` first: it carries the product context, the settled decisions and the counting
rules for every game. This file is the working agreement.

## What this repo is

The **engineering** side of the project. It is shared via git, so it must be self-sufficient:
everything needed to build is here. The owner's Obsidian vault holds the product/PO side
(vision, open questions, backlog) and is private — do not assume any reader can see it.

If you cannot implement a SPEC from this repo alone, the SPEC is incomplete. Say so and fix
the SPEC instead of guessing or reaching for outside context.

## Spec-driven workflow

```
product idea (vault)  →  docs/specs/NNN-slug.md  →  implementation
```

1. **A SPEC is the unit of work.** No implementation without one.
2. Implement **only what the SPEC states**. Out-of-scope improvements go back to the SPEC as a
   follow-up, not into the diff.
3. If the SPEC is ambiguous or contradicts `README.md`, stop and ask. Do not resolve product
   questions by picking whatever is easiest to code.
4. A SPEC is done when every acceptance criterion is demonstrably met.

SPECs are numbered sequentially and never renumbered. Use `docs/specs/000-template.md`.

## Stack

Decided, not yet scaffolded — the first SPEC sets it up:

- **TypeScript**, strict mode, no `any`
- **React + Vite** as a mobile-first PWA
- Local persistence (IndexedDB or localStorage) behind a **repository interface** — no direct
  storage calls from components
- No backend, no auth, no analytics
- Keep dependencies minimal: every added package has to earn its place in an app the family
  installs from a home-screen shortcut

## Design constraints

- **Mobile-first, thumb-first.** Generous tap targets; the app is used standing at a card table
  or a padel court, one-handed, sometimes in the dark.
- **Portuguese (pt-BR) in the UI, with no i18n layer.** The family does not speak English, and v1
  ships pt-BR only — put the strings in the components. Do not add a translation layer, locale
  files or a language switcher "for later": internationalizing is a separate, explicit decision.
  Code, comments, commits, docs and SPECs are in English.
- **The score is the interface.** Big, tabular numerals; the running score readable at arm's
  length across a table.
- **No destructive action without a confirmation**, and no action that cannot be corrected —
  every entry must be editable and deletable.
- Works offline on first load after install. No network request is ever required.

## Architecture principles

Derived from the game rules in `README.md` — these are not negotiable style preferences:

1. **The entry log is the source of truth.** A match stores an ordered list of score entries;
   the displayed score is always *derived* from it. This is what makes edit and delete
   consistent, and it is what makes padel (sets derived from games) work at all.
2. **Game rules are data, not conditionals.** Each game is one definition object declaring its
   teams, target options, entry affordances and how to compute a scoreboard from the entry log.
   Adding a game means adding a definition — never adding an `if` to a screen.
3. **Persistence is one module.** Swapping local storage for a shared backend must not touch a
   single screen.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`)
- Don't commit or push unless asked
- No `console.log` left in committed code
- Small, focused changes over large refactors
