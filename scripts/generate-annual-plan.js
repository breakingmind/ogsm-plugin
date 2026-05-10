#!/usr/bin/env node
'use strict';
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: generate-annual-plan.js <plan-data.json>');
  process.exit(2);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`Invalid JSON: ${e.message}`);
  process.exit(2);
}

const { slug, scope, year, objective, parentGoalRef, goals } = data;
if (!slug || !scope || !year || !objective || !Array.isArray(goals)) {
  console.error('Missing required fields: slug, scope, year, objective, goals');
  process.exit(2);
}

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const headerCols = ['目標 G', '策略 S', ...MONTHS.flatMap(m => [`${m} MD`, `${m} MP`])];
const separator = headerCols.map(() => '---');

const lines = [
  `# 年度計畫表 · ${slug} · ${year}`,
  '',
  `> O: ${objective}`,
];
if (parentGoalRef) lines.push(`> 對齊公司目標: ${parentGoalRef}`);
lines.push('', `| ${headerCols.join(' | ')} |`, `| ${separator.join(' | ')} |`);

for (const goal of goals) {
  let firstStrategy = true;
  for (const strategy of goal.strategies) {
    const mds = strategy.mds || [];
    const mps = strategy.mps || [];

    // Plan row: planned MD values + active MP ids (no completion marker yet)
    const planMdCells = MONTHS.map((_, i) =>
      mds.map(md => {
        const m = (md.months || [])[i];
        return m ? `${md.id}: 計畫: ${m.planned}` : '';
      }).filter(Boolean).join('; ')
    );
    const planMpCells = MONTHS.map((_, i) =>
      mps.filter(mp => (mp.months || [])[i]).map(mp => mp.id).join(' ')
    );

    const goalCell = firstStrategy ? `${goal.id}: ${goal.name}` : '';
    firstStrategy = false;
    const planCells = MONTHS.flatMap((_, i) => [planMdCells[i], planMpCells[i]]);
    lines.push(`| ${[goalCell, strategy.id, ...planCells].join(' | ')} |`);

    // Actual row: actual MD values + MP completion status
    const actualMdCells = MONTHS.map((_, i) =>
      mds.map(md => {
        const m = (md.months || [])[i];
        if (!m) return '';
        const actual = m.actual != null ? m.actual : '—';
        return `${md.id}: 實際: ${actual}`;
      }).filter(Boolean).join('; ')
    );
    const actualMpCells = MONTHS.map((_, i) =>
      mps
        .filter(mp => (mp.months || [])[i])
        .map(mp => {
          const done = (mp.completed || [])[i];
          if (done === true) return `${mp.id} ✓`;
          if (done === false) return `${mp.id} ✗`;
          return '';
        })
        .filter(Boolean)
        .join(' ')
    );
    const actualCells = MONTHS.flatMap((_, i) => [actualMdCells[i], actualMpCells[i]]);
    lines.push(`| | | ${actualCells.join(' | ')} |`);
  }
}

console.log(lines.join('\n'));
