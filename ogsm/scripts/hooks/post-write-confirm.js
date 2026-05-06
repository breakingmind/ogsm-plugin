#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    process.exit(0);
  }

  const filePath = input?.tool_input?.file_path ?? '';
  if (!filePath.includes('.ogsm/')) {
    process.exit(0);
  }

  if (filePath.includes('.ogsm/profiles/')) {
    const validateScript = path.resolve(__dirname, '..', 'validate-profile.js');
    try {
      execFileSync('node', [validateScript, filePath], { stdio: ['ignore', 'pipe', 'pipe'] });
      process.stdout.write('OGSM: profile validation passed for ' + filePath + '\n');
    } catch (err) {
      process.stderr.write('OGSM: profile validation failed after write: ' + filePath + '\n');
      process.stderr.write((err.stdout?.toString() ?? '') + '\n');
    }
  } else {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size === 0) {
        process.stderr.write('OGSM: written file is empty: ' + filePath + '\n');
      } else {
        process.stdout.write('OGSM: saved ' + filePath + '\n');
      }
    } catch {
      process.stderr.write('OGSM: could not stat written file: ' + filePath + '\n');
    }
  }

  process.exit(0);
});
