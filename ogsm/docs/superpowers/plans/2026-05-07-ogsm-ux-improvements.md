# OGSM UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a boot skill (`ogsm-start`), Chinese natural language triggers to all 7 skill descriptions, and `## Handoff` chaining sections — making the OGSM plugin as guided and smooth as Superpowers.

**Architecture:** Three independent layers: (1) new `ogsm-start` entry-point skill that detects profile state and routes; (2) enriched `description:` fields on existing skills for auto-triggering from Chinese natural language; (3) `## Handoff` sections that tell Claude what to invoke next after each skill completes.

**Tech Stack:** Markdown (SKILL.md), TOML (plugin.toml), JSON (.claude-plugin/plugin.json), Shell (validate-architecture.sh). No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-05-07-ogsm-ux-design.md`

**Working directory for all commands:** `ogsm/` (the plugin root, i.e. the directory containing `plugin.toml`)

---

### Task 1: Extend validate-architecture.sh to require ogsm-start (TDD red)

**Files:**
- Modify: `scripts/validate-architecture.sh:7`

- [ ] **Step 1: Open the skills variable on line 7 and add `ogsm-start`**

Change:
```sh
skills="ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-calendar-brief ogsm-realign ogsm-weekly-review"
```
To:
```sh
skills="ogsm-start ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-calendar-brief ogsm-realign ogsm-weekly-review"
```

- [ ] **Step 2: Run validate-architecture.sh and confirm it FAILS**

```bash
bash scripts/validate-architecture.sh
echo "Exit: $?"
```
Expected: exit 1 with an error about missing `skills/ogsm-start/SKILL.md`

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-architecture.sh
git commit -m "test: add ogsm-start to validate-architecture skills list (TDD red)"
```

---

### Task 2: Create ogsm-start skill

**Files:**
- Create: `skills/ogsm-start/SKILL.md`
- Create: `skills/ogsm-start/references/.gitkeep`
- Create: `skills/ogsm-start/scripts/.gitkeep`
- Create: `skills/ogsm-start/assets/.gitkeep`

- [ ] **Step 1: Create the three required subdirectories**

```bash
mkdir -p skills/ogsm-start/references skills/ogsm-start/scripts skills/ogsm-start/assets
touch skills/ogsm-start/references/.gitkeep skills/ogsm-start/scripts/.gitkeep skills/ogsm-start/assets/.gitkeep
```

- [ ] **Step 2: Create `skills/ogsm-start/SKILL.md` with this exact content**

```markdown
---
name: ogsm-start
description: Use when starting any conversation — detects OGSM profile state and routes the user to the right skill. Also triggers on: 「我要開始」「從哪裡開始」「OGSM 怎麼用」「幫我開始」, or when the user's first message has no clear task.
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
   a. Read the company profile. Show: Objective (full text) + first two Goals.
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
- Must not invoke more than one skill per session start.

## Handoff

完成後根據情況推薦或執行下一步：
- 使用者選擇選單項目後 → 自動 invoke 對應 skill（無需等待確認）
```

- [ ] **Step 3: Run validate-architecture.sh and confirm it PASSES**

```bash
bash scripts/validate-architecture.sh
echo "Exit: $?"
```
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-start/
git commit -m "feat: add ogsm-start boot skill with state detection and menu routing"
```

---

### Task 3: Register ogsm-start in plugin manifests

**Files:**
- Modify: `plugin.toml`
- Modify: `.claude-plugin/plugin.json`

- [ ] **Step 1: Add ogsm-start to plugin.toml**

Append to the end of `plugin.toml`:
```toml

[[skills]]
name = "ogsm-start"
path = "skills/ogsm-start/SKILL.md"
```

- [ ] **Step 2: Add ogsm-start to `.claude-plugin/plugin.json`**

The file currently has no `skills` array. Read it first, then add a `skills` array:

```json
{
  "name": "ogsm",
  "description": "Use when users need to create, review, realign, or weekly-review OGSM profiles, plans, schedules, or operating context.",
  "version": "0.1.0",
  "author": {
    "name": "breakingmind"
  },
  "keywords": [
    "ogsm",
    "strategy",
    "planning",
    "alignment",
    "weekly-review"
  ],
  "skills": [
    "ogsm-start",
    "ogsm-define",
    "ogsm-translate",
    "ogsm-audit-plan",
    "ogsm-audit-schedule",
    "ogsm-calendar-brief",
    "ogsm-realign",
    "ogsm-weekly-review"
  ]
}
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh
echo "Exit: $?"
```
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add plugin.toml .claude-plugin/plugin.json
git commit -m "feat: register ogsm-start in plugin.toml and .claude-plugin/plugin.json"
```

