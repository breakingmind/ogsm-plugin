---
name: ogsm-translate
description: "Use when the user wants to turn an OGSM profile into weekly or monthly priorities, time allocation guidance, or decision rules. Also triggers on: 「這週我要做什麼」「幫我排優先順序」「根據 OGSM 給我方向」「這個月重點是什麼」「OGSM 轉行動」"
---

# OGSM Translate

Use this skill to convert OGSM into operational guidance.

## Inputs

- Confirmed OGSM profile.
- Optional adaptive operating context.
- Optional current focus period.

## Outputs

- Priority themes.
- Strategy time allocation guidance.
- MD check-ins.
- MP priorities.
- Say-no list.
- Decision rules.

## Workflow

1. Read the OGSM profile.
2. Read `../../references/adaptive-operating-context.md` only if context exists or the user asks for adaptive guidance.
3. Read `../../references/review-rubric.md` when prioritization requires tradeoff scoring.
4. Produce operational guidance for the requested period.
5. If writing operating context updates, read `../../references/storage-policy.md`, derive scope and slug from profile metadata, show target path, summary or diff, and recorded date, then ask for confirmation.

## Progressive Disclosure

- Do not load schedule normalization unless a schedule appears.
- Do not load output templates unless the user asks for a formatted artifact.
- Read storage policy only when writing operating context.

## Tools

- May read profile and operating context.
- May write operating context only after storage policy, profile metadata scope and slug, target path, summary or diff, recorded date, and confirmation.
- Must keep company and department context files separate.
- Must not use Google Calendar.

## Handoff

完成後根據情況推薦或執行下一步：
- 優先事項輸出後 → 推薦二選一：「要審查本週行程是否支持這些優先事項（`ogsm-audit-schedule`），還是審查現有計畫文件（`ogsm-audit-plan`）？」
- 優先事項輸出後（若尚未有年度計畫表）→ 也可推薦 `ogsm-plan-annual`：「要用 ogsm-plan-annual 把這份 OGSM 展開成全年 MD/MP 追蹤表嗎？」
