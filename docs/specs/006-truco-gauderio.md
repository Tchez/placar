# SPEC 006 — Truco gaudério

- **Status:** done
- **Created:** 2026-08-23
- **Depends on:** SPEC 003 (per-game theming, per-game match view, tally scoreboard, shared finish and
  delete), SPEC 005 (home cards rendered from the registry, *Em andamento* list)

## Goal

The family can keep score of a truco gaudério game on what looks like a rough gaúcho tally board:
two sides, points drawn as matchsticks, one big tap per point, and nothing else. The app counts and
never claims to know the game — no flor, no envido, no special hands. A game played to 12 and a game
played to 24 use the same screen, because the screen simply stops at 24.

## Context

Read `README.md` and `CLAUDE.md` first.

Truco gaudério is a **separate game from truco mineiro**, not a setting on it. The project's criterion
is that a difference in *rule* makes a different game, while a difference in *table agreement* makes
match configuration. Mineiro and gaudério score differently, so they are two games with two cards.

What makes this SPEC unusual: **it has almost no rules and a completely new screen.** That is the
inverse of the normal shape, so estimate the screen, not the domain.

- **The app knows no rule of the game.** SPEC 003 gave mineiro exactly one rule beyond adding (the
  mão de onze, because it changes which points are available). Gaudério gets **none**. No flor, no
  envido, no equivalent of the mão de onze, no raising ladder.
- **Unit increments only.** `+1` and `−1`. There is no `+3 / +6 / +9 / +12` sheet.
- **There is no target.** The table plays to 12 or to 24 and the app neither knows nor asks. **24 is a
  ceiling on the display and the controls**, and a ceiling of 24 covers a 12-point game too.
- **No setup screen**, exactly as mineiro: nothing varies between tables, so the card opens the match.
- **Teams are fixed.** `Nós` and `Eles`, read-only. There is no rename affordance anywhere.
- **Teaching it the rules later is conditional, not debt.** The owner's position is that counting alone
  may be the finished product. Do not leave TODOs implying a missing feature.

This SPEC also removes padel. Padel was dropped on 2026-08-23 because the courts the family plays on
already have a physical counter on the wall. `GameId` still carries `'padel'`; it goes.

### What this SPEC reuses rather than invents

SPEC 003 already built the machinery this game needs, so **no new mechanism is required**:

- **Per-game match view.** `GameDefinition.MatchView` already lets a game own its header, scoreboard,
  scoring controls and finished state. The route supplies data and shared actions and imposes no
  visible shell.
- **Per-game theming.** The match route already sets `data-game="<gameId>"`, and per-game token
  overrides live in `styles/games/<gameId>.css` scoped to that attribute. No game colour is written
  inline or in a component.
- **`needsSetup: boolean`** already exists and is `false` for mineiro.
- **Tally-as-score** is already the established truco idiom, including "no digit is drawn anywhere".
- **Fonts** Roboto Slab and Archivo are already self-hosted and precached. This SPEC adds no font.
- **Shared finish, reopen and delete** already exist with shared confirmation wording.

### Assumptions carried from the interview

Two behaviours below were **inferred and then approved in the interview briefing**, not stated
verbatim by the owner. Recorded so nobody later mistakes them for direct instruction:

1. **At 24 the app shows the winner but does not finish the match by itself**, and `+1` becomes
   unavailable for **both** teams. The owner said both "do it like truco mineiro" and "it only ends on
   reaching 24 or by ending it manually"; SPEC 003 states explicitly that the app never finishes a
   match on its own, so the crossing was resolved on the mineiro side.
2. **Nothing is announced during play**; the winner appears only on the finished screen, reusing the
   SPEC 003 strings. The owner's "it does not need to show a winner" was read as scoping the *target*,
   not as forbidding the end-of-match hero.

No reference image is kept in the repo. The composition, the tally figure and every control placement
are written out below, which is the only form that survives.

The UI is Portuguese, no i18n layer.

## Scope

**In**

- The truco gaudério `GameDefinition`, registered in `games/index.ts`
- `GameId` gains the gaudério id and **loses `'padel'`**
- Direct-to-match flow: no setup screen for this game
- A gaudério-owned match view: gaúcho header, matchstick scoreboard, `+1` and `−1` per team, and
  *Desfazer último*
