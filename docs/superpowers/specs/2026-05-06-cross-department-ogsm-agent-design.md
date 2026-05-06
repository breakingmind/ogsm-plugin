# Cross-Department OGSM Alignment Agent Design

## Purpose

The OGSM plugin should evolve from a single-plan audit tool into an operating alignment tool for organizations. The next agentic capability is a delegated cross-department alignment agent: a user can assign it to compare company OGSM against department OGSMs, and it should independently gather available local inputs, analyze alignment, and deliver a usable report.

This design intentionally starts from one concrete agent skill before extracting a broad agent framework.

## Recommended Approach

Implement a focused skill named `ogsm-align-departments`.

This skill handles company-to-department OGSM alignment reports. It reads local `.ogsm/` profiles first, falls back to pasted input when profiles are missing, and produces a report with executive summary, operating matrix, gaps, dependencies, and revision recommendations.

Add a small reference named `references/delegated-agent-delivery.md` to define the minimum contract for delegated agent skills:

1. Understand assigned outcome.
2. Inventory available sources.
3. Handle missing data with the smallest possible user request.
4. Analyze independently.
5. Deliver a complete artifact.
6. State assumptions, limitations, and next actions.

Do not create a broad agent framework yet. Generalize only after this skill is dogfooded and pressure tested.

## Inputs

Primary inputs:

- `.ogsm/profiles/company/<company-slug>.md`
- `.ogsm/profiles/departments/<department-slug>.md`

Fallback inputs:

- User-pasted company OGSM.
- User-pasted department OGSMs.
- Handoff to `ogsm-define` when a required profile does not exist and the user wants to create one.

Out of scope for this first version:

- Google Docs, Drive, Notion, CRM, Teams, or other external document sources.
- Direct edits to Google Calendar, external docs, CRM, Teams, or Linear.

## Outputs

The skill should produce a cross-department alignment report with these sections:

- Executive summary: per-department alignment score, top risks, and highest-leverage fixes.
- Operating alignment matrix: department O/G/S/MD/MP mapped to company O/G/S/MD/MP.
- Gap analysis: missing support, duplicated ownership, conflicting strategies, unclear dependencies, and weak metrics.
- Revision recommendations: concrete changes each department should consider.
- Assumptions and missing data: sources read, profiles missing, confidence level, and questions that affect the report.
- Next action: one recommended management action or follow-up review.

The report must not silently rewrite any OGSM profile. If the user wants to apply revisions, the skill should hand off to a future apply workflow.

## Agentic Boundary

The first version should feel agentic because it can be assigned a deliverable and complete it within clear boundaries.

Allowed:

- Read project-local OGSM profiles.
- Compare multiple department profiles against a company profile.
- Produce a finished report without asking the user to guide every step.
- Ask for the smallest missing input only when required.
- Recommend revisions.

Restricted:

- Do not write `.ogsm/` files without explicit confirmation.
- Do not modify external systems.
- Do not update Objective, Goals, Strategies, MD, or MP silently.
- Do not hide missing data or low-confidence assumptions.

## Skill Architecture

Add:

- `ogsm/skills/ogsm-align-departments/SKILL.md`
- `ogsm/references/cross-department-alignment.md`
- `ogsm/references/delegated-agent-delivery.md`
- `ogsm/assets/cross-department-alignment-report-template.md`
- `ogsm/examples/sample-cross-department-alignment.md`

Update:

- `ogsm/plugin.toml`
- `ogsm/.codex-plugin/plugin.json`
- `ogsm/.claude-plugin/plugin.json`
- `ogsm/README.md`
- `ogsm/scripts/validate-architecture.sh`
- `ogsm/references/progressive-disclosure.md`
- `ogsm/references/skill-pressure-tests.md`

Optional script:

- `ogsm/scripts/list-ogsm-profiles.js` to inventory company and department profiles under `.ogsm/`.

The script should only discover files and produce structured metadata. Semantic alignment remains in the skill because it requires judgment.

## Scoring Model

Score each department from 1 to 5 across:

- Objective support for company Objective.
- Goal contribution to company Goals.
- Strategy fit and non-conflict.
- MD usefulness and roll-up potential.
- MP ownership, dependencies, and executability.
- Backward logic from department MP to company O.

Every score below 4 requires a reason and a concrete correction.

## Testing And Validation

Validation should check:

- Skill directory exists with `references/`, `scripts/`, and `assets/`.
- Plugin manifests include `ogsm-align-departments`.
- The skill references delegated delivery and cross-department alignment policy.
- The skill refuses external writes in MVP.
- The report template exists.
- Pressure tests include missing company profile, missing department profile, conflicting department strategies, duplicate ownership, and weak MD roll-up.

Dogfood with at least one company OGSM and two department OGSM examples before marking implementation complete.

## Future Linear Direction

Create separate Linear issues for:

- Implementing `ogsm-align-departments`.
- Defining the delegated agent delivery contract.
- Future confirmed apply workflow for cross-department revisions.
- Future external document source integration.
- Future multi-source operating agent cadence.

These issues should be written in Traditional Chinese so the product direction remains usable for the Double Steel team.
