'use strict';
const fs = require('fs');

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    out[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return out;
}

function extractSections(body) {
  const sections = {};
  const parts = body.split(/^##\s+/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n');
    const name = part.slice(0, nl).trim();
    const content = part.slice(nl + 1).trim();
    sections[name] = content;
  }
  return sections;
}

function parseNumberedList(text) {
  if (!text) return [];
  return text.split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());
}

function parseProfile(text) {
  const fmMatch = text.match(/^---\n[\s\S]*?\n---\n?/);
  const meta = parseFrontmatter(text);
  const body = fmMatch ? text.slice(fmMatch[0].length) : text;
  const sections = extractSections(body);

  return {
    meta,
    objective: sections['Objective'] || null,
    goals: parseNumberedList(sections['Goals']),
    strategies: parseNumberedList(sections['Strategies']),
    measures: parseNumberedList(sections['MD']),
    plans: parseNumberedList(sections['MP']),
  };
}

if (require.main === module) {
  const assert = require('assert');
  const path = require('path');
  const fixture = fs.readFileSync(
    path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
  );
  const result = parseProfile(fixture);
  assert.strictEqual(result.meta.slug, 'example-corp', 'meta.slug');
  assert.strictEqual(result.meta.scope, 'company', 'meta.scope');
  assert.ok(result.objective && result.objective.includes('preferred supplier'), 'objective text');
  assert.strictEqual(result.goals.length, 2, 'goals count');
  assert.ok(result.goals[0].includes('revenue'), 'first goal text');
  assert.strictEqual(result.strategies.length, 2, 'strategies count');
  assert.strictEqual(result.measures.length, 2, 'measures count');
  assert.strictEqual(result.plans.length, 2, 'plans count');
  assert.ok(result.plans[0].includes('Alice'), 'first plan owner');
  console.log('parse-profile: all assertions passed');
}

module.exports = { parseProfile };
