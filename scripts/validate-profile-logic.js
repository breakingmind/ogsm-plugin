#!/usr/bin/env node
'use strict';
const fs = require('fs');

const args = process.argv.slice(2);
const sectionIdx = args.indexOf('--section');
const targetSection = sectionIdx !== -1 ? args[sectionIdx + 1] : null;
const file = args.find((a, i) => !a.startsWith('--') && (sectionIdx === -1 || i !== sectionIdx + 1));

if (!file) {
  console.error('Usage: validate-profile-logic.js <profile.md> [--section M]');
  process.exit(2);
}

const text = fs.readFileSync(file, 'utf8');

function parseSections(src) {
  const result = {};
  const re = /^#{2,6}\s+(.+?)(?:\s+#+)?\s*$/gm;
  let prev = null, prevEnd = 0, m;
  while ((m = re.exec(src)) !== null) {
    if (prev !== null) result[prev] = src.slice(prevEnd, m.index).trim();
    prev = m[1].trim();
    prevEnd = m.index + m[0].length;
  }
  if (prev !== null) result[prev] = src.slice(prevEnd).trim();
  return result;
}

function parseItems(block) {
  return (block || '').split(/\n(?=\d+\.)/).map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
}

function calcScore(gaps, totalChecks) {
  if (totalChecks === 0) return 5;
  const ratio = (totalChecks - gaps.length) / totalChecks;
  if (ratio === 1) return 5;
  if (ratio >= 0.8) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.3) return 2;
  return 1;
}

function checkO(block) {
  if (!block) return { score: 1, gaps: ['Objective section missing or empty'] };
  const gaps = [];
  if (!/\b(team|teams|client|customer|user|partner|internal|external|組織|客戶|用戶|團隊)\b/i.test(block))
    gaps.push('no target audience identified (O1)');
  if (block.split(/\s+/).length < 10)
    gaps.push('scope may be missing — Objective is very short (O2)');
  if (!/\b(value|benefit|outcome|rhythm|execution|visibility|提供|價值|效益)\b/i.test(block))
    gaps.push('no value statement found (O3)');
  if (!/\b(position|partner|leader|reliable|become|becoming|成為|定位)\b/i.test(block))
    gaps.push('no positioning found (O4)');
  if (block.length < 80)
    gaps.push('vivid picture may be missing — Objective is too short (O5)');
  // O6 (keyword identification) requires AI semantic judgment — not checked structurally
  return { score: calcScore(gaps, 5), gaps };
}

function checkG(block) {
  if (!block) return { score: 1, gaps: ['Goals section missing or empty'] };
  const items = parseItems(block);
  if (items.length === 0) return { score: 1, gaps: ['no Goals found'] };
  const gaps = [];
  items.forEach((g, i) => {
    const label = `Goal ${i + 1}`;
    if (!/^(increase|decrease|reduce|grow|achieve|complete|deliver|launch|build|establish|improve|expand|reach|maintain)/i.test(g))
      gaps.push(`${label}: no clear action verb (G9)`);
    if (!/\bfrom\b.{1,80}\bto\b|\bbaseline\b/i.test(g))
      gaps.push(`${label}: no baseline with comparison reference (G11, G13)`);
    if (!/\d+\s*(%|hours?|items?|calls?|units?|visits?|times?)/i.test(g))
      gaps.push(`${label}: no measurable target amount (G14)`);
    if (!/\b20\d{2}[-/]\d{2}[-/]\d{2}|\bQ[1-4]\b|\bby\b.{1,20}20\d{2}/i.test(g))
      gaps.push(`${label}: no date or deadline (G7-time-bound)`);
  });
  return { score: calcScore(gaps, items.length * 4), gaps };
}

