'use strict';
const { parseArrow } = require('./compute');

const ANNOT_RE = /<!--\s*goal_type:\s*(\w+)(?:[^>]*\|\s*parent_ref:\s*([\w-]+))?/i;

function parseGoalAnnotation(goalText) {
  const m = String(goalText || '').match(ANNOT_RE);
  if (!m) return { goal_type: null, parent_ref: null };
  return { goal_type: m[1] || null, parent_ref: m[2] || null };
}

function diagnose({ profile, actuals, mpStatus, departments }) {
  const errors = [];
  const warnings = [];

  // --- Company profile diagnostics ---
  profile.goals.forEach((_goalText, gi) => {
    const stratId = `S${gi + 1}`;
    const mdId = `MD${gi + 1}`;
    const mdText = profile.measures[gi] || null;

    if (!mdText) {
      warnings.push({ type: 'strategy_no_md', severity: 'warning', item_id: stratId,
        message: `${stratId} has no corresponding measure (MD).` });
      return;
    }

    const { baseline, target } = parseArrow(mdText);
    if (baseline === null || target === null) {
      warnings.push({ type: 'md_no_target', severity: 'warning', item_id: mdId,
        message: `${mdId} has no parseable baseline → target arrow.` });
    }

    const actual = (actuals && actuals[mdId] !== undefined) ? actuals[mdId] : null;
    if (actual === null) {
      warnings.push({ type: 'md_no_evidence', severity: 'warning', item_id: mdId,
        message: `${mdId} has no actual value recorded.` });
    }
  });

  if (!profile.plans || profile.plans.length === 0) {
    warnings.push({ type: 'no_plans', severity: 'warning', item_id: 'MP',
      message: 'Profile has no plans (MP) defined.' });
  }

  // --- Department diagnostics ---
  const companyGoalCount = profile.goals.length;
  (departments || []).forEach(dept => {
    const slug = (dept.meta && dept.meta.slug) || 'unknown';
    (dept.goals || []).forEach((goalText, gi) => {
      const itemId = `${slug}-G${gi + 1}`;
      const { goal_type, parent_ref } = parseGoalAnnotation(goalText);

      if (!goal_type) {
        warnings.push({ type: 'missing_goal_type', severity: 'warning', item_id: itemId,
          message: `${itemId}: no goal_type annotation found.` });
      }

      if (parent_ref) {
        const refMatch = parent_ref.match(/[Gg](\d+)$/);
        if (refMatch) {
          const refN = parseInt(refMatch[1], 10);
          if (refN > companyGoalCount) {
            errors.push({ type: 'broken_parent_ref', severity: 'error', item_id: itemId,
              message: `${itemId}: parent_ref "${parent_ref}" references company-G${refN} which does not exist (company has ${companyGoalCount} goals).` });
          }
        }
      }
    });
  });

  errors.sort((a, b) => a.item_id < b.item_id ? -1 : a.item_id > b.item_id ? 1 : 0);
  warnings.sort((a, b) => a.item_id < b.item_id ? -1 : a.item_id > b.item_id ? 1 : 0);
  return [...errors, ...warnings];
}

