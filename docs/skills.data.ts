/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * VitePress build-time data loader for the interactive skills catalog
 * (<skills-catalog />). Walks skills/<plugin>/skills/*\/SKILL.md (driven off
 * skills/plugins.json), parses frontmatter, and emits a fully-inlined index:
 * skills[] + a persona→category tree + tag counts + the absolute curl base.
 *
 * Consuming the inlined `data` export (not a runtime fetch) makes the component
 * SSR-safe with no flash-of-empty-content, and keeps the GitHub-Pages base path
 * correct because the loader resolves it the same way config.mts does. The loader
 * reads the taxonomy schema for persona/category ordering + labels when present
 * and falls back to deriving them from the skills themselves (old-tag safe).
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export interface SkillRecord {
  name: string;
  plugin: string;
  persona: string | null;
  personaLabel: string | null;
  category: string | null;
  /** Additional personas this skill also serves (besides its primary persona). */
  alsoFor: string[];
  tags: string[];
  description: string;
  skillUrl: string;
  referenceUrls: string[];
}

export interface PersonaNode {
  id: string;
  label: string;
  /** Skills whose PRIMARY persona is this one. */
  count: number;
  categories: Array<{name: string; count: number}>;
}

export interface SkillsIndex {
  base: string;
  origin: string;
  skills: SkillRecord[];
  personaTree: PersonaNode[];
  tagCounts: Array<{tag: string; count: number}>;
  fidelityNote: string;
}

declare const data: SkillsIndex;
export {data};

const isDevBuild = process.env.IS_DEV_BUILD === 'true';
const siteBase = '/b2c-developer-tooling';
const basePath = isDevBuild ? `${siteBase}/dev/` : `${siteBase}/`;
const siteOrigin = process.env.DOCS_ORIGIN ?? 'https://salesforcecommercecloud.github.io';

const FIDELITY_NOTE =
  'Fetch each skill with `curl -sL <url>`, not a summarizing fetch tool — skills are precise ' +
  'operational instructions meant to be read verbatim. b2c-cli skills also require the local ' +
  '`b2c` CLI (`npm i -g @salesforce/b2c-cli`) to execute.';

const docsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(docsDir, '..');
const skillsSrcRoot = path.join(repoRoot, 'skills');

function strip(s: string): string {
  return (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")) ? s.slice(1, -1) : s;
}

function readFrontmatter(content: string): {
  name?: string;
  description?: string;
  persona?: string;
  category?: string;
  tags: string[];
  alsoFor: string[];
} {
  const out: {
    name?: string;
    description?: string;
    persona?: string;
    category?: string;
    tags: string[];
    alsoFor: string[];
  } = {tags: [], alsoFor: []};
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return out;
  const lines = match[1].split('\n');
  // Parse a flow (`[a, b]`) or block (`\n  - a`) sequence starting at line i.
  const readSeq = (rest: string, i: number): string[] => {
    if (rest.startsWith('[') && rest.endsWith(']')) {
      return rest
        .slice(1, -1)
        .split(',')
        .map((s) => strip(s.trim()))
        .filter(Boolean);
    }
    if (rest === '') {
      const seq: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
        seq.push(strip(lines[j].replace(/^\s*-\s+/, '').trim()));
        j++;
      }
      return seq;
    }
    return [];
  };
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const rest = kv[2].trim();
    if (key === 'tags') {
      out.tags = readSeq(rest, i);
    } else if (key === 'alsoFor') {
      out.alsoFor = readSeq(rest, i);
    } else if (key === 'name' || key === 'description' || key === 'persona' || key === 'category') {
      out[key] = strip(rest);
    }
  }
  return out;
}

function publishedPlugins(): string[] {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(skillsSrcRoot, 'plugins.json'), 'utf8'));
    return (manifest.plugins ?? []).map((p: {name: string}) => p.name);
  } catch {
    return [];
  }
}

interface TaxonomySchema {
  personas: Record<string, {label: string; active?: boolean; categories: string[]}>;
}

function readSchema(): TaxonomySchema | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(skillsSrcRoot, 'taxonomy.schema.json'), 'utf8'));
  } catch {
    return null;
  }
}

