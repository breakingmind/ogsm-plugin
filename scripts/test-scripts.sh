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

# validate-profile-logic: sample profile (mostly passing) → exit 0
node "$script_dir/validate-profile-logic.js" "$plugin_root/examples/sample-ogsm-profile.md"

# validate-profile-logic: gap profile → exit non-zero + gaps in JSON
cat > "$tmp_profile" <<'GAPPROFILE'
## Profile Name
Gap Test
## Time Horizon
2026
## Objective
Short.
## Goals
1. Do things.
## Strategies
1. Execute tasks.
## MD
1. Track progress.
## MP
1. Someone does work.
## Review Cadence
Weekly.
GAPPROFILE
if node "$script_dir/validate-profile-logic.js" "$tmp_profile" > "$tmp_output" 2>&1; then
  echo "Expected gap profile to exit non-zero" >&2
  exit 1
fi
grep -F '"valid": false' "$tmp_output" >/dev/null

# validate-profile-logic: --section M flag → only MD/MP/backwardLogic in output
node "$script_dir/validate-profile-logic.js" "$plugin_root/examples/sample-ogsm-profile.md" --section M > "$tmp_output"
grep -F '"MD"' "$tmp_output" >/dev/null
if grep -F '"O"' "$tmp_output" >/dev/null 2>&1; then
  echo "Expected --section M to omit O layer" >&2
  exit 1
fi

# validate-alignment: aligned goal with valid parent_ref → exit 0, valid: true
tmp_dept_valid="$(mktemp)"
tmp_company_valid="$(mktemp)"
cat > "$tmp_company_valid" <<'COMPANY'
## Goals
1. Increase revenue by 30%, 2026-12-31.
## Strategies
1. Through digital tools, accelerate pipeline.
COMPANY
cat > "$tmp_dept_valid" <<'DEPT'
## Goals
1. Grow new-client close rate from 20% to 35%, 2026-12-31.
   <!-- goal_type: aligned | parent_ref: company-G1 -->
2. Complete CRM training by 2026-08-31.
   <!-- goal_type: enabling | supports: [operations] -->
DEPT
node "$script_dir/validate-alignment.js" "$tmp_dept_valid" "$tmp_company_valid" > "$tmp_output"
grep -F '"valid": true' "$tmp_output" >/dev/null
rm -f "$tmp_dept_valid" "$tmp_company_valid"

# validate-alignment: aligned goal with invalid parent_ref → exit 1, error in output
tmp_dept_bad="$(mktemp)"
tmp_company_bad="$(mktemp)"
cat > "$tmp_company_bad" <<'COMPANY'
## Goals
1. Increase revenue by 30%, 2026-12-31.
COMPANY
cat > "$tmp_dept_bad" <<'DEPT'
## Goals
1. Grow close rate.
   <!-- goal_type: aligned | parent_ref: company-G5 -->
DEPT
if node "$script_dir/validate-alignment.js" "$tmp_dept_bad" "$tmp_company_bad" > "$tmp_output" 2>&1; then
  echo "Expected invalid parent_ref to fail" >&2
  exit 1
fi
grep -F '"valid": false' "$tmp_output" >/dev/null
grep -F 'company-G5' "$tmp_output" >/dev/null
rm -f "$tmp_dept_bad" "$tmp_company_bad"

# validate-alignment: missing goal_type → exit 0 (warning only, still valid)
tmp_dept_warn="$(mktemp)"
tmp_company_warn="$(mktemp)"
cat > "$tmp_company_warn" <<'COMPANY'
## Goals
1. Example goal.
COMPANY
cat > "$tmp_dept_warn" <<'DEPT'
## Goals
1. Some goal with no annotation.
DEPT
node "$script_dir/validate-alignment.js" "$tmp_dept_warn" "$tmp_company_warn" > "$tmp_output"
grep -F '"valid": true' "$tmp_output" >/dev/null
grep -F 'missing goal_type' "$tmp_output" >/dev/null
rm -f "$tmp_dept_warn" "$tmp_company_warn"

# validate-alignment: no args → exit 2
if node "$script_dir/validate-alignment.js" > "$tmp_output" 2>&1; then
  echo "Expected no-args to exit 2" >&2
  exit 1
fi

