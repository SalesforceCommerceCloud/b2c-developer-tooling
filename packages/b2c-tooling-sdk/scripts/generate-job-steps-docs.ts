/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generates the bundled markdown reference + search index for STANDARD (system)
 * job step types from the curated `data/job-steps/job-steps.json` dataset.
 *
 * The generated docs are merged into the same searchable corpus used by
 * `b2c docs search` / `b2c docs read` (CLI) and the `docs_search` / `docs_read`
 * MCP tools, so standard job steps become discoverable alongside the Script API.
 *
 * Run with: pnpm --filter @salesforce/b2c-tooling-sdk run generate:job-steps-docs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

interface JobStepParameter {
  name: string;
  required: boolean;
  default?: string;
  allowedValues?: string[];
  description: string;
}

interface JobStep {
  typeId: string;
  kind: 'Import' | 'Export' | 'Process';
  scope: string;
  purpose: string;
  parameters: JobStepParameter[];
}

interface JobStepsDataset {
  version: string;
  provenance: Record<string, string>;
  steps: JobStep[];
}

interface DocEntry {
  id: string;
  title: string;
  category?: string;
  filePath: string;
  preview?: string;
}

interface SearchIndex {
  version: string;
  generatedAt: string;
  entries: DocEntry[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOB_STEPS_DIR = path.resolve(__dirname, '../data/job-steps');
const DATASET_PATH = path.join(JOB_STEPS_DIR, 'job-steps.json');

const HEADER = '<!-- prettier-ignore-start -->';
const FOOTER = '<!-- prettier-ignore-end -->';

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '...';
}

function scopeSentence(scope: string): string {
  if (scope === 'Organization') return 'an organization-level job flow';
  if (scope === 'Site') return 'a site-level job flow';
  return 'an organization- or site-level job flow';
}

function parametersTable(step: JobStep): string[] {
  if (step.parameters.length === 0) {
    return ['## Configuration Parameters', '', 'This step takes no configuration parameters.', ''];
  }
  const lines = [
    '## Configuration Parameters',
    '',
    '| Parameter | Required | Default | Allowed Values | Description |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const p of step.parameters) {
    const required = p.required ? 'Yes' : 'No';
    const dflt = p.default !== undefined && p.default !== '' ? `\`${p.default}\`` : '—';
    const allowed = p.allowedValues?.length ? p.allowedValues.map((v) => `\`${v}\``).join(', ') : '—';
    const desc = p.description ? escapeCell(p.description) : '—';
    lines.push(`| \`${p.name}\` | ${required} | ${dflt} | ${allowed} | ${desc} |`);
  }
  lines.push('');
  return lines;
}

function impexGuidance(step: JobStep): string[] {
  if (step.kind === 'Import') {
    return [
      '## Working With IMPEX Files',
      '',
      'This step reads files from the instance IMPEX area. `WorkingFolder` is resolved relative to ' +
        '`IMPEX/src/` (and defaults to `IMPEX/src/`); use `FileNamePattern` to select which file(s) to ' +
        'import. A prior step — custom or standard — that writes a file under `IMPEX/src/...` can hand ' +
        'off directly to this step. See the chaining example in the `b2c:b2c-custom-job-steps` skill.',
      '',
    ];
  }
  if (step.kind === 'Export') {
    return [
      '## Working With IMPEX Files',
      '',
      'This step writes a file into the instance IMPEX area (typically under `IMPEX/src/...`). The ' +
        'produced file can be consumed by a later step in the same flow (for example a replication or a ' +
        'custom processing step) or downloaded via WebDAV. See the `b2c:b2c-custom-job-steps` skill for ' +
        'IMPEX hand-off patterns.',
      '',
    ];
  }
  return [];
}

function renderStep(step: JobStep): string {
  const kindLabel = step.kind === 'Import' ? 'Import' : step.kind === 'Export' ? 'Export' : 'Processing';
  const lines: string[] = [
    HEADER,
    `# Job Step: ${step.typeId}`,
    '',
    `**Type ID:** \`${step.typeId}\`  `,
    `**Scope:** ${step.scope} (add to ${scopeSentence(step.scope)})  `,
    `**Category:** Standard / system job step (${kindLabel})`,
    '',
  ];
  if (step.purpose) {
    lines.push(step.purpose, '');
  }
  lines.push(
    'This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job ' +
      'flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ' +
      'ID in a `jobs.xml` flow inside a site-import archive.',
    '',
  );
  lines.push(...parametersTable(step));
  lines.push(...impexGuidance(step));
  lines.push(
    '## Related',
    '',
    '- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).',
    '- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.',
    '- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.',
    '',
    FOOTER,
  );
  return lines.join('\n') + '\n';
}

function renderCatalog(dataset: JobStepsDataset): string {
  const byKind = (kind: string) => dataset.steps.filter((s) => s.kind === kind);
  const lines: string[] = [
    HEADER,
    '# Standard Job Step Catalog',
    '',
    'Catalog of built-in (standard / system) job step **type IDs** that the B2C Commerce platform ' +
      'ships for use in Business Manager job flows and `jobs.xml` site-import flows. Each step below has ' +
      'its own page with purpose and configuration parameters — read it with `b2c docs read <TypeID>` ' +
      '(for example `b2c docs read ImportCatalog`).',
    '',
    'These are the standard counterparts to authoring your own steps (see the ' +
      '`b2c:b2c-custom-job-steps` skill) and to the CLI import/export commands (see the ' +
      '`b2c-cli:b2c-job` skill).',
    '',
  ];
  for (const [label, kind] of [
    ['Import Steps', 'Import'],
    ['Export Steps', 'Export'],
    ['Processing Steps', 'Process'],
  ] as const) {
    const steps = byKind(kind);
    if (steps.length === 0) continue;
    lines.push(`## ${label}`, '', '| Type ID | Scope | Purpose |', '| --- | --- | --- |');
    for (const s of steps) {
      lines.push(`| \`${s.typeId}\` | ${s.scope} | ${escapeCell(truncate(s.purpose, 120))} |`);
    }
    lines.push('');
  }
  lines.push('## Provenance', '', escapeCell(dataset.provenance.derivation), '', FOOTER);
  return lines.join('\n') + '\n';
}

function generate(): void {
  const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8')) as JobStepsDataset;

  // Remove previously generated markdown (keep the source json)
  for (const file of fs.readdirSync(JOB_STEPS_DIR)) {
    if (file.endsWith('.md')) {
      fs.unlinkSync(path.join(JOB_STEPS_DIR, file));
    }
  }

  const entries: DocEntry[] = [];

  // Per-step pages
  for (const step of dataset.steps) {
    const fileName = `${step.typeId}.md`;
    fs.writeFileSync(path.join(JOB_STEPS_DIR, fileName), renderStep(step));
    entries.push({
      id: step.typeId,
      title: `Job Step: ${step.typeId}`,
      category: 'job-step',
      filePath: fileName,
      preview: truncate(step.purpose || `Standard ${step.kind.toLowerCase()} job step.`),
    });
  }

  // Catalog overview page (discoverable via "job steps", "job-steps", "standard step")
  fs.writeFileSync(path.join(JOB_STEPS_DIR, 'job-steps.md'), renderCatalog(dataset));
  entries.push({
    id: 'job-steps',
    title: 'Standard Job Step Catalog',
    category: 'job-step',
    filePath: 'job-steps.md',
    preview: 'Catalog of built-in standard/system job step type IDs for Business Manager job flows.',
  });

  entries.sort((a, b) => a.id.localeCompare(b.id));

  const index: SearchIndex = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(path.join(JOB_STEPS_DIR, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`Generated job-step docs: ${dataset.steps.length} steps + 1 catalog at ${JOB_STEPS_DIR}`);
}

generate();
