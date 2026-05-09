---
name: ogsm-import
description: "Use when the user wants to import an existing OGSM into the plugin. Also triggers on: 「匯入」「import」「我有既有的 OGSM」「幫我把這個 OGSM 匯入」「我之前寫過 OGSM」"
---

# OGSM Import

Use this skill to bring an existing OGSM (from a file or pasted text) into `.ogsm/profiles/` storage.

## Inputs

- File path to an existing `.md` file, OR OGSM content pasted directly into the conversation.

## Outputs

- A validated OGSM profile handed to `ogsm-define` for principle check and write to `.ogsm/profiles/`.

## Workflow

1. **Detect input mode:**
   - If the user's message contains a file path (starts with `/`, `~/`, or ends with `.md`): read the file using the Read tool.
   - Otherwise: parse OGSM content directly from the conversation.
   - File not found: show "讀取失敗：找不到該檔案。請檢查路徑或直接貼上 OGSM 內容。"
   - Permission denied: show "讀取失敗：無權限讀取該檔案。請確認路徑或直接貼上內容。"
   - File is empty: ask "該檔案無內容，請提供 OGSM 文字或另一個檔案路徑。"

2. **Map headings to standard fields** using the alias table below. For each heading found in the source:
   - Exact match (case-insensitive) → silent mapping.
   - Alias match → show notice: "偵測到『{alias}』→ 對映為 {standard field}，是否正確？"
   - No match → show the heading and its content, ask: "這一段要對映到哪個欄位？（Objective / Goals / Strategies / MD / MP / Review Cadence / Time Horizon / 忽略）"
   - If a heading matches aliases for two different standard fields: ask "『{heading}』可能對應多個欄位，你認為它是 {option1} 還是 {option2}？"

3. **Show full mapping result** as a two-column table (source heading → standard field). Ask: "對映結果如上，確認後繼續？"

3b. If the user rejects the mapping: ask "哪個對映有誤？" and re-map that heading interactively (repeat step 2 for that specific heading only).

4. **Run structural validation:**
   - Before running, read `../../references/ogsm-profile-format.md` to confirm the required field list.
   - If input was pasted, write mapped content to `/tmp/ogsm-import-<YYYYMMDD-HHMMSS>.md`.
   - Run: `node ../../scripts/validate-profile.js <file-path>`
   - Display which required fields are present and which are missing.

5. **Hand off to `ogsm-define`** by presenting the fully mapped OGSM text in the conversation, then invoking `ogsm-define`. State: "結構對映完成，以下是對映後的草稿，現在交由 ogsm-define 確認 OGSM 原則並補齊缺漏：\n\n{mapped-content}" — `ogsm-define` treats this as the user's existing draft input.

## Field Alias Table

| Standard Field | Accepted Aliases |
|----------------|-----------------|
| `Objective` | 目標、願景、使命、Mission、Vision |
| `Goals` | 目標值、量化目標、OKR、KR、Key Results |
| `Strategies` | 策略、方法、做法、How |
| `MD` | KPI、衡量指標、成效指標、Metrics |
| `MP` | 行動計畫、執行計畫、Action Plan、Todo |
| `Review Cadence` | 複盤頻率、檢討週期、Review |
| `Time Horizon` | 時間範圍、期間、週期 |

## Progressive Disclosure

- Read `../../references/ogsm-profile-format.md` only when checking mapping completeness against the required field list.
- Do not load rubrics, templates, or operating context — this skill only parses and maps.

## Tools

- May read local files provided by the user (Read tool).
- May write a temporary file to run `validate-profile.js` on mapped content.
- Must not write to `.ogsm/profiles/` directly — writing is handled by `ogsm-define`.
- Must not use Google Calendar.

## Handoff

After mapping and structural validation, invoke `ogsm-define` with the mapped content as the starting draft. `ogsm-define` owns gap-filling, OGSM principles validation, and storage.

`ogsm-define` will also ask for scope (company vs. department) and parent profile confirmation as needed before saving.
