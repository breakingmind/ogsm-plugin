#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
plugin_root="$(dirname "$script_dir")"

skills="ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-calendar-brief ogsm-realign ogsm-weekly-review"

test -f "$plugin_root/plugin.toml"
test -f "$plugin_root/README.md"
test -f "$plugin_root/.codex-plugin/plugin.json"
test -f "$plugin_root/.claude-plugin/plugin.json"
if [ -d "$plugin_root/../.agents" ]; then
  test -f "$plugin_root/../.agents/plugins/marketplace.json"
fi
if [ -d "$plugin_root/../.claude-plugin" ]; then
  test -f "$plugin_root/../.claude-plugin/marketplace.json"
fi

for skill in $skills; do
  test -f "$plugin_root/skills/$skill/SKILL.md"
  test -d "$plugin_root/skills/$skill/references"
  test -d "$plugin_root/skills/$skill/scripts"
  test -d "$plugin_root/skills/$skill/assets"
  grep -q '^name:' "$plugin_root/skills/$skill/SKILL.md"
  grep -q '^description:' "$plugin_root/skills/$skill/SKILL.md"
  grep -q '## Workflow' "$plugin_root/skills/$skill/SKILL.md"
  grep -q '## Progressive Disclosure' "$plugin_root/skills/$skill/SKILL.md"
  grep -q '## Tools' "$plugin_root/skills/$skill/SKILL.md"
  grep -q "name = \"$skill\"" "$plugin_root/plugin.toml"
  grep -q "path = \"skills/$skill/SKILL.md\"" "$plugin_root/plugin.toml"
done

for reference in ogsm-principles ogsm-profile-format review-rubric schedule-normalization output-formats adaptive-operating-context tool-policy progressive-disclosure storage-policy skill-pressure-tests; do
  test -f "$plugin_root/references/$reference.md"
done

for asset in profile-template operating-context-template quick-review-template full-audit-template realign-template storage-index-template; do
  test -f "$plugin_root/assets/$asset.md"
done

for script in validate-profile normalize-schedule score-alignment update-operating-context prepare-storage; do
  test -x "$plugin_root/scripts/$script.js"
done

grep -q 'Must not directly use Google Calendar connector' "$plugin_root/skills/ogsm-audit-schedule/SKILL.md"
grep -q 'May use Google Calendar connector to read events' "$plugin_root/skills/ogsm-calendar-brief/SKILL.md"
grep -q 'scope: department' "$plugin_root/references/storage-policy.md"
grep -q 'Scenario 1: Raw Schedule Audit' "$plugin_root/references/skill-pressure-tests.md"
grep -q 'Scenario 2: Audit to Realign' "$plugin_root/references/skill-pressure-tests.md"
test -f "$plugin_root/examples/storage-layout/profiles/company/example-company.md"
test -f "$plugin_root/examples/storage-layout/profiles/departments/sales.md"

grep -q 'Produce or consume a normalized schedule table before scoring' "$plugin_root/skills/ogsm-audit-schedule/SKILL.md"
grep -q 'load and follow `ogsm-realign` before rewriting the schedule' "$plugin_root/skills/ogsm-audit-schedule/SKILL.md"
grep -q 'load and follow `ogsm-realign` before rewriting the plan' "$plugin_root/skills/ogsm-audit-plan/SKILL.md"
grep -q 'show target path and summary or diff' "$plugin_root/skills/ogsm-realign/SKILL.md"
grep -q 'show target path and new-file notice or diff' "$plugin_root/skills/ogsm-define/SKILL.md"
grep -q 'only after storage policy, target path, summary or diff, and user confirmation' "$plugin_root/skills/ogsm-weekly-review/SKILL.md"

for skill in ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-realign ogsm-weekly-review; do
  if grep -q 'May use Google Calendar connector' "$plugin_root/skills/$skill/SKILL.md"; then
    echo "Unexpected Google Calendar connector permission in $skill" >&2
    exit 1
  fi
done
