#!/usr/bin/env node
'use strict';
const fs = require('fs');
const os = require('os');
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
  if (!filePath.includes('.ogsm/profiles/')) {
    process.exit(0);
  }

  const content = input?.tool_input?.content ?? '';
  if (!content) { process.exit(0); }

  const tmp = path.join(os.tmpdir(), `ogsm-pre-validate-${Date.now()}.md`);

  let exitCode = 0;
  try {
    fs.writeFileSync(tmp, content);
    const validateScript = path.resolve(__dirname, '..', 'validate-profile.js');
    execFileSync('node', [validateScript, tmp], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    exitCode = 2;
    let message = 'OGSM pre-write validation failed';
    try {
      const result = JSON.parse(err.stdout?.toString() ?? '{}');
      if (Array.isArray(result.missing) && result.missing.length > 0) {
        message += ': missing sections: ' + result.missing.join(', ');
      }
    } catch {}
    process.stderr.write(message + '\n');
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
  process.exit(exitCode);
});