- A score ceiling of **24**, expressed in the game definition and applied to the controls
- **Opções da partida** exposing *Encerrar partida*, *Resetar pontos* and *Apagar partida*
- **Resetar pontos**: a new action that clears the current match's entries and keeps the match
- A gaudério-owned finished-match presentation
- `styles/games/<gameId>.css` with the gaudério tokens
- Tests per `CLAUDE.md`'s testing policy

**Out** — explicitly, so it does not get built by accident

- **Every rule of the game.** Flor, envido, anything equivalent to the mão de onze or mão de ferro.
  This is a deliberate product position, **not** a deferred feature: do not scaffold for it
- **Team renaming.** `Nós` and `Eles` are read-only, and no rename lives in the options either
- **A raising ladder**, and any negative ladder. *Desfazer último* covers correction
- **An entry log UI**, and editing an individual past entry — as in mineiro
- **Undoing *Resetar pontos***. The shared confirmation is the only protection; *Desfazer último*
  reaches entries, not the reset
- **A configurable target, and any setup screen.** The 24 ceiling covers the 12-point game
- **Any mid-game announcement.** No special state, no winner banner during play, no status text
- **Changing truco mineiro.** Its screen, its rules and its tokens are untouched
- **Vôlei.** It is planned as SPEC 008 and its set-closing rule is still an open product question
- Reproducing device chrome, phone frames or status bars
- Third-party or network-fetched decoration. The surface textures are **generated in this repo** by
  `npm run textures` and committed: no stock image is vendored, nothing is downloaded at runtime, and
  the whole screen still works offline on first load

## Behaviour

### Home — `/`

A third game card, **Truco gaudério**, rendered from the registry like the others. SPEC 005 already
requires that adding a game to the registry adds a card with no screen edit, so this card must appear
without touching `HomeScreen`.

Tapping it creates a match with teams **Nós** and **Eles** and opens it immediately — no intermediate
screen. Leaving the app and returning keeps the match in progress, and it appears in the home's
*Em andamento* section like any other unfinished match.

### Normal match — `/partida/:matchId` (gaudério)

- **Game header**: a gaudério-owned header on a rough dark plank, with a back action, the centered
  title **Truco gaudério**, and an action labelled accessibly as **Opções da partida**. A small
  gaúcho-hat ornament sits above the title and a thin flourish below it; both are decorative and
  hidden from the accessibility tree.
- **Team identity**: *Nós* is always the green left side, *Eles* always the red right side. Colour
  identifies the side and never swaps with the lead. Each name sits on a banner with clipped ribbon
  ends and a small diamond either side of the name. Team names are read-only.
- **Scoreboard**: two equal columns separated by a full-height braided vertical divider with a diamond
  at its midpoint. Each score is drawn only as **matchsticks** — see *Visual direction → The score is
  matchsticks*. No digit is drawn anywhere.
- **Primary scoring**: one large `+1` button at the foot of each column, filled with that team's
  colour. The entire control, not only its label, is the tap target.
- **Correction**: one smaller, dark, recessive `−1` below each `+1`. Disabled at zero.
- **Desfazer último**: one quiet full-width action below both columns, removing the **last** entry of
  the match. Disabled when there are no entries.
- **At 24**: as soon as either team reaches 24, **both** `+1` controls become unavailable and stay
  visible in a clearly disabled state. `−1` and *Desfazer último* remain active, so a wrong 24 is
  correctable. The winner state is derived, but the match stays live and the screen stays the normal
  screen — the app does not finish it.
- **No status text**: the score is never restated as words, and no state is announced during play.
- **No entry log**: no list, history section, count badge or per-entry edit affordance.

On a common phone viewport the header, banners, matchsticks, `+1`, `−1` and *Desfazer último* fit
without horizontal scrolling. Shorter screens may scroll vertically; controls must never shrink below
their minimum tap target to force a single-screen fit.

The composition is:

```text
┌──────────────────────────────────┐
│ ‹       Truco gaudério        ⚙ │
├──────────────────────────────────┤
│   NÓS banner    │   ELES banner │
│                 │               │
│  ⊠ ⊠ boxes      ◇   ⊠ boxes     │
│  │ │ loose      │   │ │ │ loose │
│                 │               │
│      +1         │       +1      │
│      −1         │       −1      │
│                                  │
│         ↶ DESFAZER ÚLTIMO        │
└──────────────────────────────────┘
```

### Opções da partida

A gaudério-themed sheet or menu over the match, with three rows and a close action. Browser back and
`Esc` close it without changing the match.

