# SPEC 005 — Home, match lists and the install flow

- **Status:** done
- **Created:** 2026-08-23
- **Depends on:** SPEC 002 (canastra), SPEC 004 (deploy and PWA)

## Goal

Two things stop being embarrassing.

The home screen becomes the app's front door instead of a bare list: the games readable at a glance,
the matches in progress visible with their scores, and a way into everything the person has ever
played. And installing the app stops requiring folklore — no more "tap share, scroll down, find the
weird option" over WhatsApp.

## Context

Read `README.md` and `CLAUDE.md`. SPEC 002 shipped a working but plain home, and SPEC 004 made the app
installable at `https://placar.tchez.dev`.

**No reference images are kept in this repo.** The owner supplied two mockups; they are described in
full below, because that description is the only form that survives and the only form the whole team
can read. Where the description and a remembered image disagree, the description wins.

**What is deliberately untouched:** the canastra and truco *match* screens. The owner likes them. This
SPEC changes the hub, the list screens, the canastra setup screen and the install flow — nothing else.

**The design boundary, already decided:** the home is a hub with **one identity of its own** and is not
themed per game; inside a game, the game owns everything. The home's identity is a near-black ground
with each game carrying its own accent colour.

**Data is per device.** Everything lives in `localStorage` on this origin, so each phone holds its own
matches and its own history. Nothing is shared between family members and nothing syncs. The history
screen must not imply otherwise — it is *this phone's* history.

**Why the install flow matters more than it looks:** on iOS, a home-screen web app can hold storage
separate from Safari's, so matches recorded in the browser may be invisible inside the installed app.
Getting people installed *before* they start recording avoids handing the family a split history.

## Scope

**In**

- The new home screen, as described in **Home**
- The inert "Em breve" card
- A screen listing **all matches in progress**, reached from *Ver todos*
- A screen listing **this phone's full history**, reached from the top-right button
- A dedicated **install screen**: per-platform instructions, the Android install button, and
  *Continuar sem instalar*
- First-visit trigger for the install screen, a dismissal that persists, and a discreet way back
- The restyled canastra **Nova partida** screen, as described in **Nova partida (canastra)**

**Out** — explicitly, so it does not get built by accident

- **The canastra and truco match screens.** Not a pixel
- Any change to game rules, the domain, the repository, scoring, or validation messages
- **Managing matches from the new lists.** They navigate and nothing else — no delete, no rename, no
  finish. Those stay inside the match screen where they already work
- Search, filters, sorting controls or pagination in the lists
- Native packaging (APK / TestFlight), push notifications, sync, named players, statistics
- Padel, the generic game, truco gaúcho
- Restyling the app for a light theme. The app is dark, deliberately

## Behaviour

### Home

The ground is **near-black with a faint blue-green cast** — distinctly not the canastra felt green.
Every accent below is the game's own colour: **green** for canastra, **gold** for truco, **blue** for
the "Em breve" card. Titles use the display serif; labels and body use the sans.

**Top bar.** The wordmark **Placar** on the left, in the display serif, in the canastra green, at
roughly 1.9× the body size. On the right, a square button with generously rounded corners, a hairline
border and a gold **history icon** (a clock face with a counter-clockwise arrow around it). A hairline
rule closes the bar.

**Games section.**
- An eyebrow **JOGOS** — uppercase, wide letter-spacing, small, muted grey.
- A heading **Novo placar** — display serif, near-white, the largest text on the screen.
- A subtitle **Escolha um jogo para começar** — muted grey sans.
- Three cards, full width, stacked with even gaps. Each card: rounded corners of about 18px, a
  **hairline border in the game's accent at low opacity**, and a fill that is a very subtle gradient
  tinted with that accent — strongest behind the icon and fading out to the right. Inside, left to
  right: a **circular badge** about 56px across with a translucent accent fill and a line-art glyph in
  the accent; the game name in the **display serif, in the accent colour**; below it a single line of
  muted grey sans; and, **on the two real games only**, a **chevron** on the right edge in the accent.
  The *Em breve* card has **no chevron** — see **Home composition**.

