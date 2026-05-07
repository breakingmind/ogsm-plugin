#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
plugin_root="$(dirname "$script_dir")"

node "$script_dir/validate-profile.js" "$plugin_root/examples/sample-ogsm-profile.md"
node "$script_dir/normalize-schedule.js" "$plugin_root/examples/sample-schedule-input.md"

tmp_json="$(mktemp)"
tmp_context="$(mktemp)"
tmp_schedule="$(mktemp)"
tmp_calendar_events="$(mktemp)"
tmp_output="$(mktemp)"
tmp_invalid_json="$(mktemp)"
tmp_null_json="$(mktemp)"
tmp_profile="$(mktemp)"
tmp_storage_root="$(mktemp -d)"
tmp_h4=""
tmp_h4d=""
trap 'rm -f "$tmp_json" "$tmp_context" "$tmp_schedule" "$tmp_calendar_events" "$tmp_output" "$tmp_invalid_json" "$tmp_null_json" "$tmp_profile"; rm -rf "$tmp_storage_root"; [ -n "$tmp_h4" ] && rm -rf "$tmp_h4"; [ -n "$tmp_h4d" ] && rm -rf "$tmp_h4d"' EXIT

cat > "$tmp_json" <<'JSON'
[
  {"title":"Dashboard prototype","strategyLink":"Strategy 1","mdLink":"MD 1","mpLink":"MP 1"},
  {"title":"Exploratory calls","strategyLink":"Unmapped","mdLink":"Unmapped","mpLink":"Unmapped"}
]
JSON
node "$script_dir/score-alignment.js" "$tmp_json"

node "$script_dir/update-operating-context.js" "$tmp_context" "Strategy 1 was under-supported"
test -s "$tmp_context"

cat > "$tmp_schedule" <<'SCHEDULE'
Monday 09:00-10:00 A | B sync
SCHEDULE
node "$script_dir/normalize-schedule.js" "$tmp_schedule" > "$tmp_output"
grep -F 'A \| B sync' "$tmp_output" >/dev/null

cat > "$tmp_calendar_events" <<'JSON'
[
  {
    "summary": "Pipeline review | new opportunities",
    "start": {"dateTime": "2026-05-11T09:00:00+08:00"},
    "end": {"dateTime": "2026-05-11T10:30:00+08:00"},
    "location": "Teams"
  },
  {
    "summary": "All day market watch",
    "start": {"date": "2026-05-12"},
    "end": {"date": "2026-05-13"}
  }
]
JSON
node "$script_dir/normalize-calendar-events.js" "$tmp_calendar_events" > "$tmp_output"
grep -F '| 2026-05-11 | 09:00 | 10:30 | 90m | Pipeline review \| new opportunities | Admin | Fixed | Unmapped | Unmapped | Unmapped | Location: Teams |' "$tmp_output" >/dev/null
grep -F '| 2026-05-12 | All day | All day | All day | All day market watch | Unknown | Fixed | Unmapped | Unmapped | Unmapped | All-day event |' "$tmp_output" >/dev/null

printf '{' > "$tmp_invalid_json"
if node "$script_dir/score-alignment.js" "$tmp_invalid_json" > "$tmp_output" 2>&1; then
  echo "Expected invalid JSON to fail" >&2
  exit 1
fi
grep -F 'Invalid JSON' "$tmp_output" >/dev/null

printf '[null]' > "$tmp_null_json"
if node "$script_dir/score-alignment.js" "$tmp_null_json" > "$tmp_output" 2>&1; then
  echo "Expected non-object JSON array entries to fail" >&2
  exit 1
fi
grep -F 'Input must be a JSON array of objects' "$tmp_output" >/dev/null

cat > "$tmp_profile" <<'PROFILE'
  ## Profile Name
## Time Horizon ##
#### Objective
### Goals ###
## Strategies
## MD
## MP
## Review Cadence
PROFILE
node "$script_dir/validate-profile.js" "$tmp_profile"

if node "$script_dir/prepare-storage.js" "$tmp_storage_root" company Double Steel > "$tmp_output" 2>&1; then
  echo "Expected prepare-storage preview to require confirmation" >&2
  exit 1
fi
grep -F '"writeRequired": true' "$tmp_output" >/dev/null

node "$script_dir/prepare-storage.js" "$tmp_storage_root" department Sales --confirm-write > "$tmp_output"
test -f "$tmp_storage_root/.ogsm/index.md"
test -f "$tmp_storage_root/.ogsm/context/departments/sales.md"
test -d "$tmp_storage_root/.ogsm/reviews/departments/sales"

cp "$plugin_root/assets/operating-context-template.md" "$tmp_context"
node "$script_dir/update-operating-context.js" "$tmp_context" "First line
Second line"
if grep -F -- '- None recorded yet.' "$tmp_context" >/dev/null; then
  echo "Expected placeholder context note to be removed" >&2
  exit 1
fi
grep -F 'First line Second line' "$tmp_context" >/dev/null

# H1: non-.ogsm/profiles/ path → pass silently
echo '{"tool_input":{"file_path":"README.md","content":"anything"}}' | \
  node "$script_dir/hooks/pre-write-validate-profile.js"

# H1: invalid profile → exit non-zero
if echo '{"tool_input":{"file_path":".ogsm/profiles/company/test.md","content":"# bad"}}' | \
  node "$script_dir/hooks/pre-write-validate-profile.js" 2>/dev/null; then
  echo "Expected H1 to block invalid profile" >&2
  exit 1
fi

# H1: valid profile → exit 0
valid_content="$(node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('$plugin_root/examples/sample-ogsm-profile.md','utf8')))")"
printf '{"tool_input":{"file_path":".ogsm/profiles/company/test.md","content":%s}}' "$valid_content" | \
  node "$script_dir/hooks/pre-write-validate-profile.js"

# H2: non-.ogsm/ path → silent
out=$(echo '{"tool_input":{"file_path":"README.md"}}' | node "$script_dir/hooks/post-write-confirm.js")
test -z "$out"

# H3: unrelated Bash command → silent
out=$(echo '{"tool_input":{"command":"ls -la"}}' | node "$script_dir/hooks/post-context-check.js")
test -z "$out"

# H4: no .ogsm in /tmp → silent
out=$(cd /tmp && node "$script_dir/hooks/stop-reminder.js")
test -z "$out"

# H4: .ogsm/profiles/company/ with a .md file → reminder printed
tmp_h4="$(mktemp -d)"
mkdir -p "$tmp_h4/.ogsm/profiles/company"
echo "# profile" > "$tmp_h4/.ogsm/profiles/company/test.md"
out=$(cd "$tmp_h4" && node "$script_dir/hooks/stop-reminder.js")
rm -rf "$tmp_h4"
echo "$out" | grep -q 'OGSM: session ending'

# H4: .ogsm/profiles/departments/ with a .md file → reminder printed
tmp_h4d="$(mktemp -d)"
mkdir -p "$tmp_h4d/.ogsm/profiles/departments"
echo "# dept profile" > "$tmp_h4d/.ogsm/profiles/departments/sales.md"
out=$(cd "$tmp_h4d" && node "$script_dir/hooks/stop-reminder.js")
rm -rf "$tmp_h4d"
echo "$out" | grep -q 'OGSM: session ending'

"$script_dir/validate-architecture.sh"