# extract-md-actuals: sample weekly review → extracts MD values
node "$script_dir/extract-md-actuals.js" "$plugin_root/examples/sample-weekly-review-with-actuals.md" > "$tmp_output"
grep -F '"MD1-1"' "$tmp_output" >/dev/null
grep -F '"25%"' "$tmp_output" >/dev/null
grep -F '"MD1-2"' "$tmp_output" >/dev/null
grep -F '"未變"' "$tmp_output" >/dev/null
grep -F '"MD2-1"' "$tmp_output" >/dev/null
grep -F '"12"' "$tmp_output" >/dev/null

# extract-md-actuals: no args → exit 2
if node "$script_dir/extract-md-actuals.js" > "$tmp_output" 2>&1; then
  echo "Expected no-args to exit 2" >&2
  exit 1
fi

# generate-annual-plan: sample input → produces markdown table with headers
node "$script_dir/generate-annual-plan.js" "$plugin_root/examples/sample-annual-plan-input.json" > "$tmp_output"
grep -F '# 年度計畫表 · xxx-company · 2026' "$tmp_output" >/dev/null
grep -F '> O: 成為台灣鋼材市場首選供應商' "$tmp_output" >/dev/null
grep -F '1月 MD' "$tmp_output" >/dev/null
grep -F '12月 MP' "$tmp_output" >/dev/null
grep -F 'G1: 市佔率提升' "$tmp_output" >/dev/null
grep -F '計畫: 22%' "$tmp_output" >/dev/null
grep -F '實際: 23%' "$tmp_output" >/dev/null
grep -F 'MP1-1-1 ✓' "$tmp_output" >/dev/null
grep -F 'MP1-1-2 ✗' "$tmp_output" >/dev/null

# generate-annual-plan: no args → exit 2
if node "$script_dir/generate-annual-plan.js" > "$tmp_output" 2>&1; then
  echo "Expected no-args to exit 2" >&2
  exit 1
fi

# generate-annual-plan: invalid JSON → exit 2
printf '{' > "$tmp_invalid_json"
if node "$script_dir/generate-annual-plan.js" "$tmp_invalid_json" > "$tmp_output" 2>&1; then
  echo "Expected invalid JSON to fail" >&2
  exit 1
fi
grep -F 'Invalid JSON' "$tmp_output" >/dev/null

# ogsm-status: compute engine smoke test
node "$script_dir/ogsm-status/compute.js"

# ogsm-status: parse-profile smoke test
node "$script_dir/ogsm-status/parse-profile.js"

# ogsm-status: view-model smoke test
node "$script_dir/ogsm-status/view-model.js"

# ogsm-status: diagnose smoke test
node "$script_dir/ogsm-status/diagnose.js"

# ogsm-status: loader smoke test
node "$script_dir/ogsm-status/loader.js"

# ogsm-status: renderer smoke test
node "$script_dir/ogsm-status/renderer.js"

# ogsm-status: end-to-end — loader → view-model → renderer → valid HTML output
tmp_ogsm_e2e="$(mktemp -d)"
mkdir -p "$tmp_ogsm_e2e/profiles/company" "$tmp_ogsm_e2e/reviews/company/example-corp"
cp "$plugin_root/examples/fixtures/ogsm-status/profile-minimal.md" \
   "$tmp_ogsm_e2e/profiles/company/example-corp.md"
cp "$plugin_root/examples/fixtures/ogsm-status/review-minimal.md" \
   "$tmp_ogsm_e2e/reviews/company/example-corp/2026-01-15-weekly.md"
node -e "
  const {loadSources}=require('$plugin_root/scripts/ogsm-status/loader');
  const {buildViewModel}=require('$plugin_root/scripts/ogsm-status/view-model');
  const {render}=require('$plugin_root/scripts/ogsm-status/renderer');
  const src=loadSources('$tmp_ogsm_e2e','company','example-corp');
  const vm=buildViewModel(src);
  const html=render(vm);
  if(!html.startsWith('<!DOCTYPE html>')) throw new Error('bad output');
  process.stdout.write(html);
" > "$tmp_ogsm_e2e/out.html"
grep -F 'example-corp' "$tmp_ogsm_e2e/out.html" >/dev/null
grep -F 'Section 1' "$tmp_ogsm_e2e/out.html" >/dev/null
grep -F 'Section 2' "$tmp_ogsm_e2e/out.html" >/dev/null
rm -rf "$tmp_ogsm_e2e"

"$script_dir/validate-architecture.sh"
