# OGSM Plugin UX Design — Superpowers-Grade Guidance

**Date:** 2026-05-07  
**Status:** Approved  
**Goal:** Make the OGSM plugin as guided and smooth as the Superpowers plugin — auto-triggering, clear starting point, fluid skill chaining.

---

## Problem

The OGSM plugin has 7 functional skills but no entry point. A first-time user doesn't know where to start, has to remember skill names, and gets no guidance on what to do after each skill completes. The result is a plugin that works when you already know how to use it — not one that teaches you as you go.

---

## Success Criteria

1. **No memorization required** — natural language in Traditional Chinese routes to the correct skill automatically.
2. **Clear starting point** — opening Claude Code shows the user their OGSM state and what to do next.
3. **Automatic skill chaining** — completing one skill naturally leads into the next without the user having to re-explain context.

---

## Primary Use Case

Manager + team: one company-level OGSM profile, multiple department profiles with parent-child relationships. The main loop is: define profile → translate into priorities → audit plan/schedule → realign → weekly review.

---

## Design

### Component 1: `ogsm-start` Boot Skill

A new skill that acts as the session entry point, modelled on Superpowers' `using-superpowers`.

**Description (triggers):**
```
Use when starting any conversation — detects OGSM profile state and routes
the user to the right skill. Also triggers on: "我要開始", "從哪裡開始",
"OGSM 怎麼用", "幫我開始", first message with no clear task.
```

**Workflow:**

1. Check whether `.ogsm/profiles/` exists and contains `.md` files.
2. **No profiles (new user):**
   - Explain OGSM in one sentence (O/G/S/MD/MP).
   - Ask: company profile or department profile?
   - Invoke `ogsm-define`.
3. **Company profile exists, no department profiles:**
   - Show company profile summary (Objective + first two Goals).
   - Offer menu: ① Build department profile → `ogsm-define` ② Audit plan → `ogsm-audit-plan` ③ Audit schedule → see schedule source branch below ④ Weekly review → `ogsm-weekly-review`
4. **Multiple profiles (company + one or more departments):**
   - Ask which profile to work with.
   - Show same menu after selection.

**Schedule source branch (triggered when user picks "Audit schedule"):**

```
ogsm-start asks: 「你的行程來源是？」
  A) 手動貼上文字議程 → invoke ogsm-audit-schedule directly
  B) 從 Google Calendar 讀取 → invoke ogsm-calendar-brief → auto-invoke ogsm-audit-schedule
```

This branch is the only point where Google Calendar access is offered. `ogsm-start` itself does not read the calendar — it only routes to `ogsm-calendar-brief` which handles the read.

**Constraints:** Read-only. No Google Calendar reads (routing only). No file writes.

---

### Component 2: Natural Language Trigger Rewrites

All seven skill `description:` fields are updated to include Traditional Chinese colloquial triggers alongside the English description. Pattern: English summary first, followed by quoted Chinese triggers.

| Skill | Chinese triggers added |
|-------|----------------------|
| `ogsm-define` | 「幫我建立 OGSM」「我的 OGSM 要怎麼寫」「修改目標」「profile 不見了」 |
| `ogsm-translate` | 「這週我要做什麼」「幫我排優先順序」「根據 OGSM 給我方向」「這個月重點是什麼」 |
| `ogsm-audit-plan` | 「這個計畫對嗎」「審查季度計畫」「OKR 跟 OGSM 有對齊嗎」「幫我看這份路線圖」 |
| `ogsm-audit-schedule` | 「這週行程支持策略嗎」「幫我看行程」「我的時間花得對嗎」「行事曆對嗎」 |
| `ogsm-calendar-brief` | 「幫我整理這週 calendar」「Google 行事曆摘要」「先整理行程再審查」 |
| `ogsm-realign` | 「幫我調整計畫」「根據審查結果改行程」「我要重新對標」「這份計畫要怎麼修」 |
| `ogsm-weekly-review` | 「做週檢查」「這週回顧」「OGSM 週回顧」「更新執行脈絡」「這週表現怎麼樣」 |

**Rules:**
- Each skill gets 4–8 Chinese triggers.
- Triggers use 「」 quoting and comma separation.
- Original English description is preserved as the first sentence.

---

### Component 3: Handoff Protocol

Each SKILL.md gets a `## Handoff` section at the end. Two handoff modes:

- **Auto-invoke:** The next skill is a direct continuation; the user almost never wants to stop. Claude invokes it without asking.
- **Recommend (wait for confirmation):** The next skill requires new user input or the user may want to pause.

| Skill | Next skill | Mode | Condition |
|-------|-----------|------|-----------|
| `ogsm-start` | Selected skill | Auto-invoke | User picks from menu |
| `ogsm-define` | `ogsm-translate` | Recommend | New profile just created |
| `ogsm-translate` | `ogsm-audit-schedule` or `ogsm-audit-plan` | Recommend (binary choice) | Always |
| `ogsm-audit-plan` | `ogsm-realign` | Auto-invoke | Gaps found |
| `ogsm-audit-plan` | — | End | No gaps |
| `ogsm-audit-schedule` | `ogsm-realign` | Auto-invoke | Gaps found |
| `ogsm-audit-schedule` | `ogsm-weekly-review` | Recommend | No gaps (suggest Friday review) |
| `ogsm-calendar-brief` | `ogsm-audit-schedule` | Auto-invoke | Always |
| `ogsm-realign` | `ogsm-weekly-review` | Recommend | Always |
| `ogsm-weekly-review` | `ogsm-translate` | Recommend | Close of loop (suggest next Monday) |

**Handoff section format in SKILL.md:**
```markdown
## Handoff

完成後根據情況推薦或執行下一步：
- [condition] → [invoke / recommend] `ogsm-xxx`：[one-line reason]
```

---

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `skills/ogsm-start/SKILL.md` |
| Create | `skills/ogsm-start/references/` `.gitkeep` |
| Create | `skills/ogsm-start/scripts/` `.gitkeep` |
| Create | `skills/ogsm-start/assets/` `.gitkeep` |
| Modify | `skills/ogsm-define/SKILL.md` — description + Handoff |
| Modify | `skills/ogsm-translate/SKILL.md` — description + Handoff |
| Modify | `skills/ogsm-audit-plan/SKILL.md` — description + Handoff |
| Modify | `skills/ogsm-audit-schedule/SKILL.md` — description + Handoff |
| Modify | `skills/ogsm-calendar-brief/SKILL.md` — description + Handoff |
| Modify | `skills/ogsm-realign/SKILL.md` — description + Handoff |
| Modify | `skills/ogsm-weekly-review/SKILL.md` — description + Handoff |
| Modify | `plugin.toml` — add `ogsm-start` entry |
| Modify | `.claude-plugin/plugin.json` — add `ogsm-start` to skills list |
| Modify | `scripts/validate-architecture.sh` — add `ogsm-start` to skills list |

---

## Out of Scope

- Visual companion or browser-based mockups
- Changes to scripts, references, or assets directories
- Changes to hook behaviour (H1–H4)
- Multi-language support beyond Traditional Chinese + English
