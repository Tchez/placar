# SPEC 002 — Canastra, first game end to end

- **Status:** ready
- **Created:** 2026-08-22
- **Depends on:** SPEC 001

## Goal

The family can keep score of a real canastra game on a phone: create a match with the teams and
the point limit they agreed on, type each round's points, fix mistakes, and see who is winning.

This is the first usable version of the app. It is also the SPEC that settles how a match is set
up, because canastra is where the family's house rules vary the most.

## Context

Read `README.md` (canastra section and the decisions table) and `CLAUDE.md`. SPEC 001 built the
skeleton: pure domain functions over an entry log, a repository behind an interface, a store, an
empty game registry.

What is specific to this SPEC:

- **House rules vary inside the same family.** Some tables play to 3000, others to 4000. Some let a
  team lose points, others only add. So the point limit, the number of teams and whether negatives
  are allowed are **chosen when the match is created**, not baked into the game definition.
- **Teams, not people.** Only team names are modelled. Individual player names are deliberately not
  part of the app.
- **The app does not know canastra's internal scoring.** The user types the round total (e.g. 385).
  The exact values the family uses for a clean/dirty canastra are still unconfirmed, which is why
  this SPEC ships **no scoring shortcuts** — inventing them would put wrong numbers in front of the
  family.
- The UI is Portuguese, no i18n layer.

## Scope

**In**

- Contract changes needed for per-match setup (see **Rules → Contract changes**)
- The canastra `GameDefinition`, registered in `games/index.ts`
- Home screen: game picker + list of matches in progress
- New match screen: team count, team names, point limit, negatives toggle
- Match screen: scoreboard for N teams, add entry, edit entry value, delete entry, finish and
  reopen the match, delete the match
- Empty states and validation messages for everything above, in pt-BR
- Tests per `CLAUDE.md`'s testing policy

**Out** — explicitly, so it does not get built by accident

- **Round-based entry** (one input per team, saved as a round). It is a genuinely better fit for how
  canastra is scored and it is a candidate for a later SPEC, but it changes the entry log's shape and
  the semantics of editing. Not now
- Scoring shortcut buttons (`+200` clean canastra, etc.) — blocked on the family's actual values
- A note/label field on an entry. `Entry.note` stays in the type, written as an empty string, and is
  not exposed in the UI
- Changing an entry's team after the fact. Wrong team is fixed by deleting and re-adding
- Truco, padel, the generic game
- The finished-match history screen (SPEC 005). Only matches **in progress** are listed
- PWA, offline, deploy, statistics, player names, sync

## Behaviour

### Home — `/`

- The game picker lists the registered games as cards. With this SPEC that is a single card:
  **Canastra**, with a one-line description. Tapping it opens the new match screen.
- Below it, **"Partidas em andamento"**: one row per unfinished match, showing the team names, the
  point limit, when it started, and the current score. Tapping a row opens that match.
- When there is no match in progress the section is **not** rendered — no empty box.

### New match — `/nova/:gameId`

Fields, in this order:

1. **Quantidade de times** — stepper, 2 to 6, default 2.
2. **Nome dos times** — one text field per team, pre-filled `Dupla 1`, `Dupla 2`, … The count of
   fields follows the stepper: increasing keeps what was typed, decreasing drops the last fields.
3. **Pontos para vencer** — numeric field, **typed by the user**, empty by default. Two tappable
   suggestions next to it: **3000** and **4000**, which fill the field.
4. **Permitir pontos negativos** — toggle, **default on**. Helper text:
   *"Algumas mesas deixam o time voltar pontos."*

**Começar partida** creates the match and opens it. Disabled until the point limit is valid.

Unknown `:gameId` shows **"Jogo não encontrado."** and a link back to home — never a blank screen
or a crash.

### Match — `/partida/:matchId`

- **Scoreboard**: one block per team, in the match's team order, showing the team name and its
  total. The leading team is visually marked. Team names are editable in place.
- **Status line**, one of:
  - `Faltam N pontos para <time>` — while nobody reached the limit (N from the leader)
  - `<time> venceu` — exactly one team at or above the limit
  - `Empate na meta — a mesa decide` — two or more teams at or above the limit
- **Lançar pontos**: a team selector, a numeric field, and an **Adicionar** button. The selector
  defaults to the first team and, after each entry, moves to the next team — in canastra rounds are
  entered team by team, so this saves a tap per round.
- **Lançamentos**: the entry log, newest first, each row showing the team, the value and the time.
  Tapping the value edits it in place; a delete action removes the row. Both recompute the whole
  scoreboard. Empty state: **"Nenhum ponto lançado ainda."**
