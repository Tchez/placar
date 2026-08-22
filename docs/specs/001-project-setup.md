# SPEC 001 — Project setup and architectural skeleton

- **Status:** ready
- **Created:** 2026-08-22
- **Depends on:** none

## Goal

Nothing changes for the family yet: this SPEC ships no game and no score. It exists so that every
SPEC after it can be implemented quickly and safely.

The app will be built incrementally and fast, so the guardrails have to exist *before* the features:
a test harness, one command that says pass/fail, and the architectural boundaries from `CLAUDE.md`
expressed as real files with real tests. What is not enforced by a test or a type here will drift
later.

At the end of this SPEC, `npm run dev` opens a styled, empty Portuguese app shell, and
`npm run check` proves the domain and persistence layers work.

## Context

Read `README.md` for the product and `CLAUDE.md` for the working agreement. Three points from
there drive this SPEC and must be honoured by its code, not just repeated in prose:

1. **The entry log is the source of truth.** A match holds an ordered list of score entries; every
   displayed score is derived from that list. This is what makes edit/delete consistent and what
   will make padel (sets derived from games) possible at all.
2. **Game rules are data, not conditionals.** A game is one definition object. Adding a game means
   adding a definition — never adding an `if` to a screen.
3. **Persistence is one module.** Swapping local storage for a shared backend later must not touch
   a single screen.

This SPEC builds (1), (2) and (3) as contracts plus tests, with **zero game rules implemented**.
The game registry ships empty on purpose: the first real game arrives in SPEC 002 and must be a
purely additive change.

**Language:** the UI is Portuguese (pt-BR), with no i18n layer. Strings live in the components.
Code, comments, tests and commits are in English.

## Scope

**In**

- Toolchain: Vite + React + TypeScript (strict), formatter, linter, test runner
- A single verification command that gates everything
- Folder structure with a stated purpose per folder
- Domain types and pure domain functions over the entry log, with tests
- `MatchRepository` interface + a localStorage implementation, with tests
- Match store (React context) wrapping the domain functions and the repository, with tests
- Routing and the app shell: layout, design tokens, the primitives the shell itself needs
- Home screen showing the empty state driven by the empty game registry

**Out** — explicitly, so it does not get built by accident

- Any game rule, any scoring math, any `GameDefinition` implementation
- The game picker grid, match creation, the scoreboard, the entry log UI, history
- PWA manifest, service worker, icons, offline support, deploy (later SPEC)
- Named players, sync, statistics
- i18n layer, locale files, language switcher
- Auth, backend, analytics, error reporting
- CI pipeline configuration (the `check` command must be CI-ready; wiring CI is not in scope)

## Behaviour

Running `npm run dev` on a phone-sized viewport shows:

- The app shell: safe-area-aware layout, centered single column capped at a comfortable reading
  width, dark theme applied from the design tokens.
- A header with the app name **Placar**.
- The home screen's empty state, because no game is registered yet:
  **"Nenhum jogo disponível ainda."** with the supporting line
  **"Os jogos chegam nas próximas versões."**
- No console errors and no console warnings.

There is nothing to click. That is the correct outcome for this SPEC.

## Rules

### Structure

```
src/
  main.tsx                    entry point
  app/
    App.tsx                   shell: layout + routes
    routes.ts                 route path constants — no hardcoded path strings elsewhere
  domain/
    types.ts                  Match, Team, Entry, GameId, GameDefinition, Scoreboard, Standing
    match.ts                  pure functions over a Match — the only place a Match is changed
    match.test.ts
  games/
    index.ts                  GAMES registry + getGame() — ships empty
    index.test.ts
  storage/
    repository.ts             MatchRepository interface
    localRepository.ts        localStorage implementation
    localRepository.test.ts
  store/
    MatchStore.tsx            provider + useMatches() — React glue only, no business logic
    MatchStore.test.tsx
  screens/
    HomeScreen.tsx
  components/                 shared presentational primitives
  styles/
    tokens.css                design tokens as CSS custom properties
    base.css                  reset + element defaults
```

Test files are co-located with their source, named `*.test.ts(x)`.

### Domain

- `domain/match.ts` exports **pure** functions returning new objects; nothing mutates its input:
  `createMatch`, `addEntry`, `updateEntry`, `removeEntry`, `renameTeam`, `finishMatch`,
  `reopenMatch`. No React, no storage, no `Date.now()` or id generation reaching in implicitly —
  the current time and new ids are passed in or injected, so the functions are deterministic in
  tests.