---

### Task 4: Update ogsm-define — description + Handoff

**Files:**
- Modify: `skills/ogsm-define/SKILL.md`

- [ ] **Step 1: Update the description line**

Change:
```
description: Use when the user wants to create, repair, or update an OGSM profile, or when another OGSM skill cannot find a usable profile.
```
To:
```
description: Use when the user wants to create, repair, or update an OGSM profile, or when another OGSM skill cannot find a usable profile. Also triggers on: 「幫我建立 OGSM」「我的 OGSM 要怎麼寫」「修改目標」「修改策略」「profile 不見了」「從頭建立」
```

- [ ] **Step 2: Append `## Handoff` section at the end of the file**

```markdown

## Handoff

完成後根據情況推薦或執行下一步：
- 新 profile 剛建立完成 → 推薦 `ogsm-translate`：「profile 已確認，要把它轉成這週的執行優先事項嗎？」
- 修改現有 profile → 推薦 `ogsm-translate`：「profile 已更新，要重新產出執行指引嗎？」
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh && echo "PASS" || echo "FAIL"
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-define/SKILL.md
git commit -m "feat: add Chinese triggers and Handoff to ogsm-define"
```

---

### Task 5: Update ogsm-translate — description + Handoff

**Files:**
- Modify: `skills/ogsm-translate/SKILL.md`

- [ ] **Step 1: Update the description line**

Change:
```
description: Use when the user wants to turn an OGSM profile into weekly or monthly priorities, time allocation guidance, or decision rules.
```
To:
```
description: Use when the user wants to turn an OGSM profile into weekly or monthly priorities, time allocation guidance, or decision rules. Also triggers on: 「這週我要做什麼」「幫我排優先順序」「根據 OGSM 給我方向」「這個月重點是什麼」「OGSM 轉行動」
```

- [ ] **Step 2: Append `## Handoff` section**

```markdown

## Handoff

完成後根據情況推薦或執行下一步：
- 優先事項輸出後 → 推薦二選一：「要審查本週行程是否支持這些優先事項（`ogsm-audit-schedule`），還是審查現有計畫文件（`ogsm-audit-plan`）？」
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh && echo "PASS" || echo "FAIL"
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-translate/SKILL.md
git commit -m "feat: add Chinese triggers and Handoff to ogsm-translate"
```

---

### Task 6: Update ogsm-audit-plan — description + Handoff

**Files:**
- Modify: `skills/ogsm-audit-plan/SKILL.md`

- [ ] **Step 1: Update the description line**

Change:
```
description: Use when the user wants to review a written plan, OKR, roadmap, project spec, weekly plan, or initiative list against their OGSM.
```
To:
```
description: Use when the user wants to review a written plan, OKR, roadmap, project spec, weekly plan, or initiative list against their OGSM. Also triggers on: 「這個計畫對嗎」「審查季度計畫」「OKR 跟 OGSM 有對齊嗎」「幫我看這份路線圖」「計畫有沒有偏離 OGSM」
```

- [ ] **Step 2: Append `## Handoff` section**

```markdown

## Handoff

完成後根據情況推薦或執行下一步：
- 發現缺口或低對齊項目 → 自動 invoke `ogsm-realign`：直接進入修訂模式，無需使用者再說
- 無缺口，完全對齊 → 結束，不推薦後續（使用者自行決定下一步）
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh && echo "PASS" || echo "FAIL"
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-audit-plan/SKILL.md
git commit -m "feat: add Chinese triggers and Handoff to ogsm-audit-plan"
```

---

### Task 7: Update ogsm-audit-schedule — description + Handoff

**Files:**
- Modify: `skills/ogsm-audit-schedule/SKILL.md`

- [ ] **Step 1: Update the description line**

Change:
```
description: Use when the user wants to review a weekly schedule, agenda dump, or normalized calendar brief against their OGSM.
```
To:
```
description: Use when the user wants to review a weekly schedule, agenda dump, or normalized calendar brief against their OGSM. Also triggers on: 「這週行程支持策略嗎」「幫我看行程」「我的時間花得對嗎」「行事曆對嗎」「行程有沒有支持 OGSM」
```

- [ ] **Step 2: Append `## Handoff` section**