| Card | Glyph | Name | Line under it |
|---|---|---|---|
| Canastra | two overlapping playing cards with a diamond pip | Canastra | Partidas até a meta de pontos. |
| Truco | a club suit outline | Truco mineiro | Quem bate 12 pontos vence. |
| Coming soon | a die showing pips | Em breve | Truco gaúcho |

- Below the cards, a centred ornament: the muted text **Mais jogos em breve** flanked left and right
  by short gold hairlines, each ending in a small arrowhead pointing inward.
- A hairline rule closes the section.

**Em andamento section.**
- A heading **Em andamento** in the display serif on the left. On the right, a small circular outlined
  badge holding the count, then **Ver todos ›** in green.
- The matches in progress, newest first, **at most three rows** — the rest live behind *Ver todos*.
- Each row: rounded corners of about 14px, a hairline border, and left to right: a small filled dot in
  the game's accent hugging the left edge; the circular game badge, smaller than on the cards; a text
  block of three lines — the team names as **Nós × Eles** (a multiplication sign, not the letter x) in
  near-white; then `<Jogo> · Meta: <valor>` in muted grey; then `Iniciada em DD/MM, HH:MM`, muted and
  smaller. On the right, the score as **`0 × 0`** in large numerals **in the game's accent**, then a
  chevron.
- With no match in progress, the whole section — heading, badge and *Ver todos* — is **not rendered**.
  No empty box, no placeholder row.

**Footer strip.** Rounded corners of about 14px, a faint green hairline, a small flag glyph and one
line of text. Its content is **not** decorative copy: when the app is not installed it is the discreet
route back to the install screen (see **Install screen**), and when the app is installed **the strip is
not rendered at all**.

### Todas as partidas em andamento

Reached from *Ver todos*. The same row design as the home, without the three-row cap, newest first,
under a heading and a back control. Tapping a row opens that match. Nothing else on this screen: no
delete, no filter, no bulk action.

### Histórico

Reached from the top-right button on the home. Lists **this phone's matches**, finished and
in progress, newest first, using the same row design. A finished match shows its outcome — the winner
where there is one, and the *empate na meta* wording where the app declines to pick, exactly as the
match screen words it.

The screen states plainly that the history is local to this device. One quiet line is enough; it must
not read as an apology.

Empty state: **Nenhuma partida ainda.** with the games one tap away.

### Install screen

Its own route, reachable and leavable like any screen — never a modal that traps.

**When it appears automatically:** the first time the app is opened **outside** the installed app, on a
device where it has not been dismissed. Never inside the installed app.

**Detecting "already installed":** `display-mode: standalone` (and `navigator.standalone` for iOS
Safari). If either says installed, this screen never appears and its footer link is not rendered.

**Content, by platform:**

- **Android and other Chromium browsers.** If the browser has offered installation — the
  `beforeinstallprompt` event was captured — the screen leads with a primary **Instalar app** button
  that opens the browser's own install dialog. This is a real one-tap install and it is the whole
  reason this screen exists. Detect it by **capturing the event**, never by sniffing the user agent.
- **If that event never arrives** (unsupported browser, or the browser has already offered it), fall
  back to the written instructions for the platform.
- **iPhone and iPad, Safari.** Written steps, each on its own line, naming the real UI: tap the
  **Compartilhar** control in the browser toolbar (the square with the arrow pointing up), scroll the
  list, choose **Adicionar à Tela de Início**, then confirm with **Adicionar**. Plus one line telling
  the person to use **Safari**, because the other browsers on iPhone behave differently.
  iPadOS reports itself as a desktop, so detect it by touch support rather than by the platform string
  alone.
- **Desktop.** One line: install from the icon in the address bar. Nothing more; it is not the point.
- **Anything unrecognised.** The generic instruction to use the browser's own "install" or
  "add to home screen" option. Never a dead end.

**Instructions must be text**, not a screenshot. Text survives an OS redesign, is readable by a screen
reader, and costs nothing to ship.

