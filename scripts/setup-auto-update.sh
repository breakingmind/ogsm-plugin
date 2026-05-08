#!/usr/bin/env bash
# Sets up automatic daily git pull for the installed ogsm plugin.
# Run once after installing the plugin. Works on macOS (LaunchAgent) and Linux (crontab).
set -euo pipefail

REPO_URL="https://github.com/breakingmind/ogsm-plugin.git"
INSTALLED_PLUGINS_JSON="$HOME/.claude/plugins/installed_plugins.json"
UPDATE_SCRIPT="$HOME/.local/bin/ogsm-plugin-update.sh"
LAUNCHAGENT_PLIST="$HOME/Library/LaunchAgents/com.ogsm-plugin.update.plist"

# ── 1. Find install path ───────────────────────────────────────────────────────
if [ ! -f "$INSTALLED_PLUGINS_JSON" ]; then
  echo "Error: $INSTALLED_PLUGINS_JSON not found. Is the ogsm plugin installed in Claude Code?" >&2
  exit 1
fi

INSTALL_PATH=$(python3 - <<'PY'
import json, sys, os
path = os.path.expanduser("~/.claude/plugins/installed_plugins.json")
data = json.load(open(path))
plugins = data.get("plugins", data)  # support both flat and nested format
for key in ("ogsm@ogsm-plugin", "ogsm@local"):
    entries = plugins.get(key, [])
    if entries:
        print(entries[0]["installPath"])
        sys.exit(0)
print("", end="")
PY
)

if [ -z "$INSTALL_PATH" ]; then
  echo "Error: ogsm plugin entry not found in $INSTALLED_PLUGINS_JSON." >&2
  echo "Make sure the plugin is installed: /plugin install ogsm" >&2
  exit 1
fi

echo "Plugin path : $INSTALL_PATH"

# ── 2. Convert to git clone if needed ─────────────────────────────────────────
if [ -d "$INSTALL_PATH/.git" ]; then
  echo "Already a git repo — skipping clone."
else
  echo "Converting static copy → git clone …"
  BACKUP="${INSTALL_PATH}.bak.$(date +%s)"
  mv "$INSTALL_PATH" "$BACKUP"
  git clone --quiet "$REPO_URL" "$INSTALL_PATH"
  echo "Done. Backup: $BACKUP"
fi

# ── 3. Write update helper script ─────────────────────────────────────────────
mkdir -p "$(dirname "$UPDATE_SCRIPT")"
cat > "$UPDATE_SCRIPT" << SCRIPT
#!/bin/bash
LOG="\$HOME/.claude/ogsm-plugin-update.log"
git -C "$INSTALL_PATH" pull --ff-only --quiet >> "\$LOG" 2>&1
echo "\$(date '+%Y-%m-%d %H:%M:%S')  pulled $INSTALL_PATH" >> "\$LOG"
SCRIPT
chmod +x "$UPDATE_SCRIPT"
echo "Update script : $UPDATE_SCRIPT"

# ── 4. Register with OS scheduler ─────────────────────────────────────────────
if [[ "${OSTYPE:-}" == "darwin"* ]]; then
  mkdir -p "$(dirname "$LAUNCHAGENT_PLIST")"
  cat > "$LAUNCHAGENT_PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ogsm-plugin.update</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$UPDATE_SCRIPT</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST
  launchctl unload "$LAUNCHAGENT_PLIST" 2>/dev/null || true
  launchctl load  "$LAUNCHAGENT_PLIST"
  echo "LaunchAgent   : $LAUNCHAGENT_PLIST (daily 09:00, runs now on load)"
else
  # Linux fallback: crontab
  ( crontab -l 2>/dev/null | grep -v "ogsm-plugin-update"; \
    echo "0 9 * * * $UPDATE_SCRIPT" ) | crontab -
  echo "Cron job added: daily 09:00 → $UPDATE_SCRIPT"
fi

echo ""
echo "Setup complete. Plugin will auto-update daily from $REPO_URL"
echo "Log: \$HOME/.claude/ogsm-plugin-update.log"
