# SPEC 010 — Author credit linking to the portfolio

- **Status:** in progress
- **Created:** 2026-10-29
- **Depends on:** SPEC 009 (static fallback, JSON-LD, `llms.txt`)

## Goal

Placar credits its author with a small **Criado por Marco Netto** line that links to the owner's portfolio at `https://tchez.dev/`. Nothing changes for the family's scoring flow; people and search engines can see who made the app and reach the rest of the owner's work.

## Context

`tchez.dev` is the owner's portfolio and the hub for all of their live sites. It already links out to Placar; the reverse link is missing. Placar once dropped out of Google's index, which is why the portfolio became the hub: links in both directions let search engines connect the sites. The owner's other site, `speakup.tchez.dev`, already does this with a footer line ("Criado por Marco Netto", the name linking to `https://tchez.dev/`) and a JSON-LD `Person` with the same URL. This SPEC applies the same pattern here.

**Where a crawler actually looks.** Every first browser visit, Googlebot's rendering included, is redirected by `InstallGate` to the landing route (`/#/instalar`), because a crawler is never installed and has no stored dismissal. A link on the home hub alone would therefore never be rendered for Google. Crawlers that do not run JavaScript (most AI crawlers) see only the static fallback inside `index.html`'s `#root` and the JSON-LD. The credit has to exist in all three places to be seen by every reader.

## Scope

**In**

- One shared `AuthorCredit` component rendering **Criado por Marco Netto**, with **Marco Netto** linking to `https://tchez.dev/`
- The credit on the first-visit landing screen, below the install card
- The credit in the home hub footer, above the version line
- The same credit as a plain paragraph in `index.html`'s static fallback
- `author` (`Person`, name and URL) in the existing JSON-LD block
- One author line in `public/llms.txt`

**Out**

- The credit on match, history, active-matches or new-match screens: these are the scoring flow, and the home hub already carries it for people
- `rel="nofollow"`, `target="_blank"` or any other change to how the link opens: a plain link passes the connection to search engines, and the link sits on screens with no match in progress
- Updating `sitemap.xml`'s `lastmod`: SPEC 009 reserves it for meaningful changes to the home's visible content, and a credit line is not one
- Any other portfolio content (bio, photo, list of projects)

## Behaviour

- **Landing (`/#/instalar`):** below the install card, a small muted line **Criado por Marco Netto**; the name is a link.
- **Home hub (`/`):** in the footer, the same line sits directly above `versão <sha>`, in the same muted small type. It shows whether or not the app is installed.
- **Static fallback:** the last paragraph of `.seo-fallback` reads **Criado por Marco Netto.**, with the name linking to the portfolio and styled like the surrounding text (no default browser blue).
- Activating the link navigates to `https://tchez.dev/` in the same context. Offline it simply fails like any external link; nothing in the app depends on it.

## Rules

- Link markup everywhere: `<a href="https://tchez.dev/" rel="author">Marco Netto</a>`. The URL keeps its trailing slash, matching the JSON-LD and the SpeakUp site.
- Copy is pt-BR and fixed: **Criado por Marco Netto**. The public name is **Marco Netto**; never the full legal name.
- JSON-LD gains exactly:

  ```json
  "author": {
    "@type": "Person",
    "name": "Marco Netto",
    "url": "https://tchez.dev/"
  }
  ```

- `llms.txt` gains, under **Onde**: `- Autor: Marco Netto, https://tchez.dev/`
- The link has a tap area larger than its small type (vertical padding on the inline link), per the thumb-first constraint in `CLAUDE.md`.

## Acceptance criteria

- [x] `AuthorCredit` renders the text and a link named **Marco Netto** with `href="https://tchez.dev/"` and `rel="author"`
- [x] The first-visit landing shows the credit (test)
- [x] The home hub footer shows the credit above the version line (test)
- [x] `index.html`'s static fallback contains the credit link, and the JSON-LD block contains the `author` above and still parses as JSON
- [x] `public/llms.txt` contains the author line
- [x] Landing and home screenshotted at a 390 px phone viewport, DPR 2: the credit is legible and does not crowd the install card or the version line
- [x] `npm run check` and `npm run build` pass
- [ ] After deploy: the live page source at `https://placar.tchez.dev/` contains `https://tchez.dev/`, and the schema.org Validator shows the `author` with no errors

## Open questions

None.
