#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Skill taxonomy validator + manifest generator.
 *
 * Source of truth for per-skill classification is each SKILL.md's frontmatter
 * (persona / category / tags). The closed vocabulary of allowed values lives in
 * skills/taxonomy.schema.json. This script is the STRICT AUTHORITY on frontmatter
 * shape — if it passes, the other parsers (SDK parser.ts, docs skills.data.ts,
 * config.mts buildEnd, eval_lib.py) are guaranteed to parse the same files.
 *
 * Modes:
 *   (default)   Generate skills/taxonomy.generated.json from frontmatter.
 *   --check     Validate taxonomy + reference links + manifest freshness; exit 1 on error.
 *
 * Governed skills are exactly those whose plugin is listed in skills/plugins.json
 * (so skills/b2c-experimental/* is intentionally excluded). Set
 * SKILLS_TAXONOMY_OPTIONAL=1 to downgrade missing/invalid taxonomy keys from
 * errors to warnings (used during migration / for old release tags).
 */

import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, normalize, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = join(repoRoot, 'skills');
const schemaPath = join(skillsRoot, 'taxonomy.schema.json');
const pluginsPath = join(skillsRoot, 'plugins.json');
const manifestPath = join(skillsRoot, 'taxonomy.generated.json');

const checkMode = process.argv.includes('--check');
const taxonomyOptional = process.env.SKILLS_TAXONOMY_OPTIONAL === '1';

const errors = [];
const warnings = [];
const rel = (p) => relative(repoRoot, p);

/**
 * Parse the YAML frontmatter of a SKILL.md into the fields we care about.
 * Dependency-free and deliberately strict: supports `key: value` scalars
 * (quoted or unquoted), flow sequences (`tags: [a, b]`), block sequences
 * (`tags:\n  - a`), and block scalars (`description: >-`). Returns null when
 * there is no frontmatter block.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const out = {tags: undefined};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (!kv) {
      i++;
      continue;
    }
    const key = kv[1];
    let rest = kv[2].trim();

    // Block scalar (>- , >, |, |-) — gather indented continuation lines.
    if (rest === '>' || rest === '>-' || rest === '|' || rest === '|-' || rest === '>+' || rest === '|+') {
      const buf = [];
      i++;
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
        buf.push(lines[i].replace(/^ {2}/, ''));
        i++;
      }
      const folded = (rest[0] === '>' ? buf.join(' ') : buf.join('\n')).trim();
      assign(out, key, folded);
      continue;
    }

    // Block sequence — `key:` then `  - item` lines.
    if (rest === '') {
      const seq = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s*-\s+/)) {
        seq.push(stripScalar(lines[i].replace(/^\s*-\s+/, '').trim()));
        i++;
      }
      if (seq.length > 0) {
        assign(out, key, seq);
        continue;
      }
      // Empty value, no sequence — record as empty string.
      assign(out, key, '');
      continue;
    }

    // Flow sequence — `key: [a, b, c]`.
    if (rest.startsWith('[') && rest.endsWith(']')) {
      const seq = rest
        .slice(1, -1)
        .split(',')
        .map((s) => stripScalar(s.trim()))
        .filter((s) => s !== '');
      assign(out, key, seq);
      i++;
      continue;
    }

    // Plain scalar.
    assign(out, key, stripScalar(rest));
    i++;
  }
  return out;
}

function assign(out, key, value) {
  if (key === 'name') out.name = value;
  else if (key === 'description') out.description = value;
  else if (key === 'persona') out.persona = value;
  else if (key === 'category') out.category = value;
  else if (key === 'tags') out.tags = Array.isArray(value) ? value : [value];
}

function stripScalar(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/** Collect every relative markdown link target in a file's body. */
function relativeMdLinks(content) {
  const links = [];
  const re = /\]\(([^)]+\.md)(?:#[^)]*)?\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const target = m[1].trim();
    if (/^[a-z]+:\/\//i.test(target) || target.startsWith('/') || target.startsWith('mailto:')) continue;
    links.push(target);
  }
  return links;
}

function listSkillDirs(pluginName) {
  const dir = join(skillsRoot, pluginName, 'skills');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, {withFileTypes: true})
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name));
}

// --- Load schema + plugins --------------------------------------------------

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const validTags = new Set(schema.tags);
const personaDefs = schema.personas;
// Skip generated persona bundles: their skills are copies of source-of-truth
// skills already validated in their home plugin (double-validating would also
// double-count). The publish workflow still zips them (it ignores this flag).
const plugins = JSON.parse(readFileSync(pluginsPath, 'utf8'))
  .plugins.filter((p) => !p.generated)
  .map((p) => p.name);

// --- Walk + validate --------------------------------------------------------

const records = [];

