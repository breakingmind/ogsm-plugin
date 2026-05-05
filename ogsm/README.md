# OGSM Plugin

This plugin helps users make OGSM operational through a repeatable loop:

1. Define an OGSM profile.
2. Translate it into priorities and time allocation guidance.
3. Audit plans and schedules.
4. Realign work into a more executable version.
5. Review weekly execution and update adaptive context.

## Skills

- `ogsm-define`: create or repair the baseline OGSM profile.
- `ogsm-translate`: convert OGSM into priorities, time allocation, and decision rules.
- `ogsm-audit-plan`: review plans, OKRs, roadmaps, specs, and initiatives.
- `ogsm-audit-schedule`: review weekly schedules or agenda dumps.
- `ogsm-calendar-brief`: optionally prepare a Google Calendar summary for schedule audit.
- `ogsm-realign`: produce a revised plan or schedule after audit.
- `ogsm-weekly-review`: close the loop and update adaptive operating context.

## Architecture

The plugin uses progressive disclosure:

- `SKILL.md` files are short entrypoints.
- Long rules live in `references/`.
- Templates live in `assets/`.
- Repeatable mechanical work lives in `scripts/`.
- Examples live in `examples/`.

## Safety

The MVP never modifies calendars, external documents, Objective, Goals, Strategies, MD, or MP without explicit user confirmation.

If Google Calendar is unavailable, the calendar workflow falls back to manual agenda input.

## Codex Local Install

This repository includes a Codex marketplace manifest and plugin manifest:

- Repository marketplace: `./.agents/plugins/marketplace.json`
- Codex plugin manifest: `./ogsm/.codex-plugin/plugin.json`
- Legacy MVP manifest: `./ogsm/plugin.toml`

To install from a cloned repo, add the repository as a local Codex marketplace in `~/.codex/config.toml`:

```toml
[marketplaces.ogsm-plugin-mvp]
source_type = "local"
source = "/absolute/path/to/ogsm-plugin-mvp"
```

Then enable the plugin:

```toml
[plugins."ogsm@ogsm-plugin-mvp"]
enabled = true
```

Restart Codex and try:

```text
請使用 ogsm-define 幫我建立一份 OGSM profile
```

or:

```text
請使用 ogsm-audit-plan 審查這份計劃是否對齊組織 OGSM
```

If you cloned the repository to this machine's current workspace, the marketplace path is:

```text
/Users/breakingmind/Documents/Codex/2026-05-05/superpowers-brainstorming-users-breakingmind-codex-plugins
```

## Claude Code Local Install

This bundle can be installed as a local Claude Code plugin from a cloned repo.

From the repository root, run:

```bash
node ogsm/scripts/install-claude-code-local.js
```

Then restart Claude Code and try:

```text
請使用 ogsm-define 幫我建立一份 OGSM profile
```

or:

```text
請使用 ogsm-audit-plan 審查這份計劃是否對齊組織 OGSM
```

The installer copies `ogsm/` into:

```text
~/.claude/plugins/marketplaces/local/external_plugins/ogsm
```

It also registers and enables `ogsm@local` in Claude Code's local plugin files.

## Validation

Run:

```bash
ogsm/scripts/test-scripts.sh
```
