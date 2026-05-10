---
name: ogsm-plan-annual
description: "Use when the user wants to create or update a full-year MD/MP tracking table. Also triggers on: 「產生年度計畫表」「建立年度追蹤」「更新本月實際值」「月底更新 MD」「ogsm-plan-annual」"
---

# OGSM Plan Annual

Use this skill to generate a full-year MD/MP milestone and tracking table from a confirmed OGSM profile, and to update it with monthly actual values extracted from weekly reviews.

## Inputs

**Generate mode:**
- Confirmed OGSM profile.
- Target year (default: current year).

**Update mode:**
- Existing annual plan table at `.ogsm/plans/<scope>/<slug>/<year>-annual.md`.
- Recent weekly review files for the current month under `.ogsm/reviews/<scope>/<slug>/`.
- Month to update (default: current month).

## Outputs

**Generate mode:**
- Annual plan markdown table at `.ogsm/plans/<scope>/<slug>/<year>-annual.md`.
- One row-pair (plan + actual) per Strategy per Goal, with 12 month columns each containing MD and MP sub-cells.

**Update mode:**
- Updated annual plan table with actual MD values filled in for the specified month.
- MP completion status (✓ / ✗) for the specified month.

## Workflow

### Generate Mode

1. Read the OGSM profile. Derive scope and slug from profile metadata.
2. Read `../../references/storage-policy.md` to confirm target path.
3. For each MD item, show its baseline, target, and deadline. Propose linear monthly milestones (e.g., baseline=20%, target=80%, 12 months → +5%/month). Explain reasoning. Ask the user to confirm or adjust each MD's monthly values.
4. For each Strategy, list its MP items. Confirm which months each MP is active.
5. Assemble the plan JSON and run: `node ../../scripts/generate-annual-plan.js <plan-data.json>`
6. Show the generated table preview.
7. Show target path, content summary, and new-file notice. Ask for confirmation before writing.
8. Write confirmed output to `.ogsm/plans/<scope>/<slug>/<year>-annual.md`.

### Update Mode

1. Identify the annual plan file path from profile metadata and the target year.
2. Identify the month to update (default: current month, 1-indexed).
3. Run: `node ../../scripts/extract-md-actuals.js .ogsm/reviews/<scope>/<slug>/`
4. Show extracted MD actual values. Ask the user to confirm or correct each value.
5. Ask the user for MP completion status (✓ / ✗) for each MP active this month.
6. Show target path, diff summary (which cells change), and recorded date. Ask for confirmation.
7. Update the annual plan file: replace `實際: —` with `實際: <confirmed value>` in the correct month column, and add ✓/✗ to MP cells.

## Progressive Disclosure

- Read storage policy only when writing the plan file.
- Read profile format only when validating profile metadata.

## Tools

- May read OGSM profile, weekly review files, and annual plan files.
- May write `.ogsm/plans/` files only after storage policy, target path, content summary, and user confirmation.
- Must not silently change the annual plan file.
- Must not use Google Calendar.

## Handoff

完成後根據情況推薦或執行下一步：
- Generate 完成 → 推薦 `ogsm-audit-schedule`：「年度計畫表已建立。要審查本週行程是否支持第一個月的 MP 計畫嗎？」
- Update 完成 → 推薦 `ogsm-weekly-review`：「本月實際值已更新。要繼續本週的 OGSM 週回顧嗎？」
