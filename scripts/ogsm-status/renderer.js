'use strict';

const HEALTH_LABEL = {
  on_track: '🟢 On Track',
  at_risk: '🟡 At Risk',
  off_track: '🔴 Off Track',
  no_data: '⚪ No Data',
};

const PLAN_ICON = { done: '✅', in_progress: '🔄', not_started: '⬜', delayed: '❌' };

const CSS = `
body{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 32px;font-size:16px;color:#1a1a1a;line-height:1.6}
h1{font-size:1.4em;margin:0 0 4px}
.meta{color:#6b7280;font-size:.9em;margin-bottom:28px}
.section-title{font-size:1.1em;font-weight:600;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin:32px 0 16px}
.objective{background:#f9fafb;border-left:4px solid #6366f1;padding:12px 16px;border-radius:4px;margin-bottom:20px;font-style:italic}
.goal-row{display:flex;align-items:baseline;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6;flex-wrap:wrap}
.goal-id{font-weight:700;min-width:32px;color:#6366f1}
.goal-text{flex:1;min-width:200px}
.pct{font-size:.9em;color:#6b7280}
.health-on_track{color:#166534}
.health-at_risk{color:#92400e}
.health-off_track{color:#991b1b}
.health-no_data{color:#9ca3af}
.strategy{margin:12px 0 4px;padding:8px 14px;background:#f9fafb;border-radius:4px;border-left:3px solid #e5e7eb}
.strategy-id{font-weight:600;color:#6366f1;margin-right:6px}
.md-table{width:100%;border-collapse:collapse;font-size:.88em;margin:8px 0}
.md-table th{text-align:left;padding:4px 8px;background:#f3f4f6;font-weight:500}
.md-table td{padding:4px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
details>summary{cursor:pointer;color:#6366f1;font-size:.9em;padding:4px 0;user-select:none}
details>summary:hover{text-decoration:underline}
.dept{margin:4px 0 4px 12px;padding:8px 12px;border-left:2px solid #e5e7eb}
.mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin:8px 0}
.mp-card{padding:8px 12px;border:1px solid #e5e7eb;border-radius:4px;font-size:.88em}
.mp-id{font-weight:600;color:#6366f1;margin-right:4px}
.owner{color:#6b7280;font-size:.85em}
.mp-text{color:#374151;margin-top:2px}
.actuals-list{margin:8px 0;padding-left:20px;font-size:.9em}
.actuals-list li{padding:2px 0}
.no-data-note{color:#9ca3af;font-size:.9em;font-style:italic}
.progress-bar-wrap{background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden;display:inline-block;width:120px;vertical-align:middle;margin:0 8px}
.progress-bar{height:100%;border-radius:4px;background:#6366f1}
.progress-bar.on_track{background:#16a34a}
.progress-bar.at_risk{background:#d97706}
.progress-bar.off_track{background:#dc2626}
.delayed-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#991b1b}
.no-evidence-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#9ca3af}
.diag-error-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#991b1b}
.diag-warn-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#92400e}
.diag-type{font-weight:600;font-family:monospace;font-size:.85em}
.diag-ok{color:#166534;font-size:.9em;font-style:italic}
footer{margin-top:48px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:.8em;color:#9ca3af}
@media print{details,details[open]{display:block}details>summary{list-style:none}details>summary::marker{display:none}}
`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function healthBadge(h) {
  return `<span class="health-${esc(h)}">${esc(HEALTH_LABEL[h] || h)}</span>`;
}

function renderProgressBar(pct, health) {
  if (pct === null || pct === undefined)
    return '<span class="health-no_data" style="font-size:.85em">—</span>';
  const cls = esc(health || 'no_data');
  return `<div class="progress-bar-wrap"><div class="progress-bar ${cls}" style="width:${esc(pct)}%"></div></div><span class="pct">${esc(pct)}%</span>`;
}

