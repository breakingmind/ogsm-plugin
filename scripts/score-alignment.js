#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: score-alignment.js <items.json>');
  process.exit(2);
}

let items;
try {
  items = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(2);
}

if (!Array.isArray(items) || items.some((item) => item === null || typeof item !== 'object' || Array.isArray(item))) {
  console.error('Input must be a JSON array of objects');
  process.exit(2);
}

const scores = items.map((item) => {
  const strategy = item.strategyLink && item.strategyLink !== 'Unmapped';
  const md = item.mdLink && item.mdLink !== 'Unmapped';
  const mp = item.mpLink && item.mpLink !== 'Unmapped';
  const score = strategy && md && mp ? 5 : strategy && (md || mp) ? 3 : 1;
  return {
    item: item.title || item.name || 'Untitled',
    strategyLink: item.strategyLink || 'Unmapped',
    mdLink: item.mdLink || 'Unmapped',
    mpLink: item.mpLink || 'Unmapped',
    score,
  };
});

const average = scores.length === 0
  ? 0
  : scores.reduce((sum, item) => sum + item.score, 0) / scores.length;

console.log(JSON.stringify({
  averageScore: Number(average.toFixed(2)),
  items: scores,
}, null, 2));
