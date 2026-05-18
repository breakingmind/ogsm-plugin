'use strict';

// MVP rule: if actual exists → at_risk (conservative default).
// DOU-48/49 will replace this with the proper computation engine.
function mdStatus(actual) {
  return actual === null ? 'no_data' : 'at_risk';
}

function healthFromStatuses(statuses) {
  if (!statuses.length || statuses.every(s => s === 'no_data')) return 'no_data';
  if (statuses.some(s => s === 'off_track')) return 'off_track';
  if (statuses.some(s => s === 'at_risk')) return 'at_risk';
  return 'on_track';
}

function parseOwner(mpText) {
  const m = mpText.match(/owner:\s*([^,，]+)/i);
  return m ? m[1].trim() : null;
}

function lookupActual(actuals, id) {
  if (!actuals) return null;
  if (actuals[id] !== undefined) return actuals[id];
  return null;
}

function buildViewModel(sources) {
  const { profile, actuals, mpStatus, departments } = sources;

  const goals = profile.goals.map((goalText, gi) => {
    const goalId = `G${gi + 1}`;
    const stratText = profile.strategies[gi] || '';
    const stratId = `S${gi + 1}`;

    const mdText = profile.measures[gi] || null;
    const mdId = `MD${gi + 1}`;
    const actual = lookupActual(actuals, mdId);
    const mdItem = mdText
      ? [{ id: mdId, text: mdText, baseline: null, target: null, actual, status: mdStatus(actual) }]
      : [];

    const plans = profile.plans.map((mpText, pi) => {
      const mpId = `MP${pi + 1}`;
      return {
        id: mpId,
        text: mpText,
        owner: parseOwner(mpText),
        status: (mpStatus && mpStatus[mpId]) || 'not_started',
      };
    });

    const depts = (departments || []).filter(d => {
      const ref = (d.meta && d.meta.parent_ref) || null;
      return ref === stratId || ref === `company-${stratId}`;
    }).map(d => ({
      slug: d.meta.slug || 'unknown',
      name: d.meta.name || d.meta.slug || 'unknown',
      measures: [],
      plans: [],
    }));

    const strat = { id: stratId, text: stratText, measures: mdItem, plans, departments: depts };
    const mdStatuses = mdItem.map(m => m.status);
    const health = healthFromStatuses(mdStatuses);
    const withActuals = mdStatuses.filter(s => s !== 'no_data');
    const progress_pct = withActuals.length === 0 ? null : 100;

    return { id: goalId, text: goalText, health, progress_pct, strategies: [strat] };
  });

  const overallHealth = healthFromStatuses(goals.map(g => g.health));

  return {
    meta: {
      scope: profile.meta.scope || 'company',
      slug: profile.meta.slug || 'unknown',
      period: sources.period || profile.meta.time_horizon || 'unknown',
      generated_at: new Date().toISOString().slice(0, 10),
      health: overallHealth,
    },
    objective: { text: profile.objective || '' },
    goals,
  };
}

if (require.main === module) {
  const assert = require('assert');
  const { parseProfile } = require('./parse-profile');
  const fs = require('fs');
  const path = require('path');

  const profileText = fs.readFileSync(
    path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
  );
  const profile = parseProfile(profileText);

  // Test 1: no actuals → no_data health
  const vm1 = buildViewModel({ profile, actuals: {}, mpStatus: {}, departments: [] });
  assert.ok(vm1, 'buildViewModel returns a value');
  assert.strictEqual(vm1.meta.slug, 'example-corp');
  assert.strictEqual(vm1.meta.health, 'no_data');
  assert.strictEqual(vm1.goals.length, 2);
  assert.strictEqual(vm1.goals[0].health, 'no_data');
  assert.strictEqual(vm1.goals[0].progress_pct, null);
  assert.strictEqual(vm1.goals[0].strategies.length, 1);

  // Test 2: with actuals → at_risk (MVP default)
  const vm2 = buildViewModel({ profile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: { MP1: 'done' }, departments: [] });
  assert.notStrictEqual(vm2.meta.health, 'no_data', 'health changes when actuals present');
  assert.notStrictEqual(vm2.goals[0].progress_pct, null, 'progress_pct non-null with actuals');
  assert.strictEqual(vm2.goals[0].strategies[0].plans[0].status, 'done', 'MP1 status');

  // Test 3: generated_at is today's date format YYYY-MM-DD
  assert.match(vm1.meta.generated_at, /^\d{4}-\d{2}-\d{2}$/, 'generated_at format');

  console.log('view-model: all assertions passed');
}

module.exports = { buildViewModel };
