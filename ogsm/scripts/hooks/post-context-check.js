#!/usr/bin/env node
'use strict';
const fs = require('fs');

const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    process.exit(0);
  }

  const command = input?.tool_input?.command ?? '';
  if (!command.includes('update-operating-context.js')) {
    process.exit(0);
  }

  // Command form: node <script> <context-file> <note...>
  // context-file is the first argument after the script name
  const parts = command.trim().split(/\s+/);
  const scriptIdx = parts.findIndex((p) => p.includes('update-operating-context.js'));
  const contextFile = scriptIdx >= 0 ? parts[scriptIdx + 1] : null;

  if (!contextFile) {
    process.stderr.write('OGSM: could not parse context file path from command\n');
    process.exit(0);
  }

  if (!fs.existsSync(contextFile)) {
    process.stderr.write('OGSM: context file not found after update: ' + contextFile + '\n');
    process.exit(0);
  }

  const content = fs.readFileSync(contextFile, 'utf8');
  if (!content.trim()) {
    process.stderr.write('OGSM: context file is empty after update: ' + contextFile + '\n');
  } else if (content.includes('None recorded yet.')) {
    process.stderr.write('OGSM: context file still contains placeholder "None recorded yet.": ' + contextFile + '\n');
  } else {
    process.stdout.write('OGSM: context updated: ' + contextFile + '\n');
  }

  process.exit(0);
});
