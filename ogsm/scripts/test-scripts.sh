#!/bin/sh
set -eu

node ogsm/scripts/validate-profile.js ogsm/examples/sample-ogsm-profile.md
node ogsm/scripts/normalize-schedule.js ogsm/examples/sample-schedule-input.md

tmp_json="$(mktemp)"
cat > "$tmp_json" <<'JSON'
[
  {"title":"Dashboard prototype","strategyLink":"Strategy 1","mdLink":"MD 1","mpLink":"MP 1"},
  {"title":"Exploratory calls","strategyLink":"Unmapped","mdLink":"Unmapped","mpLink":"Unmapped"}
]
JSON
node ogsm/scripts/score-alignment.js "$tmp_json"
rm "$tmp_json"

tmp_context="$(mktemp)"
node ogsm/scripts/update-operating-context.js "$tmp_context" "Strategy 1 was under-supported"
test -s "$tmp_context"
rm "$tmp_context"
