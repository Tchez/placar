# Placar

Score-keeping app for family card and racket games — canastra, truco, padel, and a generic fallback mode.

**Status:** architectural skeleton complete. The first game is planned in `docs/specs/002-*`.

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
| **Match setup is per match, not per game** — team count, target and "negatives allowed" are chosen when creating a match | House rules vary inside the same family; freezing them into the game definition would force absurd variants like "canastra 3000" and "canastra 4000" as separate games | A game declares which setup options it offers; the match stores the resolved values |
| **UI in Portuguese (pt-BR) only** | The family does not speak English | No i18n layer in v1 — strings live in the components. Internationalizing is a deliberate later decision, not a default to prepare for |
| **Picking the game is the first step of the flow** | The counting rule changes everything downstream: targets, entry values, what "score" even means | Home screen is the game picker |

## How each game counts

The reason this app is not a generic counter.

### Canastra
Cumulative score. Each round produces a balance per team and totals add up to a target.
- **Team count is chosen when the match is created** — the family plays in different formations.
  Only team names exist; individual player names are not modelled
- **Target is typed in by the user**, not picked from a fixed list. The family plays to 3000 and to
  4000 depending on the table
- **Whether negative entries are allowed is also a per-match choice** — some house rules let a team
  lose points, others only add
- Entry is a **free number** (e.g. 385), not a fixed value — numeric input is required
- If two or more teams cross the target, the app does **not** pick a winner — the table decides

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
- Create a match with two teams (editable names)
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
