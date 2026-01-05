module.exports = function(eleventyConfig) {
    // Copy these folders/files directly to the output without modifying them
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