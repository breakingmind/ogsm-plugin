#!/bin/sh
set -eu

node ogsm/scripts/validate-profile.js ogsm/examples/sample-ogsm-profile.md
node ogsm/scripts/normalize-schedule.js ogsm/examples/sample-schedule-input.md

tmp_json="$(mktemp)"
tmp_context="$(mktemp)"
tmp_schedule="$(mktemp)"
tmp_output="$(mktemp)"
tmp_invalid_json="$(mktemp)"
tmp_null_json="$(mktemp)"
tmp_profile="$(mktemp)"
trap 'rm -f "$tmp_json" "$tmp_context" "$tmp_schedule" "$tmp_output" "$tmp_invalid_json" "$tmp_null_json" "$tmp_profile"' EXIT

cat > "$tmp_json" <<'JSON'
[
  {"title":"Dashboard prototype","strategyLink":"Strategy 1","mdLink":"MD 1","mpLink":"MP 1"},
  {"title":"Exploratory calls","strategyLink":"Unmapped","mdLink":"Unmapped","mpLink":"Unmapped"}
]
JSON
node ogsm/scripts/score-alignment.js "$tmp_json"

node ogsm/scripts/update-operating-context.js "$tmp_context" "Strategy 1 was under-supported"
test -s "$tmp_context"

cat > "$tmp_schedule" <<'SCHEDULE'
Monday 09:00-10:00 A | B sync
SCHEDULE
node ogsm/scripts/normalize-schedule.js "$tmp_schedule" > "$tmp_output"
grep -F 'A \| B sync' "$tmp_output" >/dev/null

printf '{' > "$tmp_invalid_json"
if node ogsm/scripts/score-alignment.js "$tmp_invalid_json" > "$tmp_output" 2>&1; then
  echo "Expected invalid JSON to fail" >&2
  exit 1
fi
grep -F 'Invalid JSON' "$tmp_output" >/dev/null

printf '[null]' > "$tmp_null_json"
if node ogsm/scripts/score-alignment.js "$tmp_null_json" > "$tmp_output" 2>&1; then
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
node ogsm/scripts/validate-profile.js "$tmp_profile"

cp ogsm/assets/operating-context-template.md "$tmp_context"
node ogsm/scripts/update-operating-context.js "$tmp_context" "First line
Second line"
if grep -F -- '- None recorded yet.' "$tmp_context" >/dev/null; then
  echo "Expected placeholder context note to be removed" >&2
  exit 1
fi
grep -F 'First line Second line' "$tmp_context" >/dev/null