- An `Entry` carries: id, team id, numeric value, a note (may be empty), and a timestamp.
- A `Match` carries: id, game id, teams, ordered entries, target (`number | null`), created-at,
  finished-at (`string | null`).
- `Scoreboard` is a **derived** value. Nothing stores a total. There is no `total` field anywhere
  on `Match`, `Team` or `Entry`.
- `GameDefinition` declares at minimum: id, label, how many teams, target options, what entry
  affordances the UI should offer, and `scoreboard(match): Scoreboard`. It is the only place a
  game's rules may live.

### Persistence

- `MatchRepository` is an async interface (`loadAll`, `save`, `remove`). Async even though
  localStorage is synchronous, so a remote implementation later does not change any call site.
- `localRepository` stores a **versioned payload** (`{ version, matches }`). On a version mismatch,
  unparseable JSON, or a payload of the wrong shape, it returns an empty list instead of throwing —
  a corrupted store must never prevent the app from opening.
- No component, screen or store may call `localStorage` directly. The repository is the only file
  in the codebase that names it.

### Store

- `MatchStore.tsx` holds the loaded matches in state, delegates every change to `domain/match.ts`,
  and persists through the repository. It contains no scoring or rule logic of its own.
- The provider accepts a repository via prop, defaulting to `localRepository`, so tests inject a
  fake instead of touching browser storage.
- `useMatches()` throws a clear error when used outside the provider.

### Routing

Use a **hash-based** router. Reason: each screen gets a URL, so the Android back button, page
refresh and deep links work without hand-rolled history handling — the exact things a hand-written
navigator gets wrong. Hash routing also needs no server rewrite rules, which keeps the deploy
decision open. Paths are declared once in `app/routes.ts`.

### Styling

- Design tokens as CSS custom properties in `styles/tokens.css`: colours, radii, spacing, and a
  minimum tap-target size. Components reference tokens, never raw hex values.
- Plain CSS. No CSS-in-JS, no utility framework, no component library.
- Mobile-first, thumb-first: tap targets at least 44px, safe-area insets respected.
- Add a component to `components/` when a second screen needs it — **not** in anticipation. This
  SPEC creates only the primitives the shell itself uses.

### Testing policy

The point is catching regressions in logic, not chasing coverage.

- **Must be tested:** every function in `domain/match.ts`; the repository (round-trip, corrupted
  payload, version mismatch, remove); the store's behaviour through its public hook.
- **Must not be tested:** CSS, token values, layout, snapshot-style assertions on markup, or
  third-party behaviour.
- Screens get at most a smoke test asserting the visible text a user would look for.
- Tests must not depend on wall-clock time or randomness. Pass clocks and ids in.

### Quality gate

`npm run check` runs typecheck, lint, format check and tests, and exits non-zero if any fails.
It is the single command that answers "is this safe to commit". No `any`. No `console.log`.

## Acceptance criteria

- [ ] `npm install && npm run dev` serves the app; the shell renders the empty state text from
      **Behaviour** with no console errors or warnings
- [ ] `npm run check` exists, runs typecheck + lint + format check + tests, and passes
- [ ] `npm run build` produces a production build with no type errors
- [ ] TypeScript runs in strict mode; the string `any` appears in no source file
- [ ] The folder structure matches **Structure** exactly, and every listed test file exists
- [ ] `grep -r localStorage src/` matches only `storage/localRepository.ts` (and its test)
- [ ] `games/index.ts` exports an **empty** `GAMES` registry; `getGame` throws a descriptive error
      for an unknown id, and a test asserts it
- [ ] No file in `src/` other than `domain/types.ts` mentions a specific game's rules
- [ ] Every function exported by `domain/match.ts` has at least one test asserting the returned
      value, and one asserting the input object was not mutated
- [ ] The repository test covers: save/load round-trip, unparseable JSON, wrong `version`, and
      `remove`
- [ ] The store test injects a fake repository and never touches real browser storage
- [ ] `useMatches()` outside the provider throws, asserted by a test
- [ ] No score total is stored anywhere: `Match`, `Team` and `Entry` have no total/points field
- [ ] All user-visible strings are in Portuguese; the repo contains no i18n library or locale file
- [ ] `CLAUDE.md` gains a **Commands** section listing the npm scripts this SPEC creates

## Open questions

None. Hosting and PWA install are deliberately out of scope and belong to a later SPEC.
