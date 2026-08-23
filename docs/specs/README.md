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

## Planned

| # | Title | Why here |
|---|---|---|
| 006 | Padel | The hard one: score is not a sum. Sets derived from a log of games won. If 002 got the contract right, this needs no change to any screen |
| 007 | Generic game | Closes the MVP game scope in `README.md`. The history screen ships in SPEC 005 |
| 008 | Truco gaúcho | A separate game from mineiro — the scoring differs. Blocked on how the family counts it |
| — | Round-based entry for canastra | One input per team saved as a round. Better fit for how canastra is actually scored; deferred out of SPEC 002 because it changes the entry log's shape |
| — | Two-finger undo gesture | Deferred from SPEC 003: decide after the family has used the button |
| — | Export / import of match history | A manual backup path, worth having before any sync exists |

## Ordering

**The implemented order is 002 → 003 → 004 → 005; 006 is next.** Numbers are identity, not priority,
and are never reused or renumbered.

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

Padel comes late, but its shape is already accounted for in the SPEC 001 contract
(`scoreboard(match)` derived from the entry log, `Standing.score` plus a free-text detail). If
implementing it requires editing a screen, the contract was wrong — that is the signal to fix the
contract, not to special-case padel.
