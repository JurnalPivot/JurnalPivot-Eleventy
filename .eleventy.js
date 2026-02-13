const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");

module.exports = function(eleventyConfig) {
  // 1. Adding a filter block
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    // If the date is missing, return empty string
    if (!dateObj) return ""; 
    
    // Convert to Indonesian format
    return DateTime.fromJSDate(dateObj, { zone: 'utc' })
      .setLocale('id') 
      .toFormat("d MMMM yyyy");
  });

  // 2. Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

  // 3. Configure Markdown with footnotes
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItFootnote);

  eleventyConfig.setLibrary("md", md);
  
    return {
      dir: {
        input: "src",
        output: "_site"
      }
    };
  };