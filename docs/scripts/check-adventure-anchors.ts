#!/usr/bin/env tsx
//
// Validates that every doc anchor referenced by a Setup Adventure (step
// `docAnchor` and checklist `href`) resolves to an actual heading in the
// corresponding source `.md` file. Run from `docs/` via `tsx`. Fails with a
// non-zero exit code on any missing anchor.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import {adventures, flags} from '../.vitepress/data/adventures/index.js';
import type {Adventure, AdventureState, DocAnchor, Step} from '../.vitepress/data/adventures/_types.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, '..');

// Slugify a heading the way markdown-it-anchor does (which VitePress uses):
// trim, lowercase, drop characters that aren't word/space/hyphen, replace
// spaces with hyphens. Honours explicit `{#custom-id}` overrides.
function slugify(heading: string): string {
  const explicit = heading.match(/\{#([^}]+)\}\s*$/);
  if (explicit) return explicit[1].trim();
  return heading
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const anchorsByFile = new Map<string, Set<string>>();

function loadAnchors(filePath: string): Set<string> {
  const cached = anchorsByFile.get(filePath);
  if (cached) return cached;
  const out = new Set<string>();
  if (!fs.existsSync(filePath)) {
    anchorsByFile.set(filePath, out);
    return out;
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (!m) continue;
    out.add(slugify(m[1]));
  }
  anchorsByFile.set(filePath, out);
  return out;
}

function resolveDocFile(docPath: string): string {
  // Adventures use paths without `.md`. Try `<path>.md` then `<path>/index.md`.
  const trimmed = docPath.replace(/\/$/, '');
  const candidates = [
    path.join(DOCS_DIR, `${trimmed}.md`),
    path.join(DOCS_DIR, trimmed, 'index.md'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[0];
}

interface Issue {
  adventure: string;
  source: string;
  anchor: DocAnchor;
  reason: string;
}

const issues: Issue[] = [];

function check(adventureId: string, source: string, a: DocAnchor) {
  if (/^https?:\/\//.test(a.path)) return; // external URLs aren't ours to validate
  const file = resolveDocFile(a.path);
  if (!fs.existsSync(file)) {
    issues.push({adventure: adventureId, source, anchor: a, reason: `Source file not found: ${file}`});
    return;
  }
  if (!a.hash) return; // top-of-page is always fine
  const anchors = loadAnchors(file);
  if (!anchors.has(a.hash)) {
    issues.push({
      adventure: adventureId,
      source,
      anchor: a,
      reason: `Anchor "#${a.hash}" not found in ${path.relative(DOCS_DIR, file)}`,
    });
  }
}

function mergeContrib(accum: AdventureState, contrib: AdventureState | undefined) {
  if (!contrib) return;
  for (const [k, v] of Object.entries(contrib)) {
    if (Array.isArray(v)) {
      const prev = accum[k];
      const merged = Array.isArray(prev) ? [...prev, ...v] : [...v];
      accum[k] = Array.from(new Set(merged));
    } else {
      accum[k] = v;
    }
  }
}

// DFS over an adventure's choice tree to enumerate every reachable state.
// Multi-select steps fan out to {each pick alone, all picks together} —
// enough subsets to cover synthesizer branches without 2^n explosion.
function enumerateStates(adventure: Adventure): AdventureState[] {
  const results: AdventureState[] = [];
  function visit(stepIdx: number, accum: AdventureState) {
    const visibleSteps = adventure.stepOrder
      .map((id) => adventure.steps[id])
      .filter((s) => !s.showIf || s.showIf(accum, flags));
    if (stepIdx >= visibleSteps.length) {
      results.push({...accum});
      return;
    }
    const step: Step = visibleSteps[stepIdx];
    const choices = step.choices(accum, flags).filter((c) => !c.featureFlag || flags[c.featureFlag]);
    if (choices.length === 0) {
      results.push({...accum});
      return;
    }
    if (step.multiSelect) {
      const subsets = [...choices.map((c) => [c]), choices];
      for (const subset of subsets) {
        const next = {...accum};
        for (const c of subset) mergeContrib(next, c.contributes);
        visit(stepIdx + 1, next);
      }
    } else {
      for (const c of choices) {
        const next = {...accum};
        mergeContrib(next, c.contributes);
        visit(stepIdx + 1, next);
      }
    }
  }
  visit(0, {});
  return results;
}

for (const adventure of adventures) {
  for (const stepId of adventure.stepOrder) {
    const step = adventure.steps[stepId];
    check(adventure.id, `step:${stepId}`, step.docAnchor);
  }
  for (const state of enumerateStates(adventure)) {
    const result = adventure.synthesize(state, flags);
    for (const item of result.checklist) {
      check(adventure.id, `checklist:${item.text}`, item.href);
    }
  }
}

if (issues.length === 0) {
  // eslint-disable-next-line no-console
  console.log(`✓ All Setup Adventure anchors resolve (${adventures.length} adventures checked).`);
  process.exit(0);
}

// eslint-disable-next-line no-console
console.error(`✗ ${issues.length} Setup Adventure anchor issue(s):`);
for (const i of issues) {
  // eslint-disable-next-line no-console
  console.error(
    `  [${i.adventure}] ${i.source}\n    → ${i.anchor.path}${i.anchor.hash ? `#${i.anchor.hash}` : ''} (${i.anchor.label})\n    ${i.reason}`,
  );
}
process.exit(1);
