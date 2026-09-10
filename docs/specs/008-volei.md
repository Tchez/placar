# SPEC 008 — Vôlei

- **Status:** done
- **Created:** 2026-09-09
- **Depends on:** SPEC 001 (project setup and architectural skeleton)

## Goal

A family member picks vôlei from the home screen and gets a landscape courtside-style counter:
two cards with no team name, points as the large numbers and sets won as smaller central numbers.
The same interface rotates 90 degrees in a portrait viewport, so it remains usable with system
auto-rotation disabled. Tapping a points or sets counter adds one to that counter without changing
the other counters; each side can have at most 50 points and three sets. Each side has controls to
go back one point, go back one set and zero its current points. The app never knows or checks a
target. Unlike every other game in the app, a vôlei match does **not** land in the app's history
automatically; the family decides to keep it, and if they don't, it is gone for good.

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
- One landscape layout, rotated clockwise with CSS in portrait, including the options and save dialogs
- Two teams, no name, no rename affordance
- Point entry (tap the points counter) and set entry (tap the sets counter) as two independent,
  manual tallies, with a maximum of 50 points and three sets per side
- A "zerar" (reset to zero) action on each side's point counter
- A "Voltar ponto" control and a "Zerar pontos" control on each point card
- A "Voltar set" control under each set counter, removing one set for that side
- The opt-in save-to-history flow: a hidden "Salvar partida" action, a save/discard prompt on exit
  or on finishing an unsaved match, and real deletion on discard
- `HistoryScreen` filtering vôlei matches by whether they were saved

**Out**

- Any target, automatic set/match winner, or best-of-N logic — the table decides all of that, the
  app only counts. The only set-count rule is the three-set maximum required by this counter.
- Serve, player rotation, or who scored the point
- A separate portrait layout, fullscreen requirements, or programmatic system orientation locking
- Editing an arbitrary past entry (the correction controls only remove the latest applicable point
  or set for their side)
- Renaming teams (there is no name to rename)
- Generalizing opt-in history to any other game
- Any automatic cleanup of vôlei matches that are never saved, discarded, or deleted — they simply
  sit under "Em andamento" until the family acts

## Behaviour

### Orientation

The match always uses one landscape arrangement. In a portrait viewport, CSS rotates the complete
interface clockwise by 90 degrees and swaps its available width and height. The family turns the
phone to read it; enabling system auto-rotation is unnecessary. In a landscape viewport, the same
layout displays without CSS rotation.

Points, sets, the header, options and save prompt all follow this orientation. Dialogs remain fully
usable when the viewport changes orientation while they are open. Dimensions and safe-area insets
follow the counter's logical landscape axes, and controls retain at least 44 × 44 CSS-pixel tap targets.
There is no fullscreen or Screen Orientation API requirement. The PWA manifest allows device
rotation; browser chrome and native system dialogs retain their system orientation. Leaving the
match restores the destination screen's normal layout.

### Match screen, in progress

Two large point cards, one per team, with no team names. Between them, two smaller set counters
sit beneath the centered `SETS` label:

- A small **sets** number. Tapping it adds one set win for that side, up to three. At three sets
  the counter is disabled. It does **not** reset either side's point counter. A separate
  **"Voltar set"** control under each counter removes that side's latest set, returning the counter
  to two.
- A large **points** number: the current set's score for that side. Tapping the points card adds
  one point, up to 50. At 50 points the card is disabled. Beside the point card's existing small
  action area, **"Voltar ponto"** removes that side's latest point in the current set and
  **"Zerar pontos"** resets the current-set counter to zero. Both actions use distinct icons and
  accessible labels; neither opens a confirmation dialog. Reduction uses a clear **−1** symbol;
  reset uses a restart arrow around **0** with the visible label **"Zerar"**. Both have distinct
  button surfaces and at least 44 × 44 CSS-pixel tap targets. Set correction uses the same −1 symbol.
- Top-left: back arrow ("Voltar ao início"). Top-right: a "Mais opções" gear opening a small
  options sheet, following the supplied reference and the existing gaudério interaction pattern.
