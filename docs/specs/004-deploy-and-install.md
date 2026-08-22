# SPEC 004 — Deploy and installable PWA

- **Status:** ready
- **Created:** 2026-08-22
- **Depends on:** SPEC 002 — the canastra work must be committed before any of this can be published

## Goal

The family installs the app from **`https://placar.tchez.dev`** onto their phones and uses it with no
network at all. After this SPEC, scores kept in the app are safe to keep for real.

Today the app only exists on a dev server on the owner's machine. What is saved on the home screen is
a bookmark, not an app: no manifest, no service worker, nothing cached, and the Mac has to be awake
and on the same Wi-Fi.

## Context

**State of the repo at the time of writing:** `npm run check` green — 41 tests in 6 files. Two commits
on `main`, and neither contains the canastra work. **No git remote.** No manifest, no service worker,
no icons, no `base` in `vite.config.ts`.

**The domain, corrected.** An earlier draft of this SPEC claimed `tchez.dev/placar` would work with no
DNS change. That was wrong. `tchez.dev` is the custom domain of the **`brain-blog` project repo**
(`build_type: legacy`), and the account has **no user site** — there is no `tchez.github.io` repo.
GitHub only serves project sites under a custom domain when the *user site* owns that domain, so with
the apex held by a project repo, `tchez.dev/<anything>` is routed by the blog and returns the blog's
own 404. Verified in the browser.

The app therefore gets its own subdomain: **`placar.tchez.dev`**, which serves at the **root** of that
host. That removes the whole class of subpath bugs, and because it is a separate origin from
`tchez.dev`, the app's service worker cannot reach the blog even in principle.

DNS for `tchez.dev` is managed by **Cloudflare**.

**Why this SPEC comes before every remaining game.** `localStorage` is scoped per origin. Scores saved
against `http://<lan-ip>:5173` do not travel to `https://tchez.dev/placar`. Until this ships, any real
match recorded in the app is orphaned data. This is what makes the app safe to actually use.

**The pipeline is modelled on `apilyzer`**, the owner's own project, with the ceremony that does not
transfer removed — see **Deliberately not built** for what was dropped and why.

## Scope

**In**

1. Get the code into a remote: commit the outstanding work, create the **public** GitHub repo `placar`,
   push `main`
2. The custom domain `placar.tchez.dev`, and a `preview` script for verifying a production build
   locally. `base` stays at the default `/` — the app is served from a host root, not a subpath
3. Web app manifest and the full icon set, generated from a single master image
4. Service worker via `vite-plugin-pwa`, precaching the whole app shell, updating itself silently
5. iOS install support: `apple-touch-icon`, standalone meta tags, status bar style
6. A discreet build-version indicator in the UI
7. GitHub Actions: a quality gate, a dependency audit, and a Pages deploy gated on the gate
8. `.nvmrc` pinning Node, and Dependabot pointed at `main`
9. `README.md` gains how to run, how to deploy, and the live URL

**Out** — explicitly, so it does not get built by accident

- **Codecov.** Coverage is printed in the CI log and not uploaded anywhere. Owner's call: a coverage
  service is an extra account, a secret to maintain, and a third party that can redden the build for
  reasons that are not the code
- **A coverage threshold.** `apilyzer` does not enforce one either. A gate on that number makes people
  write tests to satisfy the number
- **`commitlint` / `husky`.** Conventional commits stay a discipline, not a hook — which is what
  `apilyzer` actually does. A local hook also fights agent-driven commits and would be disabled at the
  first friction
- **A Node version matrix.** `apilyzer` tests several Python versions because it is a *library* and its
  users pick the version. This is an app: Node only builds it, and there is exactly one build
  environment. A matrix here doubles the job and covers nothing
- **PR preview environments.** Worth it with more people; today there is one person
- Export/import of match history, any new game, any screen or behaviour change, push notifications,
  background sync, a dedicated domain for the app

## Behaviour

### Installing

- **Android / Chrome:** opening `https://tchez.dev/placar` offers to install the app. Installed, it
  launches with no browser chrome, in portrait.