- **Encerrar partida** — finishes the match. Same effect as mineiro's finish.
- **Resetar pontos** — clears every entry of this match and keeps the match itself. Requires the
  **shared** destructive confirmation: same wording pattern, same placement and same behaviour as
  *Apagar*, because it destroys the count. After confirming, the board returns to zero matchsticks and
  the match is still the same match, still in progress. **This cannot be undone.**
- **Apagar partida** — deletes the match, using the shared confirmation from SPEC 002.

*Resetar pontos* and *Apagar partida* must be visually and textually distinguishable: one empties the
board, the other removes the match. A person who wanted to start a fresh game must not delete their
history by mistake.

### Finished match

Once the user chooses **Encerrar partida**, score entry is unavailable and the same route presents a
gaudério-owned conclusion screen:

- The header says **Fim de partida**.
- A hero panel says **NÓS VENCEMOS!** or **ELES VENCERAM!** when the rules yield one winner. If the
  user finished before a winner could be derived, or both teams sit at 24, it says
  **PARTIDA ENCERRADA**. The UI never invents a winner.
- A compact read-only two-column board keeps the banners, the divider and the final matchsticks. It
  does not replace them with numerals.
- **Nova partida** is the dominant action. It creates a new gaudério match with the same fixed teams
  and opens it; the finished match remains persisted.
- **Reabrir** and **Apagar** are secondary actions below it. Reopening clears `finishedAt` and returns
  to the derived live state. Deleting uses the shared wording and confirmation.

## Rules

### Scoring

- A team's score is the **sum of its entries**, unchanged from SPEC 001. No total is stored.
- The only entry values are `+1` and `−1`. No other value can be produced by this game's UI.
- `−1` may not take a team below zero: the button is disabled at zero. Gaudério has no negative score.
- **The 24 ceiling is a control affordance, not a domain clamp.** The domain continues to store and
  sum entries without clamping, exactly as SPEC 003 requires. Because increments are unitary and no
  ladder exists, no sequence of allowed taps can carry a score past 24, so nothing needs clamping.
- *Desfazer último* deletes the last entry of the match — the existing `removeEntry` domain function
  applied to the last element. No new domain concept.
- *Resetar pontos* removes **all** entries of the match. The match keeps its id, its teams and its
  creation time, and remains unfinished. It is not represented as an entry and is therefore not
  reachable by *Desfazer último*.

### Game state

The state shown — normal, ceiling reached, or won — is **derived** from the scores in the game's
`scoreboard` function or a pure helper beside it. It is never stored on the match, so *desfazer*
returns to the previous state for free.

Derivation, in order:

1. Any team at **24** → **won** by the team with the highest score. Both teams at 24 → no winner
   declared, as in canastra and mineiro
2. Otherwise → **normal**

There is no third state. Gaudério has no special hands, so the mão de onze and mão de ferro branches
must not appear anywhere in its code path.

### Contract changes

- **`GameId`**: add the gaudério id, **remove `'padel'`**. Padel has no game definition, no screen and
  no stored matches, so removing it from the union is a type-level cleanup with no migration.
- **A game must be able to declare that it has no target.** Mineiro declares `target: 12` with
  `targetRequired`. Gaudério declares no target at all, and no target options — which also means its
  card opens the match with nothing to resolve. Make the target genuinely optional in the definition
  rather than defaulting it to a number nobody uses.
- **A game must be able to declare a maximum score.** Add an optional ceiling to `GameDefinition`,
  used **only** to decide whether increment affordances are available. It must not reach the domain's
  scoring or validation functions.
- **A match must be able to have its entries cleared.** Add one domain function for it, beside
  `removeEntry`, operating on the match's entry list. It is exposed in this SPEC only through
  gaudério's options; no other game gains the action.

Truco mineiro's definition, screen and tokens are not modified by any of the above.

## Visual direction

The target is a rough gaúcho tally board: a dark plank, matchsticks for points, stitched leather
controls, braided rope for the divider. It is warmer and cruder than mineiro, which reads as a printed
card-table sheet. Decoration never sits behind text, reduces contrast, changes a hit area, or competes
with the matchsticks.

### Palette

Defined in `styles/games/<gameId>.css`, scoped to `[data-game=...]`. Values are gaudério's own; the
two team colours deliberately match mineiro, because team identity is stable across both trucos.

