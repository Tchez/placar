# SPEC 002 — Canastra, first game end to end

- **Status:** done
- **Created:** 2026-08-22
- **Depends on:** SPEC 001

## Goal

The family can keep score of a real canastra game on a phone: create a match with the point limit
and house rules they agreed on, type each round's points, fix mistakes, and understand the state of
the table at a glance.

This is the first usable version of the app. It is also the SPEC that settles how a match is set
up, because canastra is where the family's house rules vary the most.

## Context

Read `README.md` (canastra section and the decisions table) and `CLAUDE.md`. SPEC 001 built the
skeleton: pure domain functions over an entry log, a repository behind an interface, a store, an
empty game registry.

What is specific to this SPEC:

- **House rules vary inside the same family.** Some tables play to 3000, others to 4000. Some let a
  team lose points, others only add. So the point limit and whether negatives are allowed are
  **chosen when the match is created**, not baked into the game definition.
- **Team count does not vary.** Canastra is always two sides, and the names written on paper are
  literally *Nós* and *Eles*. Those are the defaults, there is **no screen for entering them**, and
  renaming is deferred from the current UI. Asking for team names would be a screen that earns
  nothing in the common case.
- **Teams, not people.** Only team names are modelled. Individual player names are deliberately not
  part of the app.
- **The app does not know canastra's internal scoring.** The user types the round total (e.g. 385).
  The exact values the family uses for a clean/dirty canastra are still unconfirmed, which is why
  this SPEC ships **no scoring shortcuts** — inventing them would put wrong numbers in front of the
  family.
- The UI is Portuguese, no i18n layer.
- Match visuals are game-owned. Canastra uses its own dark-green card-table theme, typography and
  composition; it does not establish a project-wide match-screen design system for later games.
- The final interaction and information hierarchy incorporate direct phone testing and feedback
  from the family members who will use the scorekeeper at the table.

## Scope

**In**

- Contract changes needed for per-match setup (see **Rules → Contract changes**)
- The canastra `GameDefinition`, registered in `games/index.ts`
- Home screen: game picker + list of matches in progress
- New match screen: point limit and negatives toggle only
- Match screen: scoreboard, add entry, edit entry value, delete entry, finish and reopen the match,
  delete the match
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
- Renaming teams in the UI. The default names stay visible without an edit control for now
- **A variable team count.** No game needs one yet, so the mechanism is not built. It arrives with
  the game that actually requires it, not before
- Truco, padel, the generic game
- The finished-match history screen (SPEC 005). Only matches **in progress** are listed
- PWA, offline, deploy, statistics, player names, sync

## Behaviour

### Home — `/`

- The game picker lists the registered games as cards. With this SPEC that is a single card:
  **Canastra**, centered in the card. Tapping it opens the new match screen.
- Below it, **"Em andamento"**: one row per unfinished match, showing the team names, the
  point limit, when it started, and the current score. Tapping a row opens that match.
- When there is no match in progress the section is **not** rendered — no empty box.

### New match — `/nova/:gameId`

Only what actually changes from table to table is asked. Two controls:

1. **Pontos para vencer** — numeric field, **typed by the user**, empty by default. Two tappable
   suggestions next to it: **3000** and **4000**, which fill the field.
2. **Permitir pontos negativos** — toggle, **default off**.

The setup screen stays concise: it has no explanatory text below the toggle and no hint about the
default team names.

The **Placar** title in the persistent app header is the home action on setup, which does not repeat
it with an additional back/home link. The match hides that project header and provides its own back
action as part of the Canastra design. Not-found states keep their explicit recovery link.

**Começar partida** creates the match with the game's default team names and opens it. Disabled
until the point limit is valid. ID generation must work when a phone opens `npm run local` over
plain HTTP; creating a match must not depend on secure-context browser APIs. If persistence fails,
the form shows **"Não foi possível começar a partida. Tente novamente."** instead of silently doing
nothing.

There is no team-count control and no team-name field on this screen.

Unknown `:gameId` shows **"Jogo não encontrado."** and a link back to home — never a blank screen
or a crash.

### Match — `/partida/:matchId`

- **Game-owned frame**: the persistent project header is hidden. The Canastra header provides its
  own back action, a centered trophy, the **CANASTRA** title, the target and a functional log toggle.
  There is no decorative settings action and no duplicate home control.
