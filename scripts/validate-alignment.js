#!/usr/bin/env node
'use strict';

const fs = require('fs');

const [deptFile, companyFile] = process.argv.slice(2);

if (!deptFile || !companyFile) {
  process.stderr.write('Usage: validate-alignment.js <dept-profile.md> <company-profile.md>\n');
  process.exit(2);
}

const deptText = fs.readFileSync(deptFile, 'utf8');
const companyText = fs.readFileSync(companyFile, 'utf8');

function buildCompanyRefs(text) {
  const refs = new Set(['company-O']);

  const goalsMatch = text.match(/^#{1,6}\s+Goals?\s*$/im);
  if (goalsMatch) {
    const afterGoals = text.slice(text.indexOf(goalsMatch[0]) + goalsMatch[0].length);
    const lines = afterGoals.split('\n');
    let count = 0;
    for (const line of lines) {
      if (/^\s*\d+\./.test(line)) count++;
      else if (/^#{1,6}\s/.test(line.trim()) && line.trim().length > 0) break;
    }
    for (let i = 1; i <= count; i++) refs.add(`company-G${i}`);
  }

  const stratMatch = text.match(/^#{1,6}\s+Strategies?\s*$/im);
  if (stratMatch) {
    const afterStrat = text.slice(text.indexOf(stratMatch[0]) + stratMatch[0].length);
    const lines = afterStrat.split('\n');
    let count = 0;
    for (const line of lines) {
      if (/^\s*\d+\./.test(line)) count++;
      else if (/^#{1,6}\s/.test(line.trim()) && line.trim().length > 0) break;
    }
    for (let i = 1; i <= count; i++) refs.add(`company-S${i}`);
  }

  return refs;
}

function parseGoalAnnotations(text) {
  const goalsMatch = text.match(/^#{1,6}\s+Goals?\s*$/im);
  if (!goalsMatch) return [];

  const startIdx = text.indexOf(goalsMatch[0]) + goalsMatch[0].length;
  const afterGoals = text.slice(startIdx);
  const lines = afterGoals.split('\n');

  const goals = [];
  let goalNum = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^#{1,6}\s/.test(line.trim()) && line.trim().length > 0 && i > 0) break;

    const numbered = line.match(/^\s*(\d+)\./);
    if (numbered) {
      goalNum++;
      const annotation = { goalNum, type: null, parentRef: null, supports: null };

      // Look ahead for HTML comment annotation on next lines
      let j = i + 1;
      while (j < lines.length && !/^\s*\d+\./.test(lines[j]) && !/^#{1,6}\s/.test(lines[j].trim())) {
        const commentMatch = lines[j].match(/<!--\s*goal_type:\s*(\w+)(?:\s*\|\s*parent_ref:\s*([\w-]+))?(?:\s*\|\s*supports:\s*\[([^\]]*)\])?\s*-->/);
        if (commentMatch) {
          annotation.type = commentMatch[1];
          annotation.parentRef = commentMatch[2] || null;
          annotation.supports = commentMatch[3]
            ? commentMatch[3].split(',').map((s) => s.trim()).filter(Boolean)
            : null;
          break;
        }
        j++;
      }

      goals.push(annotation);
    }

    i++;
  }

  return goals;
}

const companyRefs = buildCompanyRefs(companyText);
const goals = parseGoalAnnotations(deptText);

const warnings = [];
const errors = [];

for (const goal of goals) {
  if (!goal.type) {
    warnings.push(`Goal ${goal.goalNum} missing goal_type annotation`);
    continue;
  }

  if (goal.type === 'aligned') {
    if (!goal.parentRef) {
      errors.push(`Goal ${goal.goalNum}: aligned goal is missing parent_ref`);
    } else if (!companyRefs.has(goal.parentRef)) {
      errors.push(
        `Goal ${goal.goalNum}: aligned goal references ${goal.parentRef} which does not exist in company profile`
      );
    }
  } else if (goal.type === 'enabling') {
    if (!goal.supports || goal.supports.length === 0) {
      warnings.push(`Goal ${goal.goalNum}: enabling goal is missing supports list`);
    }
  }
}

const valid = errors.length === 0;
const output = { valid, warnings, errors };

process.stdout.write(JSON.stringify(output, null, 2) + '\n');
process.exit(valid ? 0 : 1);
