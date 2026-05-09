# OGSM Plugin

> **Language / 語言:** [English](#english) · [繁體中文](#繁體中文)

---

<a name="english"></a>
## English

### What Is OGSM?

OGSM connects ambition to daily execution through four layers:

| Layer | Meaning | Key question |
|-------|---------|-------------|
| **O** Objective | Who you serve, what value you create, vivid picture of success | Are we aiming at the right target? |
| **G** Goals | Measurable outcomes — verb + noun + baseline + target + date range | How do we know we've arrived? |
| **S** Strategies | Selected resources, methods, and tools that reach the Goals | What will we actually invest in? |
| **MD** 衡量指標 | Indicators that validate each Strategy is working | Is the investment producing results? |
| **MP** 行動計畫 | Time-ordered action plans that drive MD movement | What are we doing this week? |

The core logic runs backward: **MP → MD → S → G → O**. Every action should trace to a Goal through a Strategy. Strong OGSMs make it easier to say no.

---

### Plugin Overview

This plugin makes OGSM operational through a repeatable loop:

```
ogsm-import (existing OGSM)
    ↓
ogsm-define
    ↓
ogsm-translate
    ↓
ogsm-audit-plan  ──  ogsm-calendar-brief (optional)
ogsm-audit-schedule ──────────────────────────────┘
    ↓
ogsm-realign
    ↓
ogsm-weekly-review
```

Persistent OGSM data is stored under `.ogsm/` in your project. Nothing is written without your explicit confirmation.

---

### Skills

#### `ogsm-import` — Import an existing OGSM

Accepts an existing OGSM from a file path or pasted text. Auto-maps non-standard headings (e.g. "KPI" → MD, "OKR" → Goals) and confirms the mapping with you. Then hands off to `ogsm-define` to validate OGSM principles, fill any gaps, and save the profile.

**Trigger:** "Import my existing OGSM" / "I already have an OGSM, help me bring it in"

---

#### `ogsm-define` — Create or repair an OGSM profile

Build the baseline profile from scratch or fix an existing one. The skill asks one question at a time until all required fields are complete. Department profiles must reference a parent company profile.

**Trigger:** "Help me create an OGSM" / "Review and fix my OGSM"

---

#### `ogsm-translate` — Turn OGSM into operational guidance

Converts the confirmed profile into weekly or monthly priorities, time allocation guidance, MD check-in schedule, and decision rules for saying no.

**Trigger:** "What should I focus on this week based on my OGSM?"

---

#### `ogsm-audit-plan` — Review a plan against OGSM

Maps each item in a plan, OKR, roadmap, or initiative list to a Strategy, MD, and MP. Scores alignment and identifies gaps.

**Trigger:** "Audit this quarterly plan against our OGSM"

---

#### `ogsm-audit-schedule` — Review a weekly schedule against OGSM

Normalizes agenda input into a structured table, then checks whether time allocation supports Strategies and includes MD check-ins and MP execution blocks.

**Trigger:** "Does my schedule this week support our OGSM?"

---

#### `ogsm-calendar-brief` — Prepare a Google Calendar summary

Reads Google Calendar events (if the connector is available) or accepts a pasted agenda dump and produces the normalized schedule table used by `ogsm-audit-schedule`. This is the only skill that may access Google Calendar.

**Trigger:** "Prepare a calendar brief for this week before auditing my schedule"

---

#### `ogsm-realign` — Produce a revised plan or schedule

Takes audit findings and rewrites the plan or schedule with concrete changes. Each change is explained with its MP → MD → S → G → O linkage.

**Trigger:** "Rewrite the schedule based on the audit findings"

---

#### `ogsm-weekly-review` — Close the loop and update context

Compares actual work against Strategies, MD, and MP. Identifies recurring patterns, proposes operating context updates, and surfaces any OGSM profile changes needed.

**Trigger:** "Let's do the weekly OGSM review"

---

### Storage Layout

```
.ogsm/
  index.md
  profiles/
    company/<company-slug>.md
    departments/<department-slug>.md
  context/
    company/<company-slug>.md
    departments/<department-slug>.md
  reviews/
    company/<company-slug>/<YYYY-MM-DD>-<review-type>.md
    departments/<department-slug>/<YYYY-MM-DD>-<review-type>.md
  archive/
```

Initialize storage (preview only, no write):

```bash
node scripts/prepare-storage.js . company <company-slug>
```

Initialize with write:

```bash
node scripts/prepare-storage.js . company <company-slug> --confirm-write
```

---

### Installation

#### Claude Code — Local (from cloned repo)

```bash
node scripts/install-claude-code-local.js
```

Restart Claude Code. Then try:

```
Use ogsm-define to help me create an OGSM profile
```

The installer copies this plugin root to `~/.claude/plugins/marketplaces/local/external_plugins/ogsm-plugin` and registers the plugin.

#### Claude Code — From GitHub

```bash
claude plugin marketplace add https://github.com/breakingmind/ogsm-plugin
claude plugin install ogsm@ogsm-plugin
```

Restart Claude Code.

#### Auto-update (Claude Code)

After installing via either method above, run this once to enable daily automatic updates from GitHub:

```bash
bash scripts/setup-auto-update.sh
```

What it does:
- Converts the plugin install path to a live git clone of this repo
- **macOS** — registers a LaunchAgent that runs `git pull` every day at 09:00
- **Linux** — adds a crontab entry for 09:00 daily
- Logs to `~/.claude/ogsm-plugin-update.log`

To uninstall the auto-updater, remove `~/Library/LaunchAgents/com.ogsm-plugin.update.plist` (macOS) or delete the cron entry (`crontab -e`).

---

#### Codex — Local (from cloned repo)

Add to `~/.codex/config.toml`:

```toml
[marketplaces.ogsm-plugin]
source_type = "local"
source = "/absolute/path/to/ogsm-plugin"

[plugins."ogsm@ogsm-plugin"]
enabled = true
```

Restart Codex.

#### Codex — From GitHub

Ask Codex to fetch and follow:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/breakingmind/ogsm-plugin/refs/heads/master/.codex/INSTALL.md
```

Or add the marketplace manually:

```toml
[marketplaces.ogsm-plugin]
source_type = "git"
source = "https://github.com/breakingmind/ogsm-plugin.git"

[plugins."ogsm@ogsm-plugin"]
enabled = true
```

Restart Codex.

---

### Validation

Run all tests:

```bash
scripts/test-scripts.sh
```

Run architecture checks only:

```bash
scripts/validate-architecture.sh
```

---

### Safety

- **No silent writes.** Every write to `.ogsm/` requires showing the target path, a content summary or diff, and receiving confirmation.
- **No OGSM field changes without confirmation.** Objective, Goals, Strategies, MD, and MP are never changed silently.
- **No calendar modifications.** The plugin only reads Google Calendar (via `ogsm-calendar-brief`). No events are created, modified, or deleted.
- **Claude Code hooks** (H1–H4) enforce these rules mechanically on top of skill instructions. Codex relies on SKILL.md text instructions only.

---

<a name="繁體中文"></a>
## 繁體中文

### 什麼是 OGSM？

OGSM 把組織的抱負連結到每日執行，分為四個層次：

| 層次 | 意義 | 核心問題 |
|------|------|---------|
| **O** Objective 目標 | 服務對象、創造的價值、成功的具體圖像 | 我們瞄準的方向對嗎？ |
| **G** Goals 目標值 | 可量化的成果 — 動詞＋名詞＋基準＋目標量＋日期 | 我們怎麼知道到達了？ |
| **S** Strategies 策略 | 選定的資源、方法與工具 | 我們實際要投入什麼？ |
| **MD** 衡量指標 | 驗證每項策略是否奏效的指標 | 投入是否正在產生結果？ |
| **MP** 行動計畫 | 推動 MD 移動的時序行動計畫 | 這週我們在做什麼？ |

核心邏輯從後往前驗證：**MP → MD → S → G → O**。每項行動都應該能透過策略追溯到一個目標值。好的 OGSM 讓「說不」變得更容易。

---

### Plugin 概覽

這個 plugin 透過一個可重複的迴圈讓 OGSM 真正落地：

```
ogsm-import（匯入既有 OGSM）
    ↓
ogsm-define（建立 profile）
    ↓
ogsm-translate（轉化為優先事項）
    ↓
ogsm-audit-plan（審查計劃）  ──  ogsm-calendar-brief（選用）
ogsm-audit-schedule（審查行程）────────────────────────┘
    ↓
ogsm-realign（重新對標）
    ↓
ogsm-weekly-review（週檢查 · 更新執行脈絡）
```

OGSM 資料儲存於專案的 `.ogsm/` 目錄。任何寫入都需要您明確確認。

---

### 各項技能說明

#### `ogsm-import` — 匯入既有 OGSM

接受以檔案路徑或直接貼上的方式提供既有 OGSM 內容。自動對映非標準標題（例如「KPI」→ MD、「OKR」→ Goals），並請您確認對映結果。確認後交由 `ogsm-define` 驗證 OGSM 原則、補齊缺漏欄位，並儲存 profile。

**觸發時機：** 「匯入我的 OGSM」 / 「我有既有的 OGSM，幫我帶進來」

---

#### `ogsm-define` — 建立或修復 OGSM profile

從零開始建立基準 profile，或修復現有的 profile。技能每次只問一個問題，直到所有必要欄位填齊。部門 profile 必須參照上層的公司 profile。

**觸發時機：** 「幫我建立一份 OGSM」 / 「審查並修正我的 OGSM」

---

#### `ogsm-translate` — 將 OGSM 轉化為執行指引

把已確認的 profile 轉化為每週或每月的優先主題、時間分配建議、MD 檢核時程，以及說不的決策規則。

**觸發時機：** 「根據我們的 OGSM，這週我應該專注在哪裡？」

---

#### `ogsm-audit-plan` — 審查計劃是否對齊 OGSM

把計劃、OKR、路線圖或行動清單中的每一項，對應到策略、MD 與 MP，評分並找出缺口。

**觸發時機：** 「審查這份季度計劃是否對齊我們的 OGSM」

---

#### `ogsm-audit-schedule` — 審查週行程是否支持 OGSM

將議程輸入正規化為結構化表格，再檢查時間分配是否支持策略，以及是否包含 MD 檢核與 MP 執行的時段。

**觸發時機：** 「這週的行程是否支持我們的 OGSM？」

---

#### `ogsm-calendar-brief` — 準備 Google Calendar 摘要

在 connector 可用時讀取 Google Calendar 活動（或接受手動貼上的議程），產出 `ogsm-audit-schedule` 所需的正規化行程表。這是唯一可存取 Google Calendar 的技能。

**觸發時機：** 「在審查行程前，先幫我準備這週的 calendar 摘要」

---

#### `ogsm-realign` — 產出修訂後的計劃或行程

把審查發現轉化為具體修改，重寫計劃或行程。每項變更都會附上 MP → MD → S → G → O 的連結說明。

**觸發時機：** 「根據審查結果重寫行程」

---

#### `ogsm-weekly-review` — 關閉迴圈，更新執行脈絡

比較實際工作與策略、MD、MP 的落差。找出週期性模式，提出執行脈絡更新建議，以及 OGSM profile 可能需要調整的地方。

**觸發時機：** 「我們來做週 OGSM 檢查」

---

### 儲存結構

```
.ogsm/
  index.md
  profiles/
    company/<公司代號>.md
    departments/<部門代號>.md
  context/
    company/<公司代號>.md
    departments/<部門代號>.md
  reviews/
    company/<公司代號>/<YYYY-MM-DD>-<review-type>.md
    departments/<部門代號>/<YYYY-MM-DD>-<review-type>.md
  archive/
```

預覽儲存初始化（不寫入）：

```bash
node scripts/prepare-storage.js . company <公司代號>
```

確認後建立：

```bash
node scripts/prepare-storage.js . company <公司代號> --confirm-write
```

---

### 安裝方式

#### Claude Code — 本機安裝（從 clone 的 repo）

```bash
node scripts/install-claude-code-local.js
```

重啟 Claude Code，然後試試：

```
請使用 ogsm-define 幫我建立一份 OGSM profile
```

安裝程式會把這個 plugin 根目錄複製到 `~/.claude/plugins/marketplaces/local/external_plugins/ogsm-plugin`，並自動註冊 plugin。

#### Claude Code — 從 GitHub 安裝

```bash
claude plugin marketplace add https://github.com/breakingmind/ogsm-plugin
claude plugin install ogsm@ogsm-plugin
```

重啟 Claude Code。

#### 自動更新（Claude Code）

安裝完成後，執行一次下列指令即可啟用每日自動從 GitHub 更新：

```bash
bash scripts/setup-auto-update.sh
```

功能說明：
- 將 plugin 安裝路徑轉換為本 repo 的 git clone
- **macOS** — 建立 LaunchAgent，每天 09:00 自動執行 `git pull`
- **Linux** — 寫入 crontab，每天 09:00 執行
- 更新記錄寫入 `~/.claude/ogsm-plugin-update.log`

如需移除自動更新：刪除 `~/Library/LaunchAgents/com.ogsm-plugin.update.plist`（macOS），或用 `crontab -e` 刪除對應行（Linux）。

---

#### Codex — 本機安裝（從 clone 的 repo）

在 `~/.codex/config.toml` 加入：

```toml
[marketplaces.ogsm-plugin]
source_type = "local"
source = "/絕對路徑/ogsm-plugin"

[plugins."ogsm@ogsm-plugin"]
enabled = true
```

重啟 Codex，然後試試：

```
請使用 ogsm-audit-plan 審查這份計劃是否對齊組織 OGSM
```

#### Codex — 從 GitHub 安裝

請 Codex 讀取並依照這份說明安裝：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/breakingmind/ogsm-plugin/refs/heads/master/.codex/INSTALL.md
```

或手動加入 marketplace：

```toml
[marketplaces.ogsm-plugin]
source_type = "git"
source = "https://github.com/breakingmind/ogsm-plugin.git"

[plugins."ogsm@ogsm-plugin"]
enabled = true
```

重啟 Codex。

---

### 驗證

執行所有測試：

```bash
scripts/test-scripts.sh
```

僅執行架構檢查：

```bash
scripts/validate-architecture.sh
```

---

### 安全原則

- **不靜默寫入。** 寫入任何 `.ogsm/` 檔案前，必須顯示目標路徑、內容摘要或差異，並取得確認。
- **不在未確認下修改 OGSM 欄位。** Objective、Goals、Strategies、MD、MP 不會被靜默變更。
- **不修改 Calendar。** Plugin 只透過 `ogsm-calendar-brief` 讀取 Google Calendar，不建立、修改或刪除任何活動。
- **Claude Code hooks**（H1–H4）在技能指令之上，以腳本層機械化執行上述規則。Codex 環境則只靠 SKILL.md 文字指令驅動。