if (require.main === module) {
  const assert = require('assert');
  const path = require('path');
  const fs = require('fs');
  const { parseProfile } = require('./parse-profile');

  const fixtureDir = path.join(__dirname, '../../examples/fixtures/ogsm-status');
  const gapProfile = parseProfile(fs.readFileSync(path.join(fixtureDir, 'profile-gap.md'), 'utf8'));
  const minimalProfile = parseProfile(fs.readFileSync(path.join(fixtureDir, 'profile-minimal.md'), 'utf8'));
  const salesProfile = parseProfile(fs.readFileSync(path.join(fixtureDir, 'dept-profile-sales.md'), 'utf8'));

  // parseGoalAnnotation
  const ann1 = parseGoalAnnotation('Grow rate. <!-- goal_type: aligned | parent_ref: company-G1 -->');
  assert.strictEqual(ann1.goal_type, 'aligned', 'parseGoalAnnotation goal_type');
  assert.strictEqual(ann1.parent_ref, 'company-G1', 'parseGoalAnnotation parent_ref');

  const ann2 = parseGoalAnnotation('Plain goal text with no annotation.');
  assert.strictEqual(ann2.goal_type, null, 'no annotation → null goal_type');
  assert.strictEqual(ann2.parent_ref, null, 'no annotation → null parent_ref');

  // gap profile: strategy_no_md for S2, S3
  const d1 = diagnose({ profile: gapProfile, actuals: {}, mpStatus: {}, departments: [] });
  const types1 = d1.map(x => x.type);
  assert.ok(types1.filter(t => t === 'strategy_no_md').length === 2, 'S2 and S3 get strategy_no_md');
  assert.ok(types1.includes('md_no_evidence'), 'MD1 with no actual → md_no_evidence');
  assert.ok(types1.includes('no_plans'), 'empty plans → no_plans');

  // gap profile: S2/S3 have no md_no_evidence (there is no MD to have evidence for)
  const noMdItems = d1.filter(x => x.type === 'strategy_no_md');
  assert.ok(noMdItems.some(x => x.item_id === 'S2'), 'S2 reported');
  assert.ok(noMdItems.some(x => x.item_id === 'S3'), 'S3 reported');

  // gap profile: md_no_target — MD1 has arrow so should NOT appear
  assert.ok(!types1.includes('md_no_target'), 'MD1 has arrow — no md_no_target');

  // minimal profile with actuals: no warnings
  const d2 = diagnose({ profile: minimalProfile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: {}, departments: [] });
  const types2 = d2.map(x => x.type);
  assert.ok(!types2.includes('strategy_no_md'), 'minimal profile: no strategy_no_md');
  assert.ok(!types2.includes('md_no_evidence'), 'with actuals: no md_no_evidence');

  // dept profile: no broken_parent_ref (company has G1)
  const d3 = diagnose({
    profile: minimalProfile,
    actuals: { MD1: '105', MD2: '4.5' },
    mpStatus: {},
    departments: [salesProfile],
  });
  const errors3 = d3.filter(x => x.severity === 'error');
  assert.strictEqual(errors3.length, 0, 'valid parent_ref → no errors');

  // broken_parent_ref: dept goal references company-G5 (company only has 2 goals)
  const brokenDeptProfile = {
    meta: { slug: 'ops', name: 'Ops', parent: 'company/example-corp' },
    goals: ['Do something. <!-- goal_type: aligned | parent_ref: company-G5 -->'],
    strategies: [], measures: [], plans: [],
  };
  const d4 = diagnose({ profile: minimalProfile, actuals: {}, mpStatus: {}, departments: [brokenDeptProfile] });
  const broken = d4.filter(x => x.type === 'broken_parent_ref');
  assert.strictEqual(broken.length, 1, 'broken parent_ref detected');
  assert.strictEqual(broken[0].severity, 'error', 'broken_parent_ref is error severity');
  assert.ok(broken[0].message.includes('company-G5'), 'message names bad ref');

  // missing_goal_type
  const unannotatedDept = {
    meta: { slug: 'hr', name: 'HR', parent: 'company/example-corp' },
    goals: ['Hire 5 engineers by Q2.'],
    strategies: [], measures: [], plans: [],
  };
  const d5 = diagnose({ profile: minimalProfile, actuals: {}, mpStatus: {}, departments: [unannotatedDept] });
  const missing = d5.filter(x => x.type === 'missing_goal_type');
  assert.strictEqual(missing.length, 1, 'missing goal_type detected');
  assert.strictEqual(missing[0].severity, 'warning', 'missing_goal_type is warning');

  // ordering: errors before warnings
  const d6 = diagnose({ profile: gapProfile, actuals: {}, mpStatus: {}, departments: [brokenDeptProfile] });
  const sevs6 = d6.map(x => x.severity);
  const firstWarningIdx = sevs6.indexOf('warning');
  const lastErrorIdx = sevs6.lastIndexOf('error');
  assert.ok(lastErrorIdx < firstWarningIdx || firstWarningIdx === -1, 'errors before warnings');

  console.log('diagnose: all assertions passed');
}

module.exports = { diagnose, parseGoalAnnotation };
