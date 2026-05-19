'use strict';

function parseArrow(mdText) {
  const match = mdText.match(/(\d+(?:\.\d+)?)\s*(?:→|->|-)\s*(\d+(?:\.\d+)?)/);
  if (!match) return { baseline: null, target: null };
  return { baseline: parseFloat(match[1]), target: parseFloat(match[2]) };
}

function computeMdStatus(actual, baseline, target) {
  // null actual → no_data
  if (actual === null) return { status: 'no_data', progress_pct: null };

  // check qualitative patterns (case-insensitive)
  const actualLower = String(actual).toLowerCase().trim();
  if (/^(完成|done|completed|✅)$/.test(actualLower)) {
    return { status: 'on_track', progress_pct: 100 };
  }
  if (/^(進行中|in_progress|🔄)$/.test(actualLower)) {
    return { status: 'at_risk', progress_pct: 50 };
  }
  if (/^(未開始|not_started|⬜)$/.test(actualLower)) {
    return { status: 'off_track', progress_pct: 0 };
  }

  // numeric actual
  const numActual = parseFloat(actual);
  if (isNaN(numActual)) {
    // unrecognized text → at_risk
    return { status: 'at_risk', progress_pct: null };
  }

  // numeric but no target → at_risk
  if (baseline === null || target === null) {
    return { status: 'at_risk', progress_pct: null };
  }

  // compute progress based on direction
  let pct;
  if (target > baseline) {
    // increase target: pct = min(100, round(actual/target * 100))
    pct = Math.min(100, Math.round(numActual / target * 100));
  } else {
    // decrease target: pct = min(100, round(target/actual * 100))
    pct = Math.min(100, Math.round(target / numActual * 100));
  }

  // health from pct: ≥90 → on_track, ≥70 → at_risk, else off_track
  let status;
  if (pct >= 90) status = 'on_track';
  else if (pct >= 70) status = 'at_risk';
  else status = 'off_track';

  return { status, progress_pct: pct };
}

function aggregateHealth(statuses) {
  if (!statuses.length) return 'no_data';
  if (statuses.every(s => s === 'no_data')) return 'no_data';
  if (statuses.some(s => s === 'off_track')) return 'off_track';
  if (statuses.some(s => s === 'at_risk')) return 'at_risk';
  return 'on_track';
}

function avgPct(pcts) {
  const valid = pcts.filter(p => p !== null);
  if (!valid.length) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round(sum / valid.length);
}

function computePlanCompletionPct(plans) {
  if (!plans.length) return null;
  const weights = { done: 1, in_progress: 0.5, not_started: 0, delayed: 0 };
  const sum = plans.reduce((acc, p) => acc + (weights[p.status] || 0), 0);
  return Math.round(sum / plans.length * 100);
}

if (require.main === module) {
  const assert = require('assert');

  // parseArrow
  const a1 = parseArrow('Monthly revenue: 100 → 120, 2026-03-31');
  assert.strictEqual(a1.baseline, 100, 'parseArrow baseline');
  assert.strictEqual(a1.target, 120, 'parseArrow target');

  const a2 = parseArrow('Avg delivery days: 5 → 3');
  assert.strictEqual(a2.baseline, 5, 'parseArrow decrease baseline');
  assert.strictEqual(a2.target, 3, 'parseArrow decrease target');

  const a3 = parseArrow('No arrow here');
  assert.strictEqual(a3.baseline, null, 'parseArrow no arrow → null baseline');
  assert.strictEqual(a3.target, null, 'parseArrow no arrow → null target');

  // computeMdStatus — no actual
  const r1 = computeMdStatus(null, 100, 120);
  assert.strictEqual(r1.status, 'no_data', 'null actual → no_data');
  assert.strictEqual(r1.progress_pct, null, 'null actual → null pct');

  // qualitative done
  const r2 = computeMdStatus('完成', null, null);
  assert.strictEqual(r2.status, 'on_track', 'done text → on_track');
  assert.strictEqual(r2.progress_pct, 100, 'done text → 100%');

  // numeric increase, at_risk (105/120=88%)
  const r3 = computeMdStatus('105', 100, 120);
  assert.strictEqual(r3.status, 'at_risk', '105/120=88% → at_risk');
  assert.strictEqual(r3.progress_pct, 88, '105/120 rounds to 88');

  // numeric increase, on_track (110/120=92%)
  const r4 = computeMdStatus('110', 100, 120);
  assert.strictEqual(r4.status, 'on_track', '110/120=92% → on_track');
  assert.strictEqual(r4.progress_pct, 92, '110/120 rounds to 92');

  // numeric decrease, off_track (3/4.5=67%)
  const r5 = computeMdStatus('4.5', 5, 3);
  assert.strictEqual(r5.status, 'off_track', '3/4.5=67% → off_track');
  assert.strictEqual(r5.progress_pct, 67, '3/4.5 rounds to 67');

  // numeric, no target → at_risk
  const r6 = computeMdStatus('105', null, null);
  assert.strictEqual(r6.status, 'at_risk', 'numeric but no target → at_risk');
  assert.strictEqual(r6.progress_pct, null, 'no target → null pct');

  // aggregateHealth
  assert.strictEqual(aggregateHealth([]), 'no_data', 'empty → no_data');
  assert.strictEqual(aggregateHealth(['no_data', 'no_data']), 'no_data', 'all no_data → no_data');
  assert.strictEqual(aggregateHealth(['on_track', 'at_risk']), 'at_risk', 'any at_risk → at_risk');
  assert.strictEqual(aggregateHealth(['at_risk', 'off_track']), 'off_track', 'any off_track → off_track');
  assert.strictEqual(aggregateHealth(['on_track', 'on_track']), 'on_track', 'all on_track → on_track');

  // avgPct
  assert.strictEqual(avgPct([]), null, 'empty → null');
  assert.strictEqual(avgPct([null, null]), null, 'all null → null');
  assert.strictEqual(avgPct([80, null, 100]), 90, 'avg(80,100)=90');
  assert.strictEqual(avgPct([88, 67]), 78, 'avg(88,67)=77.5→78');

  // computePlanCompletionPct
  assert.strictEqual(computePlanCompletionPct([]), null, 'empty plans → null');
  const plans1 = [
    { status: 'done' }, { status: 'in_progress' },
    { status: 'not_started' }, { status: 'delayed' },
  ];
  // (1 + 0.5 + 0 + 0) / 4 * 100 = 37.5 → 38
  assert.strictEqual(computePlanCompletionPct(plans1), 38, '(1+0.5)/4=37.5→38');

  console.log('compute: all assertions passed');
}

module.exports = { parseArrow, computeMdStatus, aggregateHealth, avgPct, computePlanCompletionPct };
