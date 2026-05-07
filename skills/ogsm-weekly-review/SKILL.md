---
name: ogsm-weekly-review
description: "Use at the end of a week when the user wants to review OGSM execution or update operating context. Also triggers on: 「做週檢查」「這週回顧」「OGSM 週回顧」「更新執行脈絡」「這週表現怎麼樣」「關閉這週迴圈」"
---

# OGSM Weekly Review

Use this skill to close the OGSM operating loop.

## Inputs

- OGSM profile.
- Week plan, schedule audit, completed work, or user reflection.
- Optional operating context.

## Outputs

- Weekly execution review.
- MD movement summary.
- MP completion summary.
- Under-supported Strategy findings.
- Proposed operating context updates.

## Workflow

1. Read the OGSM profile.
1a. Run `node ../../scripts/validate-profile-logic.js <profile-file> --section M` to get MD/MP gap status.
    Include the M-layer score and any gaps in the weekly report under "M 檢核狀態".
2. Read `../../references/adaptive-operating-context.md` and `../../references/storage-policy.md` when reading or updating persistent context.
3. Compare actual work against Strategies, MD, and MP.
4. Identify recurring patterns.
5. Propose operating context updates.
6. Identify profile scope and target context path from profile metadata. If department context references company patterns, update only department context unless the user explicitly confirms a company context update.
7. Use `node ../../scripts/update-operating-context.js <context-file> <note>` only after storage policy, target path, summary or diff, recorded date, and user confirmation.
8. If OGSM changes are needed, propose a diff and ask for confirmation.

## Progressive Disclosure

- Read review rubric only when scoring the week.
- Read output formats only when the user asks for a saved report.

## Tools

- May read profile, review history, and operating context.
- May update operating context after confirmation.
- Must keep company and department context files separate.
- Must not silently change Objective, Goals, Strategies, MD, or MP.

## Handoff

完成後根據情況推薦或執行下一步：
- 週檢查完成 → 推薦 `ogsm-translate`：「這週迴圈完成。下週一可以再跑 ogsm-translate 把下週優先事項排好。」
