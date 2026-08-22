# Placar

Score-keeping app for family card and racket games — canastra, truco, padel, and a generic fallback mode.

**Status:** canastra and truco mineiro are implemented end to end. The next deliveries are planned in
`docs/specs/`.

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
| **Four games in the MVP** — canastra, truco, padel, generic | The generic mode keeps the app from ever being a dead end (dominó, buraco, whatever) | Game rules are data/config, not scattered conditionals |
| **Only what varies between tables is asked at match creation** — the target and whether negatives are allowed. Team count and default team names are declared by the game | House rules vary inside the same family, so freezing the target would force absurd variants like "canastra 3000" and "canastra 4000" as separate games. Team count does not vary, so asking for it would be a screen nobody needs | A game declares its team count, default names and which setup options it offers; the match stores the resolved values |
| **UI in Portuguese (pt-BR) only** | The family does not speak English | No i18n layer in v1 — strings live in the components. Internationalizing is a deliberate later decision, not a default to prepare for |
| **Picking the game is the first step of the flow** | The counting rule changes everything downstream: targets, entry values, what "score" even means | Home screen is the game picker |
| **Each game owns its match visual design** | The games have different identities and scoring rhythms; forcing them through one project-wide screen makes every game feel generic | The registry associates each definition with its own match view; shared domain and persistence contracts do not imply shared match UI |

## How each game counts

The reason this app is not a generic counter.

### Canastra
Cumulative score. Each round produces a balance per team and totals add up to a target.
- **Always 2 teams**, named **"Nós"** and **"Eles"** by default — that is literally what gets written
  on paper. Renaming is deferred for now. Only team names exist; individual player names are not
  modelled
- **Target is typed in by the user**, not picked from a fixed list. The family plays to 3000 and to
  4000 depending on the table
- **Whether negative entries are allowed is also a per-match choice** — some house rules let a team
  lose points, others only add
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

### Truco
Cumulative score with discrete values.
- 2 pairs ("Nós" / "Eles") · default target **12**
- Hand values: **1, 3, 6, 9, 12** · never negative
- Buttons only — free numeric entry makes no sense here

### Padel
**Not cumulative.** Hierarchical: points → games → sets. This is the game that breaks the "sum of points" model and therefore shapes the architecture.
- 2 pairs · best of 3 sets (2 sets win)
- A set is won at 6 games with a 2-game margin; 5-5 goes to 7-5; 6-6 is decided by a tie-break
- Displayed score: **sets won** as the headline number, games set-by-set as detail (e.g. `6-4, 3-2`)
- **MVP granularity: games, not individual points.** Nobody taps a phone every rally in a family match; what gets lost is the game score, and that is what needs remembering. Point-by-point (15/30/40) is a later phase
- Sets and winner are **derived** from the log of "pair X won a game", so editing or deleting an entry recomputes the whole match consistently

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
| 4 | Point-by-point padel and tournaments |

## Repository layout

```
src/                 React application, domain, persistence and tests
docs/specs/          SPECs — one per unit of work, the input to implementation
docs/specs/000-template.md   SPEC template
CLAUDE.md            Working agreement and development commands
```

## Where the product docs live

Product thinking, open questions and backlog live in the owner's private Obsidian vault
(`1. Notes/1. Projects/Personal/Placar/`). **This repo is the shared source of truth for
building.** Everything an implementer needs must be here — a SPEC that requires the vault
to be understood is an incomplete SPEC.
