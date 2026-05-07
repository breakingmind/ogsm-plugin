#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: normalize-calendar-events.js <calendar-events.json>');
  process.exit(2);
}

function escapeCell(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function classify(title) {
  const lower = title.toLowerCase();
  if (lower.includes('review') || lower.includes('檢討')) return 'Admin';
  if (lower.includes('sync') || lower.includes('call') || lower.includes('meeting') || lower.includes('會議')) return 'Meeting';
  if (lower.includes('sales') || lower.includes('customer') || lower.includes('client') || lower.includes('客戶') || lower.includes('商機')) return 'Sales';
  if (lower.includes('deep work') || lower.includes('prototype')) return 'Deep work';
  return 'Unknown';
}

function parseDateTime(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  return { date: match[1], time: `${match[2]}:${match[3]}`, raw: value };
}

function minutesBetween(startRaw, endRaw) {
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Unknown';
  return `${Math.max(0, Math.round((end - start) / 60000))}m`;
}

function normalizeEvent(event) {
  const title = event.summary || event.title || '(Untitled event)';
  const startDateTime = parseDateTime(event.start && event.start.dateTime);
  const endDateTime = parseDateTime(event.end && event.end.dateTime);

  if (startDateTime) {
    const notes = event.location ? `Location: ${event.location}` : '';
    return {
      date: startDateTime.date,
      start: startDateTime.time,
      end: endDateTime ? endDateTime.time : 'Unknown',
      duration: endDateTime ? minutesBetween(event.start.dateTime, event.end.dateTime) : 'Unknown',
      title,
      type: classify(title),
      mobility: 'Fixed',
      strategy: 'Unmapped',
      md: 'Unmapped',
      mp: 'Unmapped',
      notes,
    };
  }

  const date = event.start && event.start.date ? event.start.date : 'Unknown';
  return {
    date,
    start: 'All day',
    end: 'All day',
    duration: 'All day',
    title,
    type: classify(title),
    mobility: 'Fixed',
    strategy: 'Unmapped',
    md: 'Unmapped',
    mp: 'Unmapped',
    notes: 'All-day event',
  };
}

let events;
try {
  events = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(events) || events.some((event) => !event || typeof event !== 'object' || Array.isArray(event))) {
  console.error('Input must be a JSON array of Google Calendar event objects');
  process.exit(1);
}

const rows = events.map(normalizeEvent);
console.log('| Date | Start | End | Duration | Title | Type | Mobility | Strategy Link | MD Link | MP Link | Notes |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const row of rows) {
  const cells = [
    row.date,
    row.start,
    row.end,
    row.duration,
    row.title,
    row.type,
    row.mobility,
    row.strategy,
    row.md,
    row.mp,
    row.notes,
  ].map(escapeCell);
  console.log(`| ${cells.join(' | ')} |`);
}
