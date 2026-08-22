# SPEC 003 — Truco mineiro

- **Status:** ready
- **Created:** 2026-08-22
- **Revised:** 2026-08-22
- **Depends on:** SPEC 002

## Goal

The family can keep score of a truco mineiro game in an interface that feels like the score sheet
on the table: two opposing sides, scores drawn as tally marks, large one-tap controls, and dedicated
states for mão de onze, mão de ferro and the end of the match.

This is also the SPEC that introduces **per-game visual identity**, because truco is the second game
and the first real evidence that one shared look does not fit.

## Context

Read `README.md` and `CLAUDE.md`. SPEC 002 built canastra: a setup screen, a scoreboard, an entry log
with edit and delete.

Truco is deliberately **not** canastra with different numbers:

- **Nothing varies between tables**, so there is **no setup screen**. Tapping the game card creates
  the match and opens the scoreboard.
- **No entry log is shown.** Correction is a single *desfazer* action, not a history.
- **The app knows one rule.** It does not track who called truco or the raising ladder, but it does
  know the mão de onze, because that rule changes what points are available.
- Gaúcho and mineiro are **separate games**, not a setting: their scoring differs. Only mineiro is in
  this SPEC — gaúcho's scoring is still unconfirmed and will not be guessed.

The visual direction for this SPEC is a warm, ornamental card-table interface: dark textured ground,
cream controls, aged-gold details, stable green for *Nós* and stable red for *Eles*. It does not call
for reproducing phone chrome or decorative noise pixel for pixel. The hierarchy, screen composition,
team identity and control placement defined below are the implementation contract.

No reference image is kept in the repo. The composition, the team identity and every control
placement are written out below, which is the only form that survives — and a screenshot of somebody
else's app invites copying its appearance rather than reading the contract.

The UI is Portuguese, no i18n layer.

## Scope

**In**

- The truco mineiro `GameDefinition`, registered in `games/index.ts`
- Direct-to-match flow: no setup screen for this game
- Normal match screen: two-sided tally scoreboard, `+1` and `−1` per team, raised-value sheets and
  *Desfazer último*
- The mão de onze flow and the onze-a-onze (mão de ferro) flow
- A truco-owned finished-match presentation
- Per-game visual identity: the theming mechanism, plus retrofitting canastra onto it
- Tests per `CLAUDE.md`'s testing policy

**Out** — explicitly, so it does not get built by accident

- **Truco gaúcho.** Its scoring is unknown. It gets its own SPEC and its own game card
- **The two-finger undo gesture.** A gesture that misfires while people tap `+1` rapidly is worse
  than no gesture, and a gesture-only action is inaccessible. It becomes its own small SPEC once the
  family has used the button and can say whether they reach for more
- Recording who called truco, the raising ladder, or hand-by-hand history
- An entry log UI for truco, and editing an individual past entry
- Symmetric negative buttons (`−3 / −6 / −9 / −12`) — *desfazer* covers correction
- Team renaming. As in SPEC 002, *Nós* and *Eles* are read-only in this version
- Changing canastra's behaviour. Only its **styling** is touched by the theming retrofit
- Reproducing the status bar, hardware frame, shadows around a phone, or other device mockup chrome
- Raster textures or network-fetched decoration; the table texture and ornament are made with CSS

## Behaviour

### Home — `/`

Two cards now: **Canastra** and **Truco mineiro**, rendered from the registry. Tapping *Truco
mineiro* creates a match with teams **Nós** and **Eles** and opens it immediately — no intermediate
screen.

### Normal match — `/partida/:matchId` (truco)

- **Game header**: a compact, truco-owned header with a back action, the centered title **Truco
  mineiro**, and an action labelled accessibly as **Opções da partida**. The options action exposes
  **Encerrar partida** and **Apagar partida**. Deleting keeps the shared confirmation from SPEC 002.
- **Team identity**: *Nós* is always the green left side and *Eles* is always the red right side.
  Colour identifies the side and never swaps with the lead. Each name sits on a shallow banner above
  its score.