function renderMdTable(measures) {
  if (!measures.length) return '';
  const rows = measures.map(m => `<tr>
    <td>${esc(m.id)}</td>
    <td>${esc(m.text)}</td>
    <td>${m.actual !== null ? esc(m.actual) : '<span class="health-no_data">—</span>'}</td>
    <td>${m.progress_pct !== null && m.progress_pct !== undefined ? esc(m.progress_pct) + '%' : '—'}</td>
    <td>${healthBadge(m.status)}</td>
  </tr>`).join('');
  return `<table class="md-table">
    <thead><tr><th>ID</th><th>Measure</th><th>Actual</th><th>Progress</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderStrategy(s) {
  const planPct = s.plan_completion_pct !== null && s.plan_completion_pct !== undefined
    ? `<div style="font-size:.85em;color:#6b7280;margin-top:4px">Plan Completion: ${esc(s.plan_completion_pct)}%</div>`
    : '';
  const depts = s.departments.map(d => `<details>
    <summary>Dept: ${esc(d.name)}</summary>
    <div class="dept"><strong>${esc(d.name)}</strong>${renderMdTable(d.measures)}</div>
  </details>`).join('');
  return `<div class="strategy">
    <span class="strategy-id">${esc(s.id)}</span>${esc(s.text)}
    ${renderMdTable(s.measures)}
    ${planPct}
    ${depts}
  </div>`;
}

function renderSection1(vm) {
  const goalRows = vm.goals.map(g => {
    return `<div class="goal-row">
      <span class="goal-id">${esc(g.id)}</span>
      <span class="goal-text">${esc(g.text)}</span>
      ${renderProgressBar(g.progress_pct, g.health)}
      ${healthBadge(g.health)}
    </div>
    ${g.strategies.map(renderStrategy).join('')}`;
  }).join('');

  return `<div class="section-title">Section 1: Where Are We?</div>
    <div class="objective">${esc(vm.objective.text)}</div>
    ${goalRows}`;
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter(x => { if (seen.has(x.id)) return false; seen.add(x.id); return true; });
}

function renderSection2(vm) {
  const allPlans = dedupeById(vm.goals.flatMap(g => g.strategies.flatMap(s => s.plans)));
  const allMeasures = dedupeById(vm.goals.flatMap(g => g.strategies.flatMap(s => s.measures)));
  const withActuals = allMeasures.filter(m => m.actual !== null);
  const delayedPlans = allPlans.filter(p => p.status === 'delayed');
  const noEvidenceMds = allMeasures.filter(m => m.status === 'no_data');

  const mpCards = allPlans.length
    ? allPlans.map(p => `<div class="mp-card">
        <span class="mp-id">${esc(p.id)}</span>${PLAN_ICON[p.status] || '⬜'}
        ${p.owner ? `<span class="owner">${esc(p.owner)}</span>` : ''}
        <div class="mp-text">${esc(p.text.length > 80 ? p.text.slice(0, 80) + '…' : p.text)}</div>
      </div>`).join('')
    : '<p class="no-data-note">No plans defined.</p>';

  const actualItems = withActuals.length
    ? withActuals.map(m => {
        const pctStr = m.progress_pct !== null && m.progress_pct !== undefined
          ? ` (${esc(m.progress_pct)}%)` : '';
        return `<li><strong>${esc(m.id)}</strong>: ${esc(m.actual)}${pctStr}</li>`;
      }).join('')
    : '<li class="no-data-note">No actuals recorded yet.</li>';

  const delayedHtml = delayedPlans.length
    ? `<p style="font-weight:500;margin:16px 0 8px;color:#991b1b">❌ Delayed</p>
       <ul class="delayed-list">${delayedPlans.map(p =>
         `<li>${esc(p.id)}: ${esc(p.text.length > 60 ? p.text.slice(0, 60) + '…' : p.text)}</li>`
       ).join('')}</ul>`
    : '';

  const noEvidenceHtml = noEvidenceMds.length
    ? `<p style="font-weight:500;margin:16px 0 8px">⚪ No Evidence</p>
       <ul class="no-evidence-list">${noEvidenceMds.map(m =>
         `<li>${esc(m.id)}: ${esc(m.text.length > 60 ? m.text.slice(0, 60) + '…' : m.text)}</li>`
       ).join('')}</ul>`
    : '';

  return `<div class="section-title">Section 2: What Did We Do?</div>
    <p style="font-weight:500;margin:0 0 8px">MP Status this period</p>
    <div class="mp-grid">${mpCards}</div>
    <p style="font-weight:500;margin:16px 0 8px">MD Updates</p>
    <ul class="actuals-list">${actualItems}</ul>
    ${delayedHtml}
    ${noEvidenceHtml}`;
}

function renderSection3(vm) {
  const diags = (vm.meta.diagnostics || []);
  const errors = diags.filter(d => d.severity === 'error');
  const warnings = diags.filter(d => d.severity === 'warning');

  if (!diags.length) {
    return `<div class="section-title">Section 3: Alignment Diagnostics</div>
      <p class="diag-ok">✅ No issues found.</p>`;
  }

  const errorHtml = errors.length
    ? `<p style="font-weight:500;margin:12px 0 6px;color:#991b1b">🔴 Issues Requiring Action</p>
       <ul class="diag-error-list">${errors.map(d =>
         `<li><span class="diag-type">${esc(d.type)}</span> [${esc(d.item_id)}]: ${esc(d.message)}</li>`
       ).join('')}</ul>`
    : '';

  const warnHtml = warnings.length
    ? `<p style="font-weight:500;margin:12px 0 6px;color:#92400e">🟡 Warnings</p>
       <ul class="diag-warn-list">${warnings.map(d =>
         `<li><span class="diag-type">${esc(d.type)}</span> [${esc(d.item_id)}]: ${esc(d.message)}</li>`
       ).join('')}</ul>`
    : '';

  return `<div class="section-title">Section 3: Alignment Diagnostics</div>
    ${errorHtml}
    ${warnHtml}`;
}

function render(vm) {
  const healthLabel = esc(HEALTH_LABEL[vm.meta.health] || vm.meta.health);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OGSM Report — ${esc(vm.meta.slug)} ${esc(vm.meta.period)}</title>
<style>${CSS}</style>
</head>
<body>
<h1>OGSM Report — ${esc(vm.meta.slug)}</h1>
<div class="meta">${esc(vm.meta.period)} &nbsp;|&nbsp; ${healthLabel} &nbsp;|&nbsp; Generated ${esc(vm.meta.generated_at)}</div>
${renderSection1(vm)}
${renderSection2(vm)}
${renderSection3(vm)}
<footer>Scope: ${esc(vm.meta.scope)} / ${esc(vm.meta.slug)} &nbsp;|&nbsp; OGSM Plugin</footer>
</body>
</html>`;
}

