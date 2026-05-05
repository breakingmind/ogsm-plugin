# OGSM Plugin 設計

## 目的

建立一個 Codex plugin 與一組 skills，協助使用者把 OGSM 真的落實到計劃、行程與週期回顧中。這個 plugin 不只是檢查一份計劃是否符合 OGSM，而是協助使用者建立 OGSM、轉譯成近期優先順序、審查計劃與週行程、提出修正版，並根據實際使用狀況持續調整。

本 plugin 採用教材中的 OGSM 定義：OGSM 是一頁計畫書，從最終目的 O 展開具體目標 G，再以策略 S 提供達標所需資源，最後透過 M 檢核展現執行力。M 不是單一 Measures 欄位，而是包含 **MD 衡量指標** 與 **MP 行動計畫**。核心檢核方式是由後往前推：**MP 完成就可以達成 MD，MD 達成就可以證明 S 有效，S 成立就可以達成 G，G 達成就可以支持 O**。

MVP 的核心循環是：

1. 建立使用者的 OGSM profile。
2. 將 OGSM 轉譯成近期 priorities 與時間配置原則。
3. 審查計劃與週行程是否對齊 OGSM。
4. 產出更可執行的 realign 版本。
5. 透過週回顧檢查落實狀況，並調整後續建議。

## 產品定位

這個 plugin 的角色是「策略教練 + 嚴格稽核者」的混合體。它需要提供清楚的分數、風險與具體修正建議，同時用教練式語氣協助使用者理解問題，而不是只把計劃打回票。

這不是靜態的 OGSM checklist。它是一個 adaptive operating loop：會根據使用者實際怎麼工作、接受或拒絕哪些建議、哪些策略長期沒有被時間支持，逐步調整審查重點與建議方式。所有涉及 OGSM 本身的變更都必須透明，並經使用者確認。

## MVP 範圍

MVP 包含：

- 可散佈的 Codex plugin 結構，包含 OGSM skills 與共用 references。
- 協助沒有 OGSM 的使用者建立最小可用 OGSM profile。
- 審查文字計劃、OKR、roadmap、專案規格與週計劃。
- 審查週行程是否支持 Strategies、MD 衡量指標與 MP 行動計畫。
- 支援使用者貼上粗糙 agenda、匯出行程文字或 OCR 後文字。
- Optional Google Calendar path：若 connector 可用，能產生週行程摘要。
- 三種輸出深度：quick review、full audit、realign/rewrite。
- 輕量 adaptive context，用來記錄反覆模式與使用者偏好。

MVP 不包含：

- 自動修改 calendar。
- 自動修改外部文件。
- 長時間自主監控。
- 複雜外部記憶或分析系統。
- 完整的月度、季度自主營運系統。

## Plugin 結構

```text
ogsm/
  plugin.toml
  skills/
    ogsm-define/
      SKILL.md
      references/
      scripts/
      assets/
    ogsm-translate/
      SKILL.md
      references/
      scripts/
      assets/
    ogsm-audit-plan/
      SKILL.md
      references/
      scripts/
      assets/
    ogsm-audit-schedule/
      SKILL.md
      references/
      scripts/
      assets/
    ogsm-calendar-brief/
      SKILL.md
      references/
      scripts/
      assets/
    ogsm-realign/
      SKILL.md
      references/
      scripts/
      assets/
    ogsm-weekly-review/
      SKILL.md
      references/
      scripts/
      assets/
  references/
    ogsm-principles.md
    ogsm-profile-format.md
    review-rubric.md
    schedule-normalization.md
    output-formats.md
    adaptive-operating-context.md
    tool-policy.md
    progressive-disclosure.md
  scripts/
    validate-profile.*
    normalize-schedule.*
    score-alignment.*
    update-operating-context.*
  assets/
    profile-template.md
    operating-context-template.md
    quick-review-template.md
    full-audit-template.md
    realign-template.md
  examples/
    sample-ogsm-profile.md
    sample-plan-input.md
    sample-schedule-input.md
    sample-quick-review.md
    sample-full-audit.md
    sample-realign-output.md
```

## Skill 架構與漸進式揭露