```markdown

## Handoff

完成後根據情況推薦或執行下一步：
- 發現缺口或低對齊時段 → 自動 invoke `ogsm-realign`：直接進入行程修訂模式
- 無缺口，完全對齊 → 推薦 `ogsm-weekly-review`：「行程對齊良好，週五可以做週檢查來關閉這個迴圈。」
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh && echo "PASS" || echo "FAIL"
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-audit-schedule/SKILL.md
git commit -m "feat: add Chinese triggers and Handoff to ogsm-audit-schedule"
```

---

### Task 8: Update ogsm-calendar-brief — description + Handoff

**Files:**
- Modify: `skills/ogsm-calendar-brief/SKILL.md`

- [ ] **Step 1: Update the description line**

Change:
```
description: Use when the user wants to prepare a Google Calendar week summary for OGSM schedule audit.
```
To:
```
description: Use when the user wants to prepare a Google Calendar week summary for OGSM schedule audit. Also triggers on: 「幫我整理這週 calendar」「Google 行事曆摘要」「先整理行程再審查」「讀取 Google Calendar」
```

- [ ] **Step 2: Append `## Handoff` section**

```markdown

## Handoff

完成後根據情況推薦或執行下一步：
- 正規化行程表產出後 → 自動 invoke `ogsm-audit-schedule`：直接帶入行程表進行審查（無需使用者再說）
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh && echo "PASS" || echo "FAIL"
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-calendar-brief/SKILL.md
git commit -m "feat: add Chinese triggers and Handoff to ogsm-calendar-brief"
```

---

### Task 9: Update ogsm-realign — description + Handoff

**Files:**
- Modify: `skills/ogsm-realign/SKILL.md`

- [ ] **Step 1: Update the description line**

Change:
```
description: Use after an OGSM audit when the user wants a revised plan, weekly schedule, or action list that better supports their OGSM.
```
To:
```
description: Use after an OGSM audit when the user wants a revised plan, weekly schedule, or action list that better supports their OGSM. Also triggers on: 「幫我調整計畫」「根據審查結果改行程」「我要重新對標」「這份計畫要怎麼修」「修正行程」
```

- [ ] **Step 2: Append `## Handoff` section**

```markdown

## Handoff

完成後根據情況推薦或執行下一步：
- 修訂完成後 → 推薦 `ogsm-weekly-review`：「調整完成，要進行週檢查來確認這個迴圈嗎？」
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh && echo "PASS" || echo "FAIL"
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-realign/SKILL.md
git commit -m "feat: add Chinese triggers and Handoff to ogsm-realign"
```

---

### Task 10: Update ogsm-weekly-review — description + Handoff

**Files:**
- Modify: `skills/ogsm-weekly-review/SKILL.md`

- [ ] **Step 1: Update the description line**

Change:
```
description: Use at the end of a week when the user wants to review OGSM execution or update operating context.
```
To:
```
description: Use at the end of a week when the user wants to review OGSM execution or update operating context. Also triggers on: 「做週檢查」「這週回顧」「OGSM 週回顧」「更新執行脈絡」「這週表現怎麼樣」「關閉這週迴圈」
```

- [ ] **Step 2: Append `## Handoff` section**

```markdown

## Handoff

完成後根據情況推薦或執行下一步：
- 週檢查完成 → 推薦 `ogsm-translate`：「這週迴圈完成。下週一可以再跑 ogsm-translate 把下週優先事項排好。」
```

- [ ] **Step 3: Run validate-architecture.sh**

```bash
bash scripts/validate-architecture.sh && echo "PASS" || echo "FAIL"
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-weekly-review/SKILL.md
git commit -m "feat: add Chinese triggers and Handoff to ogsm-weekly-review"
```

---

### Task 11: Run full test suite and verify

**Files:** None (verification only)

- [ ] **Step 1: Run complete test suite**

```bash
bash scripts/test-scripts.sh
echo "Exit: $?"
```
Expected: exit 0, all tests pass including the architecture check that now validates `ogsm-start`

- [ ] **Step 2: Reinstall plugin locally**

```bash
node scripts/install-claude-code-local.js
```
Expected: `Installed ogsm@local to ~/.claude/plugins/marketplaces/local/external_plugins/ogsm-plugin`

- [ ] **Step 3: Commit test result confirmation**

If all tests pass:
```bash
git log --oneline -12
```
Confirm 11 commits since the start of this plan are all present.
