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
  
    return {
      dir: {
        input: "src",
        output: "_site"
      }
    };
  };