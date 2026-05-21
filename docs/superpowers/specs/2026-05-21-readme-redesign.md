# README Redesign Spec — 2026-05-21

## Goal

Rewrite the OGSM plugin README to be more attractive and clearer for installed users (company owners and middle/high-level managers). The current README reads like a technical reference manual — structured, complete, but lacking pull and scenario-based guidance.

## Target Readers

- Company owners / executives — need strategy-to-execution clarity
- Middle/high-level managers — need to align department work to company OGSM

## Primary Job

Help installed users understand what they can do with the plugin and how to do it.

## Language

Bilingual: English + 繁體中文, each as a full separate block (current structure preserved).

## Problems With Current README

1. Opens with OGSM theory table — correct content, but no "why should I care" hook
2. Plugin Overview is a flow diagram with no scenario context — reads like a spec, not a product intro
3. All 10 skills listed in flat alphabetical-ish order — hard to find what you need
4. No concrete dialogue examples — user can't picture how to actually trigger anything
5. HTML report section explains architecture but not how to get it running with real data
6. Tone: technical manual, not a tool a manager would want to use

---

## Structure

```
# OGSM Plugin
[language toggle]

## 什麼是 OGSM？          ← KEEP: theory table (O/G/S/MD/MP + backward logic)
## 這個 Plugin 能幫你做什麼？  ← NEW: 3 real scenarios in conversational tone
## 快速開始               ← KEEP structure, improve wording
## 我想做什麼？            ← NEW: 4 use-case groups with dialogue examples
   ### 建立或匯入 OGSM
   ### 把 OGSM 轉成本週行動
   ### 審查計劃或行程
   ### 追蹤執行進度        ← ENHANCED: full HTML report how-to
## 完整技能一覽            ← KEEP content, reorder by workflow
## OGSM 執行狀態報告       ← KEEP + add "what you need to get real data" subsection
## 儲存結構               ← KEEP
## 安裝                   ← KEEP + add one-line "start here first" note
## 驗證                   ← KEEP
## 安全原則               ← KEEP
```

---

## Section Designs

### 什麼是 OGSM？

Keep existing table verbatim. Keep backward logic sentence: MP → MD → S → G → O.

### 這個 Plugin 能幫你做什麼？

Three scenarios in conversational tone (one paragraph each, no quote formatting):

**Scenario 1 — Strategy that never gets executed**
策略寫完沒人執行？plugin 把 OGSM 轉成每週要做什麼、什麼不用做、什麼指標要看。

**Scenario 2 — Calendar full, unclear what matters**
行事曆滿了但不確定哪些重要？plugin 掃描行程，找出哪些時段在推進策略、哪些在消耗時間，給具體調整建議。

**Scenario 3 — Metrics only checked at month-end**
月底才發現指標沒在動？plugin 自動從週回顧生成 HTML 執行報告，每個指標進度和健康狀態（🟢🟡🔴）一眼看清楚。

### 快速開始

5 steps:
1. 安裝並重啟 Claude Code
2. 說「幫我開始使用 OGSM」— plugin 自動偵測狀態並引導（不需要記 skill 名稱）
3. 回答問題建立 profile（每次只問一題）
4. 說「這週我應該專注在哪裡？」— 取得本週執行優先事項
5. 每週五說「我們來做週 OGSM 檢查」— 關閉執行迴圈

### 我想做什麼？

#### 建立或匯入 OGSM

Dialogue examples:
- `幫我開始使用 OGSM` → ogsm-start routes correctly
- `匯入我的 OGSM，檔案在 ~/Downloads/strategy-2026.md` → ogsm-import

Note: supports two-tier structure (company + department profiles). Department goals can be aligned to company G or S, or declared as enabling goals.

#### 把 OGSM 轉成本週行動

Dialogue example:
- `根據我們的 OGSM，這週我應該專注在哪裡？`

Outputs: priority themes, time allocation guidance, MD check-in schedule, say-no list.

#### 審查計劃或行程

Dialogue examples:
- `審查這份 Q3 路線圖是否對齊我們的 OGSM`
- `這週的行程支持我們的 OGSM 嗎？`

Show the 3-step schedule audit flow: ogsm-calendar-brief → ogsm-audit-schedule → ogsm-realign

#### 追蹤執行進度

**週回顧:**
- `我們來做週 OGSM 檢查`

**HTML 執行報告 — full runnable command:**
```bash
node -e "
const { loadSources } = require('./scripts/ogsm-status/loader');
const { buildViewModel } = require('./scripts/ogsm-status/view-model');
const { render } = require('./scripts/ogsm-status/renderer');
const fs = require('fs');
const sources = loadSources('.ogsm', 'company', 'your-slug');
fs.writeFileSync('ogsm-report.html', render(buildViewModel(sources)));
"
open ogsm-report.html
```

Report sections: Section 1 (progress + MP cards), Section 2 (health counts), Section 3 (diagnostics).

"要讓報告顯示真實數字" subsection:
1. 完成 ogsm-define（有 profile 才能解析）
2. 每週執行 ogsm-weekly-review（產生 actuals 資料）
3. 執行報告指令

**年度計畫表:**
- `產生年度計畫表` → generate mode
- `更新本月實際值` → update mode (month-end)

### 完整技能一覽

Keep all existing skill descriptions. Reorder by workflow sequence:
ogsm-start → ogsm-import → ogsm-define → ogsm-translate → ogsm-calendar-brief → ogsm-audit-plan → ogsm-audit-schedule → ogsm-realign → ogsm-weekly-review → ogsm-plan-annual

Add header note: 「不確定用哪個？說『幫我開始使用 OGSM』，plugin 幫你判斷。」

### 安裝

Add one-line note at top: 「建議先跑快速開始，確認 plugin 運作後再看進階設定。」
Keep all existing install instructions verbatim.

---

## Tone

- Conversational, direct
- Scenario sections: one pain point + one solution, no storytelling fluff
- Technical sections (skill reference, install, storage): keep existing precise tone
- No marketing language ("powerful", "seamless", "effortless")

## Scope

- Bilingual: apply all changes to both English and 繁體中文 blocks
- Do NOT remove any existing content — reorganize and add only
- Do NOT change skill descriptions, install commands, storage layout, or safety principles

## Out of Scope

- Adding screenshots or GIFs
- Adding external wiki or docs site
- Changing plugin functionality
