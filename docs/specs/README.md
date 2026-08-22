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

## Planned

| # | Title | Why here |
|---|---|---|
| 005 | Padel | The hard one: score is not a sum. Sets derived from a log of games won. If 002 got the contract right, this needs no change to any screen |
| 006 | Generic game + finished-match history | Closes the MVP scope in `README.md` |
| 007 | The home hub | The home screen keeps one neutral identity while each game owns its own screens. Only needed if the hub outgrows what SPEC 002 built |
| 008 | PWA install, offline and deploy | How the family actually gets the app. Blocked on the hosting decision |
| 009 | Truco gaúcho | A separate game from mineiro — the scoring differs. Blocked on how the family counts it |
| — | Round-based entry for canastra | One input per team saved as a round. Better fit for how canastra is actually scored; deferred out of SPEC 002 because it changes the entry log's shape |
| — | Two-finger undo gesture | Deferred from SPEC 003: decide after the family has used the button |

## Ordering

**Implementation order is 002 → 003 → 005 …** Numbers are identity, not priority, and are
never reused or renumbered.

Number 004 is intentionally unused. It briefly held a separate canastra redesign SPEC, but phone
testing and family feedback made those refinements part of the same end-to-end Canastra delivery.
The final behaviour was consolidated into SPEC 002 instead. The original concept image remains at
`assets/004-canastra-concept.png` as a visual reference. Numbers are identity, not priority, and a
gap is cheaper than a reused number.

Canastra came first because it is what the family plays most, and because it is the game that exposes
the real variability — different point limits, negatives allowed or not. Building the first screens
against the messiest case avoids a contract that is too naive.

Padel comes late, but its shape is already accounted for in the SPEC 001 contract
(`scoreboard(match)` derived from the entry log, `Standing.score` plus a free-text detail). If
implementing it requires editing a screen, the contract was wrong — that is the signal to fix the
contract, not to special-case padel.
