/**
 * Babel plugin: React Native 0.86 (SDK 57) moved its private dev-inspector
 * modules from `src/private/inspector/` to
 * `src/private/devsupport/devmenu/elementinspector/`. The Rork dev overlay
 * (@rork-ai/toolkit-sdk) still imports the old paths, which no longer resolve.
 * This plugin rewrites those specifiers at transform time so Metro resolves
 * the moved modules. The new modules keep a default export, so existing
 * `.default` access keeps working.
 */
const RN_INSPECTOR_REDIRECTS = {
  "react-native/src/private/inspector/getInspectorDataForViewAtPoint":
    "react-native/src/private/devsupport/devmenu/elementinspector/getInspectorDataForViewAtPoint",
  "react-native/src/private/inspector/InspectorOverlay":
    "react-native/src/private/devsupport/devmenu/elementinspector/InspectorOverlay",
};

module.exports = function rn86InspectorRewrite({ types: t }) {
  return {
    name: "rn86-inspector-rewrite",
    visitor: {
      ImportDeclaration(path) {
        const next = RN_INSPECTOR_REDIRECTS[path.node.source.value];
        if (next) {
          path.node.source = t.stringLiteral(next);
        }
      },
      CallExpression(path) {
        const callee = path.node.callee;
        if (!callee || callee.type !== "Identifier" || callee.name !== "require") {
          return;
        }
        const arg = path.node.arguments[0];
        if (arg && t.isStringLiteral(arg)) {
          const next = RN_INSPECTOR_REDIRECTS[arg.value];
          if (next) {
            path.node.arguments[0] = t.stringLiteral(next);
          }
        }
      },
    },
  };
};
