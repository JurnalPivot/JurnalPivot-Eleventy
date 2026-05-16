const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");

const isProduction = process.env.ELEVENTY_ENV === 'production';

module.exports = function(eleventyConfig) {

  // Exclude draft articles from production builds.
  // Mark an article with `draft: true` in its frontmatter.
  // Locally (dev): all drafts are visible as normal.
  // Production:    drafts are excluded from the build entirely.
  eleventyConfig.addPreprocessor('drafts', '*', (data) => {
    if (isProduction && data.draft === true) {
      return false;
    }
  });

  // 1. Date filter (Indonesian locale)
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(dateObj, { zone: 'utc' })
      .setLocale('id')
      .toFormat("d MMMM yyyy");
  });

  // 2. Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/audio");

  // 3. Markdown with footnotes
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItFootnote);

  eleventyConfig.setLibrary("md", md);

  // 4. Podcast: {% chapter %} shortcode
  //    Renders a collapsible <details> section. Starts CLOSED by default.
  //    Args: title (string), timestamp (string "MM:SS"), timeInSeconds (number)
  //
  //    {% chapter "Pengantar", "0:00", 0 %}
  //      {% turn "Host", "host" %}...{% endturn %}
  //    {% endchapter %}
  //
  eleventyConfig.addPairedShortcode("chapter", function(content, title, timestamp, timeInSeconds) {
    var secs = (typeof timeInSeconds !== "undefined") ? String(timeInSeconds) : "0";
    return [
      '<details class="chapter" data-time="' + secs + '">',
      '  <summary class="chapter-summary">',
      '    <span class="chapter-info">',
      '      <span class="chapter-title">' + title + '</span>',
      '      <span class="chapter-timestamp">' + timestamp + '</span>',
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

  // 5. Podcast: {% turn %} shortcode
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
    var safeRole = (role || 'guest').toLowerCase();
    return [
      '<div class="speaker-turn speaker-' + safeRole + '">',
      '  <span class="speaker-label">' + speakerName + '</span>',
      '  <div class="speaker-body">',
      renderedContent,
      '  </div>',
      '</div>'
    ].join('\n');
  });

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