- Centered below the sets and correction controls: **"Encerrar partida"**. The options sheet contains:
  - **"Histórico de partidas"** — navigates to `HistoryScreen` without saving or discarding.
  - **"Salvar partida"** — marks the match to be kept in history, with no other side effect (does
    not finish the match). Once a match is saved this way, this row is hidden — there is no
    "unsave", only "Apagar partida" removes a saved match.
  - **"Apagar partida"** — the standard app-wide destructive action (confirmation dialog, real
    deletion), unchanged from every other game.

No automatic winner. The points card disables at 50 points and the sets counter disables at three
sets, while "Voltar ponto", "Zerar pontos" and "Voltar set" disable when their corresponding
counter has nothing to remove. All controls are also disabled while a write is in flight, matching
the existing `isSaving` pattern.

Options and save dialogs contain keyboard focus. Escape or a tap outside dismisses them without
changing the match and returns focus to the triggering control. Dismissal is unavailable while a
write is in flight. A failed write shows an error, preserves stored data and allows retry.

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
  - **Cancelar:** dismisses the prompt and returns to the match without saving, finishing or deleting.
- Once a match has been saved (by either path), the back arrow and "Encerrar partida" never ask
  again — they behave exactly like they do for every other game (navigate home; finish the match).
- If the family closes the tab, kills the app, or navigates away outside of this in-app flow
  entirely (no back-arrow tap, no "Encerrar partida" tap), nothing is asked and nothing is deleted:
  the match simply remains in storage, unsaved, `finishedAt` still `null`. It keeps showing under
  "Em andamento" on the home screen so it can be resumed, and stays absent from `HistoryScreen`
  until the family explicitly decides its fate.

The prompt explains that choosing "Não" deletes the match. Saving and finishing together are
persisted in one write, so a failed save does not leave the match partially finished.

### After "Encerrar partida"

No winner is declared — the app never picks one for vôlei (see *Rules*). The screen keeps showing
the same scoreboard with an "Encerrada" indicator and a "Reabrir partida" toggle, following the
same pattern already shipped for canastra (`CanastraMatchView`), not the separate winner-screen
pattern used by truco gaudério. Point entry and correction controls are hidden, and set entry is
disabled until the match is reopened.

### History screen

`HistoryScreen` keeps listing every match of every other game exactly as it does today. For vôlei
specifically, it lists only matches that have been saved (per the flow above). Nothing else about
the screen changes — same sorting, same `showOutcome` behaviour for finished matches.

## Visual direction

The screen follows a landscape courtside flip counter: near-black background, graphite plates
with inset edges, stacked sheets and dark metallic rings, large condensed yellow points, clickable
point plates, and two smaller white set counters under a centered `SETS` label. Reset
icons sit at the bottom-right of each plate. No team names are displayed.

The set counters and their correction controls sit above "Encerrar partida". A back arrow occupies
the top-left; the top-right gear opens a popover with history, save and delete rows. The complete
composition uses the single-layout rotation behaviour above.

Point and set changes turn a whole paper sheet around its upper binding, revealing the next number
with perspective and a brief moving shadow (about 360 ms). Removing a point or set turns the sheet back;
zeroing returns directly to zero with one reverse turn. The rings and correction buttons stay still.
Only persisted score changes animate, never the initial render or a failed write. Point writes must
not dim, blink or restart the unchanged set numbers: the set paper stays outside the temporarily
blocked entry button, as on the point cards. Set controls preserve their native disabled state
during unrelated writes: `aria-disabled` announces the temporary block and the shared busy guard
rejects clicks, while native `disabled` remains reserved for zero/cap/finished states. Unchanged
paper components skip parent-driven rerenders. Rapid taps keep
counting during the animation and show the latest score without queuing old turns. Reduced-motion
preferences replace the turn with an immediate number update. This refinement was requested by
the owner during review on 2026-09-10.

Resting numbers remain in a normal 2D layer. Perspective belongs only to the transient turning
sheet, so an earlier set turn does not leave its unchanged number inside a shared 3D context when
points are added. Check this in the local development server as well as the production build.

Decoration is generated locally and available offline, with no new runtime dependency. Existing
self-hosted Archivo supplies the typography. Verify the implementation by rendering phone
viewports at DPR 2, including the rotated options and save dialogs.
The hub and match lists use an original outlined volleyball icon: a circular silhouette with three
curved groups of panels, legible at the existing small badge size. This replaces the initial angular
seams, following the owner's 2026-09-10 review; the shared icon updates both badge sizes.

