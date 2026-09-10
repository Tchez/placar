# SPEC 008 — Validation record

Validated on 2026-09-09 and updated on 2026-09-10 for the single rotated landscape layout,
against the supplied reference and the clarified rule:
adding a set preserves both point counters; only `zerar` establishes a new baseline. The current
counter also caps each side at 50 points and three sets, and points and sets are both added by
tapping their cards.
Each side now has separate controls for going back a point, zeroing points and going back a set.
The 2026-09-10 UI review adds a 360 ms paper turn around the upper binding for points and sets,
reverse turns for corrections, explicit −1 symbols and a reset-to-0 icon with the visible label "Zerar".
The volleyball badge now has curved panel seams and an outlined silhouette. Removing the generic
badge-circle fill rule fixes the solid yellow disk that previously hid the seams in both badge sizes.

## Automated acceptance coverage

`npm run check` passed TypeScript, ESLint, Prettier and **119 tests in 15 files**.
`npm run build` produced the installable PWA successfully. The final quality gate was rerun
on 2026-09-10 after the paper animation and correction-button refinements.

| Acceptance criteria | Evidence |
|---|---|
| Bound-paper turns and clear correction buttons | Production browser checks: forward/reverse turns, rapid taps, zero, failed storage write, initial load and reduced motion; DPR-2 screenshots and touch-target measurements |
| One landscape layout in both viewport orientations | Browser checks of portrait CSS rotation, top-layer dialogs, touches, focus and resizing while a dialog is open |
| No names; direct start | UI test starts from the hub without setup or team labels |
| Independent points and sets; 50-point and three-set caps; side-specific corrections | Domain tests replay mixed actions and entry removal; UI tests exercise direct card taps, both caps, point back, zero and set back |
| Unsaved matches remain active, survive reload and stay out of history | UI tests remount against the real local repository and check both lists |
| Saving from options does not finish | UI test checks persistence and immediate history visibility |
| Back: yes saves without finishing; no deletes | Parameterized save/discard tests include reopening the deleted route after remount |
| Finish: yes saves and finishes; no deletes | Same parameterized tests; save and finish use one repository write |
| Saved matches never prompt again | Finish, reopen, finish and back exercised on the saved match |
| Finished state has no winner and can reopen | UI test checks `Encerrada`, absent entry controls and reopening; domain test checks no winner at 120 points / 10 sets |
| Other games retain their history | Test includes all three other games, a missing legacy flag and false flags on other games |
| Existing data survives | Storage test reads a literal version-2 payload without the field, then saves, reloads and removes another match |
| Failed writes remain recoverable | Save and discard failures preserve the prompt and stored match; retry succeeds |

Tests: [domain](../../src/games/volei.test.ts), [UI and flows](../../src/games/VoleiMatchView.test.tsx),
[storage](../../src/storage/localRepository.test.ts).

## Production browser verification

Chromium, DPR **2**, serving `dist/` with `npm run preview`:

- Added points and sets, used the side-specific correction controls, then reloaded the unsaved match.
- Checked its absence in history and resumed it from active matches.
- Saved, finished without another prompt and reopened the same match.
- Waited for service-worker control, disabled the browser context's network and reloaded.
  Scores and decoration remained available; point entry, corrections, creation and deletion worked offline.
  Reopening a discarded match showed “Partida não encontrada.”
- Checked Tab stays inside the options dialog; Escape closes it and restores focus to the gear.
- Recorded no JavaScript page errors or external-origin requests during the browser flow.
- Created the reference's 24–22 points / 2–1 sets through actual controls while offline.
- On 2026-09-10, verified a fixed portrait viewport with no orientation-lock API or fullscreen request:
  CSS rotates the counter and both dialogs clockwise. Point entry, corrections and cancellation work through
  the transformed controls. Rotating the viewport while options are open preserves the dialog;
  Tab remains inside and tapping the backdrop dismisses it. Returning home removes the rotation.
- Repeated the production offline flow after the CSS change; no page errors or external requests.
- Repeated browser verification after the paper/button refinement on 2026-09-10 using the
  production build and Chromium at DPR 2. Rapid card taps reached 24–22 with no queued stale
  score; animation layers disappeared on completion. A paused 210 ms frame captures the upper
  binding turn revealing 25 beneath the previous 24.
- Verified point removal plays a reverse turn. Reduced motion updates the visible number
  immediately with zero active animations; reset reaches zero, disables corrections and leaves
  the other side unchanged. A simulated storage-write failure leaves the number unchanged and
  starts no animation; retry succeeds. Reload shows the persisted number without a turn.
- Rechecked all seven viewport sizes below: no scrolling, controls entirely inside the viewport
  and all match buttons at least 44 × 44 CSS pixels. Re-rendered both dialogs in landscape and
  rotated portrait. Rotated point entry and correction worked. An offline production reload and
  another point entry succeeded, with zero page errors or external-origin requests.
- Extended the same browser checks to set turns: captured 2 → 3 mid-turn, verified the cap remains
  disabled at three, reverse removal returns to two and neither side's points change. With reduced
  motion, set correction displays the new count immediately with zero active animations. Rechecked
  the outlined volleyball badge in the hub and active-match list at 390 × 844, DPR 2.

