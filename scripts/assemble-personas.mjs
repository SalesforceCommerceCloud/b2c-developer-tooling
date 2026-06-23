#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Persona-plugin assembler.
 *
 * Reads skills/personas.json and skills/taxonomy.generated.json, then for each
 * persona COPIES the selected skill folders (from their home plugins b2c-cli /
 * b2c / storefront-next) into skills/<persona-id>/skills/. Each skill is still
 * authored exactly once in its home plugin; persona plugins are generated,
 * committed bundles. Also stamps a DO-NOT-EDIT marker, a README, an assets/
 * logo (copied from b2c-cli), and a .codex-plugin/plugin.json (version read
 * from skills/package.json, mirroring sync-plugin-versions.mjs).
 *
 * Modes:
 *   (default)   (Re)generate the persona plugin directories.
 *   --check     Assemble into a temp dir and diff against the committed tree;
 *               exit 1 if stale (CI guard). No files are written under skills/.
 *
 * Selector precedence (union): selector.persona (all governed skills with that
 * frontmatter persona) ∪ selector.tags (any governed skill carrying any tag)
 * ∪ selector.skills (explicit names). At least `persona` is expected.
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = join(repoRoot, 'skills');
const checkMode = process.argv.includes('--check');

const DO_NOT_EDIT = [
  '# GENERATED — DO NOT EDIT',
  '#',
  '# This persona plugin is assembled by scripts/assemble-personas.mjs from',
  '# skills authored in their home plugins (b2c-cli / b2c / storefront-next).',
  '# Edit the source skill or skills/personas.json, then run `pnpm run skills:assemble`.',
  '',
].join('\n');

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

const personasManifest = readJson(join(skillsRoot, 'personas.json'));
const taxonomyPath = join(skillsRoot, 'taxonomy.generated.json');
if (!existsSync(taxonomyPath)) {
  console.error('error: skills/taxonomy.generated.json missing — run "pnpm run skills:taxonomy" first.');
  process.exit(1);
}
const taxonomy = readJson(taxonomyPath);
const pluginsVersion = readJson(join(skillsRoot, 'package.json')).version;

/** Select the source skill records for a persona from the generated manifest. */
function selectSkills(persona) {
  const sel = persona;
  const wantPersona = sel.persona;
  const wantTags = new Set(sel.selectorTags ?? []);
  const wantNames = new Set(sel.selectorSkills ?? []);
  return taxonomy.skills.filter((s) => {
    if (wantPersona && s.persona === wantPersona) return true;
    if (wantNames.has(s.name)) return true;
    if (s.tags?.some((t) => wantTags.has(t))) return true;
    return false;
  });
}

/** Build the .codex-plugin/plugin.json for a persona. */
function codexManifest(persona) {
  const c = persona.codex ?? {};
  return {
    name: persona.id,
    version: pluginsVersion,
    description: persona.marketplace?.description ?? c.shortDescription ?? persona.id,
    author: {name: 'Salesforce'},
    homepage: 'https://salesforcecommercecloud.github.io/b2c-developer-tooling/',
    repository: 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling',
    license: 'Apache-2.0',
    keywords: ['salesforce', 'b2c-commerce', 'commerce-cloud', 'operations', 'devops'],
    skills: './skills/',
    interface: {
      displayName: c.displayName ?? persona.id,
      shortDescription: c.shortDescription ?? '',
      longDescription: c.longDescription ?? '',
      developerName: 'Salesforce',
      category: 'Productivity',
      capabilities: ['Read'],
      logo: './assets/logo.svg',
      composerIcon: './assets/logo.svg',
      brandColor: c.brandColor ?? '#0D9DDA',
      websiteURL: 'https://salesforcecommercecloud.github.io/b2c-developer-tooling/',
      defaultPrompt: c.defaultPrompt ?? [],
    },
  };
}

/** Render the persona README. */
function readme(persona, skills) {
  const lines = [];
  lines.push(`# ${persona.id}`, '');
  lines.push(
    `> GENERATED — DO NOT EDIT. Assembled by \`scripts/assemble-personas.mjs\` from skills in their home plugins.`,
    '',
  );
  lines.push(persona.codex?.longDescription ?? persona.marketplace?.description ?? '', '');
  lines.push(
    'Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace.',
    '',
  );
  lines.push('## Installation', '');
  lines.push('```bash');
  lines.push('claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling');
  lines.push(`claude plugin install ${persona.id}@b2c-developer-tooling`);
  lines.push('```', '');
  lines.push(
    '> This is a curated **bundle** of skills also published in `b2c-cli` and `b2c`. Install it **instead of** those plugins, not alongside — installing both duplicates the same skills and their always-on context.',
    '',
  );
  lines.push("## What's included", '');
  for (const s of skills) lines.push(`- **\`${s.name}\`** (${s.plugin}) — ${(s.description ?? '').split('. ')[0]}.`);
  lines.push(
    '',
    '## License',
    '',
    'Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).',
    '',
  );
  return lines.join('\n');
}