- **Target pill**: an exact multiple of 1000 is abbreviated (`4000` → `META: 4K`, `3000` →
  `META: 3K`). Other targets stay exact and use pt-BR grouping (`3500` → `META: 3.500`); the UI never
  rounds the match's target.
- **Team identity**: the shared scoreboard stays in match order. *Nós* is always green and *Eles* is
  always gold; colour identifies the side and does not move with the lead. Team names are read-only
  and have no rename action in this version.
- **Main scores**: totals are large, centered, tabular and formatted with pt-BR grouping. Responsive
  size tiers keep zero, negative values and increasingly long totals fully visible without an
  ellipsis or collision with the center divider.
- **Distance to target**: directly below each main score, show only the remaining numeric value in
  a quieter style. It is `max(target - score, 0)`, so a team at or beyond the target shows `0`. The
  visible number has an accessible label such as `Faltam 1.250 pontos para Nós`.
- **Score difference**: the lower scoreboard row contains only the centered absolute difference
  between the two totals. Its accessible name is `Diferença de pontos: N`. A tie displays `0`.
- **Obrigada**: a team is in the canastra obrigada when `score >= target / 2`. Its main score gains
  stronger weight and emphasis. This state is derived from the target and entry log and is never
  persisted separately.
- **Derived match status** remains available to assistive technology:
  - `Faltam N pontos para <time>` while nobody reached the target;
  - `<time> venceu` when exactly one team is at or above the target;
  - `Empate na meta — a mesa decide` when both teams are at or above the target.
- **Lançar pontos**: a wide panel contains a segmented team selector followed by two equal labeled
  actions, **Adicionar** and **Remover**. Their `+`/`−` circles support the words instead of acting as
  isolated controls. **Remover** is disabled when the match does not allow negative entries.
- **Amount modal**: either launcher action opens an overlay without changing the page layout. It
  identifies the selected team, focuses a numeric input and has explicit Cancel and confirmation
  actions. **Adicionar** stores the typed magnitude as positive; **Remover** stores it as negative.
  A successful entry closes the modal, clears the value, returns focus to the trigger and advances
  the selector to the next team. Cancel, backdrop tap and `Esc` close without changing the match.
- **Lançamentos**: the editable history is open by default and can be hidden or shown from the
  header log toggle. Entries are newest first and show team, formatted value and time. Tapping a
  value edits it in place. Deleting an entry asks for confirmation, then recomputes the scoreboard.
  Empty state: **"Nenhum ponto lançado ainda."**
- **Match actions**: **Encerrar partida** finishes the match and becomes **Reabrir partida** while
  finished. **Apagar partida** sits close to that primary action as part of the same action group,
  remains visually secondary and asks for confirmation before deleting the match. A deliberate
  moderate gap separates this group from the launcher so the actions do not look attached to score
  entry.
- **Vertical composition**: the history is open by default, so the page expands inline when needed.
  Hiding it returns to the compact primary flow, which fits in a common phone viewport. There is no
  flexible spacer creating a large void after the launcher, and usable tap targets are preserved.
- **Finished state**: the scoreboard and log remain readable, but adding, editing and deleting
  entries are unavailable. Reopening restores those affordances.
- Unknown `:matchId` shows **"Partida não encontrada."** and a link back to home.

## Rules

### Contract changes

`GameDefinition` keeps `teamCount: number` — team count is declared by the game, not chosen by the
user. Changes:

- `defaultTeamNames: readonly string[]` — new. Length must equal `teamCount`; a match is created
  with these names
- `targetSuggestions: readonly number[]` — replaces `targetOptions`. Suggestions only; the field is
  free input
- `targetRequired: boolean` — new
- `supportsNegativeEntries: boolean` — new. Whether the setup screen offers the toggle

`Match` gains `allowNegativeEntries: boolean`, resolved at creation.

Also narrow `GameId` from `string` to the union of the four planned ids
(`'canastra' | 'truco' | 'padel' | 'generico'`). A free string cannot catch a typo'd id, and the set
is known from `README.md`.

