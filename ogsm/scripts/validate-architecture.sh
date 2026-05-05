#!/bin/sh
set -eu

skills="ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-calendar-brief ogsm-realign ogsm-weekly-review"

test -f ogsm/plugin.toml
test -f ogsm/README.md

for skill in $skills; do
  test -f "ogsm/skills/$skill/SKILL.md"
  test -d "ogsm/skills/$skill/references"
  test -d "ogsm/skills/$skill/scripts"
  test -d "ogsm/skills/$skill/assets"
  grep -q '^name:' "ogsm/skills/$skill/SKILL.md"
  grep -q '^description:' "ogsm/skills/$skill/SKILL.md"
  grep -q '## Workflow' "ogsm/skills/$skill/SKILL.md"
  grep -q '## Progressive Disclosure' "ogsm/skills/$skill/SKILL.md"
  grep -q '## Tools' "ogsm/skills/$skill/SKILL.md"
done

for reference in ogsm-principles ogsm-profile-format review-rubric schedule-normalization output-formats adaptive-operating-context tool-policy progressive-disclosure; do
  test -f "ogsm/references/$reference.md"
done

for asset in profile-template operating-context-template quick-review-template full-audit-template realign-template; do
  test -f "ogsm/assets/$asset.md"
done

for script in validate-profile normalize-schedule score-alignment update-operating-context; do
  test -x "ogsm/scripts/$script.js"
done

grep -q 'Must not directly use Google Calendar connector' ogsm/skills/ogsm-audit-schedule/SKILL.md
grep -q 'May use Google Calendar connector to read events' ogsm/skills/ogsm-calendar-brief/SKILL.md