- **iOS / Safari:** *Compartilhar → Adicionar à Tela de Início* adds it, and it launches standalone
  with no Safari bars.
- On the home screen it is called **Placar** and carries the app icon at full quality — no letterboxed
  screenshot, no browser glyph in the corner.

### Offline

With the phone in airplane mode, launching from the home screen opens the app fully: the game picker,
every saved match, every score. Nothing shows a network error, because nothing needs the network.

A match saved before going offline is there. A match saved *while* offline is there after coming back
online. Both are just `localStorage`; the service worker only caches the app itself.

### Updating

Publishing a new version requires nothing from the family and asks them nothing. The next time the app
is opened it is the new version. No banner, no button, no "nova versão disponível".

Their data survives an update untouched — updates replace the app, never the storage.

### Knowing which version is running

The home screen carries a small, muted build identifier at the bottom. It is not on the match screens,
which stay clean.

It exists for support: when someone says "aqui está estranho", the answer starts with knowing which
build is on their phone rather than guessing.

## Rules

### Base path and router

The app is served from the root of `placar.tchez.dev`, so **`base` stays `/`** — do not set a subpath.
`HashRouter` means every navigation resolves inside `index.html`, so no server-side rewrite or
`404.html` trick is needed either way.

Still write asset, manifest and service-worker paths as base-relative rather than hardcoded, so a
future move to a subpath is a config change and not a hunt.

### Service worker scope

Scope is `/` on `placar.tchez.dev`, which is correct and safe: a subdomain is a **separate origin**, so
this worker can never see, intercept or cache anything on `tchez.dev`. Choosing the subdomain is what
makes this a non-issue — under a subpath on the shared apex it would have been a real risk.

Verify the registered scope anyway, and verify it is `placar.tchez.dev` and not something inherited
from a stale registration during local testing.

### Update strategy

`vite-plugin-pwa` with `registerType: 'autoUpdate'`. The new worker takes over and the app reloads on
next launch. No update prompt, no user-facing choice.

### Icons

- One master at `public/icon-master.png`: **1024×1024, fully opaque, and full-bleed** — the artwork
  reaches all four edges of the square.
- **It must not be an app-icon mockup.** No baked-in rounded corners, no drop shadow, no background
  margin around a floating tile. Every OS applies its own mask, so a pre-rounded tile on a contrasting
  background renders as a dark frame around the icon on iOS and gets cropped into that margin by
  Android's maskable crop. This is the failure mode that actually happens — check the four corners of
  the master are the icon's own background colour, not black.
- Every other size is **derived from it at build time or by a committed script** — never hand-edited.
  Replacing the master and rebuilding must regenerate every size with **no code change**. The icon is
  data, not a task.
- Required outputs: `192×192` and `512×512` (`purpose: "any"`), a `512×512` **maskable** variant with
  at least 20% padding on every side, a `180×180` opaque `apple-touch-icon`, and a favicon.
- A provisional master may be committed so the pipeline can be finished and tested. It is provisional:
  swapping it is a one-file change.

### Manifest

`name` and `short_name` are both **Placar** — it is already short enough that a separate short name
would be noise. `display: standalone`, `orientation: portrait`, `lang: pt-BR`, and `theme_color` /
`background_color` matching the app's own ground so the launch screen does not flash white.

### Version indicator

Injected at build time through Vite `define`, from the commit SHA the Actions run is building (short
form). Outside CI it reads `dev`. It is never fetched at runtime — an offline app cannot ask a server
what version it is.

### Offline precache

Precache the entire build output. The app is around 250 KB, so there is nothing to be selective about,
and selectivity is how offline breaks silently. `navigateFallback` points at the built `index.html`.

### Pipeline

One workflow, jobs independent the way `apilyzer` structures them:

