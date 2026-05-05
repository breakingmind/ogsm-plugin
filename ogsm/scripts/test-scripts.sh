#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
plugin_root="$(dirname "$script_dir")"

node "$script_dir/validate-profile.js" "$plugin_root/examples/sample-ogsm-profile.md"
node "$script_dir/normalize-schedule.js" "$plugin_root/examples/sample-schedule-input.md"

tmp_json="$(mktemp)"
tmp_context="$(mktemp)"
tmp_schedule="$(mktemp)"
tmp_output="$(mktemp)"
tmp_invalid_json="$(mktemp)"
tmp_null_json="$(mktemp)"
tmp_profile="$(mktemp)"
tmp_storage_root="$(mktemp -d)"
trap 'rm -f "$tmp_json" "$tmp_context" "$tmp_schedule" "$tmp_output" "$tmp_invalid_json" "$tmp_null_json" "$tmp_profile"; rm -rf "$tmp_storage_root"' EXIT

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

"$script_dir/validate-architecture.sh"
