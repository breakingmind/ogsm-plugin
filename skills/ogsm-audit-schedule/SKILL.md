---
name: ogsm-audit-schedule
description: "Use when the user wants to review a weekly schedule, agenda dump, or normalized calendar brief against their OGSM. Also triggers on: 「這週行程支持策略嗎」「幫我看行程」「我的時間花得對嗎」「行事曆對嗎」「行程有沒有支持 OGSM」"
---

# OGSM Audit Schedule

Use this skill to determine whether time allocation supports OGSM.

## Inputs

- Confirmed OGSM profile.
- Manual agenda dump or normalized summary from `ogsm-calendar-brief`.
- Optional output mode: quick, full, or realign.

## Outputs

- Schedule alignment review.
- Time allocation risks.
- Suggested changes.

## Workflow

1. Read the OGSM profile. If missing, route to `ogsm-define`.
2. Run `node ../../scripts/validate-profile-logic.js <profile-file>` to get the JSON gap report.
   Then read `../../references/ogsm-profile-audit-questions.md` and apply the 30 audit questions:
   - Use the script's structural gaps (O/G/S/MD/MP scores + gap list) as the base finding for each layer.
   - Supplement with AI semantic judgement for gaps the script cannot detect: O5 (vivid picture), O6 (keyword identification), S17–S19 (resource uniqueness/consumability), B30 (open-ended).
   - Only ask the user for clarification when a gap cannot be resolved from the profile text alone.
3. Read `../../references/schedule-normalization.md`.
4. Produce or consume a normalized schedule table before scoring. If raw agenda text is available only in conversation, manually normalize it into the table schema before review.
5. Even in quick mode, include the normalized schedule table or explicitly state the consumed normalized table before any score, findings, or recommendations.
6. Normalize input with `node ../../scripts/normalize-schedule.js <schedule-file>` when schedule text is saved.
7. Ask the user to confirm assumptions if normalization confidence is low.
8. Read `../../references/review-rubric.md` and `../../references/output-formats.md`.
9. Score Strategy, MD, and MP support.
10. Check whether calendar events actually execute MP and include MD check-ins.
11. If the user asks to audit Google Calendar directly, first use `ogsm-calendar-brief` to produce a normalized brief, then continue here to score alignment.
12. If the user wants revised output, state that `ogsm-realign` has been loaded, then load and follow `ogsm-realign` before rewriting the schedule.

## Progressive Disclosure

- Always read `../../references/ogsm-profile-audit-questions.md` at the start of every audit.
- Do not call Google Calendar directly.
- Only read calendar connector guidance when invoked through `ogsm-calendar-brief`.
- Read `../../references/storage-policy.md` only when saving review output.

## Tools

- May read profile, schedule normalization reference, rubric, and output formats.
- May run schedule normalization and alignment scoring scripts.
- May consume `ogsm-calendar-brief` output.
- May save review output only after storage policy, profile metadata scope and slug, target path, summary or diff, recorded date, and confirmation.
- Must not directly use Google Calendar connector.
- Must not modify calendar events.

## Handoff

完成後根據情況推薦或執行下一步：
- 發現缺口或低對齊時段 → 自動 invoke `ogsm-realign`：直接進入行程修訂模式
- 無缺口，完全對齊 → 推薦 `ogsm-weekly-review`：「行程對齊良好，週五可以做週檢查來關閉這個迴圈。」
