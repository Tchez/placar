# SPEC 009 — SEO and AI Discoverability

- **Status:** implemented — code ships checklist done; owner Search Console / AI-assistant verification pending
- **Created:** 2026-09-10
- **Depends on:** SPEC 004 (deploy and installable PWA) — builds on the existing GitHub Pages
  deployment and `vite-plugin-pwa` setup. No dependency on any game SPEC.

## Goal

Today, `placar.tchez.dev` is invisible to search and to AI assistants: there is no `robots.txt`, no
`sitemap.xml`, no structured data, and — as this SPEC explains in detail — the app's routing makes
even the *idea* of "one page per game" not work the way it looks like it should. This SPEC makes the
site technically legible to three audiences that read a site differently: a traditional search
crawler, a structured-data parser, and an AI assistant that browses the live web before answering.
When it ships, a person searching Google for a canastra/truco/vôlei score counter, or asking
ChatGPT/Claude/Gemini "existe algum app pra marcar placar de truco gaúcho?", has a real — if not
guaranteed — chance of being pointed at this app instead of nothing.

**This is explicitly a study, not a ranking mandate.** The owner's actual target for "must rank well"
is a separate project (a freela landing page), which is not part of this repo. Placar is the low-risk
place to implement the real techniques for the first time, verify they work exactly as documented,
and learn the failure modes — before spending a client's time on them. Every acceptance criterion
below is written so it can be checked for real, not approximated.

## Context

### What SEO, AEO and GEO each mean, and why this SPEC treats them as one job

