# JurnalPivot — Technical Documentation

> **Who this is for:** anyone who needs to maintain this website by hand — add articles, add authors, publish a podcast episode, change a style, or fix something that broke — including people who have only written a little HTML before.
>
> **What this covers:** every file in the repository, how Eleventy turns those files into the live website, the exact rules that decide which layout, stylesheet, and script each page gets, step-by-step recipes for common tasks, the status of every problem found in the audit, and the options for the repository's file-size problem.
>
> **Version:** updated 10 October 2026 after the first round of fixes (see [§20](#20-audit-status-what-was-fixed-what-is-still-open)). Eleventy `3.1.6`, Node `22.14.0`.
>
> **Web version:** this file is also published as a web page at `/pages/dokumentasi/` and is regenerated from this file on every build (see [§17](#17-the-web-version-of-this-documentation)).

---

## Table of Contents

1. [The Big Picture: What Kind of Website Is This?](#1-the-big-picture-what-kind-of-website-is-this)
2. [Getting Started: Installing, Previewing, Building](#2-getting-started-installing-previewing-building)
3. [The Repository, File by File](#3-the-repository-file-by-file)
4. [The Engine Room: `.eleventy.js` Section by Section](#4-the-engine-room-eleventyjs-section-by-section)
5. [Core Eleventy Concepts You Must Understand](#5-core-eleventy-concepts-you-must-understand)
6. [The Template System: How a Page Is Assembled](#6-the-template-system-how-a-page-is-assembled)
7. [Content Type 1 — Standard Articles](#7-content-type-1--standard-articles)
8. [Content Type 2 — Immersive Articles](#8-content-type-2--immersive-articles)
9. [Content Type 3 — Podcast Episodes](#9-content-type-3--podcast-episodes)
10. [Authors: `authors.json` and the Profile Pages](#10-authors-authorsjson-and-the-profile-pages)
11. [Site Settings and the Other Pages](#11-site-settings-and-the-other-pages)
12. [Styling: How the CSS Is Organised](#12-styling-how-the-css-is-organised)
13. [Client-Side JavaScript](#13-client-side-javascript)
14. [Static Assets: Images, Audio, Video](#14-static-assets-images-audio-video)
15. [Drafts: Preview vs. Build](#15-drafts-preview-vs-build)
16. [URL Map of the Live Site](#16-url-map-of-the-live-site)
17. [The Web Version of This Documentation](#17-the-web-version-of-this-documentation)
18. [Recipes: Step-by-Step Maintenance Tasks](#18-recipes-step-by-step-maintenance-tasks)
19. [Troubleshooting and Gotchas](#19-troubleshooting-and-gotchas)
20. [Audit Status: What Was Fixed, What Is Still Open](#20-audit-status-what-was-fixed-what-is-still-open)
21. [Options for the Repository Size Problem (B4)](#21-options-for-the-repository-size-problem-b4)
22. [Parked: Growth Ideas for Later](#22-parked-growth-ideas-for-later)

---

## 1. The Big Picture: What Kind of Website Is This?

### 1.1 Static vs. dynamic websites

There are two broad ways to run a website:

- **Dynamic** (WordPress, Ghost, etc.): every time a visitor opens a page, a server runs code, reads a database, and builds the HTML on the spot.
- **Static**: all the HTML pages are built *once*, ahead of time, and saved as plain files. The web host just hands those files to visitors. There is no database and no server code running while people read.

**JurnalPivot is a static site.** That makes it fast, cheap (often free) to host, and very hard to hack — but it also means *nothing on the site changes until someone rebuilds it*. (For example, the copyright year in the footer is filled in at build time; it changes the next time the site is rebuilt after New Year — which happens automatically whenever anything is published.)

### 1.2 What Eleventy does

[Eleventy](https://www.11ty.dev/) (also written **11ty**) is a *static site generator*: a program that reads your source files (Markdown articles, templates, data files) and writes out a folder of finished HTML pages.

Think of it as a print shop:

| Print-shop analogy | In this repo |
|---|---|
| The manuscripts | Markdown files in `src/articles/` |
| The page design / letterhead | Nunjucks layouts in `src/_includes/` |
| The contributor list and house details | `src/_data/authors.json` and `src/_data/site.json` |
| Paper, ink, photos | CSS, JS, images, audio in `src/css`, `src/js`, `src/images`, `src/audio` |
| The printing press | Eleventy, configured by `.eleventy.js` |
| The printed magazine | The `_site/` folder — the actual website |

### 1.3 The build pipeline in one picture

```
                          ┌──────────────────────────┐
  src/articles/*.md  ───► │                          │      _site/
  src/pages/*.njk    ───► │                          │ ───► ├── index.html
  src/index.njk      ───► │        ELEVENTY          │      ├── articles/<slug>/index.html
  src/penulis/*.njk  ───► │                          │      ├── penulis/<slug>/index.html
                          │  1. read front matter    │      ├── pages/submisi/index.html
  src/_data/*.json   ───► │  2. merge data cascade   │      ├── pages/tentang/index.html
  DOCUMENTATION.md   ───► │  3. render Markdown/njk  │      ├── pages/dokumentasi/index.html
                          │  4. wrap in layouts      │      ├── css/  js/  images/  audio/
  src/_includes/**   ───► │  5. write HTML files     │      │   (copied unchanged)
                          │  6. copy static assets   │
  src/css,js,images, ───► │                          │
  audio                   └──────────────────────────┘
```

Then whatever hosts the website serves the contents of `_site/` to visitors.

### 1.4 The three languages you will meet

1. **Markdown** (`.md`) — a lightweight way to write formatted text. `*italic*`, `**bold**`, `[link text](https://...)`. Articles are written in this.
2. **Nunjucks** (`.njk`) — HTML with "holes" in it that get filled with data. `{{ title }}` prints a value; `{% if ... %}` / `{% for ... %}` add logic. All layouts are written in this.
3. **YAML front matter** — the block at the very top of a content file between two `---` lines. It is a list of `key: value` settings for that page (title, author, date, …).

Plus **JSON** for the data files (`authors.json`, `site.json`): `{ "key": "value" }` lists with strict comma rules (see [§10.1](#101-structure)).

---

## 2. Getting Started: Installing, Previewing, Building

### 2.1 One-time setup

1. Install **Node.js** (version 18 or newer; verified with 22.14.0). Download it from nodejs.org.
2. Open a terminal in the project folder (`D:\JurnalPivot-Eleventy`).
3. Install dependencies:

   ```bash
   npm install
   ```

   This reads `package.json` / `package-lock.json` and downloads Eleventy and the other libraries into `node_modules/`. You never edit `node_modules/` and it is never committed (see `.gitignore`).

### 2.2 Everyday commands

| What you want | Command | Drafts? |
|---|---|---|
| **Live preview while you edit** — open `http://localhost:8080`; the browser reloads on every save | `npm start` | shown |
| **Build the real site** into `_site/` (deletes the old `_site/` first) | `npm run build` | hidden |
| Delete the `_site/` folder | `npm run clean` | – |
| Check the Eleventy version | `npx @11ty/eleventy --version` | – |

Stop the live preview with **Ctrl + C** in the terminal.

These commands are defined in the `"scripts"` section of `package.json`:

```json
"scripts": {
  "start": "eleventy --serve",
  "build": "npm run clean && eleventy",
  "clean": "node -e \"require('fs').rmSync('_site', { recursive: true, force: true })\""
}
```

### 2.3 Where does the live site come from?

The repository's remote is `https://github.com/JurnalPivot/JurnalPivot-Eleventy.git`. There is **no deployment configuration file in the repo**, so deployment is configured in the dashboard of whichever hosting service is connected to the GitHub repository. Typical flow: you push a commit to the `main` branch on GitHub → the host notices → it runs its build command → it publishes `_site/`.

**Things the account owner should check once in the host's dashboard and write down here:**

- the host's name (Netlify / Vercel / Cloudflare Pages / GitHub Pages / …);
- the build command — it should be `npm run build` (or `npx @11ty/eleventy` / `eleventy`; all three are fine and all three hide drafts);
- the publish/output directory — must be `_site`;
- the per-file size limit, which matters for audio and video (see [§21](#21-options-for-the-repository-size-problem-b4)).

> Drafts no longer depend on an environment variable on the host: any build (as opposed to the live preview) hides them. See [§15](#15-drafts-preview-vs-build).

---

## 3. The Repository, File by File

```
JurnalPivot-Eleventy/
├── .eleventy.js                ← Eleventy configuration (the "engine room")
├── .gitignore                  ← files Git must never commit
├── package.json                ← project metadata, npm commands, dependency list
├── package-lock.json           ← exact dependency versions (auto-generated, don't hand-edit)
├── DOCUMENTATION.md            ← this file (also published at /pages/dokumentasi/)
│
├── _site/                      ← BUILD OUTPUT. Generated. Ignored by Git. Never edit by hand.
├── node_modules/               ← installed libraries. Generated. Ignored by Git.
├── backups/                    ← personal scratch/backup folder. Ignored by Git.
├── .claude/                    ← local editor-assistant settings. Not part of the site.
│
└── src/                        ← EVERYTHING ELEVENTY READS (the "input" directory)
    ├── index.njk               ← the home page (just front matter → uses layouts/home.njk)
    │
    ├── _data/                  ← GLOBAL DATA, available in every template
    │   ├── authors.json        ← every author's bio, photo, links… → variable `authors`
    │   └── site.json           ← site name, tagline, contact email, social links → `site`
    │
    ├── _includes/              ← templates that other pages use; never become pages themselves
    │   ├── base.njk            ← the outer shell of EVERY page (<head>, header, footer)
    │   ├── layouts/
    │   │   ├── article.njk     ← standard article layout
    │   │   ├── immersive.njk   ← wide, multimedia "scrollytelling" article layout
    │   │   ├── podcast.njk     ← podcast episode layout (audio player + transcript)
    │   │   ├── home.njk        ← home page layout (hero + list of all articles)
    │   │   └── profile.njk     ← author profile page layout
    │   └── components/         ← reusable fragments
    │       ├── article-header.njk   ← category pill, title, "By X • date", optional image
    │       ├── author-bio.njk       ← "Tentang <author>" box linking to the profile
    │       ├── avatar.njk           ← author photo, or first-letter circle if no photo
    │       └── related-posts.njk    ← "Bacaan Terkait" — 3 related articles
    │
    ├── articles/               ← ONE FILE = ONE PUBLISHED ARTICLE
    │   ├── articles.11tydata.json   ← defaults for every file in this folder (tags + layout)
    │   ├── absolutisme-di-relativisme.md
    │   ├── alternatif-perubahan-fff.md
    │   ├── amok-sejarah-pemretelan.md
    │   ├── bebas-dan-pasif.md
    │   ├── ep01-kelas-politik-mas-adri.md      ← podcast episode
    │   ├── garis-buram.md
    │   ├── kripto-fasisme.md
    │   ├── mengapa-masyarakat-sering-turun.md
    │   ├── merehabilitasi-politik.md
    │   ├── pemerataan-pendidikan.md
    │   └── surat-kepada-tsuburaya.md            ← immersive article, currently a draft
    │
    ├── penulis/
    │   └── penulis.njk         ← ONE template that generates ONE PAGE PER AUTHOR
    │
    ├── pages/
    │   ├── submisi.njk         ← "Kirim Tulisan" submission guidelines page
    │   ├── tentang.njk         ← "About" page; editor masthead generated from authors.json
    │   └── dokumentasi.njk     ← web version of DOCUMENTATION.md (unlisted)
    │
    ├── css/                    ← stylesheets, copied as-is to _site/css/
    │   ├── global.css          ← loaded on every page
    │   ├── home.css  article.css  immersive.css  podcast.css
    │   ├── profile.css  submisi.css  tentang.css  docs.css
    │
    ├── js/                     ← browser scripts, copied as-is to _site/js/
    │   ├── main.js             ← every page: dark-mode toggle, link previews, email copy
    │   └── podcast.js          ← podcast pages only: the audio player
    │
    ├── images/                 ← copied as-is to _site/images/
    │   ├── authors/            ← author photos
    │   ├── icons/favicon.png
    │   └── articles/<article>/ ← per-article media (images, GIFs, MP4s)
    │
    └── audio/                  ← podcast MP3s, copied as-is to _site/audio/
        └── ep01-mas-adri.mp3
```

### 3.1 The special folder and file names

Eleventy treats a few names specially. These are *conventions*, not things configured in this repo:

| Name | Special meaning |
|---|---|
| `src/_data/` | Every `.json` file here becomes a **global variable** available in every template, named after the file: `authors.json` → `authors`, `site.json` → `site`. |
| `src/_includes/` | Where Eleventy looks for **layouts** and **includes**. `layout: layouts/article.njk` means `src/_includes/layouts/article.njk`. Files here never become pages on their own. |
| `<folder>/<folder>.11tydata.json` | A **directory data file**: its values apply to every page in that folder (and sub-folders). `src/articles/articles.11tydata.json` is one. |
| Anything else under `src/` | If it's a template file (`.md`, `.njk`, `.html`, …), it becomes a page. Its URL mirrors its path unless a `permalink` says otherwise. |

### 3.2 `.gitignore`

```
node_modules/
_site/
.DS_Store
backups/
```

- `_site/` is ignored on purpose: it is *generated*. The host rebuilds it from `src/`.
- `backups/` is the maintainer's personal scratch folder. It never reaches GitHub.

### 3.3 `package.json`

```json
"devDependencies": { "@11ty/eleventy": "^3.1.2" },
"dependencies": {
  "luxon": "^3.7.2",
  "markdown-it": "^14.1.0",
  "markdown-it-footnote": "^4.0.0"
}
```

- **`@11ty/eleventy`** — the generator itself (currently installed: 3.1.6).
- **`luxon`** — a date library, used to print dates in Indonesian ("19 Agustus 2026").
- **`markdown-it`** — the Markdown parser.
- **`markdown-it-footnote`** — adds footnote support (`[^1]`) to Markdown.
- `^3.1.2` means "3.1.2 or any newer 3.x version". The exact installed versions are locked in `package-lock.json`.
- `"private": true` stops the project from being accidentally published to the npm package registry.

---

## 4. The Engine Room: `.eleventy.js` Section by Section

This file runs every time Eleventy builds. It exports one function that receives `eleventyConfig` — an object whose methods you call to customise Eleventy. The file is divided into numbered sections with comments; this chapter follows the same numbering.

At the top are two small helper functions: `escapeHtml` (makes text safe to put inside HTML — used by the podcast shortcodes) and `slugifyHeading` (turns a heading into a link id — used by the documentation page).

### 4.1 Drafts (section 1)

```js
eleventyConfig.addPreprocessor("drafts", "*", (data) => {
  const isPreview = ["serve", "watch"].includes(process.env.ELEVENTY_RUN_MODE);
  const forceProduction = process.env.ELEVENTY_ENV === "production";
  if (data.draft === true && (!isPreview || forceProduction)) {
    return false;
  }
});
```

A *preprocessor* runs on every template before it is rendered. Returning `false` **drops that file completely** — no page is written and it disappears from every list.

Eleventy itself sets `ELEVENTY_RUN_MODE` to `serve` during `npm start` and to `build` during `npm run build`. So:

- `npm start` (live preview) → drafts are visible, so you can proofread them.
- Any build → drafts are removed.
- Setting `ELEVENTY_ENV=production` forces drafts off even in the live preview (useful to see exactly what will be published).

### 4.2 Author check (section 2)

```js
eleventyConfig.addPreprocessor("author-check", "md", (data) => {
  const tags = [].concat(data.tags || []);
  if (tags.includes("articles") && !(data.authors && data.authors[data.author])) {
    throw new Error(`Unknown author "${data.author}" in ${data.page.inputPath}. ...`);
  }
});
```

For every Markdown article, checks that the `author:` in its front matter is a key in `authors.json`. If not, **the build stops** with a message naming the file, e.g.:

```
Unknown author "Hikmahh" in ./src/articles/pemerataan-pendidikan.md. Add it to src/_data/authors.json or fix the spelling.
```

Before this check existed, a typo silently removed the author box and hid the article from the author's profile.

### 4.3 `readableDate` filter (section 3)

```js
eleventyConfig.addFilter("readableDate", (dateObj) => { ... .setLocale("id").toFormat("d MMMM yyyy") });
```

A *filter* is a function applied in a template with the pipe symbol: `{{ date | readableDate }}` → `19 Agustus 2026`.

It uses the UTC time zone on purpose: a front-matter date like `2026-08-19` is read by Eleventy as midnight UTC, and printing it in UTC guarantees the date shown is exactly the date typed, whatever computer runs the build.

### 4.4 Author helpers (section 4)

| Filter | Example | Result |
|---|---|---|
| `existingFile` | `"/images/authors/ria.jpg" \| existingFile` | the same path if `src/images/authors/ria.jpg` exists, otherwise `""` |
| `initial` | `"Jonathan K." \| initial` | `J` |
| `authorUrl` | `authors["Hikmah"] \| authorUrl` | `/penulis/hikmah/` — or the author's `profileUrl` if it has one (Redaksi → `/pages/tentang/#redaksi`) |

These power the avatar fallback and author links (see [§6.4](#64-components)).

### 4.5 Related posts filter (section 5)

```js
eleventyConfig.addFilter("relatedPosts", (posts, category, url, limit = 3) => { ... });
```

Given all articles, the current category and the current page's URL, returns up to 3 articles: **newest in the same category first, then topped up with the newest from any category**, never including the current page. So the "Bacaan Terkait" section is never empty and never shows stale picks.

### 4.6 `{% year %}` shortcode (section 6)

```js
eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));
```

Prints the current year at build time. Used in the footer: `© {% year %} JurnalPivot.` No manual change is ever needed — the year updates on the first build of the new year.

### 4.7 `profileAuthors` (section 7)

```js
eleventyConfig.addGlobalData("profileAuthors", () => { ... });
```

Creates a global list of author names that should get their own profile page: every key in `authors.json` **except** entries that have a `profileUrl` (currently only "Redaksi"). `src/penulis/penulis.njk` loops over this list (see [§10.3](#103-how-one-file-becomes-one-page-per-author)).

### 4.8 Passthrough copy (section 8)

```js
eleventyConfig.addPassthroughCopy("src/css");
eleventyConfig.addPassthroughCopy("src/js");
eleventyConfig.addPassthroughCopy("src/images");
eleventyConfig.addPassthroughCopy("src/audio");
```

These folders are copied byte-for-byte into `_site/` with the `src/` prefix removed: `src/css/global.css` → `/css/global.css`. Nothing is processed or optimised.

**If you add a new top-level asset folder** (e.g. `src/fonts/`), it will **not** appear on the site until you add another `addPassthroughCopy` line.

### 4.9 Markdown settings (section 9)

```js
const md = markdownIt({ html: true, breaks: true, linkify: true }).use(markdownItFootnote);
eleventyConfig.setLibrary("md", md);
```

| Option | Meaning in practice |
|---|---|
| `html: true` | You can write raw HTML inside Markdown (`<video>`, `<div class="...">`). The immersive article depends on this. |
| `breaks: true` | **A single line break in your text becomes a visible line break.** Separate paragraphs with a *blank line*; don't hard-wrap sentences across lines. |
| `linkify: true` | Bare URLs like `https://example.com` automatically become links. |
| footnote plugin | Enables `text[^1]` + `[^1]: the note` (see [§7.4](#74-footnotes)). |

### 4.10 Documentation page data (section 10)

Reads `DOCUMENTATION.md`, converts it to HTML (with a separate, stricter Markdown setup that does not allow raw HTML), gives every heading a link id, and collects the list of chapters for the sidebar. The result is the global variable `documentation`, used by `src/pages/dokumentasi.njk`. `addWatchTarget` makes the live preview reload when this file changes. See [§17](#17-the-web-version-of-this-documentation).

### 4.11 Podcast shortcodes (sections 11–12)

A *shortcode* is a custom tag usable in templates. A *paired* shortcode has an opening and closing tag and receives what's between them as `content`.

**`{% chapter "Title", "MM:SS", seconds %} … {% endchapter %}`** produces a collapsible box:

```html
<details class="chapter" data-time="1560">
  <summary class="chapter-summary">
    <span class="chapter-info">
      <span class="chapter-title">Title</span>
      <span class="chapter-timestamp">26:00</span>
    </span>
    <span class="chapter-chevron"><svg>…</svg></span>
  </summary>
  <div class="chapter-content"> …the turns… </div>
</details>
```

- `<details>`/`<summary>` is a native HTML collapsible box; it starts closed.
- `data-time` (3rd argument, in **seconds**) tells `podcast.js` when the chapter starts. The 2nd argument is only the visible label. **They must agree**; the code doesn't check.

**`{% turn "Speaker", "host" %} … {% endturn %}`** produces one speaker's block:

```html
<div class="speaker-turn speaker-host">
  <span class="speaker-label">Speaker</span>
  <div class="speaker-body"> …paragraphs rendered from Markdown… </div>
</div>
```

- The body uses the same Markdown settings as articles.
- The role becomes a CSS class (`speaker-host` / `speaker-guest`). Omitting it means `guest`.
- Titles and names are escaped, so characters like `&` or `<` in them are safe.

### 4.12 Return settings (end of file)

```js
return {
  markdownTemplateEngine: false,
  dir: { input: "src", output: "_site" }
};
```

- `markdownTemplateEngine: false` — Markdown articles are **plain Markdown**: template tags like `{{ }}` or `{% %}` inside an article are shown as text, never executed. (Eleventy's default would run every article through the Liquid template language first, which could break or swallow such text.) The podcast opts back in with `templateEngineOverride: njk,md`.
- `dir` — read from `src/`, write to `_site/`. Files in the project root (like this documentation, `package.json`, `backups/`) are never published as-is.

---

## 5. Core Eleventy Concepts You Must Understand

### 5.1 Front matter

Every content file starts with YAML between `---` lines:

```yaml
---
title: "Garis Buram Kesatuan dan Keseragaman"
date: 2026-05-16
author: "Patrick R."
category: "Politik"
---
```

Every key becomes a variable available to the layout (`{{ title }}`, `{{ author }}`…). YAML rules to remember:

- Put text values in **double quotes**, especially if they contain `:` (`"EP 01: Kelas Politik"` — without quotes YAML breaks on the colon).
- Indentation matters for nested values (see the `podcast:` block in [§9](#9-content-type-3--podcast-episodes)). Use spaces, never tabs.
- Dates are written `YYYY-MM-DD`.

### 5.2 The data cascade

A page's final set of variables is merged from several sources. When two define the same key, the higher one wins:

```
HIGHEST  ┌─ eleventyComputed (computed values, e.g. penulis.njk's title)
         ├─ The page's own front matter
         ├─ Directory data files (src/articles/articles.11tydata.json)
         ├─ Front matter of the LAYOUT(S) the page uses
LOWEST   └─ Global data (src/_data/authors.json → `authors`, site.json → `site`)
```

Two practical examples:

1. **Defaults for articles.** `articles.11tydata.json` contains `"tags": "articles"` and `"layout": "layouts/article.njk"`, so a standard article doesn't need to write them. The podcast and immersive articles write their own `layout:` in front matter, which *wins* over the default.
2. **Stylesheets.** `layouts/article.njk` has `cssFile: article.css` in its own front matter; every page using that layout inherits it (see [§6.3](#63-how-each-page-picks-its-stylesheet)).

### 5.3 Layouts and layout chaining

`layout:` says "after rendering my content, put it *inside* this template, where the template says `{{ content | safe }}`."

Layouts can themselves have a layout. Every layout in this repo has `layout: base.njk`, so pages are wrapped twice:

```
article .md  ──rendered──►  layouts/article.njk  ──wrapped by──►  base.njk  ──►  final HTML
(your words)                (header, bio, related)                (<head>, nav, footer)
```

`| safe` tells Nunjucks "this is already HTML — don't escape it". Nunjucks escapes every other `{{ }}` output automatically, which is why titles containing `&` or `<` are safe.

### 5.4 Collections and `tags`

Every page in `src/articles/` gets the tag `articles` (from the directory data file). Eleventy groups all pages sharing a tag into a **collection**, available everywhere as `collections.articles` — the list of every article, including the podcast and immersive one.

Each item in a collection exposes:

| Expression | Meaning |
|---|---|
| `post.url` | its URL, e.g. `/articles/garis-buram/` |
| `post.date` | its date |
| `post.data.title`, `post.data.author`, `post.data.category`, … | anything from its front matter |

**Ordering:** collections are sorted **oldest first** by `date`; ties are broken by file name. Templates that want newest first use `| reverse`: `{% for post in collections.articles | reverse %}`.

### 5.5 Permalinks (URLs)

By default, a page's URL is its path relative to `src/`, without the extension:

```
src/articles/garis-buram.md   →  _site/articles/garis-buram/index.html  →  /articles/garis-buram/
src/pages/tentang.njk         →  _site/pages/tentang/index.html         →  /pages/tentang/
src/index.njk                 →  _site/index.html                       →  /
```

So **the filename *is* the URL slug.** Renaming a file changes its public address and breaks every existing link to it (shared on Instagram, etc.). Use lowercase, hyphens, no spaces.

A page can override this with a `permalink:` key — `penulis.njk` does exactly that.

### 5.6 Template engines per file type

| File | What happens |
|---|---|
| `.njk` | Rendered by Nunjucks. |
| `.md` | Plain Markdown only (because of `markdownTemplateEngine: false`). |
| `.md` with `templateEngineOverride: njk,md` | First Nunjucks, then Markdown. **The podcast needs this** so `{% chapter %}`/`{% turn %}` work. |

### 5.7 Pagination (one template → many pages)

`src/penulis/penulis.njk` uses *pagination* to generate one page per author — explained in [§10.3](#103-how-one-file-becomes-one-page-per-author).

---

## 6. The Template System: How a Page Is Assembled

### 6.1 `base.njk` — the shell around everything

Every page ends up inside `src/_includes/base.njk`. In order, it outputs:

1. `<html lang="id">` — declares the page as Indonesian.
2. `<title>` — the browser tab text:
   - normal pages: `<page title> — JurnalPivot` (e.g. "Garis Buram Kesatuan dan Keseragaman — JurnalPivot");
   - the home page: `JurnalPivot — Merakit dan Menulis Ide`.
   The name and tagline come from `site.json`.
3. `<meta name="robots" content="noindex">` — only on pages with `noindex: true` (the documentation page), asking search engines not to list them.
4. Favicon `/images/icons/favicon.png`.
5. **A small inline theme script** — runs before anything is drawn and sets `data-theme="dark"` or `"light"` on `<html>`, using the reader's saved choice, or else their device's dark/light setting. This prevents a white flash for dark-mode readers.
6. Google Fonts: **EB Garamond** (serif, article text and headings) and **Inter** (sans-serif, interface text).
7. `/css/global.css` — always; then `/css/{{ cssFile }}` and `/css/{{ additionalCssFile }}` if defined.
8. The site header: logo (site name) → `/`, nav links **Submisi** and **Tentang**, and the dark-mode toggle (sun and moon icons; CSS shows the right one).
9. `{{ content | safe }}` — the page's own content.
10. The footer: `© <current year> JurnalPivot. Merakit dan Menulis Ide.` and the social links listed in `site.json`.
11. `<script src="/js/main.js">` — always.

**To change the nav menu, fonts, or anything in `<head>` for the whole site, edit `base.njk`. To change the site name, tagline, or footer social links, edit `site.json`.**

### 6.2 Which layout chain each page uses

| Page | Source file | Layout chain | CSS loaded (besides global.css) | Extra JS |
|---|---|---|---|---|
| Home | `src/index.njk` | `layouts/home.njk` → `base.njk` | `home.css` | – |
| Standard article | `src/articles/*.md` | `layouts/article.njk` → `base.njk` | `article.css` | – |
| Immersive article | `src/articles/surat-kepada-tsuburaya.md` | `layouts/immersive.njk` → `base.njk` | `immersive.css` | – |
| Podcast episode | `src/articles/ep01-…md` | `layouts/podcast.njk` → `base.njk` | `article.css` + `podcast.css` | `podcast.js` |
| Author profile | `src/penulis/penulis.njk` | `layouts/profile.njk` → `base.njk` | `profile.css` | – |
| Submisi | `src/pages/submisi.njk` | `base.njk` directly | `submisi.css` | – |
| Tentang | `src/pages/tentang.njk` | `base.njk` directly | `tentang.css` | – |
| Documentation | `src/pages/dokumentasi.njk` | `base.njk` directly | `docs.css` | small inline script |

### 6.3 How each page picks its stylesheet

There is no central list. It is purely the data cascade:

1. A sub-layout declares `cssFile:` (and optionally `additionalCssFile:`) in its front matter.
2. A page using that layout inherits the value.
3. `base.njk` turns the value into a `<link rel="stylesheet">`.

Pages that use `base.njk` directly (Submisi, Tentang, Dokumentasi) set `cssFile` in their own front matter.

### 6.4 Components

Two ways components are used:

- `{% include "components/x.njk" %}` pastes another template in place. It sees **all the page's variables** (`title`, `author`, `collections`, `authors`, `page`…).
- `{% from "components/avatar.njk" import avatar %}` loads a **macro** — a reusable template function you call with arguments: `{{ avatar(name, authorData, "css-class") }}`.

#### `components/article-header.njk`

```
┌──────────────────────────────────────┐
│ [POLITIK]                ← {{ category }}
│ Article Title            ← {{ title }}
│ By Jennye Awuy sebagai penulis KataKarsa • 7 Juli 2026
│ [featured image]         ← only if front matter has `image:`
└──────────────────────────────────────┘
```

- Looks the author up in `authors.json`. If they have an `affiliation`, adds "sebagai penulis <affiliation>".
- If the page sets `image: /images/articles/.../cover.jpg`, shows a featured image. (No article uses this yet.)

#### `components/avatar.njk`

The single place that decides how an author's picture looks. Used by the author box, profile pages and the Tentang masthead.

- If the author's `photo` path points to a file that **really exists** in `src/` → shows the photo.
- Otherwise (no `photo`, empty `photo`, or the file is missing) → shows a coloured circle with the **capital first letter of the author's name** ("Jonathan K." → **J**). The colour is the author's `monogramColor`, or the site's blue accent colour if none is set.

Because the check happens at build time, simply adding the missing photo file (with the exact path written in `authors.json`) makes the photo appear on the next build — nothing else to change.

#### `components/author-bio.njk`

- Looks up `authors[author]`. Renders the avatar, "Tentang <name>" (+ affiliation), the short `bio`, and a link.
- The link goes to the author's profile page, or to their `profileUrl` if they have one. The hover label is "Lihat Profil →" for profiles and "Selengkapnya →" for `profileUrl` entries (Redaksi).

#### `components/related-posts.njk`

- Uses the `relatedPosts` filter ([§4.5](#45-related-posts-filter-section-5)) to pick 3 articles.
- Renders nothing at all if there are no other articles.
- Used by the article, immersive and podcast layouts.

---

## 7. Content Type 1 — Standard Articles

### 7.1 Front matter reference

```yaml
---
title: "Alternatif Perubahan dalam Fridays for Future"   # required
date: 2026-08-19                                        # required — controls order & displayed date
author: "Jason Fernando"                                # required — MUST match a key in authors.json
category: "Politik"                                     # required — shown as pill; drives related posts
image: /images/articles/my-slug/cover.jpg               # optional — featured image under the title
draft: true                                             # optional — hide from builds (see §15)
---
```

`tags: articles` and `layout: layouts/article.njk` are supplied automatically by `src/articles/articles.11tydata.json`. Writing them again is harmless but unnecessary.

| Field | What happens if it's wrong |
|---|---|
| `title` | Empty headline and tab title. |
| `date` | If missing, Eleventy uses the file's creation time on disk — the article can jump around the list unpredictably. |
| `author` | Case- and punctuation-sensitive. `"Jonathan K"` (no dot) ≠ `"Jonathan K."`. A mismatch now **stops the build** with an "Unknown author" message. |
| `category` | Free text. Existing values: `Politik`, `Sosial`, `Budaya`, `Podcast`. A typo (`politik` lowercase) creates a new category and weakens related posts. |

### 7.2 What the page looks like (top → bottom)

1. Header from `article-header.njk`.
2. The body inside `<div class="prose">` — max 680 px wide, EB Garamond, generous line height.
3. A divider and the author box.
4. "Bacaan Terkait" related posts.

### 7.3 Writing the body — conventions this site uses

- **Lead paragraph:** the first paragraph is automatically styled larger. Many articles make it `***bold italic***` as a standfirst/summary.
- **Paragraphs:** separate with one blank line. A single newline inside a paragraph creates a forced line break.
- **Section headings:** existing articles write them as bold paragraphs (`**Lebih dari Sekadar Absen dari Kelas**`). Real Markdown headings (`## Heading`) are also styled and are better for accessibility and search engines (see B11 in [§20](#20-audit-status-what-was-fixed-what-is-still-open)).
- **Links:** `[visible text](https://url)`. Links get an amber underline; on computers with a mouse, hovering shows a small card with the destination domain and a "Buka di tab baru ↗" button (see [§13.1](#131-mainjs-every-page)). Citing sources as inline links is the house style.
- **Quotes:** start a line with `> ` for a styled blockquote with a large decorative quote mark.
- **Lists:** `- item` or `1. item`.
- **Images:** `![alt text](/images/articles/my-slug/photo.jpg)` — rounded corners, full column width.
- **Emphasis:** `*italic*`, `**bold**`, `***bold italic***`.
- Template-looking text such as `{{ }}` is now displayed literally, never executed.

### 7.4 Footnotes

```markdown
Memang betul, ia adalah *Kronjurist*.[^1] Tetapi …

[^1]: Lihat Joseph Bendersky, *Carl Schmitt: Theorist for the Reich* (2014).
```

- Footnote definitions can be anywhere in the file; they're always collected at the bottom.
- Labels don't have to be numbers (`[^schmitt]` works) — they're renumbered in order of appearance.
- `article.css` shows a small amber superscript number, adds a "Catatan Kaki" label above the list, and hides the ↩ back-arrow.
- `merehabilitasi-politik.md` and `kripto-fasisme.md` use this. `amok-sejarah-pemretelan.md` still uses hand-typed `<sup>1</sup>` markers (item A10, intentionally left for later).

### 7.5 Converting a `.docx` submission

Submissions arrive as `.docx`. Practical conversion:

- Use [Pandoc](https://pandoc.org): `pandoc artikel.docx -t gfm --wrap=none -o artikel.md`. `--wrap=none` matters because of `breaks: true` — wrapped lines would become line breaks.
- Then clean up: remove stray backslashes (`\[…\]`), convert Word footnotes to `[^n]`, turn hyperlinked phrases into `[text](url)`.

---

## 8. Content Type 2 — Immersive Articles

The immersive layout is for multimedia pieces: wide video/GIF sections and "scrollytelling" where text cards scroll over a sticky video. The only example is `surat-kepada-tsuburaya.md` (currently `draft: true`).

### 8.1 How it differs from a standard article

- Front matter must include `layout: layouts/immersive.njk` (overriding the folder default). This loads `immersive.css`.
- The header is centred and full-width, shows the category only if set, and shows the author without "By".
- The body is **not** wrapped in `.prose`. You write raw HTML blocks inside the Markdown file and choose each block's style with classes.
- The author box and related posts sit inside `.immersive-footer-wrap` at normal reading width.
- The front matter field `lede:` in the Tsuburaya file is **not read by any template** — it currently does nothing (the same sentence is already the first paragraph of the body).

### 8.2 The building blocks (classes from `immersive.css`)

| Block | Markup | Purpose |
|---|---|---|
| Reading column | `<div class="im-prose"> <p>…</p> </div>` | Normal-width text. Links get the amber style and hover preview. |
| Full-bleed media | `<figure class="im-fullbleed"><img src="…"></figure>` (or `<video>`) | Edge-to-edge image/GIF/video. Optional `<figcaption>`. |
| Section title | `<h2 class="im-section-title">…</h2>` | Large section heading. |
| Spacers | `<div class="im-spacer"></div>`, `<div class="im-spacer-lg"></div>` | Vertical breathing room. |
| Scrollytelling | see below | Sticky media with text cards scrolling over it. |
| Placeholder | add `im-placeholder` to a media container | Grey box while real media is pending. |

Scrollytelling structure:

```html
<div class="im-scrolly">
  <div class="im-scrolly-media">
    <video src="/images/articles/my-slug/clip.mp4" autoplay muted loop playsinline></video>
  </div>
  <div class="im-scrolly-text">
    <div class="im-scrolly-step">            <!-- add "centre", "right" or "dark" for variants -->
      <p>Text card that scrolls past the sticky video.</p>
    </div>
  </div>
</div>
```

- `.centre` — centred single statement; `.right` — card on the right; `.dark` — dark card for light footage. A `<blockquote>` with `<cite>` inside a step gets quote styling.
- Videos must be `muted` for `autoplay` to be allowed by browsers; `playsinline` stops iPhones going full-screen.

### 8.3 HTML-inside-Markdown rules (important)

- **Leave a blank line before and after every HTML block** (`<div>`, `<figure>`, `<h2>`), as the existing file does.
- Inside an HTML block, Markdown syntax (`*italic*`, `[link](url)`) is **not** processed. Use `<em>` and `<a href>` there.
- Don't indent HTML lines by 4+ spaces at the start of a block, or Markdown may treat them as a code block.

---

## 9. Content Type 3 — Podcast Episodes

Example: `src/articles/ep01-kelas-politik-mas-adri.md`.

### 9.1 Front matter

```yaml
---
title: "EP 01: Kelas Politik Mas Adri"
date: 2026-05-23
author: "Redaksi"
category: "Podcast"
layout: layouts/podcast.njk             # REQUIRED (overrides the folder default)
templateEngineOverride: njk,md          # REQUIRED so the shortcodes run

podcast:                                 # nested block — indent children by 2 spaces
  audioSrc: /audio/ep01-mas-adri.mp3     # path (or full https:// URL) to the MP3
  duration: "01:17:58"                   # shown until the browser reads the real duration
  episodeNumber: 1                       # printed on the generated artwork; "?" if missing
  guest: "Adrianus Harsawaskita"
  guestTitle: "Dosen Hubungan Internasional UNPAR"
  description: "One-paragraph summary shown above the transcript."
---
```

All `podcast.*` fields are optional except `audioSrc`. `audioSrc` can also be a full web address of an MP3 hosted elsewhere (relevant to [§21](#21-options-for-the-repository-size-problem-b4)).

### 9.2 What the layout renders

1. The normal article header.
2. **Player card** — a generated blue "cover art" showing `EP <number>` (no image file needed), "Episode N", "bersama <guest>, <guestTitle>", a progress bar, −15 s / play-pause / +15 s buttons, and a speed button (1× → 1.25× → 1.5× → 1.75× → 2×).
3. **Sticky mini-player** — slides up from the bottom once the main player scrolls out of view.
4. **Description** (from `podcast.description`).
5. **Transcript** — the body of the `.md` file, with a "Buka Semua / Tutup Semua" button.
6. The author box. For "Redaksi" it shows the letter **R** and links to the editorial team on the Tentang page.
7. "Bacaan Terkait" — the shared related-posts component (falls back to the newest articles, since no other article is in "Podcast").
8. `<script src="/js/podcast.js">`.

### 9.3 Writing the transcript

```nunjucks
{% chapter "Langsung Mengenai Perang Iran", "0:00", 0 %}

{% turn "Jo K", "host" %}
First paragraph of what the host said.

Second paragraph (blank line above = new paragraph).
{% endturn %}

{% turn "Adri", "guest" %}
The guest's answer…
{% endturn %}

{% endchapter %}

{% chapter "Tentang Sayap Kanan AS, Israel, dan Hungaria", "26:00", 1560 %}
…
{% endchapter %}
```

Rules:

- Arguments are separated by commas; text in double quotes.
- **3rd chapter argument = start time in seconds**: `h×3600 + m×60 + s`. Example `01:00:26` → `3626`. A mismatch makes the wrong chapter highlight during playback.
- Every `{% chapter %}` needs `{% endchapter %}`; every `{% turn %}` needs `{% endturn %}`. A missing closer fails the build with a Nunjucks error naming the file.
- Leave blank lines between shortcodes as in the example.
- Do not put literal `{{` or `{%` in transcript text (this file *is* processed by Nunjucks).

### 9.4 Player behaviour (from `podcast.js`)

- Clicking a chapter's **timestamp badge** jumps there and starts playing (clicking elsewhere on the header just opens/closes the chapter).
- While audio plays, the current chapter is highlighted and **opened automatically**.
- The progress bar supports click, drag (mouse), and touch.

---

## 10. Authors: `authors.json` and the Profile Pages

### 10.1 Structure

`src/_data/authors.json` is one JSON object. **Each key is the author's display name, exactly as written in articles' `author:` field.** A real (abridged) entry:

```json
"Jennye Awuy": {
  "slug": "jennye-awuy",
  "affiliation": "KataKarsa",
  "bio": "She simply loves to… explore new things.",
  "photo": "/images/authors/jennye-awuy.png",
  "role": "Kontributor",
  "monogramColor": "#556B2F",
  "quote": "Penulis di KataKarsa",
  "longBio": ["Paragraph one…", "Paragraph two…"],
  "links": [
    { "label": "Substack", "url": "https://katakarsa.substack.com/" },
    { "label": "Email", "url": "mailto:katakarsaid@gmail.com" }
  ]
}
```

| Field | Required? | Used where | Notes |
|---|---|---|---|
| *key* (`"Jennye Awuy"`) | yes | Matching articles; headings | Must match `author:` exactly. |
| `slug` | yes | Profile URL `/penulis/<slug>/` | Lowercase-hyphenated, unique. |
| `bio` | yes | One-line text in the author box under articles | |
| `role` | yes | Profile label; **`"Editor"` puts the person on the Tentang masthead** | e.g. `Editor`, `Kontributor`. |
| `photo` | no | Avatar | Path under `src/images/`. If empty or the file doesn't exist, the first-letter avatar is used automatically. |
| `monogramColor` | no | Background colour of the first-letter avatar | Any CSS colour (`#8B0000`). Defaults to the site's blue. |
| `affiliation` | no | "sebagai penulis …" in the article header and author box | For collaborations (Diskurasi, KataKarsa). |
| `quote` | no | Profile hero and Tentang card, in quotes | Hidden if empty. |
| `longBio` | no | Profile "Tentang" section | One string, or a list of strings (one per paragraph). |
| `links` | no | Profile "Tautan" sidebar | Each needs `label` and a **full** `url` (starting `https://`). Empty URLs are skipped. A `mailto:` URL becomes a "copy email" button. |
| `profileUrl` | no | Where the author's name links to **instead of** a profile page | If set, no `/penulis/` page is generated. Used by "Redaksi". |

JSON rules: keys and text in double quotes `"…"` (not curly quotes `“…”`); commas between items but **no comma after the last item**; one syntax error stops the entire build. Validate at jsonlint.com if unsure.

> The old `"monogram"` field (two-letter initials) was removed: avatars now always use the first letter of the name.

### 10.2 Current special entries

- **"Jouvanka E."** — added so the Tentang masthead could be generated from data. Their `bio`/`quote` are their existing masthead quote and `longBio` is a `"..."` placeholder (like "Reyner T.") — fill in when available.
- **"Redaksi"** — the editorial team, used as the podcast's author. It has `"profileUrl": "/pages/tentang/#redaksi"`, so its name links to the "Redaksi" section of the Tentang page and no profile page is generated. Its `bio` ("Tulisan dan produksi tim redaksi Jurnal Pivot.") is a starting text — edit freely.

### 10.3 How one file becomes one page per author

`src/penulis/penulis.njk` is only front matter:

```yaml
pagination:
  data: profileAuthors   # list of author names (from .eleventy.js), minus profileUrl entries
  size: 1                # one author per page
  alias: authorName      # call the current item `authorName`
layout: layouts/profile.njk
permalink: "/penulis/{{ authors[authorName].slug }}/"
eleventyComputed:
  title: "{{ authorName }}"
```

Eleventy runs this template once per name. For each run, `authorName` holds the name, the permalink uses that author's `slug`, and `layouts/profile.njk` reads `authors[authorName]` for the details. **Adding an entry to `authors.json` is all it takes to create a new profile page.**

### 10.4 What the profile page shows

A "← Kembali ke Redaksi" link (to the masthead on Tentang); the avatar, role, name and quote; the long bio; a "Tautan" card (only if at least one link has a URL); and "Tulisan": every article whose `author` matches, newest first. If none: "Belum ada tulisan yang dipublikasikan."

---

## 11. Site Settings and the Other Pages

### 11.1 `src/_data/site.json`

```json
{
  "name": "JurnalPivot",
  "tagline": "Merakit dan Menulis Ide",
  "submissionEmail": "konstruktivismeid@gmail.com",
  "contactUrl": "https://jurnalpivot.carrd.co/",
  "social": [
    { "label": "Instagram", "url": "https://www.instagram.com/jurnal.pivot/" },
    { "label": "Twitter", "url": "https://x.com/JurnalPivot" }
  ]
}
```

| Setting | Appears in |
|---|---|
| `name` | Logo, every tab title, footer |
| `tagline` | Home tab title, footer |
| `submissionEmail` | Submisi page email box |
| `contactUrl` | "Kontak Umum" button on Tentang |
| `social` | Footer links (add/remove/reorder entries freely) |

Change a value here and every page that uses it updates on the next build.

### 11.2 Home (`src/index.njk` + `layouts/home.njk`)

`index.njk` is only front matter. The layout renders a hero ("Merakit dan Menulis Ide" + subtitle, hard-coded in `layouts/home.njk`) and "Tulisan Terbaru": a card for **every** article, newest first — date, linked title, author, "Baca Artikel →".

### 11.3 Submisi (`src/pages/submisi.njk`)

Plain HTML styled by `submisi.css`: guideline blocks (topics, style, 800–1,500 words, references, editorial rights) and a submission card with the email from `site.json`, subject format, attachments, and the 7–14 day review time. Edit the HTML directly to change the guidelines.

### 11.4 Tentang (`src/pages/tentang.njk`)

The manifesto text (plain HTML), the **"Redaksi" masthead**, and a contact box.

The masthead is **generated from `authors.json`**: it shows every author whose `role` is exactly `"Editor"`, in the order they appear in the file, each with their avatar, name, role and quote, linking to their profile. The section has `id="redaksi"`, which is what `/pages/tentang/#redaksi` (Redaksi's link and the profile pages' "Kembali ke Redaksi") jumps to.

- Add an editor: give their `authors.json` entry `"role": "Editor"`.
- Remove an editor from the masthead: change their role (e.g. to `"Kontributor"`).
- Reorder: move entries within `authors.json`.

---

## 12. Styling: How the CSS Is Organised

### 12.1 Files and responsibilities

| File | Loaded on | Contains |
|---|---|---|
| `global.css` | every page | Colour variables, light/dark themes, reset, header, footer, theme icons, **author avatar**, **link preview card**, base mobile tweaks. |
| `home.css` | home | Hero, article cards. |
| `article.css` | standard articles **and** podcast | Article header, `.prose` typography, links, footnotes, lists, author box, related posts. |
| `podcast.css` | podcast | Player card, controls, sticky player, transcript, chapters, speaker turns. |
| `immersive.css` | immersive | Full-bleed and scrolly blocks; restyles the author box inside the immersive footer. |
| `profile.css` | author profiles | Hero, two-column body, links sidebar, email copy button, article list. |
| `submisi.css`, `tentang.css` | those pages | Page-specific layouts. |
| `docs.css` | documentation page | Sidebar, code blocks, tables. |

### 12.2 Design tokens (CSS variables)

Defined in `global.css`:

```css
:root {
  --bg-color: #ffffff;  --text-color: #333333;  --card-bg: #f9f9f9;
  --accent-color: #2563eb;  --border-color: #e5e5e5;
  --font-serif: 'EB Garamond', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --container-width: 800px;
  --link-underline: #b45309;  --link-underline-hover: #92400e;  --preview-bg: #1c1917;
}
[data-theme="dark"] { --bg-color: #111111; --text-color: #e0e0e0; … }
```

**To re-colour the site, change the variables, not individual rules.** Everything that uses `var(--accent-color)` updates at once. Remember to adjust both the light (`:root`) and dark (`[data-theme="dark"]`) blocks.

### 12.3 How dark mode works

1. The inline script in `base.njk`'s `<head>` sets `data-theme` on `<html>` before the page is drawn: the reader's saved choice if any, otherwise their device setting.
2. CSS rules under `[data-theme="dark"]` override the variables. The sun/moon icons are swapped by CSS too.
3. Clicking the toggle (`main.js`) flips the theme and saves the choice in the browser (`localStorage`). If the reader never clicked, the site follows their device when it switches between light and dark.

### 12.4 Responsive design

Each file has its own `@media (max-width: …)` block (600 px, 680 px or 900 px breakpoints).

---

## 13. Client-Side JavaScript

Plain JavaScript, no frameworks, no build step.

### 13.1 `main.js` (every page)

1. **Theme toggle** — flips between `light` and `dark`, saves the choice, follows the device setting until the reader makes a choice. One click always switches.
2. **Link preview card** — on devices with a mouse, hovering a link inside an article (`.prose` / `.im-prose`) shows one shared card above the link (or below it if there's no room) with the destination domain — or `JurnalPivot/<path>` for internal links — and a **"Buka di tab baru ↗"** button. Details:
   - The card is a separate element at the end of the page, not inside the link, so the link itself behaves normally (click = open in the same tab) and screen readers read only the link text.
   - It is hidden from screen readers (`aria-hidden`) because it only duplicates the link.
   - On phones and tablets there is no card; a tap just follows the link.
   - Footnote (`#…`), email and phone links are skipped.
3. **Email copy buttons** (profile pages) — clicking copies the address and shows "Tersalin!" for 2 seconds, then shows the email address again. If the browser blocks copying, the address is shown for 4 seconds so it can be copied by hand, then stays as the email. On touch screens the address is always visible.

### 13.2 `podcast.js` (podcast pages only)

Exits immediately if there's no `#podcastAudio` element. Wires up play/pause on both players, ±15 s skip, speed cycling, progress bar seeking (click, drag, touch), time display, the sticky player, chapter auto-highlight/auto-open based on `data-time`, the expand/collapse-all button, and click-to-seek on chapter timestamps.

It finds elements by `id` (`btnPlay`, `progressTrack`, `stickyPlayer`, …). **If you rename an `id` in `podcast.njk`, rename it in `podcast.js` too.** Only one podcast player per page.

---

## 14. Static Assets: Images, Audio, Video

- Put files under `src/images/…` or `src/audio/…`; reference them with a **root-relative path without `src`**: `src/images/authors/hikmah.jpeg` → `/images/authors/hikmah.jpeg`.
- Conventions: author photos in `src/images/authors/`, article media in `src/images/articles/<article-slug>/`, podcast audio in `src/audio/`.
- Paths are **case-sensitive on the web host** even though Windows isn't: `Photo.JPG` ≠ `photo.jpg`. Keep filenames lowercase.
- Nothing is resized or compressed automatically. A 4.8 MB PNG uploaded is a 4.8 MB PNG every reader downloads. Compress before adding (e.g. squoosh.app for images).
- Author photos currently missing (the avatar falls back to a letter until they're added): `jonathan.jpg`, `reyner.jpg`, `ria.jpg`, `patrick-r.jpg` in `src/images/authors/`.
- Large files: see [§21](#21-options-for-the-repository-size-problem-b4).

---

## 15. Drafts: Preview vs. Build

- Add `draft: true` to an article's front matter to keep it in the repo without publishing it.
- `npm start` (live preview): drafts appear exactly like published articles, so you can proofread.
- Any build (`npm run build`, or the host's build): drafts are removed entirely — no page, not on the home page, not in related posts, not on profiles.
- To publish: delete the `draft: true` line and set `date:` to the publish date.

> ⚠️ **Media files are not drafts.** The draft's media under `src/images/articles/surat-tsuburaya/` (~70 MB) is still copied into the build and reachable by direct URL. Until the size problem is solved ([§21](#21-options-for-the-repository-size-problem-b4)), keep unpublished media out of `src/` (e.g. in the ignored `backups/` folder) if it must not be public.

---

## 16. URL Map of the Live Site

| URL | Generated from |
|---|---|
| `/` | `src/index.njk` |
| `/articles/<filename>/` | `src/articles/<filename>.md` |
| `/penulis/<slug>/` | `src/penulis/penulis.njk` × each author without `profileUrl` |
| `/pages/submisi/` | `src/pages/submisi.njk` |
| `/pages/tentang/` (masthead at `#redaksi`) | `src/pages/tentang.njk` |
| `/pages/dokumentasi/` | `src/pages/dokumentasi.njk` + `DOCUMENTATION.md` |
| `/css/…`, `/js/…`, `/images/…`, `/audio/…` | Passthrough copies |

Author profile URLs: `/penulis/jonathan-k/`, `/penulis/reyner-t/`, `/penulis/jouvanka-e/`, `/penulis/ria-dara/`, `/penulis/patrick-r/`, `/penulis/hikmah/`, `/penulis/jennye-awuy/`, `/penulis/jason-fernando/`.

There is no 404 page, RSS feed, or sitemap yet (see [§22](#22-parked-growth-ideas-for-later)).

---

## 17. The Web Version of This Documentation

This file is published as a web page at **`/pages/dokumentasi/`** for editors who prefer reading in a browser.

**How it stays in sync:** during every build, `.eleventy.js` (section 10) reads `DOCUMENTATION.md`, converts it to HTML, and `src/pages/dokumentasi.njk` places it in the site's design with a chapter sidebar. Nothing is copied by hand, so the page can never drift from the file: **edit only `DOCUMENTATION.md`**, then commit and push; the page updates with the next deploy. During `npm start`, saving this file reloads the page in the browser immediately.

**Visibility:** the page is *unlisted* — not linked from the menu — and carries a `noindex` tag asking search engines not to list it. It is still publicly reachable by anyone who has the address. To stop publishing it, delete `src/pages/dokumentasi.njk` (the documentation file itself stays in the repo).

**Writing tips for this file** (so the web page renders well): use `##` for chapters (they become sidebar entries), `###` for sub-sections, tables for reference lists, and fenced code blocks (```` ``` ````) for code. Raw HTML is shown as text on the web page, not rendered. Links in the table of contents use GitHub-style ids (lowercase, punctuation removed, spaces → hyphens), which the web page generates the same way.

---

## 18. Recipes: Step-by-Step Maintenance Tasks

### 18.1 Publish a new standard article

1. **Make sure the author exists** in `src/_data/authors.json` (if not, do [§18.2](#182-add-a-new-author) first — the build will refuse unknown authors).
2. Create `src/articles/<slug>.md`. The slug becomes the URL forever: lowercase, hyphens, no spaces (e.g. `krisis-air-jakarta.md`).
3. Paste at the top:

   ```yaml
   ---
   title: "Judul Artikel"
   date: 2026-10-10
   author: "Nama Persis Seperti di authors.json"
   category: "Politik"
   ---
   ```

4. Write the body below the closing `---` (lead paragraph first, blank lines between paragraphs).
5. Run `npm start`, open `http://localhost:8080`, and check: it's at the top of the home page; the header shows the right author and date; the author box appears; links and footnotes work.
6. Commit and push:

   ```bash
   git add src/articles/<slug>.md
   git commit -m "Add <title> article"
   git push
   ```

### 18.2 Add a new author

1. (Optional) Add their photo to `src/images/authors/<slug>.jpg` — square-ish, ideally under 300 KB. Without a photo they get a first-letter avatar.
2. Add an entry to `authors.json` (watch the commas between entries):

   ```json
   "Nama Penulis": {
     "slug": "nama-penulis",
     "bio": "Satu kalimat singkat.",
     "photo": "/images/authors/nama-penulis.jpg",
     "role": "Kontributor",
     "monogramColor": "#556B2F",
     "quote": "Kutipan singkat.",
     "longBio": ["Paragraf pertama.", "Paragraf kedua."],
     "links": [
       { "label": "Instagram", "url": "https://www.instagram.com/username/" }
     ]
   }
   ```

3. Run `npm start` and visit `/penulis/nama-penulis/`.
4. If they're an **editor**, use `"role": "Editor"` — they appear on the Tentang masthead automatically.

### 18.3 Add a missing author photo

1. Save the image as exactly the path in their `"photo"` field (e.g. `src/images/authors/jonathan.jpg` for `"/images/authors/jonathan.jpg"`), or change the field to match your file name.
2. Rebuild. The letter avatar is replaced by the photo everywhere.

### 18.4 Publish a podcast episode

1. Compress the audio (mono 64 kbps MP3 is plenty for speech). Read [§21](#21-options-for-the-repository-size-problem-b4) before adding another large MP3 to the repo.
2. Put it in `src/audio/epNN-<name>.mp3` (or upload it elsewhere and use its full URL).
3. Copy `ep01-kelas-politik-mas-adri.md` to `src/articles/epNN-<slug>.md`; update all front matter including `episodeNumber`, `audioSrc`, `duration`.
4. Replace the transcript with your chapters/turns. Compute each chapter's seconds.
5. Preview: click each chapter timestamp and check it lands in the right place.

### 18.5 Create an immersive article

1. Create `src/images/articles/<slug>/` and put media there (prefer compressed MP4 over GIF).
2. Create `src/articles/<slug>.md` with `layout: layouts/immersive.njk` and `draft: true` while working.
3. Build the body from the blocks in [§8.2](#82-the-building-blocks-classes-from-immersivecss), using `surat-kepada-tsuburaya.md` as a model.
4. When finished, remove `draft: true` and set the publish date.

### 18.6 Add a new static page (e.g. "Kebijakan Privasi")

1. Create `src/pages/privasi.njk`:

   ```nunjucks
   ---
   layout: base.njk
   title: Kebijakan Privasi
   cssFile: submisi.css
   ---
   <div class="submission-container">
     <header class="page-header"><h1>Kebijakan Privasi</h1></header>
     <section class="prose guideline-content"> <p>…</p> </section>
   </div>
   ```

   (Reusing `submisi.css` gives the same look; or create `src/css/privasi.css` and set `cssFile: privasi.css`.)
2. It will be at `/pages/privasi/`. To add it to the menu, add `<a href="/pages/privasi">Privasi</a>` inside `<nav class="nav-menu">` in `base.njk`.

### 18.7 Edit or correct a published article

Edit the `.md` file, preview, commit (`git commit -m "Fix typo in <slug>"`), push. Don't rename the file (breaks the URL). Don't change `date:` unless you intend to move it in the list.

### 18.8 Unpublish an article

- Temporarily: add `draft: true`.
- Permanently: delete the file. Links to it will 404.

### 18.9 Rename an author

The name is a *key* used in two places — change both together:

1. The key in `authors.json`.
2. The `author:` field of **every** article by them (search: `grep -rn 'author: "Old Name"' src/articles`). The build will name any file you missed.

Changing the `slug` changes their profile URL.

### 18.10 Change the site name, contact email, or social links

Edit `src/_data/site.json`.

### 18.11 Change colours or fonts

- Colours: edit the variables in `src/css/global.css` (both the `:root` and `[data-theme="dark"]` blocks).
- Fonts: change the Google Fonts `<link>` in `base.njk` *and* `--font-serif` / `--font-sans` in `global.css`.

---

## 19. Troubleshooting and Gotchas

| Symptom | Likely cause | Fix |
|---|---|---|
| Build stops: `Unknown author "…" in ./src/articles/…` | `author:` doesn't exactly match an `authors.json` key | Fix the spelling (dots, capitals) or add the author. |
| Build fails with a YAML error | Unquoted `:` in a title, tab indentation, or missing `---` | Quote the value; use spaces. |
| Build fails mentioning `authors.json` or `site.json` | Trailing comma, missing comma, or curly quotes `“ ”` | Fix the syntax; validate at jsonlint.com. |
| Build fails in the podcast file | Missing `{% endturn %}` / `{% endchapter %}`, or missing comma between shortcode arguments | Check pairs and commas. |
| Article missing from home page | `draft: true` (in a build), file outside `src/articles/`, or a wrong `layout:` path | Fix front matter / location. |
| Letter avatar instead of a photo | Photo file missing or path/case mismatch | Check the file exists at exactly the path in `"photo"` (path starts `/images/…`, no `src`). |
| Someone missing from the Tentang masthead | Their `role` isn't exactly `"Editor"` | Fix the role (case-sensitive). |
| Paragraph has odd line breaks | Text was hard-wrapped (`breaks: true`) | Join lines; separate paragraphs with blank lines only. |
| New folder of assets 404s | Not in `addPassthroughCopy` | Add a line in `.eleventy.js`. |
| Old/deleted pages still in local `_site/` | Eleventy never deletes old output by itself | `npm run build` (cleans first) or `npm run clean`. |
| Changes to `.eleventy.js` not picked up by `npm start` | Config changes need a restart | Ctrl + C, then `npm start` again. |
| Wrong chapter highlights during playback | Chapter seconds don't match the label | Recompute seconds. |
| `npm install` reports vulnerabilities | Known issues in Eleventy's own tooling (see C3 in [§20](#20-audit-status-what-was-fixed-what-is-still-open)) | Not a risk to readers of the static site; don't run `npm audit fix --force` without testing. |

---

## 20. Audit Status: What Was Fixed, What Is Still Open

The first audit (19 Aug 2026 snapshot) listed problems A1–A13 (visible to readers) and B1–B11 (repository and build). Status as of 10 Oct 2026. Every "Fixed" item was verified by building the site and, for the interactive ones, by testing in a real (headless) browser.

### 20.1 Problems readers could see

| # | Problem | Status | What changed |
|---|---|---|---|
| A1 | Four author photos referenced but missing → broken images | **Fixed** | New `avatar.njk` component: if the photo file doesn't exist, a coloured circle with the first letter of the name is shown. Used in the author box, profiles and masthead. Adding the photo file later switches it to the photo automatically. |
| A2 | Tentang masthead hard-coded; "Jouvanka E." linked to a missing profile | **Fixed** | Masthead generated from `authors.json` (every `"role": "Editor"`). "Jouvanka E." added to `authors.json`, so `/penulis/jouvanka-e/` now exists. |
| A3 | Jonathan's Instagram link was relative | **Fixed** | Now `https://www.instagram.com/joenathankay/`; the empty Twitter slot was removed. |
| A4 | Podcast author "Redaksi" had no entry → no author box | **Fixed** | "Redaksi" added with `profileUrl: /pages/tentang/#redaksi`; its author box links to the masthead section. No profile page is generated for it. |
| A5 | Dark-mode toggle did nothing on the first click | **Fixed** | Toggle logic rewritten; one click always switches. |
| A6 | White flash on load for dark-mode readers; device setting ignored | **Fixed** | Theme now set by an inline script in `<head>` before drawing; follows the device setting until the reader chooses. Icons swapped by CSS. |
| A7 | Related posts showed oldest matches; empty section when alone in category | **Fixed** | New `relatedPosts` filter: newest same-category first, topped up with newest overall; section hidden if empty. Podcast uses the same component. |
| A8 | Footer said © 2025 | **Fixed** | `{% year %}` shortcode fills in the current year at every build. |
| A9 | Tab titles lacked the site name; home tab said "Home" | **Fixed** | Titles are now `<page> — JurnalPivot`; home is `JurnalPivot — Merakit dan Menulis Ide`. |
| A10 | `amok-sejarah-pemretelan.md` uses hand-typed `<sup>` footnotes | **Open (deferred on request)** | Convert to `[^n]` footnotes when convenient. |
| A11 | Link preview card was inside the link (screen readers, click and touch problems) | **Fixed** | One shared card outside the link, positioned by JS, hidden from screen readers, mouse-only, flips below the link when there's no room. |
| A12 | Email-copy fallback replaced the email with "klik untuk salin" | **Fixed** | Always returns to showing the email address; on failure the address stays visible to copy by hand; always visible on touch screens. |
| A13 | "sebagai penulis" vs "sebagai Penulis" | **Fixed** | Both now lowercase "sebagai penulis". |

### 20.2 Repository and build hygiene

| # | Problem | Status | What changed |
|---|---|---|---|
| B1 | No npm scripts; `"main"` pointed to a missing file | **Fixed** | `npm start`, `npm run build`, `npm run clean`; `"main"` removed; `"private": true` added. |
| B2 | `markdown-it` used but not declared | **Fixed** | Added to `dependencies`. |
| B3 | Drafts depended on an undocumented host environment variable | **Fixed** | Drafts are hidden in every build and shown only in the live preview — safe without any host setting. Host details still worth recording ([§2.3](#23-where-does-the-live-site-come-from)). |
| B4 | ~150 MB of media committed to Git | **Open — options in [§21](#21-options-for-the-repository-size-problem-b4)** | Nothing changed, as requested. |
| B5 | Draft media still published | **Open** | Tied to B4; workaround in [§15](#15-drafts-preview-vs-build). |
| B6 | Stale pages in local `_site/` | **Fixed** | `npm run build` now deletes `_site/` first. |
| B7 | Dead code (`special.njk`, invalid `gif` CSS selector, duplicated preview CSS) | **Fixed** (mostly) | `special.njk` deleted; selector fixed; preview CSS consolidated into `global.css`; unused `.profile-monogram` CSS removed. The unused `lede:` field in the Tsuburaya draft was left untouched (content, not code). |
| B8 | Repetition (`tags`/`layout` in every article, duplicated related posts, hard-coded site values) | **Fixed** | `articles.11tydata.json` supplies defaults (removed from all articles); one related-posts component; `site.json` for name/tagline/email/social. |
| B9 | Markdown processed by Liquid first | **Fixed** | `markdownTemplateEngine: false`; the podcast keeps opting in to Nunjucks. |
| B10 | Shortcode arguments not escaped | **Fixed** | `escapeHtml` applied to chapter titles, timestamps and speaker names. |
| B11 | Section headings written as bold paragraphs | **Open** | Content change; worth adopting `##` headings in new articles. |
| — | Author typos silently hid bios | **Fixed (new)** | Build now stops with an "Unknown author" message. |

### 20.3 Other notes

| # | Item | Status |
|---|---|---|
| C1 | Placeholder text in `authors.json` ("Reyner T." and "Jouvanka E." `longBio` is `"..."`; "Redaksi" bio is a starter sentence) | **Open** — fill in real text. |
| C2 | Four missing photos (`jonathan.jpg`, `reyner.jpg`, `ria.jpg`, `patrick-r.jpg`) | **Open** — letter avatars show meanwhile; add files when available. |
| C3 | `npm audit` warnings in Eleventy's build tooling | **Partly fixed** — `npm audit fix` (non-breaking) brought 15 down to 9 and updated Eleventy 3.1.2 → 3.1.6. The rest need breaking upgrades; they affect only the computer that builds the site and the local preview server, not the published static pages. Re-check when Eleventy releases updates. |
| C4 | Hosting details not recorded in the repo | **Open** — see [§2.3](#23-where-does-the-live-site-come-from). |

---

## 21. Options for the Repository Size Problem (B4)

Nothing below has been done yet. This chapter explains the problem and the options so a decision can be made.

### 21.1 The problem in numbers

| File | Size |
|---|---|
| `src/audio/ep01-mas-adri.mp3` | 53.6 MB |
| `src/images/articles/surat-tsuburaya/ultraman.gif` | 20.6 MB |
| `src/images/articles/surat-tsuburaya/film-2.mp4` | 17.6 MB |
| `src/images/articles/surat-tsuburaya/film-3.mp4` | 14.8 MB |
| `src/images/articles/surat-tsuburaya/film-1.mp4` | 13.4 MB |
| A deleted `src/images/Screenshot…` file (still in history) | 8.5 MB |
| `src/images/authors/jennye-awuy.png` | 4.6 MB |

The Git history is about **130 MB**, and it only grows: **deleting a file later does not shrink the history**, because Git keeps every old version.

Why it matters:

1. **Hard limits.** GitHub warns above 50 MB per file and **rejects files over 100 MB**; a 2-hour episode at the current bitrate would be rejected. Some hosts limit file size per deploy (Cloudflare Pages, for example, caps files at 25 MiB — the MP3 would not deploy there).
2. **Speed.** Every clone, every host build, and every new editor downloads the whole history.
3. **Readers.** Visitors download these files at full size: the Tsuburaya page alone would load ~70 MB of video and GIF — painful on mobile data.

### 21.2 Step zero (do this whatever option you choose): make files smaller

These reduce sizes dramatically without changing the site's structure. All use the free tool [ffmpeg](https://ffmpeg.org) or web tools.

| File type | Action | Typical result |
|---|---|---|
| Speech MP3 | `ffmpeg -i in.mp3 -ac 1 -b:a 64k out.mp3` (mono, 64 kbps) | 78 min ≈ 37 MB (from 53.6) |
| GIF | Convert to MP4: `ffmpeg -i ultraman.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ultraman.mp4`, then use `<video autoplay muted loop playsinline>` instead of `<img>` | Usually 90%+ smaller (20 MB → ~1–2 MB) |
| Background MP4 clips | `ffmpeg -i in.mp4 -vf scale=-2:720 -c:v libx264 -crf 28 -an -movflags faststart out.mp4` (720p, no sound) | 14–18 MB → ~1–4 MB each |
| Photos | Resize to ~400×400 and save as JPEG/WebP (squoosh.app) | 4.6 MB → ~50–150 KB |

Also add `preload="none"` or a `poster="…jpg"` image to videos further down a page so they don't all download when the page opens.

Compression alone may be enough for articles. Podcasts will keep growing (one ~35–50 MB file per episode), so they need one of the options below.

### 21.3 Option A — Host podcast audio on a podcast platform *(recommended for audio)*

Upload episodes to a podcast host (e.g. Spotify for Creators — free, Buzzsprout, Podbean) and paste the episode's direct MP3 URL into `podcast.audioSrc`. The site's player works with any URL; the transcript page stays on JurnalPivot.

- **Pros:** zero audio in Git; episodes also appear on Spotify / Apple Podcasts (more listeners); the platform handles streaming and statistics.
- **Cons:** depends on a third party; some free plans don't expose a direct MP3 link (check before choosing).
- **Effort:** low. No code change.

### 21.4 Option B — Object storage for all large media

Put audio/video in a storage bucket with a public URL — e.g. **Cloudflare R2** (generous free tier, no download fees), Backblaze B2, or the free **Internet Archive** (archive.org, good for public cultural material). Reference files by full URL (`https://media.example.com/ep02.mp3`) in front matter and HTML.

- **Pros:** works for audio *and* video; no size limits worth worrying about; repo stays small; can use your own sub-domain.
- **Cons:** another account to manage; uploading is a separate manual step; possible costs at high traffic (R2: none for downloads).
- **Effort:** low–medium. No code change; editors need upload instructions.

### 21.5 Option C — Git LFS (Large File Storage)

Git LFS keeps big files outside normal Git history while they still *appear* in the repository folder. After `git lfs install` and `git lfs track "*.mp3" "*.mp4" "*.gif"`, new large files are stored separately.

- **Pros:** workflow barely changes; files stay "in the repo".
- **Cons:** GitHub's free LFS quota is small (bandwidth is counted every time the host builds); the host must support LFS (most do, but it must be enabled); every editor must install Git LFS. Doesn't help readers' download size.
- **Effort:** medium.

### 21.6 Option D — Embed from video/audio platforms

For video, upload to YouTube/Vimeo and embed; for audio, embed the platform's player.

- **Pros:** free, fast streaming, nothing stored.
- **Cons:** third-party branding, tracking and ads; autoplaying muted background loops (used in the immersive scrolly sections) are awkward with embeds. Fine for normal videos, poor for the immersive design.
- **Effort:** low.

### 21.7 Optional — Cleaning the existing history

Options A–D stop the problem growing, but the ~130 MB already in history stays unless the history is rewritten (with the tool `git filter-repo`). Rewriting changes every commit ID: everyone must re-clone afterwards and any open branches break. It is safe only when coordinated — do it once, with everyone's agreement, after a full backup. It is **optional**: the history size is an inconvenience, not a blocker, as long as no single new file goes over 100 MB.

### 21.8 Recommendation

1. **Now:** compress existing media (§21.2), especially the GIF → MP4 and the clips — this also makes the Tsuburaya article far lighter for readers.
2. **From the next episode:** Option A for podcast audio (or Option B if you prefer one place for all media).
3. **For future immersive articles:** compress video into the repo while each clip stays under ~5 MB; switch to Option B if articles regularly need more.
4. **Later, optionally:** clean history (§21.7) once, in a coordinated session.

---

## 22. Parked: Growth Ideas for Later

Not started — fixing came first. Kept here as a list for a future round:

- Social share previews (meta description, Open Graph image) so links on WhatsApp/Instagram/X show a title, summary and picture.
- RSS feed, sitemap, custom 404 page.
- Excerpts and category on home cards; category pages; home page pagination; search (Pagefind).
- Real `##` headings with a table of contents; reading time; footnote pop-ups; "updated on" dates; series navigation; print stylesheet.
- Editorial workflow: pull-request previews, automatic broken-link checks, a web-based editor (Decap CMS / Pages CMS) for non-technical editors, scheduled publishing.
- Audience: newsletter sign-up, privacy-friendly analytics, share buttons, podcast distribution.