每個 skill 必須符合 Codex skill 的漸進式揭露原則。`SKILL.md` 只放觸發條件、最小流程、必要工具政策與需要時才讀取的 reference 清單；不可把所有 rubric、範例、模板與長篇說明全部塞進 `SKILL.md`。

每個 skill directory 可以包含：

- `SKILL.md`：入口文件，包含 metadata、使用時機、最小工作流、輸入輸出契約、工具使用規則。
- `references/`：只屬於該 skill 的補充文件，例如特定 rubric、反模式、判斷規則。
- `scripts/`：可重複使用的機械化處理，例如 profile validation、schedule normalization、alignment scoring。
- `assets/`：模板、範例表格、輸出骨架、可複製的 Markdown snippets。

Plugin root 的 `references/`、`scripts/`、`assets/` 放共用資源。Skill 內的 `SKILL.md` 必須明確說明何時讀取共用資源。例如：

- 只有在建立或更新 profile 時讀取 `references/ogsm-profile-format.md`。
- 只有在審查輸出需要評分時讀取 `references/review-rubric.md`。
- 只有在處理行程輸入時讀取 `references/schedule-normalization.md`。
- 只有在使用者要求 quick/full/realign 模式時讀取對應 output template。

若 `scripts/` 已提供可用工具，skill 應優先執行 script，而不是在 `SKILL.md` 中重寫大量規則或用一次性文字處理硬做。若 script 不可用，skill 才降級成純文字推理流程，並在輸出中註明降級原因。

## SKILL.md 內容契約

每個 `SKILL.md` 至少包含：

- `name`：skill 名稱。
- `description`：明確觸發條件，包含使用者可能的自然語言說法。
- `when_to_use`：何時使用，以及何時不要使用。
- `inputs`：接受哪些輸入，例如 OGSM profile、計劃文字、行程摘要、calendar range。
- `outputs`：輸出模式與最小必要欄位。
- `workflow`：3-8 步的最小流程。
- `progressive_disclosure`：該 skill 在什麼情況下讀取哪些 references、scripts、assets。
- `tools`：允許使用的工具、需要使用者授權的工具、不可使用的工具。
- `fallbacks`：外部工具或 connector 不可用時的降級方式。
- `safety`：不得自動修改 OGSM、calendar 或外部文件；需要使用者確認的動作。

`SKILL.md` 應保持短而可掃描。長規則放到 references，格式模板放到 assets，機械化處理放到 scripts。

## Tools 定義

Plugin 需要在共用 `references/tool-policy.md` 中定義工具政策，並在每個 skill 的 `SKILL.md` 中引用自己的子集。

### 共用可用工具

- 檔案讀取：讀取 profile、operating context、references、examples。
- 檔案寫入：只在使用者確認後寫入或更新 profile、operating context、review output。
- Shell/script execution：執行 plugin 內建 scripts，例如 validate profile、normalize schedule、score alignment。
- Google Calendar connector：只供 `ogsm-calendar-brief` 或未來 calendar sync 類 skill 使用；不可由 audit skill 直接假設可用。
- Automations：MVP 不主動使用；未來可用於週回顧提醒，但必須由使用者明確要求。

### 禁止或受限工具行為

- 不得未經使用者確認自動修改 Google Calendar 事件。
- 不得未經使用者確認自動修改外部文件。
- 不得將 connector 不可用視為流程失敗；必須降級為 manual input。
- 不得在未讀取 profile 或未確認 profile 缺漏時產生高信心審查。
- 不得偷偷更新 Objective、Goals、Strategies、MD 或 MP。

### Skill 專屬工具範圍

`ogsm-define`：

- 可讀寫 profile。
- 可使用 profile template asset。
- 可執行 profile validation script。
- 不使用 Google Calendar。

`ogsm-translate`：

- 可讀取 profile 與 adaptive context。
- 可使用 output templates。
- 可更新 operating context，但需使用者確認。
- 不使用 Google Calendar。

`ogsm-audit-plan`：

- 可讀取 profile、rubric、output formats、adaptive context。
- 可執行 alignment scoring script。
- 可寫入 review output，如果使用者要求保存。
- 不使用 Google Calendar。

`ogsm-audit-schedule`：