- **Scoreboard**: two equal columns separated by a thin aged-gold vertical rule with small diamond
  details. Each score is drawn only as **tally marks** — see **Visual direction → The score is the
  tally**. Team names are read-only.
- **Primary scoring**: one large `+1` button at the foot of each column, filled with that team's
  colour. The entire control, not only its label, is the tap target.
- **Correction**: one smaller, dark outlined `−1` button below each `+1`. It is present but visually
  recessive and is disabled at zero.
- **Raised values**: tapping a team's score block or banner opens that team's raised-value sheet.
  `+3 / +6 / +9 / +12` are not permanently visible on the normal screen. The sheet does not open
  while the match is in the mão de onze or mão de ferro state.
- **Desfazer último**: one quiet, full-width action below both columns removes the **last** entry of
  the match, whatever its value. It is disabled when there are no entries and remains available in
  every unfinished game state.
- **Status**: the score is not restated as text. The only exceptional states announced are `Mão de
  onze`, `Mão de ferro` and the winner.
- **No entry log**: no list, history section, count badge or edit affordance is rendered.

On a common phone viewport, the header, team banners, tallies, `+1`, `−1` and *Desfazer último* fit
without horizontal scrolling. Shorter screens may scroll vertically; controls must not shrink below
their minimum tap target to force a single-screen fit.

The composition is:

```text
┌──────────────────────────────────┐
│ ‹        Truco mineiro        ⚙ │
├──────────────────────────────────┤
│    NÓS banner   │   ELES banner │
│                 │               │
│   tally marks   ◇  tally marks  │
│                 │               │
│      +1         │       +1      │
│      −1         │       −1      │
│                                  │
│          ↶ DESFAZER ÚLTIMO       │
└──────────────────────────────────┘
```

### Raised-value sheet

The raised values use a team-contextual, full-height sheet over the match rather than a small menu:

- Its compact title bar uses the selected team's colour and shows the team name centered, with a
  close action. Browser back and `Esc` close it without changing the match.
- Four large cream rows show the table word on the left and the numeric result on the right:
  **TRUCO `+3`**, **SEIS `+6`**, **NOVE `+9`**, **DOZE `+12`**.
- Tapping a row records the entry and closes the sheet. Tapping the backdrop or close action records
  nothing and restores focus to the score block that opened it.
- A quiet note at the bottom says **“Na mão de onze ou de ferro, use apenas as opções daquela
  mão.”** This explains why the sheet is unavailable in those states without inventing a new rule.
- The green and red variants have identical layout and behaviour. Only the contextual team token
  changes.

### Mão de onze

While **exactly one** team is at 11, the normal scoreboard and scoring controls are replaced in the
same route by a dedicated state view:

- The header title becomes **Mão de onze** and keeps the back action.
- A bordered hero panel uses the team-at-11 colour and announces **MÃO DE ONZE** plus
  **“Equipe Nós: 11 pontos”** or **“Equipe Eles: 11 pontos”**. This phrasing treats the fixed name as
  a team label and does not invent player names.
- Below it, three large cream outcome rows preserve the existing rule and make the recipient
  explicit:
  - **`VITÓRIA: <time em 11>`** → +3 to the team at 11
  - **`VITÓRIA: <adversário>`** → +3 to the opponent
  - **`CORREU: <time em 11>`** → +1 to the opponent
- These controls replace the normal `+1`, `−1` and raised-value launchers. This is inline, not a
  dismissible modal: mão de onze is a **state the match is in**, not a choice the user opened.
- After an outcome, if a team is **still** at 11, the mão de onze appears again. This is correct:
  every hand played while exactly one team sits at 11 is a mão de onze.
- *Desfazer último* remains available at the bottom — it is the way out of a state entered by a
  mis-tap.

### Onze a onze — mão de ferro

While **both** teams are at 11, the mão de onze view is replaced by the mão de ferro view:

- The header title and hero say **Mão de ferro** and explain **“Onze a onze, jogada no escuro.”**
- There are exactly two large cream outcomes: **`VITÓRIA: NÓS`** and **`VITÓRIA: ELES`**, +3 to the
  selected winner. Nobody can run.
