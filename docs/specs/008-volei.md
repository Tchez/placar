# SPEC 008 — Vôlei

- **Status:** ready
- **Created:** 2026-09-09
- **Depends on:** SPEC 001 (project setup and architectural skeleton)

## Goal

A family member picks vôlei from the home screen and gets a courtside-style counter: two cards
with no team name, points in the current set as a big number, sets won as a small number next to
them. Sets close by tapping the sets counter itself — the app never knows or checks a target. A
single "Corrigir ponto" button undoes the last thing that happened, of any kind. Unlike every other
game in the app, a vôlei match does **not** land in the app's history automatically; the family
decides to keep it, and if they don't, it is gone for good.

## Context

Read `README.md` (*Product decisions*, *How each game counts → Vôlei*) and `CLAUDE.md`
(*Architecture principles*) first. This section only adds what those two do not already say.

**Existing architecture this SPEC builds on (do not redesign it):**

- `Match.entries` is an ordered log (`src/domain/match.ts`); every displayed score is derived from
  it (architecture principle 1). Vôlei keeps this: points, set wins and point resets are all just
  entries appended to the same log for the same match.
- `MatchStore` (`src/store/MatchStore.tsx`) already persists a match the instant it is created and
  after every `addEntry`/`removeEntry`. **Nothing new is needed to survive an app kill or an
  accidental tab close** — in-progress vôlei points are never at risk of being lost, regardless of
  whether the match is ever explicitly saved to history.
- `HistoryScreen` currently lists **every match ever created**, finished or not — there is no
  filter today beyond `showOutcome` cosmetics for finished ones. This SPEC changes that screen's
  filter, but **only for vôlei**; every other game must keep showing up unconditionally, exactly as
  today.
- `ActiveMatchesScreen` ("Em andamento" on the home screen) filters only on `finishedAt === null`
  and is untouched by this SPEC — an unsaved, in-progress vôlei match still shows up there so the
  family can resume it.

**Why history is opt-in only for vôlei:** the owner's reasoning is that a casual family vôlei match
does not usually need to be remembered — unlike canastra or truco, where "quem ganhou a última" is
the whole point of the app. This is a deliberate exception scoped to vôlei alone; canastra and
truco keep saving every match unconditionally. Extending opt-in history to truco is a possible
future decision, not part of this SPEC.

## Scope

**In**
- The vôlei game definition and its own match screen (own `MatchView`, following the pattern of
  `TrucoGauderioMatchView`)
- Two teams, no name, no rename affordance
- Point entry (`+1` per side) and set entry (tap the sets counter) as two independent, manual
  tallies
- A "zerar" (reset to zero) action on each side's point counter
- A single shared "Corrigir ponto" undo, popping the last log entry regardless of its kind
- The opt-in save-to-history flow: a hidden "Salvar partida" action, a save/discard prompt on exit
  or on finishing an unsaved match, and real deletion on discard
- `HistoryScreen` filtering vôlei matches by whether they were saved

**Out**
- Any target, set-count validation, automatic set/match winner, or best-of-N logic — the table
  decides all of that, the app only counts (see `regras/volei.md` in the owner's vault, inlined
  above and in *Rules*)
- Serve, rotation, or who scored the point
- Editing an arbitrary past entry (only "undo the last thing" exists, matching every other game's
  correction affordance today)
- Renaming teams (there is no name to rename)
- Generalizing opt-in history to any other game
- Any automatic cleanup of vôlei matches that are never saved, discarded, or deleted — they simply
  sit under "Em andamento" until the family acts

## Behaviour

### Match screen, in progress

Two cards, one per team, no header text (no team name of any kind — this differs from every other
game, which shows "Nós"/"Eles"):

- A small **sets** number. Tapping it adds one set win for that side. It does **not** reset either
  side's point counter.
- A large **points** number: the current set's score for that side. A `+1` button below it adds one
  point. A small "zerar" control resets that side's point counter to zero — with no confirmation
  dialog (unlike "Apagar partida", this is routinely correctable through the shared undo, so it
  gets no separate confirmation).
- Centered between the two cards: **"Corrigir ponto"**, a single undo shared by the whole match. It
  removes the most recent log entry — a point, a set, or a zerar, whichever happened last, for
  whichever side it belongs to — and can be pressed repeatedly to keep walking back through the
  match.
- Top-left: back arrow ("Voltar ao início"). Top-right: a history-icon shortcut into the app's
  `HistoryScreen`, per the owner's visual reference.
- Below the cards: **"Encerrar partida"**, and a "Mais opções" entry point (reuses the existing
  options-sheet pattern from `TrucoGauderioMatchView` — a gear/options icon opening a small sheet)
  containing:
  - **"Salvar partida"** — marks the match to be kept in history, with no other side effect (does
    not finish the match). Once a match is saved this way, this row is inert/hidden — there is no
    "unsave", only "Apagar partida" removes a saved match.
  - **"Apagar partida"** — the standard app-wide destructive action (confirmation dialog, real
    deletion), unchanged from every other game.

No score ceiling, no automatic winner, no button ever disables because of the score's value —
buttons are only disabled while a write is in flight, matching the existing `isSaving` pattern.

### Leaving without having saved

This is the behaviour that makes vôlei different from every other game. It applies **only** while
the match has not yet been explicitly saved (neither through "Salvar partida" nor through a
previous "sim" on this same prompt):

- Tapping the back arrow **or** "Encerrar partida" opens a prompt: **"Salvar esta partida no
  histórico?"**
  - **Sim:** the match is marked as saved. If the trigger was "Encerrar partida", the match is also
    finished (`finishedAt` set), same as finishing works for every other game today. If the trigger
    was the back arrow, the match stays in progress (not finished) and simply becomes visible in
    `HistoryScreen` from now on.
  - **Não:** the match is deleted outright — the same real removal "Apagar partida" performs
    elsewhere in the app. Nothing about it survives, visibly or not: it must not remain readable
    from any screen, including `HistoryScreen`, `ActiveMatchesScreen`, or by reopening the app.
