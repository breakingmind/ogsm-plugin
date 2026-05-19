'use strict';
const { parseArrow, computeMdStatus, aggregateHealth, avgPct, computePlanCompletionPct } = require('./compute');

function parseOwner(mpText) {
  const m = mpText.match(/owner:\s*([^,，]+)/i);
  return m ? m[1].trim() : null;
}

function lookupActual(actuals, id) {
  if (!actuals) return null;
  return actuals[id] !== undefined ? actuals[id] : null;
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

    let mdItem = [];
    if (mdText) {
      const { baseline, target } = parseArrow(mdText);
      const { status, progress_pct } = computeMdStatus(actual, baseline, target);
      mdItem = [{
        id: mdId,
        text: mdText,
        baseline: baseline !== null ? String(baseline) : null,
        target: target !== null ? String(target) : null,
        actual,
        status,
        progress_pct,
      }];
    }

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

    const mdStatuses = mdItem.map(m => m.status);
    const mdPcts = mdItem.map(m => m.progress_pct);
    const stratHealth = aggregateHealth(mdStatuses);
    const stratProgressPct = avgPct(mdPcts);
    const planCompletionPct = computePlanCompletionPct(plans);

    const strat = {
      id: stratId,
      text: stratText,
      measures: mdItem,
      plans,
      departments: depts,
      plan_completion_pct: planCompletionPct,
    };

    return {
      id: goalId,
      text: goalText,
      health: aggregateHealth([stratHealth]),
      progress_pct: stratProgressPct,
      strategies: [strat],
    };
  });

  const overallHealth = aggregateHealth(goals.map(g => g.health));

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

  // Test 2: with actuals — MD1:100→120 actual=105 → 88% at_risk; MD2:5→3 actual=4.5 → 67% off_track
  const vm2 = buildViewModel({ profile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: { MP1: 'done' }, departments: [] });
  assert.notStrictEqual(vm2.meta.health, 'no_data', 'health changes with actuals');
  assert.strictEqual(vm2.goals[0].strategies[0].measures[0].progress_pct, 88, 'MD1 progress_pct=88');
  assert.strictEqual(vm2.goals[0].strategies[0].measures[0].status, 'at_risk', 'MD1 at_risk');
  assert.strictEqual(vm2.goals[1].strategies[0].measures[0].progress_pct, 67, 'MD2 progress_pct=67');
  assert.strictEqual(vm2.goals[1].strategies[0].measures[0].status, 'off_track', 'MD2 off_track');
  assert.strictEqual(vm2.goals[0].strategies[0].plans[0].status, 'done', 'MP1 status done');

  // Test 3: generated_at format
  assert.match(vm1.meta.generated_at, /^\d{4}-\d{2}-\d{2}$/, 'generated_at format');

  // Test 4: plan_completion_pct — MP1=done(1), MP2=in_progress(0.5) → (1.5/2)*100 = 75%
  const vm3 = buildViewModel({ profile, actuals: {}, mpStatus: { MP1: 'done', MP2: 'in_progress' }, departments: [] });
  assert.strictEqual(vm3.goals[0].strategies[0].plan_completion_pct, 75, 'plan_completion_pct=75');

  console.log('view-model: all assertions passed');
}

module.exports = { buildViewModel };
