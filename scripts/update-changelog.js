#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

const version = process.argv[2] || process.env.VERSION;
const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
if (!version) {
  console.error('Usage: node scripts/update-changelog.js <version> [--dry-run]');
  process.exit(1);
}
const tag = `v${version}`;
try { execSync('git fetch --prune --tags', { stdio: 'inherit' }); } catch (e) {}

let tags = [];
try {
  const raw = run('git tag --sort=-creatordate');
  tags = raw.split('\n').filter(Boolean);
} catch (e) {
  // ignore
}

let prevTag = '';
const idx = tags.indexOf(tag);
if (idx !== -1) {
  prevTag = tags[idx + 1] || '';
} else if (tags.length > 0) {
  // tag not found in local tag list; fall back to most recent tag that's not the same
  prevTag = tags.find(t => t !== tag) || '';
}

const range = prevTag ? `${prevTag}..${tag}` : tag;
let log = '';
try {
  log = run(`git log --pretty=format:%h::%s ${range}`);
} catch (e) {
  log = '';
}

if (!log) {
  console.log('No commits found between tags; no CHANGELOG update necessary.');
  process.exit(0);
}

const commits = log.split('\n').map(line => {
  const [hash, ...rest] = line.split('::');
  return { hash, message: rest.join('::') };
});

const sectionsMap = {
  feat: 'Added',
  fix: 'Fixed',
  docs: 'Documentation',
  perf: 'Performance',
  refactor: 'Refactor',
  chore: 'Chores',
  test: 'Tests',
  style: 'Style',
  ci: 'CI',
  build: 'Build',
};

const sections = {};

for (const c of commits) {
  const m = c.message.match(/^([a-zA-Z0-9]+)(\([^)]+\))?:\s*(.+)$/);
  if (m) {
    const type = m[1].toLowerCase();
    const subject = m[3];
    const section = sectionsMap[type] || 'Others';
    sections[section] = sections[section] || [];
    sections[section].push(`- ${subject} (${c.hash})`);
  } else {
    sections['Others'] = sections['Others'] || [];
    sections['Others'].push(`- ${c.message} (${c.hash})`);
  }
}

const date = new Date().toISOString().slice(0, 10);
let fragment = `## [${version}] - ${date}\n\n`;
const order = ['Added', 'Changed', 'Fixed', 'Performance', 'Documentation', 'Refactor', 'Chores', 'Tests', 'Style', 'CI', 'Build', 'Others'];
for (const key of order) {
  if (sections[key] && sections[key].length) {
    fragment += `### ${key}\n`;
    fragment += sections[key].join('\n') + '\n\n';
  }
}

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
let original = '';
if (fs.existsSync(changelogPath)) {
  original = fs.readFileSync(changelogPath, 'utf8');
} else {
  original = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
}

// If the changelog already contains this version header, skip to avoid duplicates
const versionHeaderRegex = new RegExp('^## \[' + escapeRegExp(version) + '\]', 'm');
if (versionHeaderRegex.test(original)) {
  console.log(`CHANGELOG.md already contains entry for ${version}; skipping update.`);
  process.exit(0);
}

// Insert fragment after the top `# Changelog` heading (preserve existing header and intro)
let newContent = '';
if (original.startsWith('# Changelog')) {
  const afterHeader = original.indexOf('\n\n');
  if (afterHeader !== -1) {
    const header = original.slice(0, afterHeader + 2);
    const rest = original.slice(afterHeader + 2);
    newContent = header + fragment + rest;
  } else {
    newContent = original + '\n' + fragment;
  }
} else {
  newContent = '# Changelog\n\n' + fragment + original;
}

if (dryRun) {
  // Print only the fragment so caller can inspect
  console.log('--- DRY RUN: Generated changelog fragment ---\n');
  console.log(fragment);
  process.exit(0);
}

fs.writeFileSync(changelogPath, newContent, 'utf8');
console.log('CHANGELOG.md updated for', version);
process.exit(0);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
