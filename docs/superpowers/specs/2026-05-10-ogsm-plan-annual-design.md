# 設計規格：ogsm-plan-annual — OGSM 年度計畫表

## Context

OGSM 訂定後，MD（Measure Dashboard）與 MP（Measure Plans）需要隨時間推進。現有設計只有「定義端」（profile 靜態目標）與「回顧端」（weekly review），缺少中間的「前瞻型月度推進計畫」。

本規格新增 `ogsm-plan-annual` skill，填補這個空缺：年初產生全年 MD 里程碑與 MP 月度計畫，每月底自動萃取 weekly review 資料更新實際值，形成計畫 vs 實際的完整追蹤矩陣。

---

## 架構

### 新增元件

```
skills/ogsm-plan-annual/
  SKILL.md
  references/   (.gitkeep)
  scripts/      (.gitkeep)
  assets/       (.gitkeep)

scripts/
  extract-md-actuals.js    ← 從 weekly reviews 萃取 MD 實際值
  generate-annual-plan.js  ← 產生年度計畫表 markdown

.ogsm/plans/               ← 新增儲存路徑
  company/<slug>/<year>-annual.md
  departments/<slug>/<year>-annual.md
```

### 整合點

```
ogsm-translate 完成
  └─ 自動詢問：「要用 ogsm-plan-annual 產生年度計畫表嗎？」
        └─ 是 → 進入 ogsm-plan-annual（generate 模式）

ogsm-weekly-review 執行
  └─ MD 移動摘要段落加入結構化標記（HTML 註解）
        └─ extract-md-actuals.js 掃描此標記

ogsm-plan-annual update（月底呼叫）
  └─ 讀取近期 weekly reviews → 萃取 MD 實際值 → 寫入年度計畫表
```

### 不動的元件

- profile 格式不變
- 現有 hook（H1–H4）不需修改
- weekly-review SKILL.md 只微調輸出格式（加結構化標記）

---

## 年度計畫表格式

檔案路徑：`.ogsm/plans/<scope>/<slug>/<year>-annual.md`

```markdown
# 年度計畫表 · xxx-company · 2026

> O: 成為台灣鋼材市場首選供應商

| 目標 G | 策略 S | 1月 MD | 1月 MP | 2月 MD | 2月 MP | … | 12月 MD | 12月 MP |
|--------|--------|--------|--------|--------|--------|---|---------|---------|
| G1: 市佔率提升 | S1-1 | 計畫: 22% | MP1-1-1 ✓ | 計畫: 25% | MP1-1-2 | … | 計畫: 40% | |
| | | 實際: 23% | MP1-1-2 ✗ | 實際: — | | … | 實際: — | |
| | S1-2 | … | … | … | … | … | … | … |
| G2: 毛利率改善 | S2-1 | … | … | … | … | … | … | … |
```

**格式規則：**

- 每個 Strategy 佔兩列：上列計畫值、下列實際值
- MP 欄顯示當月應執行項目，附完成狀態（✓ / ✗ / 空白=未到期）
- 實際值無法萃取時顯示 `—`
- 部門版在表頭多一行：`> 對齊公司目標: G2 (市佔率提升)`

---

## ogsm-plan-annual Skill 工作流程

### 模式一：Generate（年初建立）

觸發：`ogsm-translate` 完成後詢問，或使用者直接呼叫。

```
1. 讀取 profile（公司或部門）
2. 列出所有 G × S 組合
3. 針對每個 MD，顯示 baseline / target / deadline
4. Claude 建議逐月里程碑（線性分配為預設，說明理由）
5. 使用者確認或調整每個 MD 的月度數值
6. 列出每個 S 的 MP 項目，確認分配到哪些月份
7. 顯示完整年度計畫表預覽
8. 確認後寫入 .ogsm/plans/<scope>/<slug>/<year>-annual.md
```

### 模式二：Update（月底更新實際值）

觸發：使用者呼叫 `ogsm-plan-annual update`。

```
1. 讀取近期 weekly reviews（當月所有週次）
2. extract-md-actuals.js 掃描 MD 移動摘要中的結構化標記
3. 顯示萃取結果請使用者確認
4. 確認後回填當月實際值欄
5. 標記當月 MP 完成狀態（✓ / ✗）
6. 顯示更新後的表格
```

---

## weekly-review 微調

在 MD 移動摘要段落加入結構化標記，供腳本可靠萃取：

```markdown
## MD 移動摘要
<!-- md-actual: MD1=25%, MD2=未變 -->
- MD1 轉換率：22% → 25%（+3%），本週客戶開發活動帶動
```

HTML 註解對使用者不顯眼，腳本精確讀取。

---

## 儲存政策補充

`.ogsm/plans/` 遵循與 `.ogsm/reviews/` 相同的安全約束：

- 寫入前必須顯示目標路徑與內容摘要
- 需使用者明確確認
- H1–H4 hook 現有規則適用

---

## 驗證方式

1. 執行 `ogsm-translate`，確認完成後出現年度計畫詢問
2. 執行 `ogsm-plan-annual`（generate 模式），確認 Claude 提出月度里程碑建議且使用者可調整
3. 確認後檢查 `.ogsm/plans/<scope>/<slug>/<year>-annual.md` 已正確建立
4. 執行 `ogsm-weekly-review`，確認輸出含 `<!-- md-actual: ... -->` 標記
5. 執行 `ogsm-plan-annual update`，確認從 reviews 萃取數值並填入實際值欄
6. 執行 `scripts/validate-architecture.sh`，確認新 skill 結構通過驗證
