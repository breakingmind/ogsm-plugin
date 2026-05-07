---
name: ogsm-start
description: Use when starting any conversation — detects OGSM profile state and routes the user to the right skill. Also triggers on: 「我要開始」「從哪裡開始」「OGSM 怎麼用」「幫我開始」, or when the user's message has no clear OGSM task.
---

# OGSM Start

Entry point for the OGSM plugin. Detects the user's current OGSM state and guides them to the right skill without requiring the user to know skill names.

## Inputs

- Current working directory (to check for `.ogsm/profiles/`).

## Outputs

- Invokes the appropriate OGSM skill based on detected state and user choice.

## Workflow

1. Check whether `.ogsm/profiles/` exists in the current directory and contains `.md` files.
2. **No profiles found (new user):**
   a. Say: "OGSM 把組織目標連結到每日執行，分為五層：O（目標）→ G（目標值）→ S（策略）→ MD（衡量指標）→ MP（行動計畫）。"
   b. Ask: "你要建立公司 profile，還是部門 profile？"
   c. Invoke `ogsm-define`.
3. **Company profile exists, no department profiles:**
   a. Read the company profile. Show: Objective (full text) + up to two Goals.
   b. Ask: "你接下來想做什麼？" with numbered menu:
      - ① 建立部門 profile
      - ② 審查計畫（OKR / 路線圖 / 季度計畫）
      - ③ 審查行程（本週時間安排）
      - ④ 週檢查
4. **Multiple profiles (company + one or more departments):**
   a. List available profiles by name and scope. Ask: "你要操作哪一個 profile？"
   b. After selection, show same menu as step 3b.
5. **Menu routing:**
   - ① → invoke `ogsm-define`
   - ② → invoke `ogsm-audit-plan`
   - ③ → ask: "行程來源：A) 手動貼上文字議程  B) 從 Google Calendar 讀取"
     - A → invoke `ogsm-audit-schedule`
     - B → invoke `ogsm-calendar-brief`
   - ④ → invoke `ogsm-weekly-review`

## Progressive Disclosure

- Read profile files only to extract Objective and first two Goals for the summary in step 3a.
- Do not load rubrics, templates, or references — this skill only routes.

## Tools

- May read `.ogsm/profiles/` directory listing and profile `.md` files (summary only).
- Must not write any files.
- Must not read Google Calendar.
- Must invoke exactly one skill per workflow completion — do not chain multiple skills in sequence.

## Handoff

完成後根據情況推薦或執行下一步：
- 使用者選擇選單項目後 → 自動 invoke 對應 skill（無需等待確認），但選項 ③ 須先完成 A/B 行程來源詢問後再 invoke
