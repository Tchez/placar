# SPECs

One SPEC per unit of work. Numbered sequentially, never renumbered.

A SPEC is the only input to implementation: it must be understandable and buildable from this
repo alone, with no access to the owner's private notes. Copy `000-template.md` to start one.

## Written

| # | Title | Status |
|---|---|---|
| [001](001-project-setup.md) | Project setup and architectural skeleton | done |
| [002](002-canastra.md) | Canastra, first game end to end | done |
| [003](003-truco-mineiro.md) | Truco mineiro | done |
| [004](004-deploy-and-install.md) | Deploy and installable PWA | implemented — live and device verification pending |
| [005](005-ui-and-install.md) | Home, match lists and the install flow | done |
| [006](006-truco-gauderio.md) | Truco gaudério | done |
| [007](007-canastra-defaults-and-home-cleanup.md) | Canastra defaults and home cleanup | done |
| [008](008-volei.md) | Vôlei | done |

## Planned

| # | Title | Why here |
|---|---|---|
| 009 | Generic game | Closes the MVP game scope in `README.md`. The history screen shipped in SPEC 005 |
| — | Round-based entry for canastra | One input per team saved as a round. Better fit for how canastra is actually scored; deferred out of SPEC 002 because it changes the entry log's shape |
| — | Two-finger undo gesture | Deferred from SPEC 003: decide after the family has used the button |
| — | Export / import of match history | A manual backup path, worth having before any sync exists. Gains value if the installed app turns out not to share storage with the browser |
| — | Rules for truco gaudério (flor, envido) | **Conditional, not debt.** The owner's position is that counting alone may be the finished product. Do not treat this as missing |

## Dropped

| Title | Why |
|---|---|
| Padel | Dropped 2026-08-23. The courts the family plays on already have a physical counter on the wall, so the app would compete with something free and already there. The residual value was history only — a wall counter answers *"what's the score"* but not *"who won last time"* — and that was judged too thin to carry a game. **Do not re-propose without new information.** The trigger would be playing on a court with no counter, or wanting padel history badly enough to justify the screen |

## Ordering

**The implemented order is 002 → 003 → 004 → 005 → 006 → 007 → 008.** Numbers are identity,
not priority, and are never reused or renumbered.

**The queue changed on 2026-08-23, and again when 007 was assigned elsewhere.** It was `006 padel ·
007 generic · 008 truco gaúcho`; it then became `006 truco gaudério · 007 vôlei · 008 generic` when
padel was dropped (see *Dropped* above) and vôlei took over its architectural role. SPEC 007 was
later assigned to the canastra-default change when that became the next written unit, so vôlei
slid to **008** and generic to **009**. No rule was bent: planned numbers are queue positions until
a file gives them identity. **Identity begins at the file.**

**004 remains ahead of every game after truco.** `localStorage` is scoped per origin, so every score
recorded against the dev server is orphaned the moment the app moves to a real URL. Until the app is
installed and works offline, nothing recorded in it can be trusted to survive — so the deploy comes
before more features, not after.

Canastra came first because it is what the family plays most, and because it is the game that exposes
the real variability — different point limits, negatives allowed or not. Building the first screens
against the messiest case avoids a contract that is too naive. The canastra redesign that arrived
mid-implementation was folded into SPEC 002 rather than becoming its own SPEC, and the decisions it
settled are recorded in `README.md` under *The canastra screen*. No reference images are kept in this
repo: a SPEC that needs a picture to be understood is not finished.

**Vôlei is the architecture test, and that is why it stays in the plan.** The SPEC 001 contract
(`scoreboard(match)` derived from the entry log, `Standing.score` plus a free-text detail) was designed
for a game whose score is not a sum. Padel used to be that game; vôlei now is. The shared scoreboard represents sets won as
`Standing.score` and current-set points as its detail; the dedicated match view makes points the
large number and sets the small number. The registry owns that view, as it does for both trucos.
History opt-in is declared in the game definition, so shared screens do not branch on game IDs.

Vôlei is a harder test than padel would have been: padel would have logged *games*, vôlei logs
*points*. Far more entries, and the set boundary has to live in the log rather than being inferred from
a known target — because the app deliberately does not know the target.

**006 is almost no rules and a whole new screen — the opposite of the usual shape.** Truco gaudério has
no game rules at all in v1 (no flor, no envido, no mão de onze) and increments by one, so the domain work
is near zero. The work is the screen: its own gaúcho identity, with the score drawn as matchsticks —
groups of five as a closed square with a diagonal fifth, the remainder as loose sticks — and no ladder.
**Estimate the screen, not the rules.**

That screen is cheaper than it first looks, though, because SPEC 003 already built the machinery: a
per-game `MatchView`, per-game tokens via `data-game` and `styles/games/<gameId>.css`, `needsSetup`,
tally-as-score with no digits, and self-hosted Roboto Slab and Archivo. **006 adds no new mechanism** —
it is a new theme and a new tally figure inside an existing system.