- 可讀取 profile、schedule normalization reference、rubric、adaptive context。
- 可執行 schedule normalization 與 alignment scoring scripts。
- 可接收 `ogsm-calendar-brief` 的輸出。
- 不直接呼叫 Google Calendar connector。

`ogsm-calendar-brief`：

- 可使用 Google Calendar connector 讀取指定日期範圍。
- 可產生 normalized schedule summary。
- 不做 OGSM alignment scoring。
- 不修改 calendar。

`ogsm-realign`：

- 可讀取 audit output、profile、decision rules、output templates。
- 可產生修正版計劃或行程建議。
- 不直接修改 calendar 或文件。

`ogsm-weekly-review`：

- 可讀取 profile、review history、adaptive context。
- 可更新 adaptive context。
- 若建議修改 OGSM profile，必須先提出 diff 與理由，取得使用者確認後才寫入。

## 核心 Skills

### ogsm-define

建立或更新使用者的 OGSM profile。如果任何其他 skill 啟動時找不到 profile，應先引導使用者進入 `ogsm-define`。

這個 skill 不假設使用者已經懂 OGSM。它會一次問一個問題，從使用者自然語言中的目標開始，逐步整理成：

- Objective：方向、意義與主要意圖。
- Goals：2-5 個具體成果。
- Strategies：達成 Goals 所選用的資源、方法論與工具；不是一般待辦。
- MD：主管或使用者用來檢視策略是否產生成果的衡量指標，需有日期。
- MP：依時間順序排列的行動計畫，需有負責人/單位、協作單位、期間與工作事項。

它會檢查常見品質問題：

- Objective 沒有明確對象、服務範圍、價值、定位或畫面感。
- Goals 沒有從 O 的關鍵字展開，或缺少動詞、名詞、基準點、總量、時間區間。
- Strategies 只是待辦清單，而不是資源、方法論或工具。
- Strategies 沒有檢查資源是否新的、獨特的、會被消耗。
- MD 沒有日期、指標、總量，或無法檢驗 S 的落實度。
- MP 沒有負責人/單位、協作單位、時間順序或工作事項。
- MP、MD、S、G、O 無法由後往前推導成「就可以」鏈。

Profile 只有在使用者確認後才會保存。

### ogsm-translate

將 OGSM profile 轉成當週或當月可執行的操作指引。輸出包含：

- 當前 priority themes。
- 各 Strategy 的建議時間配置。
- 本期應推動的 MP 與應檢查的 MD。
- 不支持 OGSM 的「say no」清單。
- 接受、延後、委派或刪除工作的決策規則。

### ogsm-audit-plan

審查文字計劃、OKR、roadmap、專案規格、週計劃或 initiative list。

這個 skill 會把每個 initiative、task、commitment 或 milestone 映射到 OGSM，並找出：

- 強對齊項目。
- 弱對齊或關聯不清楚的項目。
- 沒有 Strategy 支持的工作。
- 沒有 MD 檢核的 Strategy。
- 沒有 MP 行動計畫的 MD。
- 沒有負責人、協作單位或日期的 MP。
- 過載的 priority。
- 看似重要但不受目前 OGSM 支持的工作。
- 無法通過 `MP → MD → S → G → O` 由後往前檢核的邏輯斷點。

### ogsm-audit-schedule

審查週行程是否對齊 OGSM。MVP 接受粗糙貼上的行程、匯出的 calendar agenda、OCR 後文字，或 `ogsm-calendar-brief` 產生的標準摘要。

這個 skill 會將行程 normalize 成：

- 日期。
- 開始與結束時間，或 duration。
- 事件名稱。
- 事件類型。
- 參與者，如果有。
- 描述或脈絡，如果有。
- 可移動性：固定、可移動、可刪、可委派或未知。
- Strategy、MD 與 MP 關聯。

它會分析該週是否真的在執行 MP、檢查 MD，並把時間投入到最重要的 Strategies。

### ogsm-calendar-brief

Optional Google Calendar path。當 Google Calendar connector 可用時，這個 skill 讀取指定日期範圍，產生 `ogsm-audit-schedule` 可直接使用的標準週行程摘要。

如果 connector 不可用，skill 會平順降級，請使用者貼上 agenda dump。

