---
name: ogsm-audit-plan
description: "Use when the user wants to review a written plan, OKR, roadmap, project spec, weekly plan, or initiative list against their OGSM. Also triggers on: 「這個計畫對嗎」「審查季度計畫」「OKR 跟 OGSM 有對齊嗎」「幫我看這份路線圖」「計畫有沒有偏離 OGSM」"
---

# OGSM Audit Plan

Use this skill to evaluate written plans against OGSM.

## Inputs

- Confirmed OGSM profile.
- Plan text, OKR, roadmap, project spec, or initiative list.
- Optional requested output mode: quick, full, or realign.

## Outputs

- Alignment review using `../../references/output-formats.md`.

## Workflow

1. Read the OGSM profile. If missing, route to `ogsm-define`.
2. Read `../../references/review-rubric.md`.
3. Read `../../references/output-formats.md`.
4. Run `node ../../scripts/validate-profile-logic.js <profile-file>` to get the JSON gap report.
   Then read `../../references/ogsm-profile-audit-questions.md` and apply the 30 audit questions:
   - Use the script's structural gaps (O/G/S/MD/MP scores + gap list) as the base finding for each layer.
   - Supplement with AI semantic judgement for gaps the script cannot detect: O5 (vivid picture), O6 (keyword identification), S17–S19 (resource uniqueness/consumability), B30 (open-ended).
   - Only ask the user for clarification when a gap cannot be resolved from the profile text alone.
5. Map each plan item to Strategy, MD, and MP.
6. Check backward logic: MP should achieve MD, MD should validate Strategy, Strategy should support Goal, and Goal should support Objective.
7. Use `node ../../scripts/score-alignment.js <items.json>` when structured alignment items are available.
8. Ask one clarifying question only if it changes the review.
9. If the user wants a revised version, state that `ogsm-realign` has been loaded, then load and follow `ogsm-realign` before rewriting the plan.

## Progressive Disclosure

- Always read `../../references/ogsm-profile-audit-questions.md` at the start of every audit.
- Read examples only if the user asks for examples or output calibration.
- Do not read schedule normalization unless calendar or agenda content appears.
- Read `../../references/storage-policy.md` only when saving review output.

## Tools

- May read profile, rubric, output format, and adaptive context.
- May run alignment scoring script.
- May save review output only after storage policy, profile metadata scope and slug, target path, summary or diff, recorded date, and confirmation.
- Must not use Google Calendar.

## Handoff

完成後根據情況推薦或執行下一步：
- 發現缺口或低對齊項目 → 自動 invoke `ogsm-realign`：直接進入修訂模式，無需使用者再說
- 無缺口，完全對齊 → 結束，不推薦後續（使用者自行決定下一步）