for (const plugin of plugins) {
  for (const skillDir of listSkillDirs(plugin)) {
    const skillName = skillDir.split('/').pop();
    const skillPath = join(skillDir, 'SKILL.md');
    if (!existsSync(skillPath)) {
      errors.push(`${rel(skillDir)}: no SKILL.md`);
      continue;
    }
    const content = readFileSync(skillPath, 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      errors.push(`${rel(skillPath)}: missing or malformed frontmatter`);
      continue;
    }

    // name + description (always required; matches the SDK parser contract).
    if (!fm.name) errors.push(`${rel(skillPath)}: frontmatter missing "name"`);
    else if (fm.name !== skillName) errors.push(`${rel(skillPath)}: name "${fm.name}" != directory "${skillName}"`);
    if (!fm.description) errors.push(`${rel(skillPath)}: frontmatter missing "description"`);
    else if (fm.description.length > 1024) warnings.push(`${rel(skillPath)}: description exceeds 1024 chars`);

    // Taxonomy (required unless SKILLS_TAXONOMY_OPTIONAL=1).
    const taxIssue = taxonomyOptional ? (m) => warnings.push(m) : (m) => errors.push(m);
    const persona = fm.persona;
    const category = fm.category;
    const tags = fm.tags;

    if (!persona) {
      taxIssue(`${rel(skillPath)}: frontmatter missing "persona"`);
    } else if (!personaDefs[persona]) {
      taxIssue(`${rel(skillPath)}: unknown persona "${persona}"`);
    } else if (personaDefs[persona].active === false) {
      taxIssue(`${rel(skillPath)}: persona "${persona}" is not active in taxonomy.schema.json`);
    }

    if (!category) {
      taxIssue(`${rel(skillPath)}: frontmatter missing "category"`);
    } else if (persona && personaDefs[persona] && !personaDefs[persona].categories.includes(category)) {
      taxIssue(`${rel(skillPath)}: category "${category}" does not belong to persona "${persona}"`);
    }

    if (!tags || tags.length === 0) {
      taxIssue(`${rel(skillPath)}: frontmatter missing "tags"`);
    } else {
      for (const tag of tags) {
        if (!validTags.has(tag)) taxIssue(`${rel(skillPath)}: unknown tag "${tag}"`);
      }
    }

    // Reference-link resolution (errors; cross-plugin ../../../ links allowed
    // as long as they resolve on disk).
    for (const link of relativeMdLinks(content)) {
      const target = normalize(resolve(skillDir, link));
      if (!existsSync(target)) errors.push(`${rel(skillPath)}: broken link "${link}"`);
    }

    // Enumerate references/*.md (relative to the skill dir).
    const referencesDir = join(skillDir, 'references');
    const references = existsSync(referencesDir)
      ? readdirSync(referencesDir, {withFileTypes: true})
          .filter((e) => e.isFile() && e.name.endsWith('.md'))
          .map((e) => `references/${e.name}`)
          .sort()
      : [];

    records.push({
      name: fm.name ?? skillName,
      plugin,
      path: `skills/${plugin}/skills/${skillName}/SKILL.md`,
      description: fm.description ?? '',
      persona: persona ?? null,
      category: category ?? null,
      tags: tags ?? [],
      references,
    });
  }
}

records.sort((a, b) => (a.plugin === b.plugin ? a.name.localeCompare(b.name) : a.plugin.localeCompare(b.plugin)));

// --- Emit / check -----------------------------------------------------------

const manifest = {
  $comment:
    'GENERATED by scripts/validate-skills.mjs — do not edit by hand. Run `pnpm run skills:taxonomy` to regenerate. Source of truth is each SKILL.md frontmatter; vocabulary is skills/taxonomy.schema.json.',
  schemaVersion: schema.version,
  skills: records,
};
const manifestText = JSON.stringify(manifest, null, 2) + '\n';

if (checkMode) {
  if (!existsSync(manifestPath)) {
    errors.push(`${rel(manifestPath)}: missing — run "pnpm run skills:taxonomy"`);
  } else {
    const committed = readFileSync(manifestPath, 'utf8');
    // Compare ignoring the volatile nothing — manifest has no timestamp by design.
    if (committed !== manifestText) {
      errors.push(`${rel(manifestPath)}: stale — run "pnpm run skills:taxonomy" and commit the result`);
    }
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);

if (errors.length > 0) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(
    `\nvalidate-skills: ${errors.length} error(s), ${warnings.length} warning(s) across ${records.length} skills.`,
  );
  process.exit(1);
}

if (!checkMode) {
  writeFileSync(manifestPath, manifestText);
  console.log(`validate-skills: wrote ${rel(manifestPath)} (${records.length} skills, ${warnings.length} warning(s)).`);
} else {
  console.log(`validate-skills: OK (${records.length} skills, ${warnings.length} warning(s)).`);
}
