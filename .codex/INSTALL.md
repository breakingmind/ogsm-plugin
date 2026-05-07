# Install OGSM for Codex

This file is the Codex installation entrypoint for the OGSM plugin.

## What OGSM Provides

OGSM adds these skills:

- `ogsm-start`
- `ogsm-define`
- `ogsm-translate`
- `ogsm-audit-plan`
- `ogsm-audit-schedule`
- `ogsm-calendar-brief`
- `ogsm-realign`
- `ogsm-weekly-review`

The plugin root is this repository root. The Codex plugin manifest is:

```text
.codex-plugin/plugin.json
```

The skills directory is:

```text
skills/
```

## Install From GitHub

Add this to `~/.codex/config.toml`:

```toml
[marketplaces.ogsm-plugin]
source_type = "git"
source = "https://github.com/breakingmind/ogsm-plugin.git"

[plugins."ogsm@ogsm-plugin"]
enabled = true
```

Restart Codex, then verify in a new thread:

```text
請檢查目前可用 skills 清單中是否有 ogsm 開頭的技能；只列出名稱。
```

Expected skills:

```text
ogsm:ogsm-audit-plan
ogsm:ogsm-audit-schedule
ogsm:ogsm-calendar-brief
ogsm:ogsm-define
ogsm:ogsm-realign
ogsm:ogsm-start
ogsm:ogsm-translate
ogsm:ogsm-weekly-review
```

## Install From A Local Checkout

If you already cloned this repository, add this to `~/.codex/config.toml`:

```toml
[marketplaces.ogsm-plugin]
source_type = "local"
source = "/absolute/path/to/ogsm-plugin"

[plugins."ogsm@ogsm-plugin"]
enabled = true
```

Restart Codex and use the same verification prompt above.

## Fallback Manual Skill Install

If the current Codex CLI/App version does not load custom plugin marketplaces, install the skills directly:

1. Clone the repository:

```bash
git clone https://github.com/breakingmind/ogsm-plugin.git
```

2. Copy the skill folders into Codex's user skills directory:

```bash
mkdir -p ~/.codex/skills
cp -R ogsm-plugin/skills/ogsm-* ~/.codex/skills/
```

3. Restart Codex and verify that the `ogsm-*` skills appear.

This fallback installs the skills, not the full plugin metadata. It is useful while custom plugin marketplace support differs across Codex versions.

## Validation

From a cloned repository:

```bash
scripts/validate-architecture.sh
scripts/test-scripts.sh
```

Both commands should exit successfully.