| Token role | Use |
|---|---|
| Ground | Near-black, never pure black; carries a low-contrast leather/canvas gradient |
| Plank | The header surface: a darker, warmer brown with a rough top and bottom edge |
| Leather | Raised control surfaces, with a stitched edge drawn as a dashed inset border |
| Bone | Title, team names, button labels; a warm cream with an engraved feel |
| Ember | Matchstick heads; a saturated red-orange, used nowhere else |
| Stick | Matchstick bodies; a pale warm wood |
| Rope | The central divider, borders and small ornament |
| Nós | The same stable green as truco mineiro |
| Eles | The same stable red as truco mineiro |

The *Eles* red is team identity, so red is not globally reserved for destructive actions inside this
game either. Destructive meaning comes from the shared **Apagar** and **Resetar pontos** labels, icon,
placement and confirmation. `−1` stays a neutral dark recessive control and never uses the *Eles* red
merely to mean subtraction.

**The material is carried by four generated texture images, not by gradients.** Pure-CSS texture was
tried first and does not get there: repeating linear or radial gradients at an angle read as graph
paper or as vinyl rings, and procedural SVG noise is too coarse and too even to pass as hide. The
textures are produced by `scripts/generate-textures.mjs` (`npm run textures`) — seeded, procedural,
committed, and generated with `sharp`, which the project already depends on. **No stock or third-party
image is vendored**, which matters because this repository is public.

| Asset | What it is | Where it goes |
|---|---|---|
| `ground.webp` | Seamless pebbled leather, **colour baked in** | The board, tiled at `9rem`, darkened by a gradient above it |
| `leather.webp` | The same pebbling in mid grey | Every leather control, blended `overlay` over its colour |
| `crackle.webp` | Seamless craquelure | Team ribbons and the winner panel, blended `overlay` |
| `plank.webp` | Wood grain, colour baked in, **torn bottom edge in the alpha channel** | The header, `cover`, anchored to its bottom |

Rules that keep this from degrading:

- **The board's leather is coloured, not blended.** Blending a mid-grey tile over near-black leaves
  almost nothing visible, and the board's grain is meant to read.
- **Every grey tile is blended `overlay` over a colour gradient**, so one asset serves green, red and
  brown without a variant per colour.
- **Tiles are displayed small.** Around `3.5rem` for controls: at ribbon or button scale a large tile
  reads as snakeskin, not leather.
- **The plank's bottom edge is torn, not cut** — and the tear lives in the image's alpha, with fibres
  hanging below the break. A CSS path cannot do this convincingly: uniform teeth read as a saw and a
  straight border reads as a printed banner.
- **Regenerating is deterministic.** The script is seeded, so the same parameters give the same bytes.
  Change a parameter, run `npm run textures`, commit the result.

**Stitching is thread, not a dashed outline.** One-pixel dashes in bone at low alpha, inset a third of
a rem. Thicker, brighter dashes read as a dotted border and fight the label.

**Controls are matte.** Team colour arrives as a single soft vertical gradient plus an inner bevel;
gloss makes the board look like plastic.

**Ribbon ends are visible.** The banner is a rectangle with barely any corner radius, tilted about half
a degree, and its folded ends sit outside the body, darker than it, fully inside the column — never
clipped by the screen edge and never crossing the divider.

### Type

Roboto Slab for the game title, team banners and the finished hero; Archivo for utility labels and
accessible action text. Both are already self-hosted and precached — **this SPEC adds no font**. If a
file fails, the fallback stack stays legible and layout must not depend on exact glyph widths.

### The score is matchsticks

Each team's score is drawn as matchsticks, one per point, **grouped in fives**:

- A **group of five is a closed box: four matchsticks forming a square with a fifth laid diagonally
  across it.** A box always means exactly five.
- The remainder below five is drawn as **loose upright matchsticks**, never as a partial box.
- Every matchstick has a pale wood body and a rounded ember head.
- The maximum a side can ever show is therefore **4 boxes plus 4 loose sticks = 24**. Lay the board out
  for that maximum from the start; it must not reflow awkwardly when the fifth group would have
  appeared, because it never can.

Requirements, because this is the hero rather than a texture:

- Boxes and loose sticks keep team colour **off** them: colour lives on the banner and the `+1`
  control, and the tally never recolours based on the lead.
- Groups have a clear gap, so 12 reads as *two boxes and two* at a glance.
- Matchsticks **wrap to another row rather than shrinking**, so one stick is always the same size.
  On a narrow viewport the four boxes may wrap to two rows of two.
- **The tally does not animate.** A stick appears the moment its point lands, and disappears the
  moment it is undone. A draw-in animation was built and then removed: it re-fired on unrelated
  re-renders and added nothing at this size.
- Removing, undoing or resetting redraws the derived total without a misleading reverse flourish.

