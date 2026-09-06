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

// Keep the app config identical to app.json (app.config.js takes precedence
// over app.json when both exist, so re-export it verbatim).
module.exports = JSON.parse(fs.readFileSync(path.join(__dirname, "app.json"), "utf8"));