| CSS viewport | Result |
|---|---|
| 844 × 390 | Landscape phone: no scrolling or clipped controls |
| 836 × 470 | Reference proportions: no scrolling or clipped controls |
| 667 × 375 | Compact landscape: no scrolling or clipped controls |
| 390 × 844 | Rotated landscape counter: no scrolling or clipped controls |
| 320 × 568 | Small rotated counter: no scrolling or clipped controls |
| 430 × 932 | Large rotated counter: no scrolling or clipped controls |
| 568 × 320 | Small landscape: no scrolling or clipped controls |

All match buttons measured at least **44 × 44 CSS pixels**. These are browser viewport checks;
physical iOS and Android installation/rotation were not exercised.

## Rendered evidence

### Set-number flicker follow-up (2026-09-10)

The owner reported set numbers blinking on point entry. Set numbers previously lived inside the
button temporarily disabled by every write. They now live on a separate paper surface, with an
empty entry button over it, matching point-card entry. Busy/capped/finished states still disable
input, without applying native disabled-button rendering to the set number.

The reported flicker was not reproduced in the original desktop Chromium/WebKit baseline, so the
native-button mechanism remains a suspected cause rather than a confirmed device reproduction.
The production fix was checked in WebKit 26.6 and Chromium (Brave), at DPR 2 and 844 × 390,
390 × 844 and 568 × 320. Both set-card crops remained visually stable with their entry buttons
disabled and at 0/100/200/300 ms of point turns on either side; no set-turn layer was created.
The comparison allowed only subpixel edge variation (maximum channel delta 12/255 and mean
delta below 0.1/255). Set addition, reverse correction and reduced motion still worked, with no
page errors. Physical-phone confirmation remains outstanding.

`npm run check` passed all 115 tests and the production build passed after this fix.
See [the point turn with stable sets](008-volei-stable-sets.png).

### Nonzero set flicker follow-up (2026-09-10)

The owner confirmed the first fix did not resolve the phone issue: both set numbers blink on
either side's point entry, specifically at 1/2/3, in the app reached through the PC's local-network
address. No physical-device reproduction has yet established the renderer's exact cause.

The final follow-up removes the shared visual invalidation during a point write. Native set-control
`disabled` states now depend only on actual zero/cap/finished conditions; pending writes use
`aria-disabled` and the existing synchronous busy guard. Previously, nonzero set correction controls
changed opacity from 1 to 0.4 during every point write, whereas zero remained at 0.4 throughout.
The number paper is memoized and the perspective container exists only while its own sheet turns;
resting and reduced-motion numbers remain in 2D.

Four UI regression cases hold a point write pending at 0/1/2/3 sets, check stable native disabled
states and accessible blocking, attempt set addition/correction during the write, and verify that
only the point is persisted. The complete quality gate passed **119 tests** and the build succeeded.

Local Vite browser checks in Chromium/Brave and WebKit covered 844 × 390, 390 × 844 and 568 × 320
at DPR 2, both point cards, reverse set turns and reduced motion. A temporary isolated harness held
writes pending and compared the **entire set control**, not only its numeral, for each value 0–3.
All comparisons passed the same subpixel tolerance above. At nonzero values correction opacity now
stays at 1 during writes. The temporary harness was removed after verification.
Phone confirmation of this final follow-up remains pending.

- [Local point turn with resting set layers](008-volei-stable-sets-2d.png)
- [Two sets during a held point write](008-volei-pending-point.png)

### Review screenshots

These are DPR-2 screenshots of the production implementation, not copies of the supplied concept.
All captures were regenerated on 2026-09-10 after the paper/button refinement and cover the
landscape, rotation, updated controls and dialog composition:

- [Reference proportions](008-volei-reference.png)
- [Landscape phone](008-volei-landscape.png)
- [Paper turn in progress, 24 → 25](008-volei-paper-turn.png)
- [Set turn in progress, 2 → 3](008-volei-set-turn.png)
- [Volleyball badge in the match list](008-volei-match-list-icon.png)
- [Volleyball badge in the hub](008-volei-hub-icon.png)
- [Portrait viewport with rotated counter](008-volei-portrait.png)
- [Rotated options](008-volei-rotated-options.png)
- [Rotated save prompt](008-volei-rotated-prompt.png)
- [Options open](008-volei-options.png)
- [Save/discard prompt](008-volei-save-prompt.png)

The treatment follows the reference's black and yellow plates, metallic rings, stacked edges,
central sets and gear menu. Existing Archivo supplies the numerals; its glyph outlines differ
from the concept. Portrait rotates the same layout, including the options and save dialogs, by
90 degrees; there is no separate vertical arrangement. Browser chrome and native confirmation
dialogs stay in their system orientation. Physical rotation-lock settings were simulated by keeping
the browser viewport in portrait, rather than tested on a physical phone.

## Offline weight and compatibility

- No new runtime dependencies or fonts.
- `counter.webp`: **2,678 bytes**, generated deterministically by `npm run textures` and inlined
  into CSS by Vite. Existing gaudério assets remain byte-for-byte unchanged.
- Production precache: **1,473.95 KiB across 19 entries**, including existing icons, fonts and games.
  The paper turn and icons use local React/CSS/SVG and the existing counter texture.
  Screenshot evidence under `docs/` is not included in the app precache.
- The manifest uses `orientation: any` to allow the landscape counter when installed.
- Persistence remains `placar:matches`, schema **2**; missing `savedToHistory` reads as `true`.
