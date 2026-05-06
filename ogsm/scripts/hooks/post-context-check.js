#!/usr/bin/env node
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => { process.exit(0); });
