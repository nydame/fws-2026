# go-firefly.com: Pico → Astro migration research

**Status:** primary-source research. No application code written.

## What was verified against what

| Subject | Source | Exact ref |
| --- | --- | --- |
| Old site source | `github.com/nydame/Pico`, branch `firefly` | commit `56a2ce14` (2020-05-29 "Get hero from Cloudinary"), tree `24160cea` |
| Old site fork lineage | GitHub API `repos/nydame/Pico` | `fork: true`, `parent.full_name: picocms/Pico` |
| Live site | `https://go-firefly.com` | fetched 2026-08-27 |
| Target Astro | `node_modules/astro/` in this repo | **7.1.3** (matches `package.json` `astro: ^7.1.3`) |
| Zod | `node_modules/.pnpm/zod@4.4.3` | **4.4.3** (Zod 4, not 3) |
| Markdown engine | `node_modules/.pnpm/satteri@0.9.5` via `@astrojs/markdown-satteri@0.3.4` | **satteri 0.9.5** |

Old-repo citations are GitHub blob links pinned to commit `56a2ce14`. Astro citations are `path:line` into `node_modules/`, which is authoritative for 7.1.3 behavior. Where docs prose and shipped code disagree, both are shown and the disagreement is called out.

Old-repo blob base: `https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/`

The repo is **public** and was fully readable. Nothing in Step 1 is conditional.

---

## What the old site actually is