這個 skill 不直接做 OGSM 對齊審查。它的職責是整理行程輸入，讓 schedule audit 有穩定資料介面。

### ogsm-realign

在審查後產生可執行的修正版。它可以建議：

- 保留。
- 刪除。
- 委派。
- 延後。
- 縮短。
- 合併。
- 移動。
- 新增缺少的 Strategy time block。
- 新增 MD check-in。
- 新增或補齊 MP。

對計劃，它可以把任務改寫成可追溯到 MP、MD、S、G、O 的行動。對行程，它可以提出修正版週時間配置。MVP 不會直接修改外部 calendar 或文件。

### ogsm-weekly-review

在每週結束時關閉循環。它會檢查：

- 哪些 MD 有進展。
- 哪些 Strategies 得到了實際時間。
- 哪些 Strategies 被宣稱重要，但沒有被行程支持。
- 哪些 MP 沒有被排入行程或沒有負責人。
- 哪些事件或任務反覆擠掉 OGSM 工作。
- 是 OGSM 需要修正，還是執行方式需要修正。

它會在使用者確認後更新 adaptive operating context。

## 共用 Agent Loop

每個 audit 類 skill 都遵守這個流程：

1. 讀取 OGSM profile。
2. 如果沒有 profile，轉到 `ogsm-define`。
3. 如果 profile 不完整，詢問最小必要資訊。
4. 解析計劃或行程輸入。
5. 將輸入項目映射到 Objective、Goals、Strategies、MD 與 MP。
6. 由後往前檢查 `MP → MD → S → G → O` 是否合規且合理。
7. 診斷缺口、矛盾、時間配置問題、弱 MD 與缺漏 MP。
8. 只有在答案會實質影響審查時，才追問一個關鍵問題。
9. 產出使用者要求的輸出深度。
10. 若使用者想要可執行修正版，銜接 `ogsm-realign`。

## Adaptive Operating Context

Plugin 會維護一份輕量 operating context，讓它能隨使用狀況調整。這不是隱藏記憶，而是使用者可以檢視與修改的本地紀錄。

它可以追蹤：

- 使用者接受與拒絕過的建議。
- 偏好的輸出風格。
- 偏好的審查深度。
- 深度工作時段。
- 可接受的會議負載。
- 反覆出現的行程衝突。
- 長期沒有被時間支持的 Strategies。
- 反覆太弱或沒有追蹤的 MD。
- 反覆缺少負責人、協作單位或日期的 MP。
- 使用者自己的決策規則。

Plugin 可以據此調整：

- 對使用者常偏離的地方提高審查嚴格度。
- 若會議反覆侵蝕策略時間，優先檢查 calendar load。
- 根據過去週回顧調整時間配置建議。
- 記住使用者偏好直接評分、教練式問題，或先給修正版。

Plugin 不得偷偷修改 OGSM profile。任何 Objective、Goal、Strategy、MD 或 MP 的變更都需要使用者明確確認，並記錄簡短原因。

## Profile 格式

預設 profile 使用可讀的 Markdown，方便使用者直接檢視。

必要欄位：

- Profile name。
- Time horizon。
- Objective。
- Goals。
- Strategies。
- MD。
- MP。
- Review cadence。

建議欄位：

- Current focus period。
- Strategy priority weights。
- Preferred working rhythm。
- Known constraints。
- Decision rules。
- Last reviewed date。

## Review Rubric

Rubric 至少要評分：

- Objective clarity。
- Goal measurability。
- Strategy as resource/method quality。
- MD quality。
- MP executability。
- MP-to-MD linkage。
- MD-to-Strategy linkage。
- Strategy-to-Goal linkage。
- Goal-to-Objective linkage。
- Backward logic: MP to MD to S to G to O。
- Plan alignment。
- Schedule alignment。
- Time allocation realism。
- Execution risk。

分數必須有用途，而不是裝飾。每個低分都要有理由與具體修正建議。

## 輸出模式

### Quick Review

用於快速決策。包含：

- Overall alignment score。
- Top 3 risks。
- Top 3 recommended changes。
- One next action。

### Full Audit

用於較完整的計劃檢查。包含：

