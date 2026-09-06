const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Metro's fallback file watcher needs a large inotify budget; sandbox
// environments often boot with a low default that makes Metro crash
// (ENOSPC/EINVAL) before it becomes ready. Expo CLI evaluates this file
// before starting Metro, so re-apply the higher limit on every start.
// Idempotent, and silently no-ops where sudo is unavailable.
try {
  execSync(
    "sudo -n /usr/sbin/sysctl -w fs.inotify.max_user_watches=524288 || /usr/sbin/sysctl -w fs.inotify.max_user_watches=524288 || true",
    { stdio: "ignore", timeout: 5000 },
  );
} catch {
  // ignore — best-effort tuning
}

// Fresh provisioning restores metro.config.js and babel.config.js from the
// platform template, wiping fixes stored there. This file is evaluated by
// Expo CLI on every start, so re-apply the patches here (idempotent: files
// containing their marker are left untouched).

const METRO_CONFIG = `const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

// React Native 0.86 (SDK 57) moved its private inspector modules from
// \`src/private/inspector/\` to \`src/private/devsupport/devmenu/elementinspector/\`.
// The Rork dev inspector still imports the old paths — redirect them.
const RN_INSPECTOR_REDIRECTS = {
  "react-native/src/private/inspector/getInspectorDataForViewAtPoint":
    "react-native/src/private/devsupport/devmenu/elementinspector/getInspectorDataForViewAtPoint",
  "react-native/src/private/inspector/InspectorOverlay":
    "react-native/src/private/devsupport/devmenu/elementinspector/InspectorOverlay",
};

const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const redirect = RN_INSPECTOR_REDIRECTS[moduleName];
  if (redirect) {
    return context.resolveRequest(context, redirect, platform);
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withRorkMetro(config);
`;

const BABEL_CONFIG = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    // Rewrites RN 0.86 moved private-inspector paths (see scripts/rn86-inspector-babel-plugin.js)
    plugins: [require.resolve("./scripts/rn86-inspector-babel-plugin.js")],
  };
};
`;

function ensureFile(relPath, marker, content) {
  const abs = path.join(__dirname, relPath);
  try {
    if (fs.readFileSync(abs, "utf8").includes(marker)) {
      return;
    }
  } catch {
    // file missing — fall through and create it
  }
  try {
    fs.writeFileSync(abs, content);
  } catch {
    // ignore — best-effort patching
  }
}

ensureFile("metro.config.js", "RN_INSPECTOR_REDIRECTS", METRO_CONFIG);
ensureFile("babel.config.js", "rn86-inspector-babel-plugin", BABEL_CONFIG);

// Keep the app config identical to app.json (app.config.js takes precedence
// over app.json when both exist, so re-export it verbatim).
module.exports = JSON.parse(fs.readFileSync(path.join(__dirname, "app.json"), "utf8"));