**Continuar sem instalar** leaves for the home and **persists the dismissal on that device**, so the
screen never opens automatically again. Getting back is always possible through the home's footer
strip.

### Nova partida (canastra)

The ground is the **deep felt green** of the canastra world, with a subtle vignette that darkens toward
the edges. Gold is the accent throughout; the only green accents are the unselected suggestion chip and
the primary button's fill.

**Header, centred as a stack.** Top-left, sitting outside the stack, a **back control**: a square with
rounded corners of about 14px, a gold hairline border and a gold left arrow. Then, centred: a small
**gold trophy glyph**; below it **CANASTRA** in gold, uppercase, wide letter-spacing, flanked left and
right by short gold hairlines each ending in a small dash; and below that **Nova partida** in a large
**gold display serif** — the largest text on the screen.

**One panel** holds every control: full width inside the screen margins, rounded corners of about 24px,
a gold hairline border, and a fill a shade lighter than the ground.

1. **Label** — a short gold rule ending in a dot, then **PONTOS PARA VENCER** in gold, uppercase,
   letter-spaced.
2. **The field** — rounded corners of about 12px, a gold border, a dark fill, the value in large light
   numerals aligned left, and a small **gold outlined diamond** inside the right edge of the field.
   The field always shows the value in effect.
3. **Two suggestion chips**, side by side and equal width, rounded like the field: **3000** and
   **4000**. The chip whose number matches the field is the **selected** one: gold text, a full gold
   border, and a small **gold diamond ornament centred just above its top edge**. The other chip is
   quieter — green text on a green hairline. Tapping a chip fills the field. Typing a number that
   matches neither chip leaves both unselected, and that is a valid state.
4. A hairline divider.
5. **The toggle row** — the same rule-and-dot ornament, then **PERMITIR PONTOS NEGATIVOS** in gold
   uppercase; on the right a pill toggle with a green track and a green knob, shown on by default.
6. A hairline divider.
7. **The primary action** — full width, rounded corners of about 14px, a green gradient fill with a
   gold hairline border, holding a gold two-cards glyph and **COMEÇAR PARTIDA** in gold, uppercase,
   letter-spaced. Disabled while the point limit is not valid.

The screen **ends with the panel**. There is nothing below it, and in particular **the hint about the
teams being called Nós and Eles is removed** — the owner cut it, and renaming lives inside the match.

## Rules

### What this SPEC may not touch

The domain functions, the repository, the scoring derivation, the winner and tie rules, and the wording
of validation messages. Every rule from SPEC 002 stands: the point limit is required, an integer and
greater than zero; the negatives toggle still governs negative entries; the rejection messages are
unchanged. If the redesign appears to need one of those changed, stop and say so.

### Home composition

- Game cards are rendered **from the game registry**, never hardcoded. Adding a game must add a card.
- The **Em breve** card is the one exception, and it is **not interactive at all**. It carries **no
  chevron**, gives **no press feedback**, is **not a button or a link**, and is **not focusable** by
  keyboard. A chevron on a card that cannot be opened is an affordance that lies, and press feedback
  lies the same way in a quieter voice — so the card is a plain, non-interactive announcement.
- Its sub-line names the specific game that is coming: **Truco gaúcho**. A concrete name earns the
  card's space; "new games coming" did not.
- Its glyph stays the **die**, not a club. Two club glyphs on one screen — one you can open and one you
  cannot — would be worse than a generic mark. *(This one is a judgement call, easily reversed.)*
- The card exists so the section does not look thin while only two games are real, and the ornament
  under the cards says the same thing in words.
- The in-progress section caps at three rows and is **absent entirely** when there is none.
- The count badge next to *Ver todos* shows the true total, including rows not displayed.

### Dates and numbers

`Iniciada em DD/MM, HH:MM` in pt-BR, and every number through the existing pt-BR format helper. No
ad-hoc formatting in a component, and no second date helper — if one already exists, use it.

### Install detection