function checkS(block) {
  if (!block) return { score: 1, gaps: ['Strategies section missing or empty'] };
  const items = parseItems(block);
  if (items.length === 0) return { score: 1, gaps: ['no Strategies found'] };
  const gaps = [];
  items.forEach((s, i) => {
    const label = `Strategy ${i + 1}`;
    if (!/\bthrough\b|透過/i.test(s))
      gaps.push(`${label}: no resource/method framing — missing "Through…" or "透過" (S15)`);
    if (s.split('\n').length > 5 && /^\s*[-*]/m.test(s))
      gaps.push(`${label}: may be a task list rather than a resource/method/tool (S17-S19)`);
  });
  return { score: calcScore(gaps, items.length * 2), gaps };
}

function checkMD(block) {
  if (!block) return { score: 1, gaps: ['MD section missing or empty'] };
  const items = parseItems(block);
  if (items.length === 0) return { score: 1, gaps: ['no MD items found'] };
  const gaps = [];
  items.forEach((md, i) => {
    const label = `MD ${i + 1}`;
    if (!/\b20\d{2}[-/]\d{2}[-/]\d{2}|\bQ[1-4]\b/i.test(md))
      gaps.push(`${label}: no deadline found (M24)`);
    if (!/\d+\s*(%|hours?|units?|calls?|visits?|items?)/i.test(md))
      gaps.push(`${label}: no numeric target found (M22)`);
    if (!/\b(weekly|monthly|quarterly|daily|每週|每月|每季|reviewed)\b/i.test(md))
      gaps.push(`${label}: no review cadence found (M24)`);
  });
  return { score: calcScore(gaps, items.length * 3), gaps };
}

function checkMP(block) {
  if (!block) return { score: 1, gaps: ['MP section missing or empty'] };
  const items = parseItems(block);
  if (items.length === 0) return { score: 1, gaps: ['no MP items found'] };
  const gaps = [];
  items.forEach((mp, i) => {
    const label = `MP ${i + 1}`;
    if (!/\b(owner|負責人|[a-z]+ owner)\b/i.test(mp))
      gaps.push(`${label}: no owner or responsible person identified (M26)`);
    if (!/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|20\d{2}[-/]\d{2}[-/]\d{2}|weekly|monthly|每週|每月)\b/i.test(mp))
      gaps.push(`${label}: no time order or schedule found (M27)`);
  });
  return { score: calcScore(gaps, items.length * 2), gaps };
}

function checkBackward(sections) {
  const broken = [];
  const mpItems = parseItems(sections['MP']);
  const mdItems = parseItems(sections['MD']);
  if (mpItems.length > 0 && mdItems.length === 0)
    broken.push('MP items exist but no MD items — cannot trace MP → MD (B29)');
  if (mdItems.length > 0 && !(sections['Strategies'] || '').trim())
    broken.push('MD items exist but no Strategies — cannot trace MD → S (B29)');
  return { complete: broken.length === 0, broken };
}

const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
const isDeptWithParent =
  /^\s*scope:\s*department\s*$/im.test(frontmatter) &&
  /^\s*parent:\s*\S/im.test(frontmatter);

const sections = parseSections(text);
const oResult  = checkO(sections['Objective']);
const gResult  = checkG(sections['Goals']);
const sResult  = checkS(sections['Strategies']);
const mdResult = checkMD(sections['MD']);
const mpResult = checkMP(sections['MP']);
const backward = checkBackward(sections);

const warnings = [];
if (isDeptWithParent && sections['Goals'] && !/goal_type:/i.test(sections['Goals'])) {
  warnings.push('department profile with parent set has no goal_type annotations — alignment layer may have been skipped');
}

const allValid = [oResult, gResult, sResult, mdResult, mpResult].every(r => r.gaps.length === 0) && backward.complete;

let output;
if (targetSection === 'M') {
  output = {
    valid: mdResult.gaps.length === 0 && mpResult.gaps.length === 0 && backward.complete,
    layers: { MD: mdResult, MP: mpResult },
    backwardLogic: backward,
  };
} else {
  output = {
    valid: allValid,
    warnings,
    layers: { O: oResult, G: gResult, S: sResult, MD: mdResult, MP: mpResult },
    backwardLogic: backward,
  };
}

console.log(JSON.stringify(output, null, 2));
process.exit(allValid ? 0 : 1);
