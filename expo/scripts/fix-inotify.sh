#!/bin/sh
# Metro's fallback file watcher needs a large inotify budget. Sandboxes often
# boot with a low fs.inotify.max_user_watches default, which makes Metro crash
# with ENOSPC/EINVAL before it becomes ready. Re-apply the higher limit on
# every dependency install (see "postinstall" in package.json).
# Safe to run repeatedly and in environments without sudo (no-op).
sudo -n /usr/sbin/sysctl -w fs.inotify.max_user_watches=524288 >/dev/null 2>&1 \
  || /usr/sbin/sysctl -w fs.inotify.max_user_watches=524288 >/dev/null 2>&1 \
  || true