Canastra's definition: `teamCount: 2`, `defaultTeamNames: ['Nós', 'Eles']`, suggestions
`[3000, 4000]`, target required, negatives supported, numeric entry with no shortcuts.

The runtime game registry extends the pure domain definition with a game-owned React match view.
The route loader resolves that view from the registry; it contains no canastra-specific branch.

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
- Value parsing accepts `,` and `.` as typed but stores an integer; non-numeric input is rejected.
- Validation of an entry value lives in a **pure, tested domain function** and is used by the UI —
  not inline in a component.

### Finished matches

While `finishedAt` is set, add, edit and delete of entries are unavailable. Reopening clears
`finishedAt` and restores them.

## Acceptance criteria

- [x] `npm run check` and `npm run build` pass
- [x] `GameId` is a union of the four ids; `targetOptions` no longer exists on `GameDefinition`,
      and `teamCount` is still there
- [x] `Match` has `allowNegativeEntries`; no total/score aggregate field was added anywhere
- [x] Canastra is the only entry in `GAMES` and the home picker renders it from the registry, not
      from a hardcoded card
- [x] The home game card shows only the game name, centered and without a description
- [x] The persistent **Placar** header is the only home action on setup; the game-owned match view
      hides it and supplies its own back action
- [x] A new canastra match is created with exactly two teams named `Nós` and `Eles`, asserted by a
      test; the new-match screen has no team-count and no team-name control
- [x] Team names are read-only on the scoreboard and no rename control is rendered
- [x] The point limit is a free numeric input; the suggestions 3000 and 4000 fill it when tapped
- [x] The match target pill abbreviates only exact thousands and preserves any other target exactly
      with pt-BR grouping
- [x] Negative points start deselected, and the setup screen has no helper or default-team hint
- [x] Starting a match works over plain HTTP on the local network and navigates to the match; a
      persistence failure renders a visible error
- [x] With negatives disabled, **Remover** is unavailable and the domain validator rejects
      a negative entry with the exact message in **Validation**; with negatives enabled subtraction
      is accepted and lowers the total — all covered by tests
- [x] Entry value validation is a pure exported domain function with its own tests, and no component
      duplicates the rule
- [x] Editing an entry's value updates the total; deleting one removes its contribution — both
      covered by tests
- [x] Scoreboard tests cover: empty match, one team over the limit, two teams over the limit (no
      winner), and a negative entry pulling a team back under the limit
- [x] Zero and multi-digit score values stay centered and fully visible without an ellipsis
- [x] Each team shows only its numeric distance to the target below its score; the lower scoreboard
      row shows the absolute score difference with an accessible label, including `0` for a tie
- [x] Reaching half the target visually emphasizes that team's score as being in the obrigada
- [x] Canastra's match view and styles are owned under `games/`; the generic route resolves the view
      from the registry without a canastra conditional
- [x] The Canastra screen follows its dark-green/gold game identity, keeps *Nós* green and *Eles*
      gold regardless of the lead, centers the trophy and hides the project header
- [x] The editable log is open by default and its header action hides and shows it; the wide launcher
      uses labeled **Adicionar** and **Remover** actions, and each opens a contextual value modal.
      Removal remains unavailable when negatives are disabled
- [x] The amount modal focuses the numeric input, validates through the domain function, closes via
      Cancel, backdrop or `Esc`, restores focus, and advances the team only after a successful entry
- [x] With history hidden, the primary flow fits a common phone viewport. A moderate gap
      separates launcher from match actions, while **Apagar partida** stays close to
      **Encerrar/Reabrir partida**; the default open history is what expands the inline page
- [x] Entry deletion and match deletion require confirmation; finishing is reversible through
      **Reabrir partida**
- [x] Standings are returned in the match's team order, asserted by a test with unequal scores
- [x] A finished match exposes no add/edit/delete affordance, and reopening restores them
- [x] Reloading the page keeps matches, entries and settings (repository round-trip test)
- [x] Unknown `:gameId` and unknown `:matchId` render their message instead of crashing
- [x] Every user-visible string is pt-BR; no i18n library or locale file was added
- [x] No file outside `games/` contains a canastra-specific rule

## Open questions

None. Canastra's internal point values remain unconfirmed but are not needed: the user types the
round total. That becomes a real blocker only if scoring shortcuts are ever specified.