## Rules

- **The entry log carries three kinds of event per team, distinguished by `Entry.note`:**
  a point (`note: ''`, `value: 1`), a set win (`note: 'set'`, `value: 1`), and a point reset
  (`note: 'zerar'`, `value: 0`). This is the smallest change that fits the existing `Entry` shape —
  `note` is already free-text and unused by every other game.
- **Sets won**, per team: the count of that team's `'set'`-tagged entries in the whole log.
- **Current set points**, per team: the count of that team's point entries (`note: ''`) that come
  **after** that same team's most recent reset entry (`'zerar'`), or all of them if it
  has no reset entry yet. This is computed independently per team — a reset on one side never
  affects the other side's tally. Set entries never establish a new point-count baseline.
- **Voltar ponto removes the latest point entry for that team after its latest `zerar` entry.** It
  changes no other team's score and cannot remove points from an earlier set baseline.
- **Zerar pontos appends a `zerar` entry** for that team, making the current point count zero. It is
  disabled when the current point count is already zero.
- **Voltar set removes the latest `set` entry for that team.** It changes no point count and is
  disabled when that team has no set to remove. Because every displayed number is derived from the
  log (architecture principle 1), each correction remains consistent after persistence and reload.
- **The app never determines a winner**, of a set or of the match. `scoreboard(match).winnerTeamId`
  is always `null` for vôlei; ending the match is exclusively the "Encerrar partida" action, decided
  by the table.
- **Saved-to-history is stored in `Match.savedToHistory`**, defaulting to
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
- No target, no negative points, no more than 50 points and no more than three sets per side:
  point-card taps and set-taps are the only ways a number goes up; "Voltar ponto", "Voltar set"
  and "Zerar pontos" are the ways a number goes down or returns to zero.

## Acceptance criteria

- [x] Point and set changes show a short bound-paper turn, including reverse corrections, with no turn on
      initial load or failed writes; rapid taps and reduced motion preserve the correct score
- [x] Correction buttons clearly distinguish −1 from resetting to 0, with a visible "Zerar" label,
      accessible names and 44 × 44 CSS-pixel minimum touch targets in both orientations
- [x] A portrait viewport shows the same landscape counter rotated 90 degrees, including the options
      and save dialogs; scoring, corrections and navigation stay usable without enabling system rotation
- [x] Vôlei match cards show no team name — no "Nós"/"Eles" or any other label — only the numbers
- [x] Tapping a points card increases that side's current-set points by one; tapping the sets
      counter increases that side's sets by one and leaves both sides' current-set points unchanged
- [x] Each side's points counter stops at 50
- [x] Each side's sets counter stops at 3; its "Voltar set" control removes the latest set for that
      side
- [x] "Voltar ponto" removes the latest current-set point for that side, and "Zerar pontos"
      resets that side's current-set points to zero without a confirmation dialog
- [x] A brand-new vôlei match does not appear in `HistoryScreen`
- [x] A brand-new vôlei match does appear in "Em andamento" on the home screen, and survives a
      full app reload with all of its points intact, even though it was never saved
- [x] Tapping "Salvar partida" in "Mais opções" makes the match appear in `HistoryScreen`
      immediately, without finishing it
- [x] Tapping the back arrow on an unsaved match prompts to save; choosing "não" removes the match
      so that it no longer appears anywhere (home, history, or after reloading the app)
- [x] Tapping the back arrow on an unsaved match and choosing "sim" keeps the match in progress
      (not finished) and makes it appear in `HistoryScreen`
- [x] Tapping "Encerrar partida" on an unsaved match prompts to save; "sim" finishes the match and
      saves it, "não" deletes it entirely
- [x] Tapping the back arrow or "Encerrar partida" on an already-saved match does not prompt again
- [x] After "Encerrar partida", the screen shows an "Encerrada" state with no declared winner and a
      way to reopen, matching the canastra pattern
- [x] Every match created by every other game (canastra, truco mineiro, truco gaudério) still
      appears in `HistoryScreen` exactly as before this SPEC

## Open questions

None.

## Validation

See [the validation record](../validation/008-volei.md) for automated acceptance coverage,
production offline checks and DPR-2 phone screenshots of the landscape counter, its portrait
rotation and both dialogs.