- **SEO (Search Engine Optimization):** making a page **crawlable** (a bot can fetch it),
  **parseable** (its content and structure are legible), and **indexable** (a search engine decides
  to store and rank it) by traditional search engines. The classic references: Google's own
  [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) and
  [How Search Works](https://developers.google.com/search/docs/fundamentals/how-search-works) —
  already read this month per the vault's backlog.
- **AEO (Answer Engine Optimization):** the same crawlability/legibility work, but optimized to be
  *extracted as a direct answer* rather than *ranked as a link* — featured snippets, voice
  assistants, "People also ask". It rewards content that states facts plainly (short, direct,
  well-labelled sentences) over content that only reads well as prose.
- **GEO (Generative Engine Optimization):** the same idea one step further — optimizing for
  inclusion in an LLM-generated answer (ChatGPT, Claude, Gemini) rather than a search results page.
  This is a named academic field, not a buzzword: see
  [*GEO: Generative Engine Optimization*, arXiv:2311.09735](https://arxiv.org/abs/2311.09735)
  (Aggarwal, Murahari et al., Nov 2023), the paper that coined the term and the one nearly every
  later industry article cites.

**The practical reason this SPEC does not treat them as three separate workstreams:** GEO has two
completely different mechanisms, and only one of them is engineerable at all:

1. **Training-time inclusion** — the model "knows" about Placar because a crawler ingested it into a
   training corpus at some point in the past. This is slow (models train infrequently), unverifiable
   (no one outside the AI labs knows what's in a given training run), and not something a SPEC can
   target with a deadline. Out of scope by nature, not by choice.
2. **Inference-time retrieval** — the assistant performs a **live web search** while answering, the
   same way a search engine does, and cites what it finds. ChatGPT, Claude and Gemini all confirm
   this capability in their own docs:
   [ChatGPT web search](https://learn.chatgpt.com/docs/web-search),
   [Gemini / Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search),
   [Claude web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool).
   **This is the lever this SPEC pulls**, and it runs on the same rails as regular SEO: if a page is
   crawlable, parseable and indexed, it is a candidate for both a Google results page *and* an
   AI assistant's live-search answer. GEO-specific work on top of that is mostly about making facts
   easy to lift out cleanly (AEO), plus a couple of AI-specific extras (below).

### The one hard constraint that changes everything: this app uses hash routing

`src/app/App.tsx` wraps everything in `HashRouter`, and `src/app/routes.ts` declares:

```
/               → home
/instalar       → install guide
/em-andamento   → active matches
/historico      → history
/nova/:gameId   → new match setup
/partida/:matchId → a match in progress
```

With `HashRouter`, every one of those paths actually lives **after a `#`** in the real URL —
`https://placar.tchez.dev/#/historico`, not `https://placar.tchez.dev/historico`. This matters
because **the fragment portion of a URL is never sent to the server**, and search engines have
treated it as effectively invisible for a decade: Google's old AJAX-crawling scheme, which used
to give special meaning to `#!` fragments, was retired in 2015 —
[*Deprecating our AJAX crawling scheme*](https://developers.google.com/search/blog/2015/10/deprecating-our-ajax-crawling-scheme) —
and the guidance since has been to use real, server-visible paths (`pushState`/`history` API) for
any URL that needs to be independently indexed.

**Consequence: there is exactly one URL in this entire app that a search engine or an AI crawler can
meaningfully index — `https://placar.tchez.dev/`.** Not one per game, not one for the install guide.
Whatever content lives behind `#/instalar` or `#/historico` might as well not have its own URL at
all, as far as SEO/GEO is concerned.

**This SPEC does not fix that by switching to `BrowserRouter`.** It's the correct long-term fix, and
worth knowing for the freela project, but it is explicitly **out of scope here** — see *Scope*. It
would change the real URL of every screen, which risks breaking bookmarks/shortcuts on family
devices that already have the PWA installed, and GitHub Pages (fully static hosting, no
server-side rewrites) needs the well-known `404.html`-copy-of-`index.html` workaround to make
deep links work at all. That is a real architecture change with real product risk, and it deserves
its own decision, not a side effect of adding some metadata files. **The one page this app can be
found by is the home screen — so that page has to carry the entire weight of the description.**

### Why the static HTML shell matters more here than the JS-rendered app

Google's own pipeline crawls first, queues rendering, executes the JavaScript, *then* indexes what
it sees — a three-phase process documented at
[*JavaScript SEO basics*](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
Google can eventually see a client-rendered React app. **Most AI crawlers cannot** — the ones used to
build training corpora fetch raw HTML and do not run a JavaScript engine. This is why the static
fallback content below (a plain, real, factual description of the app, sitting in the initial HTML
before React mounts) is the single highest-value change in this SPEC: it is the *only* thing several
of the target audiences will ever see.

### The AI crawlers that exist today, what each is for, and how to address them

| Bot | Company | What it's actually for | robots.txt token |
|---|---|---|---|
| `GPTBot` | OpenAI | Ingests pages into training data | `GPTBot` |
| `OAI-SearchBot` | OpenAI | Live retrieval that powers ChatGPT's search feature | `OAI-SearchBot` |
| `ChatGPT-User` | OpenAI | Fetches one specific URL a user pasted or asked about, live in a chat | `ChatGPT-User` |
| `ClaudeBot` | Anthropic | Ingests pages into training data | `ClaudeBot` |
| `Claude-SearchBot` | Anthropic | Live retrieval for Claude's web search tool | `Claude-SearchBot` |
| `Claude-User` | Anthropic | Fetches one specific URL a user references live | `Claude-User` |
| `Google-Extended` | Google | A robots.txt **token**, not a separate crawler — controls whether content already fetched by Googlebot may additionally be used for Gemini/Vertex AI generative features | `Google-Extended` |
| `Googlebot` | Google | Standard Search crawl/index; also the backbone Gemini's live "Google Search grounding" draws on | `Googlebot` |

Sources: OpenAI's [bot documentation](https://developers.openai.com/api/docs/bots), Anthropic's
[crawler support article](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler),
Google's [AI features and your site](https://developers.google.com/search/docs/appearance/ai-features).

Placar has no user data in its public HTML — match scores live only in each device's local storage
and are never sent anywhere, so there is nothing sensitive for a training crawler to pick up, only
the generic app description. Given that, and given the whole point of this SPEC is to be found,
**every bot in the table above gets `Allow: /`** — training bots included. If that ever needs to
change (e.g. a future opinion on AI training specifically, independent of search visibility), it is
a one-line edit to `robots.txt`, not a redesign.

### `llms.txt` — an honest caveat, not a guarantee

`llms.txt` is a proposed convention (a plain-Markdown file at the site root summarizing it for an
LLM to read) from Answer.AI, spec at
[`github.com/AnswerDotAI/llms-txt`](https://github.com/AnswerDotAI/llms-txt). Some developer tools
have adopted reading it. **No AI vendor — OpenAI, Anthropic or Google — has published anything
confirming their crawlers or assistants actually consume it.** This SPEC includes it anyway because
it costs one static file and cannot hurt, but it is documented here, explicitly, as a bet with
unconfirmed odds — not as an equivalent to `robots.txt` or `sitemap.xml`, which are real, universally
respected standards.

### Structured data: `SoftwareApplication` / `WebApplication`

`schema.org` defines [`WebApplication`](https://schema.org/WebApplication) as a subtype of
[`SoftwareApplication`](https://schema.org/SoftwareApplication) for browser-delivered apps. Google's
own [Software App structured data guide](https://developers.google.com/search/docs/appearance/structured-data/software-app)
confirms this is a **recognized rich-result type** (unlike plain `WebApplication`/`SoftwareApplication`
markup being ignored, Google explicitly documents parsing it) and its own example uses
`"applicationCategory": "GameApplication"` — a direct fit for a score-keeping companion app. Google
lists `name` and `offers` (with a price) as required; `applicationCategory`, `operatingSystem`,
`browserRequirements`, `description` and an image are recommended.

Two validators serve different purposes and both matter:
[Google's Rich Results Test](https://search.google.com/test/rich-results) checks whether *Google
Search specifically* will do anything with the markup; the
[schema.org Validator](https://schema.org/docs/validator.html) checks the markup is valid
schema.org syntax at all, independent of any one consumer. An AI assistant's live-search summarizer
is closer to the second case — it just needs clean, valid, parseable facts, not a Google-specific
rich snippet.

### Realistic timeline — for the "before/after" test

Google's own guidance:
[Search Console Help — indexing](https://support.google.com/webmasters/answer/7474347) says to allow
**at least one week** after submitting a sitemap, with total time to full indexing ranging from "a
day or two to a few weeks" depending on the site. This app is small and brand-new to Search Console,
so the slower end of that range is the realistic planning assumption. AI-assistant live search sits
downstream of the same indexes (Google's for Gemini, likely Bing's/OpenAI's own index for ChatGPT),
so it should not be checked *before* the underlying index has had a chance to pick the page up.

**Recommended test cadence (see Acceptance criteria for the exact checklist):**
- **Day 0 (right after deploy):** technical validation only — Rich Results Test, schema.org
  Validator, `robots.txt`/`sitemap.xml` reachable and well-formed. Nothing about ranking is
  meaningful yet.
- **~1 week after deploy:** check Search Console's Coverage/Indexing report for the one submitted
  URL.
- **~2–4 weeks after deploy:** once indexing is confirmed, do the manual AI-assistant test — ask
  ChatGPT, Claude and Gemini (with web search/browsing enabled in each) something like *"existe
  algum app pra marcar placar de canastra e truco gaúcho?"* and record verbatim what each answers.
  A "no" here is itself a valid, useful result for the study — it is evidence about how hard
  discovery actually is for a small new site, which is exactly what carries over to the freela
  project.

## Scope

**In**
- `public/robots.txt` — allow every crawler in the table above, plus a link to the sitemap
- `public/sitemap.xml` — **exactly one `<url>` entry**, the site root, with `lastmod` only (no
  `priority`/`changefreq` — Google ignores both per its own sitemap docs)
- `public/llms.txt` — a short, plain-Markdown summary of the app, explicitly labelled in this SPEC
  as experimental/unconfirmed
- A `SoftwareApplication` JSON-LD block added to `index.html`
- Real, static, descriptive content placed inside `index.html`'s `<div id="root">`, visible to any
  crawler that does not execute JavaScript, and to any browser during the brief window before React
  mounts and replaces it. The copy explicitly states that the interactive app requires JavaScript —
  see *Behaviour* for the drafted text and why it says that
- A small, dependency-free hook that updates `document.title` and the meta description while
  navigating between screens client-side (framed correctly below as a UX/share-preview benefit —
  **not** an indexing mechanism, given the hash-routing constraint above)
- Excluding `robots.txt`, `sitemap.xml` and `llms.txt` from the Workbox service-worker's precache/
  routing, so the PWA's offline behavior can never intercept a crawler's request for them
- A manual checklist for setting up and verifying Google Search Console, Rich Results Test and the
  AI-assistant query test, with the timeline above

**Out**
- Switching `HashRouter` to `BrowserRouter`, or any other change to the app's routing/URL scheme —
  real product risk (breaks installed-PWA deep links), and a decision on its own, not a side effect
  of this SPEC
- Server-side rendering, static-site generation, or per-route pre-rendering — the technique that
  *would* make every game screen independently indexable, deliberately reserved for the freela
  project, where it is the actual point
- SSO / Google login — a separate, already-planned SPEC
- Any analytics or traffic measurement of any kind — contradicts the repo's standing "no analytics"
  decision; Search Console reads Google's own index data, not this app's traffic, so it does not
  conflict with that decision
- Any new npm dependency — everything above is either a static file or a few lines of
  dependency-free code
- Optimizing or indexing per-match URLs (`/#/partida/:matchId`) — meaningless, since match data is
  local-only and differs per device, and unreachable to a crawler regardless, since it is a hash
  route

## Behaviour

### `public/robots.txt`

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://placar.tchez.dev/sitemap.xml
```

### `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://placar.tchez.dev/</loc>
    <lastmod>2026-09-10</lastmod>
  </url>
</urlset>
```

Update `<lastmod>` whenever the home screen's meaningfully-visible content changes (a new game
added, the static description rewritten) — not on every deploy.

### `public/llms.txt`

Follow the current format at [llmstxt.org](https://llmstxt.org) at implementation time (the
convention may evolve) — as of this writing it is an H1 title, a one-line blockquote summary, and
Markdown sections linking to further detail. A draft to adapt:

```markdown
# Placar

> Aplicativo web para marcar pontos dos jogos de uma família: canastra, truco mineiro, truco
> gaudério e vôlei. Instalável como PWA, funciona offline, sem cadastro e sem coleta de dados.

## O que é
- Contador de pontos por jogo, com a regra de contagem de cada um (canastra é cumulativa, truco
  gaudério é incremento livre, vôlei conta pontos e sets separadamente).
- Sem login, sem backend, sem anúncios. Os dados ficam só no aparelho de quem joga.

## Onde
- App: https://placar.tchez.dev/
- Código-fonte (aberto): https://github.com/Tchez/placar
```

### JSON-LD structured data, added to `index.html`'s `<head>`

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Placar",
  "url": "https://placar.tchez.dev/",
  "description": "Placar para os jogos da família: canastra, truco mineiro, truco gaudério e vôlei. Instalável, funciona offline, sem cadastro.",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "browserRequirements": "Requires JavaScript.",
  "inLanguage": "pt-BR",
  "image": "https://placar.tchez.dev/icon-master.png",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "BRL"
  }
}
</script>
```

Validate with both the Rich Results Test and the schema.org Validator (URLs above) before
considering this criterion met — a syntactically valid block that Google's tool still flags is not
done.

### Static fallback content inside `index.html`

Today's `index.html` mounts straight into an empty `<div id="root">` (see `src/main.tsx`:
`createRoot(root).render(...)` fully replaces whatever was already inside `root` — this is standard
React behaviour, so putting real markup inside that `div` in the source `index.html` is safe: it
displays until React takes over, then disappears without a trace for any browser that runs the
app's JavaScript, and stays permanently visible to anything that does not.

```html
<div id="root">
  <main>
    <h1>Placar</h1>
    <p>
      Aplicativo para marcar pontos dos jogos da família: canastra, truco mineiro, truco gaudério
      e vôlei. Funciona offline, é instalável no celular e não exige cadastro — os dados ficam só
      no aparelho de quem está jogando.
    </p>
    <p>
      Esta página carrega a interface completa e interativa por JavaScript. Se você é um sistema
      automatizado que não executa JavaScript, este texto é a descrição completa do aplicativo;
      o restante da experiência (criar partidas, lançar pontos, ver o histórico) só existe depois
      que o JavaScript é executado.
    </p>
  </main>
</div>
```

Approved by the owner as-is on 2026-09-10. The second paragraph exists specifically because the
owner asked for it: a plain, explicit statement of why a non-JS reader is seeing a stripped-down
version, aimed at any AI system parsing the raw HTML.

This SPEC deliberately does **not** additionally use a `<noscript>` tag for this content. A
crawler that never executes JavaScript reads the raw document the same way regardless of whether
the text sits inside `<noscript>` or inside `#root` — but content inside `<noscript>` is actively
hidden from every browser and crawler that *does* run JavaScript (which includes Googlebot's
render phase), while content inside `#root` is real, briefly-visible markup that a JS-executing
renderer sees before the app mounts. One tag choice, not two, covers every reader.

### Per-route `document.title` and meta description

A small hook, no new dependency:

```ts
// src/app/useDocumentMeta.ts
import { useEffect } from 'react';

export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', description);
  }, [title, description]);
}
```

Called once per screen component with a title/description pair (e.g. `"Canastra — Placar"` /
`"Contador de canastra para dois times, com meta de pontos e lançamentos editáveis."`). **Be exact
about what this does and does not achieve:** because every route lives behind `#` (see Context), no
search engine or AI crawler will ever see these per-screen values as separate indexed pages — this
purely improves the browser tab, and anything that reads `document.title` live (a share sheet, a
bookmark) for the family member currently using the app. It is included because it is nearly free
and is good practice regardless, not because it moves the needle on findability.

### Excluding root files from the service worker

`vite-plugin-pwa`'s Workbox layer can precache or intercept static files by default. Add to the
existing `VitePWA({...})` config in `vite.config.ts`:

```ts
workbox: {
  globPatterns: ['**/*'],
  globIgnores: ['robots.txt', 'sitemap.xml', 'llms.txt'],
  navigateFallback: 'index.html',
},
```

This guarantees a crawler's direct request for any of these three files always reaches the real,
current static file — never a stale cached response or the app shell's `navigateFallback`.

### Google Search Console — manual checklist (owner-executed)

The implementer cannot do this part — it requires the owner's own Google account. Leave this as an
explicit checklist in the repo for the owner to work through once the code above is deployed:

1. Add the property `placar.tchez.dev` in [Search Console](https://search.google.com/search-console).
2. Verify ownership via the **HTML tag** method (paste the provided `<meta name="google-site-verification" ...>` tag into `index.html`'s `<head>`, next to the other meta tags) — chosen over the DNS TXT method specifically to avoid touching Cloudflare DNS for something this low-stakes.
3. Submit `sitemap.xml` from the Sitemaps report.
4. Use **Request Indexing** on the root URL to avoid waiting for organic discovery.

## Rules

- The sitemap lists **only** `https://placar.tchez.dev/` — never add a hash-fragment URL to it; it
  would not be wrong exactly, just meaningless, since Google has not treated `#` fragments as
  distinct indexable locations since 2015 (see Context).
- `robots.txt` allows every crawler listed in the Context table. Do not add a `Disallow` for any of
  them without an explicit, separate decision — the default here is maximum visibility, matching the
  entire point of this SPEC.
- The static fallback content inside `#root` must remain accurate to the app's real, current feature
  set (game list, offline/no-signup facts) — if a future SPEC changes what games exist or how
  installation works, update this text in the same change, the same way `README.md` gets updated.
- `useDocumentMeta` must never be relied upon as a substitute for the static fallback content or the
  JSON-LD block — it only affects the live, JS-running session.
- Do not add `priority` or `changefreq` to the sitemap entry — Google documents that it ignores
  both, so they would be pure noise.

## Acceptance criteria

**Ships with the code:**
- [x] `public/robots.txt` exists, is reachable at `/robots.txt` in a production build, and matches
      the content above
- [x] `public/sitemap.xml` exists, is reachable at `/sitemap.xml`, contains exactly one `<url>`,
      and validates as well-formed XML
- [x] `public/llms.txt` exists and is reachable at `/llms.txt`
- [ ] The JSON-LD block is present in the built `index.html` (done), passes the schema.org
      Validator with no errors, and passes the Rich Results Test with no errors (warnings
      acceptable if explained) — the two validators require the owner to run them against the
      live deployed URL, left for the post-deploy checklist below
- [x] Viewing the production build's raw HTML source (`curl` or "view source", not the rendered
      DOM) shows the real static description text inside `#root`
- [x] With JavaScript enabled, the static content is replaced by the running app with no visible
      flash-of-unstyled-content or layout shift beyond what already exists today
- [x] Navigating between screens updates `document.title` and the meta description tag live, per
      the pairs defined for each screen
- [x] `robots.txt`, `sitemap.xml` and `llms.txt` are excluded from the Workbox precache list and are
      confirmed (via the built service worker's manifest) not to be intercepted
- [x] `npm run check` and `npm run build` pass with no regressions

**Verified after deploy, on the owner's timeline (see Context):**
- [ ] Search Console property verified, sitemap submitted, indexing requested (Day 0)
- [ ] Search Console's Coverage/Indexing report shows the root URL as indexed (~1 week)
- [ ] Asking ChatGPT, Claude and Gemini (web search/browsing enabled) about a canastra/truco
      gaudério score-keeping app is attempted and the verbatim responses are recorded, whatever
      they are (~2–4 weeks) — a negative result is a valid, recorded outcome, not a failure of this
      SPEC

## Open questions

None. `"GameApplication"`/`"Web"` are the chosen `applicationCategory`/`operatingSystem` values
(Google-precedented, see Context); the Rich Results Test acceptance criterion is what actually
validates them, not a further decision.