- Once a match has been saved (by either path), the back arrow and "Encerrar partida" never ask
  again — they behave exactly like they do for every other game (navigate home; finish the match).
- If the family closes the tab, kills the app, or navigates away outside of this in-app flow
  entirely (no back-arrow tap, no "Encerrar partida" tap), nothing is asked and nothing is deleted:
  the match simply remains in storage, unsaved, `finishedAt` still `null`. It keeps showing under
  "Em andamento" on the home screen so it can be resumed, and stays absent from `HistoryScreen`
  until the family explicitly decides its fate.

### After "Encerrar partida"

No winner is declared — the app never picks one for vôlei (see *Rules*). The screen keeps showing
the same scoreboard with an "Encerrada" indicator and a "Reabrir partida" toggle, following the
same pattern already shipped for canastra (`CanastraMatchView`), not the separate winner-screen
pattern used by truco gaudério.

### History screen

`HistoryScreen` keeps listing every match of every other game exactly as it does today. For vôlei
specifically, it lists only matches that have been saved (per the flow above). Nothing else about
the screen changes — same sorting, same `showOutcome` behaviour for finished matches.

## Rules

- **The entry log carries three kinds of event per team, distinguished by `Entry.note`:**
  a point (`note: ''`, `value: 1`), a set win (`note: 'set'`, `value: 1`), and a point reset
  (`note: 'zerar'`, `value: 0`). This is the smallest change that fits the existing `Entry` shape —
  `note` is already free-text and unused by every other game.
- **Sets won**, per team: the count of that team's `'set'`-tagged entries in the whole log.
- **Current set points**, per team: the count of that team's point entries (`note: ''`) that come
  **after** that same team's most recent boundary entry (`'set'` or `'zerar'`), or all of them if it
  has no boundary entry yet. This is computed independently per team — a boundary on one side never
  affects the other side's tally, matching "tapping sets does not zero either side's points".
- **Undo removes the single most recent entry in the whole match log**, regardless of which team it
  belongs to or which of the three kinds it is. Because every displayed number is derived from the
  log (architecture principle 1), removing a boundary entry naturally restores whatever point count
  existed right before it — no special-casing is needed to make undo correct for sets or resets.
- **The app never determines a winner**, of a set or of the match. `scoreboard(match).winnerTeamId`
  is always `null` for vôlei; ending the match is exclusively the "Encerrar partida" action, decided
  by the table.
- **Saved-to-history is a new field on `Match`** (e.g. `savedToHistory: boolean`), defaulting to
  `true`. Every other game always creates matches with it `true` and never changes it, so their
  behaviour is provably unaffected. Vôlei is the only game that creates matches with it `false` and
  the only one with UI that can flip it. `HistoryScreen`'s filter treats a missing value (any match
  already stored before this SPEC ships) as `true`, so no existing match disappears from history.
- **Do not bump the local-storage schema version to add this field.** A version bump makes
  `parsePayload` (`src/storage/localRepository.ts`) reject every previously stored match outright,
  which would silently wipe the family's existing canastra/truco/gaudério history — a mistake with
  no acceptable UI recovery. Treat the field as optional at the storage boundary and default it to
  `true` wherever it is read.
- **Discarding ("não" on the save prompt) is a real delete**, going through the same repository
  removal every other "Apagar partida" uses — not a hidden flag, not a soft delete.
- No target, no ceiling, no negative points: `+1` and set-taps are the only ways a number goes up;
  "zerar" and undo are the only ways a number goes down.

## Acceptance criteria

- [ ] Vôlei match cards show no team name — no "Nós"/"Eles" or any other label — only the numbers
- [ ] Tapping `+1` increases that side's current-set points by one; tapping the sets counter
      increases that side's sets by one and leaves both sides' current-set points unchanged
- [ ] "Zerar" resets one side's current-set points to zero without a confirmation dialog
- [ ] "Corrigir ponto" undoes the single most recent action in the match (point, set, or zerar) on
      whichever side it happened, and can be pressed repeatedly to keep undoing further back;
      undoing a set-tap restores the current-set points that side had right before that tap
- [ ] A brand-new vôlei match does not appear in `HistoryScreen`
- [ ] A brand-new vôlei match does appear in "Em andamento" on the home screen, and survives a
      full app reload with all of its points intact, even though it was never saved
- [ ] Tapping "Salvar partida" in "Mais opções" makes the match appear in `HistoryScreen`
      immediately, without finishing it
- [ ] Tapping the back arrow on an unsaved match prompts to save; choosing "não" removes the match
      so that it no longer appears anywhere (home, history, or after reloading the app)
- [ ] Tapping the back arrow on an unsaved match and choosing "sim" keeps the match in progress
      (not finished) and makes it appear in `HistoryScreen`
- [ ] Tapping "Encerrar partida" on an unsaved match prompts to save; "sim" finishes the match and
      saves it, "não" deletes it entirely
- [ ] Tapping the back arrow or "Encerrar partida" on an already-saved match does not prompt again
- [ ] After "Encerrar partida", the screen shows an "Encerrada" state with no declared winner and a
      way to reopen, matching the canastra pattern
- [ ] Every match created by every other game (canastra, truco mineiro, truco gaudério) still
      appears in `HistoryScreen` exactly as before this SPEC

## Open questions

None. All product questions this game raised (`regras/volei.md` in the owner's vault) were closed
in the 2026-09-09 interview before this SPEC was written.