- *Desfazer último* remains available.
- This outcome decides the game, so the winning team reaches 14 and the winner state appears.

### Reaching 12

As in canastra, the app **never finishes the match by itself**: it shows the winner state and the
user finishes. Scores above 12 are normal and expected — a mão de onze win puts a team at 14 — so
the score is never capped. Until the user finishes, the normal scoreboard and all normal controls
remain available; the winner announcement does not turn a live match into the read-only finished
screen.

### Finished match

Once the user chooses **Encerrar partida**, score entry is unavailable and the same route presents a
truco-owned conclusion screen:

- The header says **Fim de partida**.
- A bordered hero panel says **NÓS VENCEMOS!** or **ELES VENCERAM!** when the scoring rules yield one
  winner. If the user finished before a winner could be derived, it says **PARTIDA ENCERRADA**; the UI
  never invents a winner.
- A compact, read-only two-column scoreboard keeps the green/red banners, central rule and final
  tally marks. It does not replace them with numerals.
- **Nova partida** is the dominant cream action. It creates a new truco mineiro match with the same
  fixed teams and target, then opens it; the finished match remains persisted.
- **Reabrir** and **Apagar** are secondary actions below it. Reopening clears `finishedAt` and returns
  to the derived live state. Deleting uses the same wording and confirmation behaviour as SPEC 002.

## Rules

### Scoring

- A team's score is the **sum of its entries**, unchanged from SPEC 001. Nothing is stored as a
  total, and no score is clamped or capped.
- `−1` may not take a team below zero: the button is disabled at zero. Truco has no negative score.
- A mão de onze or mão de ferro outcome creates a **normal entry** for the receiving team, with
  `Entry.note` recording which outcome produced it (`mão de onze`, `correu`, `mão de ferro`). The
  note is stored, not displayed.
- *Desfazer* deletes the last entry in the match. It is the existing `removeEntry` domain function
  applied to the last element — no new domain concept.

### Game state

The state shown — normal, mão de onze, mão de ferro, or won — is **derived** from the scores, in the
game's `scoreboard` function or a pure helper beside it. It is never stored on the match, so
*desfazer* returns to the previous state for free.

Derivation, in order:

1. Any team at 12 or more → **won** by the team with the highest score. Both at 12 or more with
   equal scores → no winner declared, as in canastra
2. Both teams exactly at 11 → **mão de ferro**
3. Exactly one team at 11 → **mão de onze**
4. Otherwise → **normal**

### Contract changes

- Truco mineiro's definition: `teamCount: 2`, `defaultTeamNames: ['Nós', 'Eles']`, target `12`,
  `targetRequired`, no negatives config, and a scoring affordance of the fixed ladder
  `[1, 3, 6, 9, 12]` plus `−1`.
- A game must be able to declare that it needs **no setup screen**. Add
  `needsSetup: boolean` — false for truco, true for canastra. The home card routes to the match
  directly when false.
- A game must be able to declare **its own match view**. Add `MatchView` to the definition: the
  component that renders the game-owned header, scoreboard, scoring affordances and finished state.
  The route supplies data and shared actions; it does not impose a visible match shell.

### Per-game visual identity

The boundary is fixed and is not the implementer's judgement call:

- **Free per game**: match header, palette, typography, scoreboard, score controls, contextual sheets
  and the presentation of live, special and finished states.
- **Shared, must not vary semantically**: routing, domain validation, persistence, focus restoration,
  destructive confirmation wording and the effects of finish, reopen and delete.
- The home screen remains a neutral hub and is not themed per game.

Mechanism:

- The match route sets `data-game="<gameId>"` on its container. Per-game token overrides live in
  `styles/games/<gameId>.css`, scoped to that attribute. No game-specific colour is written inline
  or in a component.
- The shared tokens in `styles/tokens.css` remain the default and the home shell's identity.
- Canastra is retrofitted: its current colours move into `styles/games/canastra.css`. **Its
  behaviour must not change** — this is a styling move only.

## Visual direction

The visual target is an old score counter made for the table, not a generic dark dashboard. It uses
warm darkness, paper-like controls, engraved-looking dividers and restrained card-table ornament.
The treatment must remain readable and practical: decoration never sits behind text, reduces
contrast, changes hit areas or competes with the tally marks.

