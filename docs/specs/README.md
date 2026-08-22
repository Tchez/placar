# SPECs

One SPEC per unit of work. Numbered sequentially, never renumbered.

A SPEC is the only input to implementation: it must be understandable and buildable from this
repo alone, with no access to the owner's private notes. Copy `000-template.md` to start one.

## Written

| # | Title | Status |
|---|---|---|
| [001](001-project-setup.md) | Project setup and architectural skeleton | done |
| [002](002-canastra.md) | Canastra, first game end to end | ready |

## Planned

Order matters — each one is meant to be a purely additive change on top of the last.

| # | Title | Why here |
|---|---|---|
| 003 | Truco | Fixed-value buttons and a required target. Blocked on which variant the family plays (gaúcho / mineiro) |
| 004 | Padel | The hard one: score is not a sum. Sets derived from a log of games won. If 002 got the contract right, this needs no change to any screen |
| 005 | Generic game + finished-match history | Closes the MVP scope in `README.md` |
| 006 | PWA install, offline and deploy | How the family actually gets the app. Blocked on the hosting decision |
| — | Round-based entry for canastra | One input per team saved as a round. Better fit for how canastra is actually scored; deferred out of SPEC 002 because it changes the entry log's shape |

Canastra comes first because it is what the family plays most, and because it is the game that
exposes the real variability — different point limits, variable team count, negatives allowed or not.
Building the first screens against the messiest case avoids a contract that is too naive.

Padel comes late but its shape is already accounted for in the SPEC 001 contract
(`scoreboard(match)` derived from the entry log, `Standing.score` plus a free-text detail). If
implementing 004 requires editing a screen, the contract was wrong — that is the signal to fix the
contract, not to special-case padel.
