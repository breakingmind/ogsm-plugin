#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: prepare-storage.js <project-root> <company|department> <slug> [--confirm-write]');
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const projectRoot = process.argv[2];
const scope = process.argv[3];
const inputSlug = process.argv[4];
const confirmed = process.argv.includes('--confirm-write');

if (!projectRoot || !scope || !inputSlug) {
  usage();
  process.exit(2);
}

if (!['company', 'department'].includes(scope)) {
  console.error('Scope must be company or department');
  process.exit(2);
}

const slug = slugify(inputSlug);
if (!slug) {
  console.error('Slug must contain at least one letter or number');
  process.exit(2);
}

const root = path.resolve(projectRoot);
const ogsmRoot = path.join(root, '.ogsm');
const scopeDir = scope === 'company' ? 'company' : 'departments';
const profilePath = path.join(ogsmRoot, 'profiles', scopeDir, `${slug}.md`);
const contextPath = path.join(ogsmRoot, 'context', scopeDir, `${slug}.md`);
const reviewsPath = path.join(ogsmRoot, 'reviews', scopeDir, slug);
const archivePath = path.join(ogsmRoot, 'archive', scopeDir, slug);
const indexPath = path.join(ogsmRoot, 'index.md');

const plan = {
  ogsmRoot,
  scope,
  slug,
  paths: {
    index: indexPath,
    profile: profilePath,
    context: contextPath,
    reviews: reviewsPath,
    archive: archivePath,
  },
};

if (!confirmed) {
  console.log(JSON.stringify({ writeRequired: true, plan }, null, 2));
  console.error('Add --confirm-write after user confirmation to create directories and starter files.');
  process.exit(3);
}

for (const dir of [
  path.dirname(profilePath),
  path.dirname(contextPath),
  reviewsPath,
  archivePath,
]) {
  fs.mkdirSync(dir, { recursive: true });
}

if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, `# OGSM Storage Index

## Company Profiles

- None recorded yet.

## Department Profiles

- None recorded yet.

## Operating Context

- None recorded yet.

## Review Outputs

- None recorded yet.

## Notes

This directory is project-local. Do not commit sensitive OGSM profiles, operating context, or review outputs unless the user explicitly confirms.
`);
}

if (!fs.existsSync(contextPath)) {
  fs.writeFileSync(contextPath, `# OGSM Operating Context

## Scope

- Type: ${scope}
- Slug: ${slug}

## Preferences

- Preferred output style: not yet confirmed
- Preferred review depth: not yet confirmed

## Working Rhythm

- Deep work windows: not yet confirmed
- Meeting load tolerance: not yet confirmed

## Accepted Recommendations

- None recorded yet.

## Rejected Recommendations

- None recorded yet.

## Recurring Patterns

- None recorded yet.

## Last Updated

Not yet reviewed.
`);
}

console.log(JSON.stringify({ writeRequired: false, created: plan }, null, 2));