### Palette

These are identity tokens, not an instruction to apply every colour everywhere:

| Token | Value | Use |
|---|---|---|
| `--truco-noite` | `#0D0F0D` | Screen ground; never pure black |
| `--truco-madeira` | `#1B1813` | Raised dark surfaces and CSS table texture |
| `--truco-papel` | `#E7D0AA` | Raised-value and special-state controls |
| `--truco-tinta` | `#17130F` | Text on cream controls |
| `--truco-giz` | `#DCC8A3` | Tally marks and primary text on dark ground |
| `--truco-ouro` | `#B78639` | Divider, borders, icons and small ornament |
| `--truco-nos` | `#35451F` | Stable identity for *Nós* |
| `--truco-eles` | `#8E2B1E` | Stable identity for *Eles* |

The red of *Eles* is team identity, so red is no longer globally reserved for destructive actions
inside truco. Destructive meaning comes from the shared **Apagar** label, icon, placement and
confirmation. `−1` remains a neutral dark outlined correction and never uses `--truco-eles` merely
to mean subtraction.

The background texture uses low-contrast CSS gradients over `--truco-noite`; it must not require an
image file, make text noisy, or resemble photorealistic wood. Borders and ornaments may use thin
lines and simple CSS diamond shapes. No decorative asset is required.

### Type

Use two locally hosted latin-subset `woff2` families and no font CDN:

- **Roboto Slab** for the game title, team banners, raised-value labels, special-state headings and
  the finished hero. It supplies a compact printed-card character.
- **Archivo** (variable `wght` + `wdth`) for utility labels, explanatory copy and accessible action
  text. Digits use `tabular-nums`.

Both fonts are self-hosted in the repository and precached with the app shell. If either file fails,
the fallback stack remains legible; layout must not depend on exact glyph widths.

### The score is the tally

Each team's score is drawn as **tally marks — one mark per point, grouped in fives**, exactly the way
truco gets scored on paper: four uprights and a fifth struck diagonally across them. No digit is
drawn anywhere on the live or finished scoreboard.

Requirements, because this is the hero rather than a texture:

- Marks use `--truco-giz` at full presence. Team colour stays on the banner and `+1` control; it does
  not recolour the tally based on the lead.
- Groups of five have a clear gap, so twelve reads as *two groups and two* at a glance.
- Marks wrap to another row rather than shrinking, so one mark is always the same size.
- A newly added mark draws itself in when a point lands. When an entry adds several points, the new
  marks may draw as one short sequence; the total feedback must finish quickly enough for the next
  tap.
- Removing or undoing points redraws the derived total without a misleading reverse flourish.

Losing the digit is an accepted trade, not an oversight: the two scores that must be unmistakable —
11 and the win — both announce themselves in words. The accessible numeric value remains mandatory.

**Accessibility:** each score block is a real button in the normal state and carries a label such as
`Abrir opções de Nós. Placar: 8 pontos`. In read-only states it is a labelled group such as
`Nós: 14 pontos`. Decorative individual strokes are hidden from the accessibility tree.

### Surfaces and controls

- Primary score buttons are at least `112 × 88px`; all other interactive targets are at least
  `48 × 48px`.
- Cream controls use dark high-contrast labels and a subtle pressed state. They are not skeuomorphic
  paper sheets: no curled corners, stains or readability-reducing texture.
- Team banners may use clipped or pseudo-element ends, but the team name remains centered and the
  accessible hit area stays rectangular.
- The interface respects device safe areas. A phone status bar is device chrome, not part of the app.
- All interactive icons have visible focus styles and Portuguese accessible names.

### Motion

One orchestrated moment, not scattered effects: entering the mão de onze. The hero panel settles in
and the team colour briefly warms its border. Elsewhere, only newly added tally marks draw in and
sheets enter or leave.

`prefers-reduced-motion` must be respected: state changes, focus movement and tally totals still
occur, while transforms and stroke-drawing animations are suppressed.

## Acceptance criteria

