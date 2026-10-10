const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");

// Escapes text before it is placed inside generated HTML (used by the shortcodes).
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// GitHub-style heading ids, so the Table of Contents links in
// DOCUMENTATION.md also work on the web version (/pages/dokumentasi/).
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}

module.exports = function(eleventyConfig) {

  // 1. Drafts
  //    Mark an article with `draft: true` in its frontmatter.
  //    `npm start` (live preview):  drafts are visible, so you can proofread them.
  //    `npm run build` (any build): drafts are excluded entirely.
  //    This is safe by default: no environment variable is needed on the host.
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    const isPreview = ["serve", "watch"].includes(process.env.ELEVENTY_RUN_MODE);
    const forceProduction = process.env.ELEVENTY_ENV === "production";
    if (data.draft === true && (!isPreview || forceProduction)) {
      return false;
    }
  });

  // 2. Author check
  //    Stops the build with a clear message when an article's `author`
  //    is not a key in src/_data/authors.json (a typo would otherwise
  //    silently remove the author box and the profile listing).
  eleventyConfig.addPreprocessor("author-check", "md", (data) => {
    const tags = [].concat(data.tags || []);
    if (tags.includes("articles") && !(data.authors && data.authors[data.author])) {
      throw new Error(
        `Unknown author "${data.author}" in ${data.page.inputPath}. ` +
        `Add it to src/_data/authors.json or fix the spelling.`
      );
    }
  });

  // 3. Date filter (Indonesian locale)
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(dateObj, { zone: "utc" })
      .setLocale("id")
      .toFormat("d MMMM yyyy");
  });

  // 4. Author helpers
  //    existingFile: returns the path only if the file really exists in src/,
  //                  otherwise "" (so templates can fall back to an initial).
  //    initial:      first letter of a name, capitalised ("Jonathan K." -> "J").
  //    authorUrl:    where an author's name should link to.
  eleventyConfig.addFilter("existingFile", (filePath) => {
    if (!filePath) return "";
    return fs.existsSync(path.join("src", filePath)) ? filePath : "";
  });

  eleventyConfig.addFilter("initial", (name) => {
    const match = String(name || "").match(/\p{L}/u);
    return match ? match[0].toUpperCase() : "?";
  });

  eleventyConfig.addFilter("authorUrl", (author) => {
    if (!author) return "";
    return author.profileUrl || `/penulis/${author.slug}/`;
  });

  // 5. Related posts
  //    Newest articles in the same category first, topped up with the newest
  //    articles from any category, never including the current page.
  eleventyConfig.addFilter("relatedPosts", (posts, category, url, limit = 3) => {
    const others = [...(posts || [])].reverse().filter((post) => post.url !== url);
    const sameCategory = others.filter((post) => post.data.category === category);
    const otherCategories = others.filter((post) => post.data.category !== category);
    return [...sameCategory, ...otherCategories].slice(0, limit);
  });

  // 6. Current year, filled in at every build: {% year %}
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  // 7. Authors that get their own /penulis/<slug>/ page.
  //    Entries with a `profileUrl` (e.g. "Redaksi") link somewhere else instead.
  eleventyConfig.addGlobalData("profileAuthors", () => {
    const authors = JSON.parse(fs.readFileSync("src/_data/authors.json", "utf8"));
    return Object.keys(authors).filter((name) => !authors[name].profileUrl);
  });

  // 8. Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/audio");

  // 9. Markdown with footnotes
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItFootnote);

  eleventyConfig.setLibrary("md", md);

  // 10. Web version of DOCUMENTATION.md -> /pages/dokumentasi/
  //     Rendered fresh on every build, so the page always matches the file.
  const docsMd = markdownIt({ html: false, linkify: true });
  docsMd.core.ruler.push("heading_ids", (state) => {
    state.tokens.forEach((token, i) => {
      if (token.type !== "heading_open") return;
      const text = state.tokens[i + 1].children
        .filter((child) => child.type === "text" || child.type === "code_inline")
        .map((child) => child.content)
        .join("");
      token.attrSet("id", slugifyHeading(text));
    });
  });

  eleventyConfig.addWatchTarget("./DOCUMENTATION.md");
  eleventyConfig.addGlobalData("documentation", () => {
    const source = fs.readFileSync("DOCUMENTATION.md", "utf8");
    const tokens = docsMd.parse(source, {});
    const sections = [];
    tokens.forEach((token, i) => {
      if (token.type === "heading_open" && token.tag === "h2" && tokens[i + 1].content !== "Table of Contents") {
        sections.push({ id: token.attrGet("id"), title: tokens[i + 1].content.replace(/`/g, "") });
      }
    });
    return { html: docsMd.renderer.render(tokens, docsMd.options, {}), sections };
  });

  // 11. Podcast: {% chapter %} shortcode
  //    Renders a collapsible <details> section. Starts CLOSED by default.
  //    Args: title (string), timestamp (string "MM:SS"), timeInSeconds (number)
  //
  //    {% chapter "Pengantar", "0:00", 0 %}
  //      {% turn "Host", "host" %}...{% endturn %}
  //    {% endchapter %}
  //
  eleventyConfig.addPairedShortcode("chapter", function(content, title, timestamp, timeInSeconds) {
    var secs = (typeof timeInSeconds !== "undefined") ? String(Number(timeInSeconds) || 0) : "0";
    return [
      '<details class="chapter" data-time="' + secs + '">',
      '  <summary class="chapter-summary">',
      '    <span class="chapter-info">',
      '      <span class="chapter-title">' + escapeHtml(title) + '</span>',
      '      <span class="chapter-timestamp">' + escapeHtml(timestamp) + '</span>',
      '    </span>',
      '    <span class="chapter-chevron">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"',
      '           stroke-linecap="round" stroke-linejoin="round">',
      '        <polyline points="6 9 12 15 18 9"></polyline>',
      '      </svg>',
      '    </span>',
      '  </summary>',
      '  <div class="chapter-content">',
      content,
      '  </div>',
      '</details>'
    ].join('\n');
  });

  // 12. Podcast: {% turn %} shortcode
  //    Wraps one speaker's full turn (any number of paragraphs) in a labelled block.
  //    Args: speakerName (string), role ("host" | "guest")
  //
  //    {% turn "Host", "host" %}
  //    First paragraph.
  //
  //    Second paragraph (blank line above = new <p>).
  //    {% endturn %}
  //
  eleventyConfig.addPairedShortcode("turn", function(content, speakerName, role) {
    var renderedContent = md.render(content.trim());
    var safeRole = (role || 'guest').toLowerCase().replace(/[^a-z-]/g, '');
    return [
      '<div class="speaker-turn speaker-' + safeRole + '">',
      '  <span class="speaker-label">' + escapeHtml(speakerName) + '</span>',
      '  <div class="speaker-body">',
      renderedContent,
      '  </div>',
      '</div>'
    ].join('\n');
  });

  return {
    // Markdown articles are plain Markdown (no template tags inside prose).
    // The podcast opts back in with `templateEngineOverride: njk,md`.
    markdownTemplateEngine: false,
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
