#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: extract-md-actuals.js <review-file-or-dir>');
  process.exit(2);
}

const MD_ACTUAL_RE = /<!--\s*md-actual:\s*(.+?)\s*-->/g;

function extractFromText(text) {
  const results = {};
  const matches = [...text.matchAll(MD_ACTUAL_RE)];
  for (const match of matches) {
    for (const part of match[1].split(',')) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const id = part.slice(0, eqIdx).trim();
      const value = part.slice(eqIdx + 1).trim();
      if (id && value) results[id] = value;
    }
  }
  return results;
}

let stat;
try {
  stat = fs.statSync(target);
} catch (e) {
  console.error(`Cannot read: ${target}`);
  process.exit(2);
}

const texts = stat.isDirectory()
  ? fs.readdirSync(target)
      .filter(f => f.endsWith('.md'))
      .sort()
      .map(f => fs.readFileSync(path.join(target, f), 'utf8'))
  : [fs.readFileSync(target, 'utf8')];

const merged = {};
for (const text of texts) {
  Object.assign(merged, extractFromText(text));
}

console.log(JSON.stringify(merged, null, 2));