- [ ] `npm run check` and `npm run build` pass
- [ ] Home renders both games from the registry; no game card is hardcoded
- [ ] Tapping truco creates a match with teams `Nós` and `Eles` and lands on the match screen with no
      intermediate screen, asserted by a test
- [ ] Canastra still goes through its setup screen — `needsSetup` drives both, and a test covers each
- [ ] The truco header provides back and match-options actions; team names are read-only and no rename
      control is rendered
- [ ] The normal screen follows the specified order: header, team banners, tallies, `+1`, `−1`, then
      *Desfazer último*, with two equal columns and the central divider
- [ ] *Nós* stays green on the left and *Eles* stays red on the right regardless of score; the tally
      colour does not follow the lead
- [ ] `+1` and `−1` are on the main screen and `+3 +6 +9 +12` are only in the sheet opened from a
      team's score block; the raised values are labelled *truco / seis / nove / doze*
- [ ] The raised-value sheet uses the selected team's contextual title bar, restores focus when
      closed, records nothing when dismissed, and has the four cream rows and explanatory note
- [ ] The raised-value sheet does not open in the mão de onze or mão de ferro state, asserted by a
      test
- [ ] `+1`, `−1` and every raised value add and subtract correctly; `−1` is disabled at zero, with
      tests
- [ ] `+1` and `−1` are not styled as equal-weight peers; `−1` does not use a team colour
- [ ] *Desfazer* removes the last entry regardless of its value, is disabled with no entries, and has
      a test proving a `+9` is undone in one action
- [ ] Truco's match screen renders no entry log
- [ ] State derivation is a pure tested function covering all four cases in **Game state**, including
      both teams at 11, one team at 11, and a team at 14
- [ ] Mão de onze replaces normal scoring, shows the team at 11, and offers exactly three explicit
      outcomes with values +3 / +3 / +1; tests assert each resulting score
- [ ] Mão de onze reappears when exactly one team remains at 11 after an outcome, asserted by a test
- [ ] Mão de ferro replaces the mão de onze view, offers exactly two outcomes worth +3 and no run
      option, asserted by a test
- [ ] Undoing a mão de onze outcome returns the match to the derived mão de onze state, asserted by a
      test
- [ ] Outcome entries carry a `note`; the note is not rendered
- [ ] No score is capped: a test asserts a team can reach 14
- [ ] The match never auto-finishes; reaching 12 only changes the derived live state
- [ ] Finishing presents the truco-owned conclusion screen; it shows the correct winner or the neutral
      **Partida encerrada** fallback and exposes no scoring action
- [ ] **Nova partida** creates and opens a fresh truco match without deleting or reopening the
      finished one; **Reabrir** and confirmed **Apagar** keep their domain behaviour
- [ ] `data-game` drives styling; game-specific colours occur only in `styles/games/`
- [ ] The texture and ornaments use CSS only; truco adds no raster decoration or network request
- [ ] Roboto Slab and Archivo are self-hosted `woff2` files in the repo;
      `grep -rn "fonts.googleapis\|fonts.gstatic" .` finds nothing outside `node_modules`
- [ ] No numeral is rendered for either score anywhere on the live or finished scoreboard
- [ ] The tally renders one mark per point, grouped in fives, with tests at 4, 5, 11, 12 and 14
- [ ] Each interactive and read-only score block exposes the specified accessible numeric label,
      asserted by a test; decorative strokes are hidden from the accessibility tree
- [ ] A newly added mark animates in, and the animation is suppressed under `prefers-reduced-motion`
      while the mark still appears
- [ ] The mão de onze and sheet animations are suppressed under `prefers-reduced-motion` while state
      and focus behaviour remain correct
- [ ] Every interactive target is at least `48 × 48px`, and the primary `+1` targets are at least
      `112 × 88px`
- [ ] Canastra's behaviour is unchanged after the theming retrofit — its SPEC 002 tests still pass
      untouched
- [ ] **Apagar partida** keeps the same confirmation wording in both games, and validation messages
      keep the same shape and wording rules
- [ ] Every user-visible string is pt-BR with standard spelling; no i18n library or locale file was
      added
