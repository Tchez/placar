# SPECs

One SPEC per unit of work. Numbered sequentially, never renumbered.

A SPEC is the only input to implementation: it must be understandable and buildable from this
repo alone, with no access to the owner's private notes. Copy `000-template.md` to start one.

## Written

| # | Title | Status |
|---|---|---|
| [001](001-project-setup.md) | Project setup and architectural skeleton | done |
| [002](002-canastra.md) | Canastra, first game end to end | done |
| [003](003-truco-mineiro.md) | Truco mineiro | ready |
| [004](004-deploy-and-install.md) | Deploy and installable PWA | ready — **do this next** |

## Planned

| # | Title | Why here |
|---|---|---|
| 005 | Padel | The hard one: score is not a sum. Sets derived from a log of games won. If 002 got the contract right, this needs no change to any screen |
| 006 | Generic game + finished-match history | Closes the MVP scope in `README.md` |
| 007 | The home hub | The home screen keeps one neutral identity while each game owns its own screens. Only needed if the hub outgrows what SPEC 002 built |
| 008 | Truco gaúcho | A separate game from mineiro — the scoring differs. Blocked on how the family counts it |
| — | Round-based entry for canastra | One input per team saved as a round. Better fit for how canastra is actually scored; deferred out of SPEC 002 because it changes the entry log's shape |
| — | Two-finger undo gesture | Deferred from SPEC 003: decide after the family has used the button |
| — | Export / import of match history | A manual backup path, worth having before any sync exists |

## Ordering

**Implementation order is 002 → 004 → 003 → 005 …** Numbers are identity, not priority, and are never
reused or renumbered.

**004 jumps the queue, ahead of every remaining game.** `localStorage` is scoped per origin, so every
score recorded against the dev server is orphaned the moment the app moves to a real URL. Until the
app is installed and works offline, nothing recorded in it can be trusted to survive — so the deploy
comes before more features, not after.

Canastra came first because it is what the family plays most, and because it is the game that exposes
the real variability — different point limits, negatives allowed or not. Building the first screens
against the messiest case avoids a contract that is too naive. The canastra redesign that arrived
mid-implementation was folded into SPEC 002 rather than becoming its own SPEC; the concept image stays
at `assets/004-canastra-concept.png` and the decisions it settled are recorded in `README.md` under
*The canastra screen*.

Padel comes late, but its shape is already accounted for in the SPEC 001 contract
(`scoreboard(match)` derived from the entry log, `Standing.score` plus a free-text detail). If
implementing it requires editing a screen, the contract was wrong — that is the signal to fix the
contract, not to special-case padel.
