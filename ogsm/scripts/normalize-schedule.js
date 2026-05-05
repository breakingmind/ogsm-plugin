#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: normalize-schedule.js <schedule.txt>');
  process.exit(2);
}

const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

function classify(title) {
  const lower = title.toLowerCase();
  if (lower.includes('review')) return 'Admin';
  if (lower.includes('sync') || lower.includes('call') || lower.includes('meeting')) return 'Meeting';
  if (lower.includes('deep work') || lower.includes('prototype')) return 'Deep work';
  return 'Unknown';
}

function parseLine(line) {
  const match = line.match(/^(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s+(.+)$/);
  if (!match) {
    return {
      date: 'Unknown',
      start: 'Unknown',
      end: 'Unknown',
      duration: 'Unknown',
      title: line,
      type: classify(line),
      mobility: 'Unknown',
      strategy: 'Unmapped',
      md: 'Unmapped',
      mp: 'Unmapped',
      notes: 'Could not parse date or time',
    };
  }

  const [, date, start, end, title] = match;
  return {
    date,
    start,
    end,
    duration: 'Unknown',
    title,
    type: classify(title),
    mobility: 'Unknown',
    strategy: 'Unmapped',
    md: 'Unmapped',
    mp: 'Unmapped',
    notes: '',
  };
}

const rows = lines.map(parseLine);
console.log('| Date | Start | End | Duration | Title | Type | Mobility | Strategy Link | MD Link | MP Link | Notes |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const row of rows) {
  console.log(`| ${row.date} | ${row.start} | ${row.end} | ${row.duration} | ${row.title} | ${row.type} | ${row.mobility} | ${row.strategy} | ${row.md} | ${row.mp} | ${row.notes} |`);
}