- **Encerrar partida** finishes it; a finished match shows **Reabrir partida** instead. While
  finished, the scoreboard and log are visible but adding, editing and deleting are unavailable.
- **Apagar partida**, visually secondary, asks for confirmation before deleting.
- Unknown `:matchId` shows **"Partida não encontrada."** and a link back to home.

## Rules

### Contract changes

`GameDefinition` currently fixes `teamCount` and offers `targetOptions`. Replace with the setup
descriptor the screens read:

- `minTeams` / `maxTeams` / `defaultTeamCount`
- `teamNamePrefix: string` — default names are `` `${teamNamePrefix} ${index + 1}` ``, so any team
  count works
- `targetSuggestions: readonly number[]` — suggestions only. The field is free input
- `targetRequired: boolean`
- `supportsNegativeEntries: boolean` — whether the setup screen offers the toggle

`Match` gains `allowNegativeEntries: boolean`, resolved at creation.

Also narrow `GameId` from `string` to the union of the four planned ids
(`'canastra' | 'truco' | 'padel' | 'generico'`). A free string cannot catch a typo'd id, and the set
is known from `README.md`.

Canastra's definition: 2–6 teams (default 2), prefix `Dupla`, suggestions `[3000, 4000]`, target
required, negatives supported, numeric entry with no shortcuts.

### Scoring

- A team's total is the **sum of its entries**. Nothing is stored as a total, in the match or in
  storage. This holds after every edit and delete.
- Standings keep the **match's team order**, always. They are never re-sorted by score — positions
  jumping around mid-game is confusing and hides mistakes.
- The leader is the team with the highest total. With a tie for highest, no team is marked as leader.
- A match with no entries shows every team at `0`.

### Reaching the limit

- The match **never finishes by itself.** Crossing the limit changes the status line and nothing
  else; only the user finishes a match. A negative entry can legitimately pull a team back under.
- Exactly one team at or above the limit → that team is the winner in the status line.
- Two or more at or above → **no winner is declared**. The table decides.
- A match may be finished at any time, whether or not the limit was reached.

### Validation

Every rejection shows a specific message next to the field — never a silent no-op.

- Point limit: required, integer, greater than zero. Rejected → *"Informe quantos pontos para vencer."*
- Entry value: integer, not zero. Zero → *"Informe um valor diferente de zero."*
- Negative entry when the match does not allow it → *"Esta partida não permite pontos negativos."*
- Team name: empty or whitespace falls back to the default name for that position. Not an error.
- Duplicate team names are allowed.
- Value parsing accepts `,` and `.` as typed but stores an integer; non-numeric input is rejected.
- Validation of an entry value lives in a **pure, tested domain function** and is used by the UI —
  not inline in a component.

### Finished matches

While `finishedAt` is set, add, edit, delete of entries and team renaming are unavailable. Reopening
clears `finishedAt` and restores them.

## Acceptance criteria

- [ ] `npm run check` and `npm run build` pass
- [ ] `GameId` is a union of the four ids; `targetOptions` and `teamCount` no longer exist on
      `GameDefinition`
- [ ] `Match` has `allowNegativeEntries`; no total/score aggregate field was added anywhere
- [ ] Canastra is the only entry in `GAMES` and the home picker renders it from the registry, not
      from a hardcoded card
- [ ] A match can be created with 2, 3 and 6 teams; a test covers a team count other than 2
- [ ] The point limit is a free numeric input; the suggestions 3000 and 4000 fill it when tapped
- [ ] With negatives disabled, a negative entry is rejected with the exact message in **Validation**;
      with negatives enabled it is accepted and lowers the total — both covered by tests
- [ ] Entry value validation is a pure exported domain function with its own tests, and no component
      duplicates the rule
- [ ] Editing an entry's value updates the total; deleting one removes its contribution — both
      covered by tests
- [ ] Scoreboard tests cover: empty match, one team over the limit, two teams over the limit (no
      winner), and a negative entry pulling a team back under the limit
- [ ] Standings are returned in the match's team order, asserted by a test with unequal scores
- [ ] A finished match exposes no add/edit/delete affordance, and reopening restores them
- [ ] Reloading the page keeps matches, entries and settings (repository round-trip test)
- [ ] Unknown `:gameId` and unknown `:matchId` render their message instead of crashing
- [ ] Every user-visible string is pt-BR; no i18n library or locale file was added
- [ ] No file outside `games/` contains a canastra-specific rule

## Open questions

None. Canastra's internal point values remain unconfirmed but are not needed: the user types the
round total. That becomes a real blocker only if scoring shortcuts are ever specified.
