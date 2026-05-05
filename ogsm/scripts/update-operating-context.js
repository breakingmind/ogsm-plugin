#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
const note = process.argv.slice(3).join(' ');

if (!file || !note) {
  console.error('Usage: update-operating-context.js <context.md> <note>');
  process.exit(2);
}

const safeNote = note.replace(/\r?\n/g, ' ').trim();
if (!safeNote) {
  console.error('Note must not be empty');
  process.exit(2);
}

let text = '';
if (fs.existsSync(file)) {
  text = fs.readFileSync(file, 'utf8');
} else {
  text = '# OGSM Operating Context\n\n## Recurring Patterns\n\n';
}

const date = new Date().toISOString().slice(0, 10);
const entry = `- ${date}: ${safeNote}\n`;
text = text.replace(/^- None recorded yet\.\n?/gm, '');

if (text.includes('## Recurring Patterns')) {
  text = text.replace(/(## Recurring Patterns\s*\n+)/m, `$1${entry}`);
} else {
  text += `\n## Recurring Patterns\n${entry}`;
}

fs.writeFileSync(file, text);
console.log(`Updated ${file}`);