| Job | Runs on | Does | Blocks deploy |
|---|---|---|---|
| `check` | push to `main`, and every PR | `npm ci` then `npm run check` (typecheck, lint, format, tests) with coverage printed | **yes** |
| `audit` | push to `main`, and every PR | `npm audit --audit-level=moderate` | no — it may fail on its own |
| `deploy` | push to `main` only | builds and publishes to GitHub Pages | — |

- `deploy` declares `needs: check`. A red gate never reaches the family's phones.
- `audit` is deliberately independent: a CVE in a transitive dev dependency should not stop a
  score-keeping app from shipping, but it should be visible.
- Node comes from `.nvmrc` via `node-version-file`, so CI and the owner's machine cannot drift.
- Deploy uses the official Pages flow (`upload-pages-artifact` + `deploy-pages`) with the permissions
  it requires. No third-party deploy action.
- `npm ci`, never `npm install`, so the lockfile is authoritative.

### Manual steps, done by the owner

The SPEC cannot do these, and CI fails in a confusing way if they are missing:

1. Create the **public** GitHub repo named `placar`, add it as `origin`, push `main`. *(Done.)*
2. Set **Pages → Source = GitHub Actions**, not "Deploy from a branch". *(Done, `build_type: workflow`.)*
3. In **Cloudflare** DNS for `tchez.dev`, add `CNAME  placar → tchez.github.io` with proxy status
   **DNS only**. Proxied (orange cloud) prevents GitHub from issuing the Let's Encrypt certificate and
   produces a certificate error or a redirect loop — this is the classic Cloudflare + Pages failure.
4. Set the custom domain on the repo:
   `gh api --method PUT /repos/Tchez/placar/pages -f cname=placar.tchez.dev`, then wait for the
   certificate and confirm `https_enforced` is true.
5. Provide `public/icon-master.png`.

Also commit `public/CNAME` containing `placar.tchez.dev`, so the domain travels with the deploy
artifact and cannot be lost by a publish.

These belong in the README so they are not rediscovered later.

## Acceptance criteria

- [ ] `npm run check` and `npm run build` pass
- [ ] All outstanding work is committed; `main` has a remote and is pushed
- [ ] `base` is the default `/`; no subpath is configured anywhere
- [ ] `public/CNAME` contains `placar.tchez.dev`, and the deployed site reports that custom domain
- [ ] `https://placar.tchez.dev` serves over HTTPS with a valid certificate and `https_enforced` true
- [ ] `npm run preview` serves the production build and the app works from it
- [ ] Installing from `https://placar.tchez.dev` on Android gives a standalone app with the real icon
- [ ] *Adicionar à Tela de Início* on iOS gives a standalone app with the real icon and no Safari bars
- [ ] With the device offline, launching from the home screen loads the app and every saved match
- [ ] The registered service worker origin is `placar.tchez.dev` with scope `/`, and no stale
      registration from local testing survives — asserted by inspection and recorded in the PR
- [ ] Publishing a new build results in that build being live on next launch, with no prompt, and with
      existing matches intact
- [ ] The home screen shows a build identifier; the match screens do not
- [ ] The build identifier is baked in at build time and never fetched at runtime
- [ ] Every icon size is generated from `public/icon-master.png`; replacing that file and rebuilding
      changes every icon with no code edit
- [ ] The maskable icon keeps all content within the central 80% of the canvas
- [ ] `deploy` runs only on `main` and declares `needs: check`; a failing gate blocks it — verified by
      pushing a deliberately failing branch to a PR
- [ ] `audit` failing does not block `deploy`
- [ ] `.nvmrc` exists and CI reads Node from it
- [ ] Coverage is printed in the CI log and uploaded nowhere; no Codecov token or badge exists
- [ ] No `commitlint`, no `husky`, no Node version matrix in the workflow
- [ ] Dependabot is configured against `main`
- [ ] `README.md` documents the live URL, how to run locally, how a deploy happens, and the manual
      steps above — including the Cloudflare DNS-only requirement
- [ ] No screen, game rule or domain file was changed by this SPEC

## Open questions

None. The real icon master is still to be supplied; a provisional one may be committed so the pipeline
can be completed, and swapping it later is a one-file change by design.
