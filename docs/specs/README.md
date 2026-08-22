# SPECs

One SPEC per unit of work. Numbered sequentially, never renumbered.

A SPEC is the only input to implementation: it must be understandable and buildable from this
repo alone, with no access to the owner's private notes. Copy `000-template.md` to start one.

## Written

| # | Title | Status |
|---|---|---|
| [001](001-project-setup.md) | Project setup and architectural skeleton | ready |

## Planned

Order matters — each one is meant to be a purely additive change on top of the last.

| # | Title | Why here |
|---|---|---|
| 002 | Truco: first game end to end | Simplest counting rule (fixed buttons, no negatives, target 12). Proves the whole flow — pick game → create match → add entries → live score — and the game-as-data contract, with the least surface area |
| 003 | Canastra | Adds free numeric entry and negative round balances |
| 004 | Padel | The hard one: score is not a sum. Sets derived from a log of games won. If 002–003 got the contract right, this needs no change to any screen |
| 005 | Generic game + match history | Closes the MVP scope in `README.md` |
| 006 | PWA install, offline and deploy | How the family actually gets the app. Blocked on the hosting decision |

Ordering rationale: padel comes late but its shape is already accounted for in the SPEC 001
contract (`scoreboard(match)` derived from the entry log). If implementing 004 requires editing a
screen, the contract was wrong — that is the signal to fix the contract, not to special-case padel.