- Executive summary。
- OGSM alignment matrix。
- Strengths。
- Gaps。
- MD quality review。
- MP executability review。
- Backward logic review: MP to MD to S to G to O。
- Time allocation analysis，如果有行程輸入。
- Risks and tradeoffs。
- Recommended corrections。
- Open questions。

### Realign / Rewrite

用於使用者想要可執行修正版時。包含：

- Revised plan or schedule。
- Change log，說明改了什麼與為什麼。
- MP、MD、Strategy、Goal、Objective linkage。
- 要刪除、延後、委派或新增的項目。
- Suggested next review point。

## Calendar 輸入策略

MVP 支援兩種行程輸入：

1. Manual agenda dump。
2. Optional Google Calendar summary。

Manual input 必須能容忍混亂文字。Skill 會先產生 normalized schedule summary；如果來源模糊，會先請使用者確認假設，再開始評分。

Google Calendar integration 是 optional。若可用，`ogsm-calendar-brief` 讀取指定週期並產生標準行程摘要。若不可用，流程繼續使用 manual input，不阻斷審查。

## 錯誤處理

如果沒有 OGSM profile：

- 說明需要先建立 baseline OGSM。
- 啟動 `ogsm-define`。

如果 OGSM 不完整：

- 指出最小缺漏欄位。
- 問一個問題補齊。
- 只有在資訊足夠做有意義審查時才繼續。

如果行程輸入混亂：

- 先 normalize。
- 顯示假設。
- 若信心不足，先請使用者確認再評分。

如果 Google Calendar 不可用：

- 降級到 manual agenda input。
- 不阻斷 audit workflow。

如果 MD 或 MP 太弱：

- 標記 review confidence limited。
- 建議更好的 MD、proxy MD，或補齊 MP 的負責人、協作單位、日期與工作事項。
- 如果使用者願意接受 rough review，仍可繼續，但需明確註記限制。

## 測試策略

MVP 測試以 example-driven validation 為主，不只依賴自動化測試。

測試案例：

- 使用者沒有 profile，卻先啟動 plan audit。
- 使用者用自然語言建立 profile。
- 計劃高度對齊 OGSM。
- 計劃有大量無關 task。
- 週行程有太多低對齊會議。
- 週行程沒有 MD check-in。
- 計劃有 MD 但沒有 MP。
- MP 無法往前推導到 MD、S、G、O。
- 混亂 agenda dump normalization。
- Google Calendar 不可用時平順降級。
- 週回顧更新 adaptive context。
- 使用者拒絕某項建議，context 記錄偏好。
- 每個 skill 的 `SKILL.md` 都只包含入口流程，長規則放在 references。
- 每個 skill 都列出允許工具、受限工具與 fallback。
- 每個 references、scripts、assets 項目都有至少一個 skill 會在明確情境下使用。
- `ogsm-audit-schedule` 不直接呼叫 Google Calendar；只接收 manual input 或 `ogsm-calendar-brief` 的 normalized summary。

每個 skill 至少要有一組 sample input 與 expected output shape。

## 未來擴充

後續可以加入：

- Connector-first 的 Google Calendar 讀取。
- 經使用者明確同意後寫回 Calendar。
- 從 Google Docs 或 Notion 匯入 OGSM。
- 月度與季度策略回顧。
- 週回顧提醒 automation。
- 從外部系統追蹤 MD 與 MP 完成狀態。
- Team OGSM mode，支援多 owner。
- 跨 calendar 與 project management 的對齊分析。

## 驗收標準

MVP 成功的標準：

- 新使用者不懂 OGSM 術語，也能建立包含 O、G、S、MD、MP 的可用 profile。
- Plugin 能用該 profile 審查文字計劃與週行程。
- Plugin 能產生 quick review、full audit、realign 三種輸出。
- Optional Google Calendar path 可在 connector 可用時準備行程輸入，並在不可用時平順降級。
- Weekly review 能更新透明的 adaptive context。
- 每個 skill 符合漸進式揭露：入口短、長規則分離、模板放 assets、機械化處理放 scripts。
- 每個 skill 明確定義可用工具、不可用工具、需要使用者確認的工具行為與 connector fallback。
- Plugin 能持續幫使用者更清楚地決定該做什麼、不該做什麼，以及下一週時間應該放在哪裡。