Losing the digit is an accepted trade and matches mineiro's established idiom. **The accessible
numeric value remains mandatory.**

**Accessibility:** each score block carries a label such as `Nós: 8 pontos`. Individual matchsticks
and every ornament are hidden from the accessibility tree. When `+1` is unavailable at 24, its
disabled state is conveyed to assistive technology, not by colour alone.

### Surfaces, controls and motion

- Primary score buttons are at least `112 × 88px`; every other interactive target is at least
  `48 × 48px`.
- Leather controls use high-contrast bone labels and a subtle pressed state. Stitching is decorative
  and must not reduce label contrast.
- Team banners may use clipped or pseudo-element ribbon ends, but the name stays centered and the
  accessible hit area stays rectangular.
- The interface respects device safe areas.
- All interactive icons have visible focus styles and Portuguese accessible names.
- Motion is limited to the options sheet entering or leaving, and the pressed state of a control.
  Nothing animates on the tally, and there is no orchestrated state moment, because gaudério has no
  special state.
- `prefers-reduced-motion` is respected: the sheet stops animating, while totals, focus movement and
  state changes still occur.

## Acceptance criteria

- [x] `npm run check` and `npm run build` pass
- [x] Truco mineiro's screen, rules and tokens are unchanged — verified by the diff
- [x] Canastra's screen, rules and tokens are unchanged — verified by the diff
- [x] A third card **Truco gaudério** appears on the home with no edit to `HomeScreen`
- [x] Tapping the card creates a match with **Nós** and **Eles** and opens the scoreboard directly,
      with no setup screen
- [x] `GameId` no longer contains `'padel'`, and the project typechecks
- [x] The gaudério definition declares **no target** and no target options
- [x] Only `+1` and `−1` can create entries; no ladder control exists anywhere in the game
- [x] `−1` is disabled when a team is at zero, and no score can go negative
- [x] When either team reaches 24, **both** `+1` controls become disabled, and `−1` plus
      *Desfazer último* remain enabled — asserted by a test
- [x] Reaching 24 does **not** finish the match: the normal screen and its controls remain, and
      `finishedAt` is unset — asserted by a test
- [x] No digit appears anywhere on the live or finished scoreboard
- [x] A score of 5 renders as one closed box; 4 renders as four loose sticks; 12 renders as two boxes
      and two loose sticks; 24 renders as four boxes and four loose sticks — asserted by tests
- [x] Each score block exposes its numeric value to assistive technology
- [x] No mão de onze, mão de ferro or raised-value code path is reachable from the gaudério game
- [x] *Desfazer último* removes the last entry and is disabled when there are no entries
- [x] **Opções da partida** exposes exactly *Encerrar partida*, *Resetar pontos* and *Apagar partida*
- [x] *Resetar pontos* asks for the shared destructive confirmation, then clears all entries while
      keeping the same match id, the same teams and `finishedAt` unset — asserted by a test
- [x] After *Resetar pontos*, *Desfazer último* is disabled: the reset is not an entry and is not
      reversible — asserted by a test
- [x] *Resetar pontos* and *Apagar partida* are distinguishable in label and in effect; deleting is the
      only one that removes the match
- [x] There is no rename affordance for teams anywhere in the game
- [x] No entry log, history list or per-entry edit affordance is rendered
- [x] The finished screen shows **NÓS VENCEMOS!** / **ELES VENCERAM!** with one winner, and
      **PARTIDA ENCERRADA** when finished early or with both teams at 24 — asserted by a test
- [x] The finished screen offers *Nova partida*, *Reabrir* and *Apagar*, and *Nova partida* opens a
      fresh gaudério match while the finished one stays persisted
- [x] Leaving and reopening the app keeps an unfinished gaudério match listed under *Em andamento*
- [x] Per-game colour is set only through `styles/games/<gameId>.css` scoped to `[data-game=...]`;
      `grep` finds no gaudério colour inline or in a component
- [x] No font file is added, and nothing is fetched from the network at runtime
- [x] Every texture in `src/assets/textures/` is reproducible from `npm run textures`, and no
      third-party image is vendored
- [x] Primary score buttons measure at least `112 × 88px`; all other targets at least `48 × 48px`
- [x] Nothing on the tally animates, and `prefers-reduced-motion` suppresses the sheet animation

## Open questions

None. The two inferred behaviours are recorded in *Context → Assumptions carried from the interview*
and were approved before this SPEC was written; they are decisions, not open questions.
