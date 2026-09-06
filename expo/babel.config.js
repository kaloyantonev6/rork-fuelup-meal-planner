module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    // Rewrites RN 0.86 moved private-inspector paths (see scripts/rn86-inspector-babel-plugin.js)
    plugins: [require.resolve("./scripts/rn86-inspector-babel-plugin.js")],
  };
};