**Yes, it is genuinely Pico CMS** — the PHP flat-file CMS from picocms.org. `nydame/Pico` is a direct GitHub fork of `picocms/Pico` (confirmed via the API's `parent` field). It is not a coincidental name collision, and not something else wearing Pico's name.

### 1. Version: Pico **1.0.3-dev**, not Pico 2.x

This is the single most consequential fact, because nearly all current picocms.org documentation describes Pico **2.x**.

- [`lib/Pico.php:25`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/lib/Pico.php#L25) — `@version 1.0`
- [`CHANGELOG.md`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/CHANGELOG.md) — top entry is `### Version 1.0.3` with `Released: -`, i.e. the fork sits on unreleased 1.0.3, after 1.0.2 (2016-03-16).
- Layout confirms 1.x: config is [`config/config.php`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/config/config.php) (a PHP array). Pico 2.x uses `config/config.yml`. There is no `pico-theme.yml`, which 2.x themes require.

Dependencies, from [`composer.json:25-30`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/composer.json#L25-L30):

```json
"require": {
    "php": ">=5.3.6",
    "twig/twig": "^1.18",
    "erusev/parsedown-extra": "^0.7",
    "symfony/yaml" : "^2.3"
}
```

So: **Twig 1.x** (not Twig 3), **Parsedown Extra 0.7**, Symfony YAML 2.3. `vendor/` is gitignored and not committed.

### 2. Templating: Twig 1.x, custom theme `firefly`

`config/config.php:26` sets `$config['theme'] = 'firefly'`. The theme is a **fork of Pico's stock default theme** — verified by blob-SHA comparison: `themes/firefly/old_index.twig`, `themes/firefly/scripts/modernizr-2.6.1.min.js` and `themes/firefly/menu-icon.png` are byte-identical to their `themes/default/` counterparts, and `themes/firefly/style.css` still carries the header comment `/* Pico Default Theme / By: Gilbert Pellegrom */`.

Live theme files (only 3 matter):

| File | Size | Role |
| --- | --- | --- |
| [`themes/firefly/base.html`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/themes/firefly/base.html) | 11.8 KB | the real layout — full `<html>` document, defines all Twig blocks |
| [`themes/firefly/index.twig`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/themes/firefly/index.twig) | 4.7 KB | homepage; `{% extends "base.html" %}` |
| [`themes/firefly/page.twig`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/themes/firefly/page.twig) | 80 B | every other page; 4 lines total |

`old_index.twig` and `old_page.twig` are dead stock leftovers — nothing references them.

The Twig surface actually in use is **very small**: `{% extends %}`, `{% block %}`, `{% for page in pages if page.title %}`, `{% if %}`, and exactly three filters — `|striptags`, `|date('Y')`, and Pico's custom `|link` filter. That is the entire template language footprint to port.

`config/config.php:29` sets `'autoescape' => false`. This matters: the theme relies on `{{ content }}` emitting raw HTML unescaped.

### 3. Content format: front matter + **raw HTML**, essentially no Markdown

Pico 1.x front matter is a YAML block between `---` fences with capitalized keys. Actual keys used across the four content files: `Title`, `Description`, `Author`, `Date`, `Template`, `Robots`.

**The critical finding:** the page bodies are not Markdown. They are hand-written HTML blocks. `content/index.md`, `content/about/index.md` and `content/hire/index.md` each consist of a single `<section class="content"><div class="inner">…` tree with `<article>`, `<h1>`, `<p>`, `<a>` written literally. Only `content/404.md` uses Markdown (a setext `=====` heading).

Directory→URL mapping in Pico: `content/index.md` → site root, `content/about/index.md` → `about`, `content/hire/index.md` → `hire`, and `content/404.md` is the not-found fallback ([picocms.org/docs](https://picocms.org/docs/)).

### 4. Plugins: stock only, zero custom

Four plugin files ship: `00-PicoDeprecated.php`, `01-PicoParsePagesContent.php`, `02-PicoExcerpt.php`, `DummyPlugin.php`. I compared each blob SHA against `picocms/Pico` at tag `v1.0.2` — **all four are byte-identical to upstream**. No third-party plugins, no custom plugins, and `config/config.php` enables/disables nothing (the only plugin line is a commented-out `DummyPlugin.enabled`).

Their stock roles: `PicoDeprecated` provides Pico 0.x back-compat, `PicoParsePagesContent` pre-parses every page's content into the `pages` array, `PicoExcerpt` derives excerpts. **Nothing here needs migrating** — no plugin behavior is load-bearing for this site.

### 5. Content inventory

See the dedicated [Content inventory](#content-inventory) section below. Short version: **3 real pages + a 404 + 5 case-study HTML fragments hidden inside the theme directory.**

### 6. Assets — and there is **no firefly SVG logo**

I searched the entire tree. The only `.svg` files in the repo are Ubuntu webfont files (`assets/fonts/ubuntu-v9-latin-*.svg`) — font glyph data, not artwork.

**The logo is plain text.** [`base.html:76`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/themes/firefly/base.html#L76):

```twig
<h1><a href="{{ "index"|link }}" id="logo">{{ site_title }}</a></h1>
```

…styled by exactly two CSS declarations (`style.css`, `#logo { text-transform: lowercase; }`). It renders as the lowercase words "firefly web services". There is no firefly illustration on the live site either.

There *is* an inline SVG sprite in `base.html:47-72` — a `<defs>` block of five `<symbol>`s: `icon-heart`, `icon-twitter`, `icon-github`, `icon-wordpress`, `icon-codepen`, consumed via `<use xlink:href="#icon-…">` in the footer. These are generic social icons (IcoMoon-style, 16×16 viewBox, single `<path class="path1">` each). They are inline-styleable — but note the paths carry **no `fill` attribute at all**, so they inherit `fill` from CSS by default; they do not use `currentColor` explicitly.

**Conclusion: the cute firefly SVG logo does not exist yet and must be designed from scratch.** Treat it as new creative work, not a migration task.

Other assets:
- `assets/` holds the five case-study screenshots (`soilnotoil.png`, `oesa.png`, `tbinaa.png`, `openoak-a.png`, `college-abacus.png`), plus `hazy-water.jpg`, `favicon.ico`, `Loading_icon-translucent.gif`, and the Ubuntu webfont set.
- **The live site does not use those local copies.** The case-study `<img>` tags point at `https://go-firefly.imgix.net/…`, and **imgix now returns HTTP 410 Gone** — every case-study image on the live site is currently broken. The local PNGs in `assets/` are the recovery source.
- The hero background is pulled from Cloudinary (`style.css`, `.header-section1-wrap`), which **still returns 200**. The local `assets/hazy-water.jpg` fallback is commented out on the line above.
- Third-party scripts in `base.html`: Google Fonts (Open Sans, Ubuntu), Typekit `teb7vha` (still 200), Modernizr 2.6.1, **Heap Analytics** (`heap.load("1732739567")`), **Hotjar** (`hjid:1084213`), and a **Typeform** embed (`nydame.typeform.com/to/cOYwsz`) that is the entire body of the Hire page.

### 7. Live URL shape: **query strings**, not paths

This is the second most consequential finding, and it is good news.

```
Server: Apache/2.4.6 (CentOS) OpenSSL/1.0.1e-fips PHP/5.6.17
X-Powered-By: PHP/5.6.17
```

Measured live responses:

| URL | Status | Title |
| --- | --- | --- |
| `https://go-firefly.com/` | 200 | Welcome |
| `https://go-firefly.com/?index` | 200 | Welcome |
| `https://go-firefly.com/?about` | 200 | About |
| `https://go-firefly.com/?about/index` | 200 | About |
| `https://go-firefly.com/?hire` | 200 | Hire |
| `https://go-firefly.com/?hire/index` | 200 | Hire |
| `https://go-firefly.com/about` | **404** | Apache default 404 |
| `https://go-firefly.com/about/` | **404** | Apache default 404 |
| `/sitemap.xml`, `/robots.txt` | **404** | absent |

**`mod_rewrite` is not active on the live host.** The `.htaccess` rewrite block ships in the repo, but `config/config.php:21` leaves `$config['rewrite_url'] = null` (not forced), and git history shows the attempt was made and reverted: commit `7bc65f56` "Enable forced rewriting of URLs" followed immediately by `a937e31a` "Enable forced rewriting of URLs. **CANCEL**" (both 2016-05-23).

So the site serves Pico's query-string fallback. There are **no dated post URLs** and **no `/page/` or `/page.html` URLs to preserve** — because none exist.

Worse, the nav emits the *redundant* form. From the live homepage:

```html
<a href="https://go-firefly.com/?index">Welcome</a>
<a href="https://go-firefly.com/?about%2Findex">About</a>
<a href="https://go-firefly.com/?hire%2Findex">Hire</a>
```

Every page is reachable at two or three distinct URLs, with **no `<link rel="canonical">` anywhere** — the live `<head>` contains only `charset`, `viewport` and `description`. No Open Graph, no Twitter cards, no canonical (grep count: 0).

---

## Findings that change the plan

Ordered by how much damage each does to a naive plan.

### 1. There is no firefly SVG logo to migrate — it has to be created

Any plan with a "port the firefly SVG" task is planning to move a file that does not exist. The current logo is CSS-lowercased text. This is a **design task**, and it should be scoped and scheduled as one. The upside: starting from nothing means it can be authored as a clean, `currentColor`-driven, theme-aware SVG from day one (see [The firefly logo](#the-firefly-logo-in-astro-7)).

### 2. The content is HTML, not Markdown — so "Markdown → content collections" is the wrong framing

Three of the four `.md` files contain zero Markdown. Piping them through a Markdown processor is a no-op that preserves 2016-era hand-written HTML — including presentational wrappers (`<div class="inner">`, `<div class="welcome-wrap">`) that exist purely to serve the old stylesheet.

The real work is **re-authoring** this content as Astro components plus genuine Markdown/MDX. Treat the old files as a *content source*, not a *migration input*. A content collection is still the right destination for the case studies (they are repeating, schema-shaped records); the two static pages (About, Hire) are better as plain `.astro` pages.

Corollary: there is a latent bug to fix. `content/about/index.md` contains `Although Pico **can** handle simple blogging` inside an HTML block. I verified the live site renders the literal asterisks — `**can**` ships to users as-is. Parsedown Extra does not parse Markdown inside block-level HTML, and neither does satteri (I tested satteri directly: raw HTML blocks pass through verbatim, inner `**markdown**` untouched). So this is a **pre-existing content defect, not a migration risk** — the two engines agree. Fix it during re-authoring.

### 3. Astro 7.1.3 does **not** use remark/rehype by default — it uses satteri

This will silently invalidate any plan copied from an Astro 4/5-era tutorial.

`node_modules/astro/package.json` lists `"@astrojs/markdown-satteri": "0.3.4"`, and **`@astrojs/markdown-remark` is not installed at all**. satteri is a Rust-native Markdown/MDX engine (`satteri@0.9.5`, from `github.com/bruits/satteri`), shipped with per-platform native binaries (`@bruits/satteri-darwin-arm64` etc.).

The shipped config type is explicit — `node_modules/astro/dist/types/public/config.d.ts:2322-2324`:

> Configures the Markdown processor used to render `.md` files. Defaults to `satteri()` from `@astrojs/markdown-satteri`, Astro's native Markdown pipeline.

And the entire remark option surface is now **deprecated**:

| Option | Line | Status |
| --- | --- | --- |
| `markdown.remarkPlugins` | `config.d.ts:2233` | `@deprecated` — "Will be removed in a future major." |
| `markdown.rehypePlugins` | `config.d.ts:2251` | `@deprecated` |
| `markdown.gfm` | `config.d.ts:2271` | `@deprecated` — pass `gfm` to your processor |
| `markdown.smartypants` | `config.d.ts:2290` | `@deprecated` |
| `markdown.remarkRehype` | `config.d.ts:2303` | `@deprecated` |

**Practical impact for this site: near zero**, because there is almost no Markdown to process and no remark plugins in play. But it must be stated so nobody adds `remarkPlugins: [...]` to the config expecting it to be the supported path. If a remark plugin genuinely becomes necessary later, the escape hatch is documented at `config.d.ts:2340-2354`: install `@astrojs/markdown-remark` and pass `processor: unified({ remarkPlugins: [...] })`.

satteri exposes its own plugin system instead (`defineMdastPlugin` / `defineHastPlugin`, per its README), and `satteri({ features: { gfm: false } })` for feature toggles.

### 4. There are no clean URLs to preserve — the "URL preservation" problem largely evaporates

Because the live site is `?about` and not `/about/`, the usual trailing-slash agony does not apply. **Astro cannot serve a query-string route as a distinct page anyway** — `?about` is the site root with a query string; a static build serves `index.html` and ignores the query.

Two consequences:
- Astro's `redirects` config **cannot** map `?about` → `/about/`. Its keys are pathnames (`config.d.ts:218-243`), and `'/product1/', '/product1'` is explicitly called out as unsupported at `config.d.ts:239`.
- Any real preservation of `?about` must be **client-side** (a small script on the homepage reading `location.search` and redirecting) or **host-level** (a rewrite rule matching the query string).

Given the URLs are query-string, uncanonicalized, duplicated across two forms, and the site has no sitemap or robots.txt, the realistic SEO footprint is small. **Recommendation: adopt clean `/about/` URLs and add a homepage-level query-string shim** for the handful of legacy inbound links, rather than contorting the new site.

### 5. The five case studies — the actual portfolio — live in the *theme*, and are broken in production

`themes/firefly/includes/case1.html` … `case5.html` are HTML fragments fetched by `XMLHttpRequest` from inline JS in `index.twig`. They are not in `content/`, have no front matter, and are invisible to Pico's page tree.

This is the site's most valuable content — five client case studies with named clients — and it is:
- **not server-rendered** (invisible to search engines and to anyone with JS disabled),
- **image-broken** (all five `<img>` point at `go-firefly.imgix.net`, which returns **410 Gone**),
- structurally unmodelled (no titles in the fragments; titles live separately in `content/index.md`).

For a portfolio whose stated purpose is attracting clients and informing employers, this is the highest-value fix in the whole migration. These should become **real, individually-addressable, server-rendered pages** backed by a content collection, with the local `assets/*.png` screenshots restored and run through `astro:assets`.

### 6. Zod 4, not Zod 3 — and the import path moved

`node_modules/astro/package.json` declares `"zod": "^4.3.6"`; pnpm resolves **4.4.3**. `node_modules/astro/dist/zod.js` is a thin re-export:

```js
import * as mod from "zod/v4";
export * from "zod/v4";
```

Schemas written against Zod 3 idioms may not port cleanly. Import from **`astro/zod`**.

Nuance worth knowing: `z` is *also* still exported from `astro:content`, but is flagged for removal — `node_modules/astro/templates/content/module.mjs:16-17`:

```js
// TODO: remove in Astro 7
export { z } from 'astro/zod';
```

**The comment says "remove in Astro 7" and we are on 7.1.3, yet it is still present** — so it works today but is living on borrowed time. Official docs recommend `import { z } from "astro/zod"`; that is the safe choice and matches the shipped escape hatch.

### 7. Hosting must change — the current host is a PHP 5.6 box

`Server: Apache/2.4.6 (CentOS) … PHP/5.6.17`. PHP 5.6 reached end of life in December 2018; CentOS 7's Apache 2.4.6 is likewise long past its prime. A static Astro build needs no PHP at all, so the migration is also an opportunity to leave this host.

---

## Twig → Astro components

The mapping is unusually clean here because the theme uses so little of Twig.

| Twig (firefly theme) | Astro 7 equivalent | Verdict |
| --- | --- | --- |
| `{% extends "base.html" %}` | a layout component in `src/layouts/`, wrapping page content | clean |
| `{% block section2 %}{{ content }}{% endblock %}` | default `<slot />` | clean |
| `{% block section1 %}` / `{% block head_extra %}` / `{% block page_specific_scripts %}` | **named slots** (`<slot name="hero" />`) | clean |
| `{% block %}` default content | slot fallback content — Astro renders a slot's children as the default when nothing is passed | clean |
| `{% for page in pages if page.title %}` | `getCollection()` + `.filter()`, or a hand-written nav array | clean, and better — the nav should be explicit, not derived |
| `{% if page.id == current_page.id %}` | compare against `Astro.url.pathname` | clean |
| `{{ meta.title }}`, `{{ site_title }}` | component `Props` + a site constant | clean |
| `{{ meta.description\|striptags }}` | no built-in equivalent | **needs a helper** — trivial regex, or just author clean descriptions |
| `{{ "now"\|date('Y') }}` | `new Date().getFullYear()` | clean |
| `{{ "index"\|link }}` (Pico custom filter) | plain `href="/"` | **disappears** — this filter exists only to build Pico's query-string URLs |
| `{{ theme_url }}` | `import`ed assets, or `/` paths under `public/` | **disappears** |
| `autoescape => false` (`config.php:29`) | Astro escapes `{expr}` by default; raw HTML needs `set:html` | **behavior change — see below** |

**The one real gotcha: escaping.** Pico disables Twig autoescaping globally, so `{{ content }}` emits raw HTML. Astro escapes interpolated expressions by default; injecting a rendered HTML string requires the `set:html` directive. If the case studies are kept as HTML strings rather than re-authored as Markdown, they will need `set:html` — and that is a good reason to re-author them as Markdown instead, where `<Content />` handles it safely.

There are **no Twig macros, no `{% include %}`, no `{% embed %}`, no custom Twig extensions in use**, and no filter without a one-line Astro equivalent. (`lib/PicoTwigExtension.php` ships upstream Pico's `markdown`, `map`, `sort_by` and `link` filters, but the firefly theme uses only `link`.) The 190 lines of vanilla JS in `base.html` and `index.twig` are framework-agnostic and can move as-is — though the XHR case-study loader should simply be deleted in favor of real pages.

---

## Pico content → Astro Content Layer

All of the following is verified against shipped 7.1.3 code, not docs prose.

**Config file location — `src/content.config.ts`.** The shipped resolver at `node_modules/astro/dist/content/utils.js:557-562` searches:

```js
"content.config.mjs",
"content.config.js",
"content.config.mts",
"content.config.ts"
```

The legacy `src/content/config.ts` location is detected and **errors**, per `node_modules/astro/dist/core/errors/errors-data.d.ts:1613`:

> Found legacy content config file in "src/content/config.ts". Please move this file to "src/content.config.ts" and ensure each collection has a loader defined.

**`entry.slug` is gone; it is `entry.id`.** The shipped entry shape, `node_modules/astro/dist/content/data-store.d.ts:16-24`:

```ts
export interface DataEntry<TData extends Record<string, unknown> = Record<string, unknown>> {
    /** The ID of the entry. Unique per collection. */
    id: string;
    /** The parsed entry data */
    data: TData;
    filePath?: string;
    body?: string;
    …
}
```

No `slug` field. (`slug` survives only on the legacy `ContentEntryModule` type at `dist/types/public/content.d.ts:75`, which is not what `getCollection()` returns.)

The old slug-based helpers now **throw on call** rather than warn — `templates/content/module.mjs:41-45` wires `getEntryBySlug` and `getDataEntryById` to `createDeprecatedFunction`, and `dist/content/runtime.js:535-547` shows that factory constructs an `AstroError` and `throw`s it.

**Rendering is `render(entry)` imported from `astro:content`.** From the shipped virtual-module template, `node_modules/astro/templates/content/module.mjs:11-15`:

```js
export {
	defineCollection,
	defineLiveCollection,
	renderEntry as render,
} from 'astro/content/runtime';
```

So `const { Content } = await render(entry);` — **not** `entry.render()`.

**Loaders are required and come from `astro/loaders`.** `node_modules/astro/package.json` maps `./loaders` → `./dist/content/loaders/index.js`, which exports exactly `file` and `glob` (`dist/content/loaders/index.js:4-7`).

Sketch for this site (illustrative, not committed):

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    client: z.string(),
    clientUrl: z.string().url(),
    screenshot: image(),
    screenshotAlt: z.string(),
    order: z.number(),
  }),
});

export const collections = { caseStudies };
```

The old front-matter keys map straightforwardly: `Title` → `title`, `Description` → `description`, `Date` → `z.coerce.date()`, `Author` → drop (single-author site), `Template` → drop (replaced by layout choice), `Robots` → drop (handle via a meta component).

---

## Markdown processing

Astro 7.1.3's default `.md` processor is **satteri**, not remark — see [finding 3](#3-astro-713-does-not-use-remarkrehype-by-default--it-uses-satteri). `markdown.processor` defaults to `satteri()` from `@astrojs/markdown-satteri` (`config.d.ts:2322-2324`), the package is a declared dependency of `astro@7.1.3`, and `@astrojs/markdown-remark` is absent from `node_modules`.

Syntax highlighting still ships: `shiki ^4.0.2` is an astro dependency, and `markdown.syntaxHighlight` (`config.d.ts:2186`) accepts `'shiki' | 'prism' | false` plus an `excludeLangs` array.

### Parsedown Extra → satteri gaps

Pico uses `erusev/parsedown-extra ^0.7` (`composer.json:28`), i.e. Parsedown + Markdown Extra. Differences that matter, in rough order of risk:

1. **Markdown inside HTML blocks** — Parsedown Extra and satteri **agree**: neither parses it. I confirmed empirically on both sides (live site renders literal `**can**`; satteri's `markdownToHtml` returns the raw block verbatim). **No migration risk**, but it does mean the existing `**can**` bug survives a lift-and-shift — fix it by hand.
2. **Markdown Extra features** — Parsedown Extra adds definition lists, footnotes, abbreviations, and `{#id .class}` attribute blocks. satteri is CommonMark + GFM. **None of these appear in the actual content** (the only Markdown in the whole site is one setext heading in `404.md`), so the gap is theoretical here — but it would bite if old content were reused verbatim elsewhere.
3. **Line-break handling and smart typography** — Parsedown and CommonMark differ on some soft-break and emphasis edge cases; `smartypants` is a separate deprecated option in Astro (`config.d.ts:2298`). Since content is being re-authored, this is not a practical concern.

**Net: because there is essentially no Markdown in the old site, the Parsedown→satteri gap is a non-issue for this migration.** It is documented here so the conclusion is traceable rather than assumed.

---

## The firefly logo in Astro 7

The logo must be **created**, not migrated ([finding 1](#1-there-is-no-firefly-svg-logo-to-migrate--it-has-to-be-created)). Once it exists, Astro 7 inlines SVG into the DOM natively — no integration needed.

**Type declaration** — `node_modules/astro/client.d.ts:113-116`:

```ts
declare module '*.svg' {
	const Component: import('./types').SvgComponent & ImageMetadata;
	export default Component;
}
```

`SvgComponent` is `(props: astroHTML.JSX.SVGAttributes) => any` (`node_modules/astro/types.d.ts:34`). Note the intersection with `ImageMetadata` — the same import is usable both as a component *and* as image metadata (`.src`, `.width`, `.height`).

**It genuinely inlines.** `node_modules/astro/dist/assets/runtime.js:8-22`:

```js
function createSvgComponent({ meta, attributes, children, styles }) {
  const Component = createComponent({
    async factory(result, props) {
      const normalizedProps = normalizeProps(attributes, props);
      …
      return render`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
    },
```

A real `<svg>` element with its children unescaped into the document — so **every internal node is CSS-targetable and DOM-reachable**, exactly what a `currentColor`-driven, theme-aware logo needs.

**Props win over file attributes.** `dist/assets/runtime.js:43-45`:

```js
function normalizeProps(attributes, props) {
  return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}
```

So `<Logo class="site-logo" fill="currentColor" />` overrides whatever the `.svg` file declares.

**Three attributes are always stripped** — `dist/assets/runtime.js:35`:

```js
const ATTRS_TO_DROP = ["xmlns", "xmlns:xlink", "version"];
```

Harmless for inline SVG (the HTML parser assumes the SVG namespace), but worth knowing if the file is ever *also* served standalone.

**`<style>` inside the SVG is handled**, not dropped: `dist/assets/svg/utils.js` collects `<style>` children into a `styles` array, and the component sets `propagation: "self"` when styles are present, plus CSP digests when CSP is enabled. Still, prefer external CSS + `currentColor` over embedded `<style>` for a logo that should adapt to light/dark.

**SVGO runs on import.** `svgo ^4.0.1` is an astro dependency and `dist/assets/svg/svgo.js` wires it in — so author the file readably; it gets optimized at build.

Practical guidance for the new logo: author it with a `viewBox`, no hardcoded `width`/`height`, `fill="currentColor"` on the paths, and semantic `class` hooks on any part meant to animate (a glowing abdomen is the obvious candidate). Then `import Logo from '../assets/firefly.svg'` and use `<Logo class="logo" />`. Add `<title>` inside the SVG for accessibility, or `role="img"` + `aria-label` via props.

For the **existing social icons**, the old `<symbol>` + `<use xlink:href>` sprite pattern should simply be dropped — importing each icon as its own `.svg` component is simpler and avoids the `xlink` deprecation entirely.

---

## URL preservation

**Astro's shipped `build.format` options** — `config.d.ts:1154-1157`:

- `'file'` — `src/pages/about.astro` → `/about.html`
- `'directory'` (**default**) — → `/about/index.html`
- `'preserve'` — mirrors the source folder shape exactly

`trailingSlash` is `'always' | 'never' | 'ignore'`, default `'ignore'` (`config.d.ts:215`).

**The crucial limitation, quoted verbatim from `config.d.ts:205-206`:**

> Trailing slashes on prerendered pages are handled by the hosting platform, and may not respect your chosen configuration. See your hosting platform's documentation for more information. **You cannot use Astro redirects for this use case at this point.**

So: on a **static build, `trailingSlash` is a dev-server and on-demand-rendering concern only.** What a visitor actually gets for `/about` vs `/about/` in production is decided by the host. This is a **host-level concern** — say so plainly in any plan, and do not promise trailing-slash behavior Astro cannot deliver.

`config.d.ts:198-203` confirms the scope: the redirect-to-correct-URL behavior described for `'always'`/`'never'` applies to *"on-demand rendered URLs"*, not prerendered files.

**Astro `redirects` on a static build are `<meta refresh>`, not 301** — `config.d.ts:245`:

> For statically-generated sites with no adapter installed, this will produce a client redirect using a [`<meta http-equiv="refresh">` tag] and **does not support status codes**.

Status codes (301/308) require SSR or a static adapter (`config.d.ts:247-250`). For SEO-grade permanent redirects, use **host-level redirect rules**, not Astro's `redirects` map.

**Recommended shape for this site**, given there are no clean legacy URLs to honor:

- `build.format: 'directory'` (default) + `trailingSlash: 'always'` — the pairing the shipped docs themselves recommend at `config.d.ts:1178-1179`.
- Target URLs: `/`, `/about/`, `/hire/`, plus new `/work/<slug>/` pages for the five case studies.
- Handle legacy `?about` / `?hire` / `?about/index` / `?hire/index` with a **small script on the homepage** that reads `location.search` and rewrites to the new path. This is the only mechanism that can catch a query string in a static build.
- Add a real `sitemap.xml` and `robots.txt` — the live site has **neither** (both 404).
- Add `<link rel="canonical">` site-wide — currently **absent**, and the duplicate `?about` / `?about/index` forms make it genuinely necessary.

---

## Hosting and DNS

The current host runs `Apache/2.4.6 (CentOS)` with `PHP/5.6.17` — an end-of-life PHP on an end-of-life OS. A static Astro build removes the PHP requirement entirely.

What changes:
- **No PHP, no `.htaccess` rewrite dependency.** Pico's whole URL scheme existed to work around `mod_rewrite` being unavailable; that constraint disappears.
- **The host must serve directory-index files** (`/about/` → `/about/index.html`) to match `build.format: 'directory'`, and its trailing-slash normalization becomes the deciding factor per `config.d.ts:205-206`.
- **Host-level redirect rules** are needed for real 301s (Astro static gives only `<meta refresh>`).
- **A custom 404** must be wired up host-side; `src/pages/404.astro` builds to `404.html` but the host has to actually serve it.
- The existing host *could* keep working — it is just Apache serving files — but keeping an EOL PHP box for a site that no longer needs PHP is hard to justify.

**DNS:** an apex-domain move needs `A`/`ALIAS`/`ANAME` records depending on the target; `go-firefly.com` is currently served on the apex with a working TLS cert. Plan the cutover so the cert is provisioned before the DNS switch. *(Unverified: I did not inspect DNS records or registrar/host identity — only HTTP response headers.)*

---

## What this site actually needs for its goal

The stated goal is a professional site that (a) attracts freelance clients and (b) informs potential employers — while keeping personal touches. Judged against that, the current site's biggest problem is not its stack, it is that **the portfolio is invisible**: five case studies behind XHR, with broken images, on a site with no sitemap and no canonical tags.

Priorities, highest value first:

1. **Make the case studies real pages.** Server-rendered, individually linkable (`/work/soil-not-oil/`), each with a restored screenshot. This is the single change that most serves both audiences — a client can be sent a direct link, and an employer can see the work without executing JavaScript.
2. **Restore the images.** `assets/*.png` are in the repo; imgix is 410 Gone.
3. **SEO and sharing metadata.** Canonical URLs, Open Graph and Twitter card tags — currently **zero** on the live site. Essential when a link is pasted into Slack, LinkedIn or a DM.
4. **`@astrojs/sitemap`** — latest `3.7.3`, no peer-dependency constraint, so it is compatible with astro 7.1.3. **Not currently in `package.json`.** Requires `site` to be set in `astro.config.mjs` (currently empty: `defineConfig({})`).
5. **Image optimization via `astro:assets`.** Built in — no integration needed. `client.d.ts:36-73` exports `Image`, `Picture`, `getImage`, and `inferRemoteSize` from `astro:assets`. The five case-study screenshots are large (`oesa.png` alone is 943 KB); running them through `<Image />` for responsive `srcset` and modern formats is a direct win for the portfolio pages.
6. **Fonts.** Astro 7 ships a fonts API — `client.d.ts` exports `Font` and `fontData` from `astro:assets`, backed by `unifont ~0.7.4` and `fontace` in astro's dependencies. This can replace the current three-way split across Google Fonts, Typekit and self-hosted Ubuntu webfonts, and removes a third-party render-blocking request.
7. **RSS — only if a blog actually lands here.** `@astrojs/rss` latest `4.0.19`, no peer constraint. Note the current "Blog" nav item points off-site to CodePen (`base.html:95`); if that stays, RSS is not needed.
8. **View transitions — optional.** Built into Astro (`astro:transitions`, declared in `client.d.ts`), no package needed. A light touch here could carry the "friendly" personality without much cost.
9. **Drop the tracking cruft.** Heap and Hotjar are wired into `base.html` from 2016/2018; Modernizr 2.6.1 targets browsers that no longer exist. Carrying them forward is pure liability. The Typeform embed on the Hire page is worth reconsidering too — a native form posting to a serverless endpoint would be faster and better-integrated.

`package.json` currently declares **exactly one dependency** (`astro: ^7.1.3`) — no integrations installed. Items 4 and 7 are the only ones on this list that need a package added; 5, 6 and 8 ship with Astro.

---

## Content inventory

Everything that must move. This is the complete list.

### Pages (`content/`) — 4 files

| Source | Front matter | URL now | Proposed | Notes |
| --- | --- | --- | --- | --- |
| [`content/index.md`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/content/index.md) | Title `Welcome`, Description, Author, Date `2016/04/20`, Template `index` | `/`, `?index` | `/` | Body is HTML only: an `<h2>`, two intro `<p>`s, and 5 empty `<article class="case">` shells that XHR-load the real content |
| [`content/about/index.md`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/content/about/index.md) | Title `About`, Description, Author, Date `2016/04/22`, Template `page` | `?about`, `?about/index` | `/about/` | 3 Q&A `<article>`s. Contains the literal `**can**` bug. Second article states a **$75/hour** rate — confirm it is still current. Third article describes the site as Pico-built — **will be factually wrong after migration** |
| [`content/hire/index.md`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/content/hire/index.md) | Title `Hire`, Description, Author, Date `2016/04/24`, Template `page` | `?hire`, `?hire/index` | `/hire/` | Body is an `<h2>` plus a Typeform embed (`nydame.typeform.com/to/cOYwsz`) and its loader script. Almost no owned content |
| [`content/404.md`](https://github.com/nydame/Pico/blob/56a2ce1430ef13ac112390c0983e57e085292fe3/content/404.md) | Title `Error 404`, Robots `noindex,nofollow` | fallback | `/404.html` | The only file containing real Markdown |

`content-sample/` (`404.md`, `index.md`, `sub/index.md`, `sub/page.md`) is **stock Pico sample content — do not migrate.**

### Case studies (`themes/firefly/includes/`) — 5 fragments, the real portfolio

Each is a bare HTML fragment: a linked screenshot `<img>` followed by 1–3 `<p>`s. Titles are **not** in the fragments — they live in the `<h1>`s of `content/index.md` and must be joined back up.

| # | Title (from `content/index.md`) | Client | Client URL | Screenshot (local) | imgix URL (**410 Gone**) |
| --- | --- | --- | --- | --- | --- |
| 1 | A Quick Fix with Out-of-the-Box Solutions | Soil Not Oil Coalition | `soilnotoil.org` | `assets/soilnotoil.png` (210 KB) | `go-firefly.imgix.net/soilnotoil.png` |
| 2 | A Custom WordPress Theme with an Innovative Approach to Responsive Web Design | One Earth Sacred Arts | `oneearthsacredarts.com` | `assets/oesa.png` (943 KB) | `go-firefly.imgix.net/oesa.png` |
| 3 | A Staff Page with Layers of Information | The Body Is Not An Apology | `thebodyisnotanapology.com` | `assets/tbinaa.png` (431 KB) | `go-firefly.imgix.net/tbinaa.png` |
| 4 | Getting Data Architecture Right | Open Oakland | `openoakland.org` | `assets/openoak-a.png` (118 KB) | `go-firefly.imgix.net/openoak-a.png` |
| 5 | A 3-Month Sprint as Lead Front-End Dev on a Rails App | College Abacus | `collegeabacus.org` | `assets/college-abacus.png` (64 KB) | `go-firefly.imgix.net/college-abacus.png` |

### Theme copy embedded in templates (not in `content/`)

Easy to miss, since it lives in `index.twig` and `base.html` rather than content files:

- **Tagline / hero** (`index.twig:4-14`): *"On the web there are no roads. You can go anywhere."* + *"But what if you need a guide?"* — this is the site's main personality moment and must be carried over.
- **Footer** (`base.html:160-183`): photo credit to [Romain Briaux](https://unsplash.com/romainbriaux), `Firefly Web Services © {{ year }}`, and three social links (Twitter/GitHub/CodePen, all `nydame`).
- **Nav** (`base.html:88-97`): Welcome / About / Hire, plus an **off-site** "Blog" link to `codepen.io/nydame/posts/published/`.
- **Site title** (`config.php:19`): `Firefly Web Services`.

### Assets

Migrate: the 5 case-study PNGs, `favicon.ico`. Optional: `hazy-water.jpg` (local fallback for the Cloudinary hero). Drop: `Loading_icon-translucent.gif` (only needed by the XHR loader), `assets/fonts/ubuntu-v9-*` (superseded by Astro's fonts API), `menu-icon.png` and `modernizr-2.6.1.min.js` (stock leftovers), the entire `themes/default/` tree, `old_index.twig` / `old_page.twig`.

External, decide deliberately: Cloudinary hero (still 200 — consider bringing it in-repo), Typekit `teb7vha`, Google Fonts, Heap `1732739567`, Hotjar `1084213`, Typeform `cOYwsz`.

---

## Confidence and gaps

### Verified directly — high confidence

- Pico identity, fork lineage, and version 1.0.3-dev. Read from the repo at commit `56a2ce14`; fork parent confirmed via GitHub API.
- Dependency set (Twig 1.x, Parsedown Extra 0.7, Symfony YAML 2.3, PHP ≥5.3.6) — read from `composer.json`.
- All four plugins byte-identical to upstream `picocms/Pico@v1.0.2` — compared by blob SHA.
- The complete file tree (99 entries, `truncated: false`) and full text of every content file, both `.twig` templates, `base.html`, all five case fragments, and `style.css`.
- **Absence of any firefly SVG.** Enumerated every blob in the tree; the only `.svg` files are Ubuntu webfont data.
- Live URL shape, host banner, and the 404s for `/about`, `/sitemap.xml`, `/robots.txt` — measured with `curl`.
- imgix 410 Gone; Cloudinary 200; Typekit 200 — measured.
- Absence of canonical/OG/Twitter tags on the live homepage — grepped the fetched HTML (count: 0).
- Astro 7.1.3 internals: satteri default, deprecated remark options, Zod 4.4.3, `src/content.config.ts`, `entry.id` (no `slug`), `render` from `astro:content`, `glob`/`file` from `astro/loaders`, SVG inlining and `ATTRS_TO_DROP`, `trailingSlash`/`redirects`/`build.format` doc comments — all read from `node_modules/`, cited by `path:line`.
- satteri's raw-HTML passthrough — **executed** `markdownToHtml` against the installed 0.9.5 binary and inspected output.
- Live rendering of the `**can**` bug — fetched and grepped the live About page.

### Docs vs shipped code — noted disagreements

- **picocms.org documents Pico 2.x; this site is Pico 1.0.** The current docs describe `pico-theme.yml` and a `pages()` *function*; the firefly theme has no `pico-theme.yml` and uses `pages` as a plain *variable* (`base.html:90`). Where they conflict, I trusted the shipped 1.0 source. Pico 1.x documentation is no longer the default on picocms.org, so 1.x-specific behavioral details are **less well corroborated** than the Astro side.
- **`z` from `astro:content`:** official docs say import from `astro/zod`; the shipped template still exports `z` from `astro:content` but marks it `// TODO: remove in Astro 7` while shipping *in* 7.1.3. Both work today; `astro/zod` is the durable choice.
- **Pico docs say `content/sub/index.md` → `?sub`**, but the live nav emits `?about/index`. Both forms return 200 (measured). This is a Pico 1.0 URL-generation quirk; I did not trace it into `lib/Pico.php` to find the exact cause.

### Not verified — treat as assumption

- **Whether the live deployment matches the `firefly` branch.** The branch's last commit is 2020-05-29; the live site is consistent with it (same nav, same Heap/Hotjar IDs, same Cloudinary hero), but I could not confirm the deployed tree is identical. There may be untracked edits made directly on the server. **`config/config.php` is committed here, which is unusual** — the stock `.gitignore` entry for it is commented out — so the live config *probably* matches, but this is inference.
- **Whether go-firefly.com currently ranks for or receives traffic on any legacy URL.** I have no analytics access. My recommendation to abandon `?about`-style URLs rests on the reasoning that they are query-string, duplicated, uncanonicalized, and unsupported by any sitemap — **not** on measured traffic data. If real inbound links exist, the homepage query-string shim becomes more important.
- **Hosting provider, registrar, and DNS records.** I read only HTTP response headers (`Apache/2.4.6 (CentOS) … PHP/5.6.17`). I did not query DNS or identify the host. All hosting/DNS recommendations are conditional on that.
- **Whether the $75/hour rate, the client list, and the LinkedIn/Twitter/CodePen links are still accurate.** This content dates from 2016. It needs the user's review, not a developer's.
- **Whether Typeform form `cOYwsz`, Heap `1732739567`, and Hotjar `1084213` are still live accounts.** I did not authenticate against any of them.
- **satteri's full CommonMark/GFM conformance vs Parsedown Extra.** I tested the one behavior that matters for this content (raw HTML block passthrough) and confirmed agreement. I did **not** run a conformance suite. Given how little Markdown exists in the source, this gap is low-risk — but it is a gap.
- **`@astrojs/sitemap@3.7.3` and `@astrojs/rss@4.0.19` against astro 7.1.3.** I confirmed via the npm registry that neither declares *any* `peerDependencies`, so nothing blocks installation. I did **not** install or build with them, so runtime compatibility with 7.1.3 is **unverified**.
- **Anything about `docs/research/eleventy-to-astro-migration.md`.** Per instructions, that file was not read, and nothing here derives from it.
