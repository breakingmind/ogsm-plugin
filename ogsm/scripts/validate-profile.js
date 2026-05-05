#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: validate-profile.js <profile.md>');
  process.exit(2);
}

const text = fs.readFileSync(file, 'utf8');
const required = [
  'Profile Name',
  'Time Horizon',
  'Objective',
  'Goals',
  'Strategies',
  'MD',
  'MP',
  'Review Cadence',
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const missing = required.filter((name) => {
  const escapedName = escapeRegex(name);
  const pattern = new RegExp(`^ {0,3}#{2,6}\\s+${escapedName}(?:\\s+#+)?\\s*$`, 'im');
  return !pattern.test(text);
});

if (missing.length > 0) {
  console.log(JSON.stringify({ valid: false, missing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ valid: true, missing: [] }, null, 2));
