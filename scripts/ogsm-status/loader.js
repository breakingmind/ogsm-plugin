'use strict';
const fs = require('fs');
const path = require('path');
const { parseProfile } = require('./parse-profile');
const { extractFromText } = require('../extract-md-actuals');

const MP_DONE_RE = /^[-*]\s+(MP[\d-]+)\s+(完成|done|✅)/gim;
const MP_PROGRESS_RE = /^[-*]\s+(MP[\d-]+)\s+(進行中|in[- ]?progress)/gim;

function collectActuals(reviewDir) {
  if (!fs.existsSync(reviewDir)) return {};
  const merged = {};
  for (const f of fs.readdirSync(reviewDir).filter(f => f.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(reviewDir, f), 'utf8');
    Object.assign(merged, extractFromText(text));
  }
  return merged;
}

function collectMpStatus(reviewDir) {
  if (!fs.existsSync(reviewDir)) return {};
  const status = {};
  for (const f of fs.readdirSync(reviewDir).filter(f => f.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(reviewDir, f), 'utf8');
    for (const m of text.matchAll(MP_DONE_RE)) status[m[1]] = 'done';
    for (const m of text.matchAll(MP_PROGRESS_RE)) status[m[1]] = 'in_progress';
  }
  return status;
}

function loadSources(ogsmDir, scope, slug) {
  const profilePath = path.join(ogsmDir, 'profiles', scope, `${slug}.md`);
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Profile not found: ${profilePath}`);
  }

  const profile = parseProfile(fs.readFileSync(profilePath, 'utf8'));
  const reviewDir = path.join(ogsmDir, 'reviews', scope, slug);
  const actuals = collectActuals(reviewDir);
  const mpStatus = collectMpStatus(reviewDir);

  const departments = [];
  if (scope === 'company') {
    const deptDir = path.join(ogsmDir, 'profiles', 'departments');
    if (fs.existsSync(deptDir)) {
      for (const f of fs.readdirSync(deptDir).filter(f => f.endsWith('.md'))) {
        try {
          const d = parseProfile(fs.readFileSync(path.join(deptDir, f), 'utf8'));
          if (d.meta.parent === `company/${slug}`) departments.push(d);
        } catch (_) { /* skip unparseable */ }
      }
    }
  }

  return { profile, actuals, mpStatus, departments };
}

if (require.main === module) {
  const assert = require('assert');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  // Set up a minimal .ogsm/ tree in a temp dir
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ogsm-loader-test-'));
  const fixtureDir = path.join(__dirname, '../../examples/fixtures/ogsm-status');

  fs.mkdirSync(path.join(tmp, 'profiles', 'company'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'reviews', 'company', 'example-corp'), { recursive: true });
  fs.copyFileSync(
    path.join(fixtureDir, 'profile-minimal.md'),
    path.join(tmp, 'profiles', 'company', 'example-corp.md')
  );
  fs.copyFileSync(
    path.join(fixtureDir, 'review-minimal.md'),
    path.join(tmp, 'reviews', 'company', 'example-corp', '2026-01-15-weekly.md')
  );

  // Test 1: loads profile and extracts actuals
  const sources = loadSources(tmp, 'company', 'example-corp');
  assert.ok(sources, 'loadSources returns a value');
  assert.ok(sources.profile, 'sources.profile exists');
  assert.strictEqual(sources.profile.meta.slug, 'example-corp');
  assert.strictEqual(sources.actuals['MD1'], '105', 'actuals from review');
  assert.strictEqual(sources.actuals['MD2'], '4.5', 'actuals MD2');
  assert.strictEqual(sources.mpStatus['MP1'], 'done', 'MP1 done');
  assert.strictEqual(sources.mpStatus['MP2'], 'in_progress', 'MP2 in_progress');

  // Test 2: missing profile throws
  assert.throws(() => loadSources(tmp, 'company', 'nonexistent'), /not found/i);

  // Cleanup
  fs.rmSync(tmp, { recursive: true });

  console.log('loader: all assertions passed');
}

module.exports = { loadSources };
