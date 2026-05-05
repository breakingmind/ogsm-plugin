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

const missing = required.filter((name) => {
  const pattern = new RegExp(`^#{2,3}\\s+${name}\\s*$`, 'im');
  return !pattern.test(text);
});

if (missing.length > 0) {
  console.log(JSON.stringify({ valid: false, missing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ valid: true, missing: [] }, null, 2));