- Installed state comes from `display-mode: standalone`, plus `navigator.standalone` on iOS Safari.
- The Android install button exists **only** because `beforeinstallprompt` was captured. Do not infer
  installability from the user agent, and do not render a button that cannot do anything.
- Platform text selection may use the user agent, because there is no API for it. Handle iPadOS
  claiming to be a desktop, and always have an unrecognised-platform fallback.
- The dismissal is stored under a namespaced key alongside the existing storage, **written through a
  small module**, not by a component reaching for `localStorage` — the repository rule from SPEC 001
  applies to this too.
- A cleared dismissal (new device, cleared data) simply shows the screen again. That is correct.

### Styling

- The home and the two list screens share **one hub identity**, defined in its own token file and not
  themed per game. Per-game colour appears only as the accent on a card, a badge, a dot or a score.
- The canastra setup screen belongs to canastra's world and uses canastra's tokens.
- The install screen uses the **hub** identity — it is not a game screen.
- No new font family. The display serif and the sans already in the app carry all of this.
- Tap targets stay at least 44px. Rows are tappable across their whole width, not only on the chevron.

### Quality floor

- Keyboard focus is visible on every control, including the cards and rows.
- `prefers-reduced-motion` is respected by any press or entry animation.
- Every screen added here works offline, like the rest of the app.

## Acceptance criteria

- [x] `npm run check` and `npm run build` pass
- [x] No domain, repository, scoring or validation file was modified, and the canastra and truco match
      screens are unchanged — verified by the diff
- [x] Game cards render from the registry; adding a game to the registry adds a card with no screen edit
- [x] The **Em breve** card renders with the sub-line **Truco gaúcho**, has no chevron, is not a
      button or link, is not keyboard-focusable and produces no press feedback — asserted by a test
- [x] With no match in progress, the whole *Em andamento* section is absent — no heading, no badge, no
      empty box
- [x] With more than three matches in progress, the home shows three rows and the badge shows the true
      total, asserted by a test
- [x] *Ver todos* lists every in-progress match; the history screen lists finished and in-progress
      matches for this device; both open a match on tap
- [x] Neither list screen offers delete, rename, finish, filter or search
- [x] The history screen states that the history is local to the device
- [x] The history empty state reads **Nenhuma partida ainda.**
- [x] Opening the app for the first time in a browser, not installed and not dismissed, lands on the
      install screen
- [x] The install screen never appears in standalone mode, and the footer strip is absent there —
      asserted by tests for both `display-mode: standalone` and `navigator.standalone`
- [x] **Instalar app** appears only when `beforeinstallprompt` was captured, and triggers the browser's
      dialog; with no event, the written instructions appear instead
- [x] iOS instructions name *Compartilhar*, *Adicionar à Tela de Início* and *Adicionar*, and tell the
      person to use Safari
- [x] An unrecognised platform still gets usable instructions
- [x] No instruction is delivered as an image
- [x] **Continuar sem instalar** returns to the home, and reopening the app does not show the screen
      again; the footer strip still leads back to it
- [x] The dismissal flag is written by a dedicated module; `grep -rn localStorage src/` matches only the
      repository and that module
- [x] The canastra setup screen matches **Nova partida (canastra)**: centred trophy, `CANASTRA` rule,
      serif title, one panel, field with the diamond, two chips with the selected one marked, toggle,
      primary button — and **no hint text below the panel**
- [x] Tapping a suggestion chip fills the field; typing a value matching neither chip leaves both
      unselected without error
- [x] **COMEÇAR PARTIDA** is disabled while the limit is invalid, and SPEC 002's messages are unchanged
- [x] Dates read `Iniciada em DD/MM, HH:MM`, and every number goes through the existing pt-BR helper
- [x] Rows and cards are tappable across their full width and show a visible keyboard focus state
- [x] Every user-visible string is pt-BR; no i18n library or locale file was added
- [x] No image file was added to the repository by this SPEC

## Open questions

None. The screen designs came from the owner's mockups and are transcribed above; the mockups
themselves are deliberately not committed.
