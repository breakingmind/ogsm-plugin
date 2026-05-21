'use strict';

const HEALTH_LABEL = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  off_track: 'Off Track',
  no_data: 'No Data',
};

const HEALTH_ICON = {
  on_track: '●',
  at_risk: '●',
  off_track: '●',
  no_data: '○',
};

const PLAN_ICON = { done: '✓', in_progress: '◑', not_started: '○', delayed: '✕' };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

:root{
  --text:#37352f;
  --text-muted:#9b9a97;
  --text-light:#c8c7c4;
  --border:#e9e9e7;
  --surface:#f7f6f3;
  --health-ok:#0f7b0f;
  --health-risk:#9a5c00;
  --health-bad:#eb5757;
  --health-none:#9b9a97;
  --progress-ok:#0f7b0f;
  --progress-risk:#d9730d;
  --progress-bad:#eb5757;
  --progress-default:#d3d1cb;
  --font:'DM Sans',ui-sans-serif,system-ui,sans-serif;
}
*,*::before,*::after{box-sizing:border-box}
body{font-family:var(--font);max-width:860px;margin:0 auto;padding:48px 40px;font-size:15px;color:var(--text);line-height:1.6;background:#fff}
h1{font-size:1.25rem;font-weight:600;margin:0 0 4px;letter-spacing:-0.01em}
.meta{color:var(--text-muted);font-size:.875rem;margin-bottom:40px}
h2.section-title{font-size:.6875rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin:40px 0 14px;padding:0;border:none}
.objective{font-style:italic;color:var(--text);margin-bottom:24px;font-size:1rem;line-height:1.75;padding:0}
.goal-row{display:flex;align-items:baseline;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap}
.goal-id{font-weight:600;min-width:36px;font-size:.8125rem;color:var(--text-muted);font-variant-numeric:tabular-nums}
.goal-text{flex:1;min-width:200px}
.pct{font-size:.8125rem;color:var(--text-muted);font-variant-numeric:tabular-nums}
.health-on_track{color:var(--health-ok)}
.health-at_risk{color:var(--health-risk)}
.health-off_track{color:var(--health-bad)}
.health-no_data{color:var(--health-none)}
.strategy{margin:8px 0 2px;padding:6px 0 6px 20px;background:none}
.strategy-id{font-weight:500;color:var(--text-muted);margin-right:6px;font-size:.8125rem}
.md-table{width:100%;border-collapse:collapse;font-size:.875rem;margin:8px 0}
.md-table th{text-align:left;padding:6px 8px;font-size:.6875rem;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);border-bottom:1px solid var(--border);background:none}
.md-table td{padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top}
details>summary{cursor:pointer;font-size:.875rem;padding:4px 0;user-select:none;color:var(--text-muted)}
details>summary:focus-visible{outline:2px solid var(--border);outline-offset:2px;border-radius:2px}
.dept{margin:4px 0 4px 16px;padding:8px 0}
.mp-list{list-style:none;margin:8px 0;padding:0}
.mp-item{padding:0;border-bottom:1px solid var(--border)}
.mp-item>summary{cursor:pointer;list-style:none;display:flex;align-items:baseline;gap:8px;padding:10px 0;outline:none;min-height:44px}
.mp-item>summary::-webkit-details-marker{display:none}
.mp-item>summary::marker{display:none}
.mp-item>summary:focus-visible{outline:2px solid var(--border);outline-offset:2px;border-radius:2px}
.mp-toggle{color:var(--text-light);font-size:.75rem;flex-shrink:0;transition:transform .12s ease-out}
.mp-item[open] .mp-toggle{transform:rotate(90deg)}
.mp-item[open] .mp-preview{display:none}
.mp-item:not([open]) .mp-full{display:none}
.mp-id{font-weight:500;font-size:.8125rem;color:var(--text-muted);min-width:44px;flex-shrink:0;font-variant-numeric:tabular-nums}
.mp-status-icon{flex-shrink:0;font-size:.875rem}
.owner{color:var(--text-muted);font-size:.8125rem}
.mp-text{color:var(--text);margin-top:6px;padding-bottom:10px;white-space:pre-wrap;font-size:.875rem;padding-left:0}
.actuals-list{margin:8px 0;padding-left:20px;font-size:.875rem}
.actuals-list li{padding:3px 0}
.no-data-note{color:var(--text-muted);font-size:.875rem;font-style:italic}
.progress-bar-wrap{background:var(--border);border-radius:2px;height:4px;overflow:hidden;display:inline-block;width:80px;vertical-align:middle;margin:0 6px}
.progress-bar{height:100%;border-radius:2px;background:var(--progress-default)}
.progress-bar.on_track{background:var(--progress-ok)}
.progress-bar.at_risk{background:var(--progress-risk)}
.progress-bar.off_track{background:var(--progress-bad)}
.subsection-label{font-weight:500;margin:16px 0 8px;font-size:.875rem;color:var(--text)}
.subsection-label-error{font-weight:500;margin:16px 0 8px;font-size:.875rem;color:var(--health-bad)}
.subsection-label-warn{font-weight:500;margin:16px 0 8px;font-size:.875rem;color:var(--health-risk)}
.plan-completion{font-size:.8125rem;color:var(--text-muted);margin-top:4px}
.delayed-list{margin:8px 0;padding-left:20px;font-size:.875rem;color:var(--health-bad)}
.no-evidence-list{margin:8px 0;padding-left:20px;font-size:.875rem;color:var(--text-muted)}
.diag-error-list{margin:8px 0;padding-left:20px;font-size:.875rem;color:var(--health-bad)}
.diag-warn-list{margin:8px 0;padding-left:20px;font-size:.875rem;color:var(--health-risk)}
.diag-type{font-weight:600;font-family:ui-monospace,monospace;font-size:.8125rem}
.diag-ok{color:var(--health-ok);font-size:.875rem;font-style:italic}
footer{margin-top:56px;padding-top:12px;border-top:1px solid var(--border);font-size:.75rem;color:var(--text-muted)}
@media(max-width:600px){body{padding:24px 20px}}
@media print{details,details[open]{display:block}details>summary{list-style:none}details>summary::marker{display:none}}
`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function healthBadge(h) {
  const label = HEALTH_LABEL[h] || h;
  const icon = HEALTH_ICON[h] || '○';
  return `<span class="health-${esc(h)}" role="img" aria-label="${esc(label)}">${esc(icon)} ${esc(label)}</span>`;
}

function renderProgressBar(pct, health) {
  if (pct === null || pct === undefined)
    return '<span class="health-no_data">—</span>';
  const cls = esc(health || 'no_data');
  const label = HEALTH_LABEL[health] || health || 'no_data';
  return `<div class="progress-bar-wrap" role="progressbar" aria-valuenow="${esc(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(pct)}% ${esc(label)}"><div class="progress-bar ${cls}" style="width:${esc(pct)}%"></div></div><span class="pct">${esc(pct)}%</span>`;
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
    ? `<div class="plan-completion">Plan Completion: ${esc(s.plan_completion_pct)}%</div>`
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

  return `<h2 class="section-title">Section 1: Where Are We?</h2>
    <p class="objective">${esc(vm.objective.text)}</p>
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
    ? `<ul class="mp-list" role="list">${allPlans.map(p => {
        const text = p.text || '';
        const needsTruncate = text.length > 80;
        const preview = needsTruncate ? text.slice(0, 80) + '…' : text;
        return `<details class="mp-item">
        <summary>
          <span class="mp-id">${esc(p.id)}</span>
          <span class="mp-status-icon" role="img" aria-label="${esc(p.status)}">${PLAN_ICON[p.status] || '○'}</span>
          ${p.owner ? `<span class="owner">${esc(p.owner)}</span>` : ''}
          <span class="mp-text mp-preview">${esc(preview)}</span>
          ${needsTruncate ? '<span class="mp-toggle" aria-hidden="true">▸</span>' : ''}
        </summary>
        ${needsTruncate ? `<div class="mp-text mp-full">${esc(text)}</div>` : ''}
      </details>`;
      }).join('')}</ul>`
    : '<p class="no-data-note">No plans defined.</p>';

  const actualItems = withActuals.length
    ? withActuals.map(m => {
        const pctStr = m.progress_pct !== null && m.progress_pct !== undefined
          ? ` (${esc(m.progress_pct)}%)` : '';
        return `<li><strong>${esc(m.id)}</strong>: ${esc(m.actual)}${pctStr}</li>`;
      }).join('')
    : '<li class="no-data-note">No actuals recorded yet.</li>';

  const delayedHtml = delayedPlans.length
    ? `<p class="subsection-label-error">✕ Delayed</p>
       <ul class="delayed-list">${delayedPlans.map(p =>
         `<li>${esc(p.id)}: ${esc(p.text.length > 60 ? p.text.slice(0, 60) + '…' : p.text)}</li>`
       ).join('')}</ul>`
    : '';

  const noEvidenceHtml = noEvidenceMds.length
    ? `<p class="subsection-label">○ No Evidence</p>
       <ul class="no-evidence-list">${noEvidenceMds.map(m =>
         `<li>${esc(m.id)}: ${esc(m.text.length > 60 ? m.text.slice(0, 60) + '…' : m.text)}</li>`
       ).join('')}</ul>`
    : '';

  return `<h2 class="section-title">Section 2: What Did We Do?</h2>
    <p class="subsection-label">MP Status this period</p>
    ${mpCards}
    <p class="subsection-label">MD Updates</p>
    <ul class="actuals-list">${actualItems}</ul>
    ${delayedHtml}
    ${noEvidenceHtml}`;
}

function renderSection3(vm) {
  const diags = (vm.meta.diagnostics || []);
  const errors = diags.filter(d => d.severity === 'error');
  const warnings = diags.filter(d => d.severity === 'warning');

  if (!diags.length) {
    return `<h2 class="section-title">Section 3: Alignment Diagnostics</h2>
      <p class="diag-ok">✓ No issues found.</p>`;
  }

  const errorHtml = errors.length
    ? `<p class="subsection-label-error">● Issues Requiring Action</p>
       <ul class="diag-error-list">${errors.map(d =>
         `<li><span class="diag-type">${esc(d.type)}</span> [${esc(d.item_id)}]: ${esc(d.message)}</li>`
       ).join('')}</ul>`
    : '';

  const warnHtml = warnings.length
    ? `<p class="subsection-label-warn">● Warnings</p>
       <ul class="diag-warn-list">${warnings.map(d =>
         `<li><span class="diag-type">${esc(d.type)}</span> [${esc(d.item_id)}]: ${esc(d.message)}</li>`
       ).join('')}</ul>`
    : '';

  return `<h2 class="section-title">Section 3: Alignment Diagnostics</h2>
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
  assert.ok(html.includes('✓'), 'shows done MP');
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
