# Placar

Score-keeping app for family card and court games — canastra, truco, vôlei, and a generic fallback mode.

**Status:** canastra, truco mineiro and truco gaudério are implemented end to end, with a game hub,
local match history and an in-app installation guide. The app is deployed as an installable,
offline-first PWA at **[placar.tchez.dev](https://placar.tchez.dev)**. The next deliveries are planned
in `docs/specs/`.

## Run locally

The project pins Node in `.nvmrc`. With `nvm` installed:

```bash
nvm use
npm ci
npm run dev
```

Use `npm run local` to expose the development server on the local network for phone testing. Scores
saved there belong to that development origin and do not move to the live site.

Before opening a change, run the complete quality gate:

```bash
npm run check
npm run build
```

`npm run check` runs TypeScript, ESLint, Prettier and the test suite with coverage printed locally.
`npm run build` creates the production app in `dist/`; `npm run preview` serves that exact build for
local verification.

## Install

- **First browser visit:** the app opens its installation guide before the first match. Choosing
  **Continuar sem instalar** remembers that choice; the install guide remains available from the
  home-screen footer.
- **Android / Chrome:** open [placar.tchez.dev](https://placar.tchez.dev) and choose the install app
  action offered by Chrome.
- **iPhone / Safari:** open the site, then choose *Compartilhar → Adicionar à Tela de Início*.

The installed app launches standalone in portrait and caches its complete app shell. After the first
online load, it opens with no network. Matches remain in the browser's local storage and survive app
updates.

## Deploy

Every push to `main` starts `.github/workflows/ci.yml`:

1. `check` installs from the lockfile with `npm ci` and runs the complete quality gate;
2. `audit` reports dependency vulnerabilities independently and does not gate publishing;
3. `deploy` waits for `check`, builds with the short commit SHA baked into the home screen and uses
   the official GitHub Pages artifact flow.

A failed quality gate never reaches the live app. Dependabot checks npm and GitHub Actions weekly
against `main`.

The PWA icon pipeline has one source: `public/icon-master.png`. It must remain a 1024×1024 opaque,
full-bleed image. Every build regenerates the 192px, 512px, maskable 512px, Apple 180px and favicon
outputs from it. Replacing the master is enough to update every installed icon; the current artwork
is provisional.

### One-time GitHub Pages and DNS setup

These infrastructure steps are not performed by the build:

1. Create the public `Tchez/placar` GitHub repository, add it as `origin` and push `main`.
2. In the repository, set **Settings → Pages → Source** to **GitHub Actions**.
3. In Cloudflare DNS for `tchez.dev`, add `CNAME placar → tchez.github.io`, TTL `Auto`, with the proxy
   explicitly set to **DNS only** (gray cloud). Cloudflare's orange proxy prevents GitHub from issuing
   the TLS certificate.
4. Set the Pages custom domain and, after the certificate is ready, enforce HTTPS:

   ```bash
   gh api --method PUT /repos/Tchez/placar/pages -f cname=placar.tchez.dev
   gh api --method PUT /repos/Tchez/placar/pages -F https_enforced=true
   gh api /repos/Tchez/placar/pages
   ```

5. Keep `public/CNAME` committed with `placar.tchez.dev`. Provide or replace
   `public/icon-master.png` when the final artwork is ready.

## The problem

The family plays often and keeping score is the friction: paper gets lost, sums get wrong, nobody remembers who won last time. Each game counts differently, so a plain counter is not enough — the app has to know each game's rules.

The users are family members, not developers. That drives every decision: no login, no configuration, no empty screen without an explanation. The app has to be faster than reaching for pen and paper.

## Product decisions

These are settled. Do not relitigate them in a SPEC without saying so explicitly.

| Decision | Rationale | Consequence |
|---|---|---|
| **Data stays on the device** — no backend, offline-first local persistence | Works with no internet (backyard, countryside), zero cost, no auth | Each device has its own history; whoever enters the points is the table's scorekeeper |
| **Persistence sits behind an interface** | Shared sync is a later phase and must not require rewriting screens | One module owns storage; screens never touch it directly |
| **Mobile-first PWA** — installable via "add to home screen" | Distributes to the family without TestFlight/APK or store fees | Must work on iOS Safari and Android Chrome |
| **Four games in the MVP** — canastra, truco, vôlei, generic (padel dropped 2026-08-23) | The generic mode keeps the app from ever being a dead end (dominó, buraco, whatever) | Game rules are data/config, not scattered conditionals |
| **Only what varies between tables is asked at match creation** — the target and whether negatives are allowed. Team count and default team names are declared by the game | House rules vary inside the same family, so freezing the target would force absurd variants like "canastra 3000" and "canastra 4000" as separate games. Team count does not vary, so asking for it would be a screen nobody needs | A game declares its team count, default names and which setup options it offers; the match stores the resolved values |
| **UI in Portuguese (pt-BR) only** | The family does not speak English | No i18n layer in v1 — strings live in the components. Internationalizing is a deliberate later decision, not a default to prepare for |
| **Picking the game is the first step of the flow** | The counting rule changes everything downstream: targets, entry values, what "score" even means | Home screen is the game picker |
| **Each game owns its match visual design** | The games have different identities and scoring rhythms; forcing them through one project-wide screen makes every game feel generic | The registry associates each definition with its own match view; shared domain and persistence contracts do not imply shared match UI |
| **Looking good is a requirement, not decoration** | This app competes with pen and paper at a family table; if it feels cheap nobody reaches for it. The owner supplies a visual reference per game and the screen is expected to match it | Whatever it takes to get there is allowed — texture assets, a CSS library, a dependency — inside the boundaries in `CLAUDE.md`. A SPEC that forbids a technique gets amended by the owner, not worked around |

## How each game counts

The reason this app is not a generic counter.

### Canastra
Cumulative score. Each round produces a balance per team and totals add up to a target.
- **Always 2 teams**, named **"Nós"** and **"Eles"** by default — that is literally what gets written
  on paper. Renaming is deferred for now. Only team names exist; individual player names are not
  modelled
- **Target is typed in by the user**, not picked from a fixed list. The family plays to 3000 and to
  4000 depending on the table; the setup starts at **4000**
- **Whether negative entries are allowed is also a per-match choice** — some house rules let a team
  lose points, others only add; the setup starts with negatives **disabled**
- Entry is a **free number** (e.g. 385), not a fixed value — numeric input is required
- If two or more teams cross the target, the app does **not** pick a winner — the table decides

### The canastra screen

The visual direction started from a concept the owner drew, and phone testing with the family refined
it from there. [SPEC 002](docs/specs/002-canastra.md) is the complete contract for the shipped
behaviour. No concept image is kept in the repo, so the decisions below are the record — a layout can
be re-drawn, a rounding rule cannot be re-derived.

- **Team colour is identity, not standing.** *Nós* is always green and *Eles* always gold, whoever is
  winning. Colours never swap and never follow the lead. Truco follows the same identity principle
  with its own palette: *Nós* is green and *Eles* is red there, while the tally marks remain neutral.
  The game themes must not share token values merely because both use stable team identities.
- **The target seal never rounds.** An exact multiple of a thousand abbreviates (`4000` → `META: 4K`,
  `3000` → `META: 3K`); anything else shows in full with the pt-BR separator (`3500` → `META: 3.500`).
  Showing `4K` for a 3500-point match would be false information about the one number the match is
  measured against.
- **The score is the information hierarchy.** Each total is dominant; only the numeric distance to
  target sits below it. The lower row shows the absolute difference between teams. Reaching half the
  target emphasizes the team's score as being in the *obrigada*.
- **Adding and removing are explicit actions.** The wide launcher uses labeled buttons and opens a
  contextual amount modal. The modal changes nothing until confirmed, and removal is unavailable
  when that match does not allow negative entries.
- **The entry log lives behind the header icon.** It is open by default, can be hidden from that
  toggle and is the inline block that expands the compact match page. Team renaming and a settings
  action are not part of this version.
- **One formatting helper.** Every displayed score, target distance, difference and log value goes
  through a wrapper around `Intl.NumberFormat('pt-BR')`. No manual separators in components.
- **Action grouping matters.** The finish/delete controls are one group, separated from score entry
  by a deliberate gap; delete remains visually secondary and close to finish.
- **Presentation only.** None of this touches the domain, the repository, the scoring derivation or the
  validation messages. If it seems to, that is worth surfacing before changing them.
- **Not built, on purpose:** a count badge on the log icon and scoring shortcut buttons (still
  blocked on the family's point values).

### Truco mineiro
Cumulative score with discrete values.
- 2 pairs ("Nós" / "Eles") · default target **12**
- Hand values: **1, 3, 6, 9, 12** · never negative
- Buttons only — free numeric entry makes no sense here
- Knows one rule beyond adding: the **mão de onze**, and mão de ferro at 11-11

### Truco gaudério
A **separate game**, not a variant of mineiro. By the project's criterion, a difference in *rule* is a
different game, while a difference in *table agreement* is match configuration.
- 2 pairs ("Nós" / "Eles"), fixed and not renameable · **no target at all**
- **Unit increments only: `+1` and `−1`.** No hand ladder
- **Knows no rule of the game** in v1 — no flor, no envido, nothing equivalent to mão de onze
- Played to 12 or to 24 depending on the table. The app neither knows nor asks; it counts.
  **24 is the ceiling**, and a ceiling of 24 covers a 12-point game too
- Teaching it the rules later is **conditional, not debt**: counting alone may be the finished product

### Vôlei
**Not cumulative.** Hierarchical: points → sets. This is the game that breaks the "sum of points" model and therefore shapes the architecture. It inherits that role from padel, which was dropped on 2026-08-23.
- 2 teams · point-by-point entry · **no team name shown at all** — no "Nós"/"Eles", no rename
- Displayed score: **sets won as the small number, points in the current set as the large number** — the layout of a courtside counter
- **The app is the counter, not the referee.** The family plays indoor and beach, sometimes serious and sometimes casual, so the set target varies (25, 21, or whatever was agreed). A counter does not need to know the target; it counts
- **A set closes by tapping the sets counter itself.** That tap never resets either side's current-set points — a separate "zerar" control on each side does that, as its own undoable action
- Sets are **derived** from the entry log, so editing or deleting an entry recomputes the whole match consistently. See [SPEC 008](docs/specs/008-volei.md) for the exact entry-log encoding
- **No automatic winner, ever** — not of a set, not of the match. Ending a match is the "Encerrar partida" action, decided by the table
- **History is opt-in, unlike every other game.** A vôlei match does not appear in the local history until the family explicitly saves it; declining when prompted deletes it outright. This exception is scoped to vôlei only — see [SPEC 008](docs/specs/008-volei.md)

### Generic
Free teams and a plain sum, optional target. Exists so any other game fits.

## MVP scope

- Pick the game on the home screen
- Create a match with the game's default teams
- Set the point/set target according to the game
- Add, edit and delete score entries
- Live scoreboard using the correct counting rule per game
- Finish a match and browse local history

## Roadmap

| Phase | Delivery |
|---|---|
| 1 | MVP above |
| 2 | Named players and stats (who wins most) |
| 3 | Sync between family devices |
| 4 | *Empty.* Held phase 4 (point-by-point padel and tournaments) until padel was dropped on 2026-08-23. The only declared candidate is teaching truco gaudério its rules, which the owner has left conditional |

## Repository layout

```
src/                 React application, domain, persistence and tests
src/assets/textures/ Generated surface textures — see scripts/, never hand-edited
scripts/             Build-time generators (`npm run textures`)
docs/specs/          SPECs — one per unit of work, the input to implementation
docs/specs/000-template.md   SPEC template
CLAUDE.md            Working agreement and development commands
```

Decoration is **generated in this repo, never downloaded**: the truco gaudério leather, craquelure
and wood plank come from `scripts/generate-textures.mjs`, which is seeded and deterministic. The repo
is public, so no third-party image is vendored into it.

## Where the product docs live

Product thinking, open questions and backlog live in the owner's private Obsidian vault
(`1. Notes/1. Projects/Personal/Placar/`). **This repo is the shared source of truth for
building.** Everything an implementer needs must be here — a SPEC that requires the vault
to be understood is an incomplete SPEC.