/** Assemble one persona into destRoot/<id>/. Returns the source skill records. */
function assemblePersona(persona, destRoot) {
  const skills = selectSkills(persona).sort((a, b) => a.name.localeCompare(b.name));
  if (skills.length === 0) throw new Error(`persona ${persona.id} selected zero skills`);
  const personaDir = join(destRoot, persona.id);
  const skillsDir = join(personaDir, 'skills');
  mkdirSync(skillsDir, {recursive: true});

  for (const s of skills) {
    const srcSkillDir = join(repoRoot, 'skills', s.plugin, 'skills', s.name);
    const destSkillDir = join(skillsDir, s.name);
    // Copy the skill folder, excluding evals/ (not shipped in bundles).
    cpSync(srcSkillDir, destSkillDir, {
      recursive: true,
      filter: (src) => relative(srcSkillDir, src).split('/')[0] !== 'evals',
    });
  }

  // .codex-plugin/plugin.json
  const codexDir = join(personaDir, '.codex-plugin');
  mkdirSync(codexDir, {recursive: true});
  writeFileSync(join(codexDir, 'plugin.json'), JSON.stringify(codexManifest(persona), null, 2) + '\n');

  // assets/logo.svg (reuse b2c-cli's logo)
  const assetsDir = join(personaDir, 'assets');
  mkdirSync(assetsDir, {recursive: true});
  cpSync(join(repoRoot, 'skills', 'b2c-cli', 'assets', 'logo.svg'), join(assetsDir, 'logo.svg'));

  // README.md + DO-NOT-EDIT marker
  writeFileSync(join(personaDir, 'README.md'), readme(persona, skills));
  writeFileSync(join(personaDir, '.assembled'), DO_NOT_EDIT);

  return skills;
}

// Normalize selector fields onto the persona object (personas.json uses
// selector.{persona,tags,skills}; flatten for convenience).
const personas = personasManifest.personas.map((p) => ({
  ...p,
  persona: p.persona ?? p.selector?.persona,
  selectorTags: p.selector?.tags,
  selectorSkills: p.selector?.skills,
}));

if (checkMode) {
  const tmp = mkdtempSync(join(tmpdir(), 'personas-'));
  let stale = false;
  for (const persona of personas) {
    assemblePersona(persona, tmp);
    const committed = join(skillsRoot, persona.id);
    const fresh = join(tmp, persona.id);
    if (!existsSync(committed)) {
      console.error(`error: ${persona.id}: not committed — run "pnpm run skills:assemble"`);
      stale = true;
      continue;
    }
    if (!treesEqual(committed, fresh)) {
      console.error(`error: ${persona.id}: stale — run "pnpm run skills:assemble" and commit the result`);
      stale = true;
    }
  }
  rmSync(tmp, {recursive: true, force: true});
  if (stale) process.exit(1);
  console.log(`assemble-personas: OK (${personas.length} persona(s) up to date).`);
} else {
  for (const persona of personas) {
    // Clean the generated skills dir to drop removed skills, then regenerate.
    const personaDir = join(skillsRoot, persona.id);
    if (existsSync(personaDir)) rmSync(join(personaDir, 'skills'), {recursive: true, force: true});
    const skills = assemblePersona(persona, skillsRoot);
    console.log(
      `assemble-personas: ${persona.id} ← ${skills.length} skills (${skills.map((s) => s.name).join(', ')}).`,
    );
  }
}

/** Recursively compare two directory trees for identical files + contents. */
function treesEqual(a, b) {
  const listing = (root) => {
    const out = [];
    const walk = (dir, base) => {
      for (const e of readdirSync(dir, {withFileTypes: true}).sort((x, y) => x.name.localeCompare(y.name))) {
        const rel = base ? `${base}/${e.name}` : e.name;
        if (e.isDirectory()) walk(join(dir, e.name), rel);
        else out.push(rel);
      }
    };
    if (existsSync(root) && statSync(root).isDirectory()) walk(root, '');
    return out;
  };
  const fa = listing(a);
  const fb = listing(b);
  if (fa.length !== fb.length || fa.some((f, i) => f !== fb[i])) return false;
  for (const f of fa) {
    if (readFileSync(join(a, f), 'utf8') !== readFileSync(join(b, f), 'utf8')) return false;
  }
  return true;
}