if (require.main === module) {
  const assert = require('assert');
  const { parseProfile } = require('./parse-profile');
  const { buildViewModel } = require('./view-model');
  const fs = require('fs');
  const path = require('path');

  const profileText = fs.readFileSync(
    path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
  );
  const profile = parseProfile(profileText);

  // Test with department to trigger details element
  const depts = [{ meta: { scope: 'department', slug: 'sales', name: 'Sales', parent_ref: 'S1' }, goals: [] }];
  const vm = buildViewModel({ profile, actuals: { MD1: '105' }, mpStatus: { MP1: 'done' }, departments: depts });
  const html = render(vm);

  assert.ok(html.startsWith('<!DOCTYPE html>'), 'starts with DOCTYPE');
  assert.ok(html.includes('<style>'), 'has inline CSS');
  assert.ok(!html.includes('<link'), 'no external CSS link');
  assert.ok(!html.includes('<script'), 'no script tags');
  assert.ok(html.includes('example-corp'), 'contains slug');
  assert.ok(html.includes('preferred supplier'), 'contains objective text');
  assert.ok(html.includes('Section 1'), 'has Section 1');
  assert.ok(html.includes('Section 2'), 'has Section 2');
  assert.ok(html.includes('<details'), 'uses details element');
  assert.ok(html.includes('105'), 'shows actual value');
  assert.ok(html.includes('✅'), 'shows done MP');
  assert.ok(html.includes('@media print'), 'has print styles');

  // no-data case: no actuals → shows No Data markers
  const vmEmpty = buildViewModel({ profile, actuals: {}, mpStatus: {}, departments: [] });
  const htmlEmpty = render(vmEmpty);
  assert.ok(htmlEmpty.includes('No Data') || htmlEmpty.includes('no_data'), 'empty shows no data');

  // DOU-50: progress_pct, delayed, plan completion
  const { buildViewModel: bvm2 } = require('./view-model');
  const vm3 = bvm2({
    profile,
    actuals: { MD1: '105', MD2: '4.5' },
    mpStatus: { MP1: 'delayed', MP2: 'not_started' },
    departments: [],
  });
  const html3 = render(vm3);
  assert.ok(html3.includes('88%'), 'shows MD1 progress_pct 88%');
  assert.ok(html3.includes('67%'), 'shows MD2 progress_pct 67%');
  assert.ok(html3.includes('Delayed') || html3.includes('delayed'), 'shows delayed section');
  assert.ok(html3.includes('Plan Completion'), 'shows plan completion label');

  // DOU-53: Section 3 diagnostics
  const { diagnose: diag53 } = require('./diagnose');
  const { parseProfile: pp53 } = require('./parse-profile');
  const fs53 = require('fs');
  const gapProf = pp53(fs53.readFileSync(
    path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-gap.md'), 'utf8'
  ));
  const vm53 = buildViewModel({ profile: gapProf, actuals: {}, mpStatus: {}, departments: [] });
  const html53 = render(vm53);
  assert.ok(html53.includes('Section 3'), 'has Section 3');
  assert.ok(html53.includes('strategy_no_md') || html53.includes('S2'), 'shows strategy_no_md');
  assert.ok(html53.includes('no_plans') || html53.includes('No plans'), 'shows no_plans');

  // clean profile: shows no-issues note
  const vmClean = buildViewModel({ profile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: {}, departments: [] });
  const htmlClean = render(vmClean);
  assert.ok(htmlClean.includes('Section 3'), 'clean profile also has Section 3');
  assert.ok(htmlClean.includes('No issues') || htmlClean.includes('no issues'), 'clean profile shows no issues');

  console.log('renderer: all assertions passed');
}

module.exports = { render };
