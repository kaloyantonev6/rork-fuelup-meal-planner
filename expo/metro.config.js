const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

// React Native 0.86 (SDK 57) moved its private inspector modules from
// `src/private/inspector/` to `src/private/devsupport/devmenu/elementinspector/`.
// The Rork dev inspector (@rork-ai/toolkit-sdk) still imports the old paths,
// so redirect them here to keep the dev overlay working.
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