export default {
  watch: ['../skills/*/skills/*/SKILL.md', '../skills/taxonomy.schema.json', '../skills/plugins.json'],
  load(): SkillsIndex {
    const abs = (p: string) => `${siteOrigin}${basePath}${p}`;
    const schema = readSchema();
    const personaLabel = (id: string | null) => (id && schema?.personas[id]?.label) || id;

    const skills: SkillRecord[] = [];
    for (const plugin of publishedPlugins()) {
      const pluginSkillsDir = path.join(skillsSrcRoot, plugin, 'skills');
      if (!fs.existsSync(pluginSkillsDir)) continue;
      for (const entry of fs.readdirSync(pluginSkillsDir, {withFileTypes: true})) {
        if (!entry.isDirectory()) continue;
        const skillName = entry.name;
        const skillMd = path.join(pluginSkillsDir, skillName, 'SKILL.md');
        if (!fs.existsSync(skillMd)) continue;
        const fm = readFrontmatter(fs.readFileSync(skillMd, 'utf8'));
        const referencesDir = path.join(pluginSkillsDir, skillName, 'references');
        const refs = fs.existsSync(referencesDir)
          ? fs
              .readdirSync(referencesDir, {withFileTypes: true})
              .filter((e) => e.isFile() && e.name.endsWith('.md'))
              .map((e) => e.name)
              .sort()
          : [];
        skills.push({
          name: fm.name ?? skillName,
          plugin,
          persona: fm.persona ?? null,
          personaLabel: personaLabel(fm.persona ?? null),
          category: fm.category ?? null,
          alsoFor: fm.alsoFor,
          tags: fm.tags,
          description: fm.description ?? '',
          skillUrl: abs(`skills/${plugin}/skills/${skillName}/SKILL.md`),
          referenceUrls: refs.map((r) => abs(`skills/${plugin}/skills/${skillName}/references/${r}`)),
        });
      }
    }
    skills.sort((a, b) => a.name.localeCompare(b.name));

    // Persona → category tree. A skill belongs to a persona if it is the
    // primary persona OR appears in alsoFor — so the chip count matches what
    // the catalog filter shows. Order personas + categories by the schema when
    // available; otherwise fall back to discovery order. Skip personas with no
    // skills (so a defined-but-unused persona doesn't show empty).
    const servesPersona = (s: SkillRecord, pid: string) => s.persona === pid || s.alsoFor.includes(pid);
    const personaTree: PersonaNode[] = [];
    const personaOrder = schema ? Object.keys(schema.personas) : [];
    const discovered = [...new Set(skills.flatMap((s) => [s.persona, ...s.alsoFor]).filter((p): p is string => !!p))];
    const orderedPersonas = [
      ...personaOrder.filter((p) => discovered.includes(p)),
      ...discovered.filter((p) => !personaOrder.includes(p)),
    ];
    for (const pid of orderedPersonas) {
      const inPersona = skills.filter((s) => servesPersona(s, pid));
      if (inPersona.length === 0) continue;
      // Categories are only meaningful for a skill's PRIMARY persona; an
      // alsoFor skill keeps its home category, so only count primary matches
      // in the per-category breakdown.
      const catOrder = schema?.personas[pid]?.categories ?? [];
      const catCounts = new Map<string, number>();
      for (const s of inPersona)
        if (s.persona === pid && s.category) catCounts.set(s.category, (catCounts.get(s.category) ?? 0) + 1);
      const orderedCats = [
        ...catOrder.filter((c) => catCounts.has(c)),
        ...[...catCounts.keys()].filter((c) => !catOrder.includes(c)),
      ];
      personaTree.push({
        id: pid,
        label: personaLabel(pid) ?? pid,
        count: inPersona.length,
        categories: orderedCats.map((name) => ({name, count: catCounts.get(name) ?? 0})),
      });
    }

    // Tag cloud counts, descending then alphabetical.
    const tagMap = new Map<string, number>();
    for (const s of skills) for (const t of s.tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    const tagCounts = [...tagMap.entries()]
      .map(([tag, count]) => ({tag, count}))
      .sort((a, b) => (b.count === a.count ? a.tag.localeCompare(b.tag) : b.count - a.count));

    return {base: basePath, origin: siteOrigin, skills, personaTree, tagCounts, fidelityNote: FIDELITY_NOTE};
  },
};
