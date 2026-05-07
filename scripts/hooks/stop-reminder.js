#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

function hasMdFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).some((f) => f.endsWith('.md'));
}

const profilesRoot = path.join(process.cwd(), '.ogsm', 'profiles');
if (!fs.existsSync(profilesRoot)) {
  process.exit(0);
}

const companyDir = path.join(profilesRoot, 'company');
const deptsDir = path.join(profilesRoot, 'departments');

if (!hasMdFiles(companyDir) && !hasMdFiles(deptsDir)) {
  process.exit(0);
}

process.stdout.write(
  'OGSM: session ending. Confirm any unsaved profile, context, or review changes have been written to .ogsm/.\n'
);
process.exit(0);
