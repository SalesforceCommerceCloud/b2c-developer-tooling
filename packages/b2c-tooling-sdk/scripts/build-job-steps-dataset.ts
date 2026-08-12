/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Builds the standard job-step dataset (data/job-steps/job-steps.json) from the
 * PUBLIC B2C Commerce Job Step API documentation — the `jobstepapi/` section of
 * the Script API documentation archive. No private/internal source is used.
 *
 * Obtain the input HTML by downloading the documentation archive from an
 * instance and extracting the `jobstepapi/html/api/jobstep.*.html` files, e.g.:
 *
 *   b2c docs download ./docs-archive --keep-archive
 *   # then unzip the inner DWAPP-*.API-doc.zip and point this script at
 *   # the extracted jobstepapi/html/api directory
 *
 * Usage:
 *   pnpm --filter @salesforce/b2c-tooling-sdk run build:job-steps-dataset -- <dir-with-jobstep-html>
 *
 * After regenerating the dataset, run `generate:job-steps-docs` to rebuild the
 * bundled markdown + search index.
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../data/job-steps/job-steps.json');

/** Strip HTML to text, preserving block boundaries as newlines. */
function htmlToText(html: string): string {
  let t = html;
  t = t.replace(/<script[\s\S]*?<\/script>/gi, '');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, '');
  t = t.replace(/<\/(div|p|li|tr|td|th|h[1-6]|dt|dd|table|ul|ol|span)>/gi, '\n');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<[^>]+>/g, ' ');
  t = decodeEntities(t);
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/\n[ \t]+/g, '\n');
  t = t.replace(/\n{2,}/g, '\n');
  return t.trim();
}

function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    copy: '©',
    reg: '®',
    trade: '™',
    mdash: '—',
    ndash: '–',
    hellip: '…',
    rsquo: '’',
    lsquo: '‘',
    ldquo: '“',
    rdquo: '”',
    '#39': "'",
  };
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-zA-Z]+|#\d+);/g, (m, e) => named[e] ?? m);
}

/** Trim a verbose overview to a concise summary, dropping inlined JSON examples. */
function summarize(purpose: string): string {
  let p = purpose.trim();
  for (const marker of [
    'The following is an example',
    'The following is an JSON',
    'The following is a JSON',
    'The JSON syntax',
    '{ "',
    '{"',
  ]) {
    const idx = p.indexOf(marker);
    if (idx !== -1) p = p.slice(0, idx).trim();
  }
  if (p.length > 500) {
    const sentences = p.split(/(?<=[.!?])\s+/);
    let out = '';
    for (const s of sentences) {
      if (out && out.length + s.length > 500) break;
      out = `${out} ${s}`.trim();
    }
    p = out;
  }
  return p.trim();
}

function scopeLabel(ctx: string): string {
  const c = ctx.trim();
  if (['Organization or Sites', 'Organization, Sites', 'Organization, Site'].includes(c)) {
    return 'Organization & Sites';
  }
  if (c === 'Sites' || c === 'Site') return 'Site';
  return c; // 'Organization'
}

function kindFor(typeId: string): 'Import' | 'Export' | 'Process' {
  if (typeId.startsWith('Import')) return 'Import';
  if (
    typeId.startsWith('Export') ||
    ['SiteExport', 'CatalogDeltaExport', 'CustomerListsDeltaExport', 'LibraryDeltaExport'].includes(typeId)
  ) {
    return 'Export';
  }
  return 'Process';
}

function parseStep(typeId: string, text: string): JobStep {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const ecIdx = lines.findIndex((l) => l.replace(/:$/, '').trim() === 'Execution Context');
  const ctx = ecIdx !== -1 && ecIdx + 1 < lines.length ? lines[ecIdx + 1].trim() : '';

  const headerIdxs = lines.map((l, i) => (l === typeId ? i : -1)).filter((i) => i !== -1);
  let purpose = '';
  if (headerIdxs.length && ecIdx !== -1) {
    purpose = summarize(
      lines
        .slice(headerIdxs[headerIdxs.length - 1] + 1, ecIdx)
        .join(' ')
        .trim(),
    );
  }

  const params: JobStepParameter[] = [];
  const ipIdx = lines.findIndex((l) => l === 'Input Parameters');
  if (ipIdx !== -1) {
    // The Input Parameters section ends at the next top-level section
    // (e.g. "Exit Status", "Output Parameters") or the page footer.
    const afterIp = lines.slice(ipIdx + 1);
    const endMarkers = ['Exit Status', 'Output Parameters', 'Status Codes'];
    let endIdx = afterIp.findIndex((l) => endMarkers.includes(l.replace(/:$/, '').trim()));
    if (endIdx === -1) {
      const copyIdx = afterIp.findIndex((l) => /Copyright \d{4}/.test(l));
      endIdx = copyIdx === -1 ? afterIp.length : copyIdx;
    }
    const sec = afterIp.slice(0, endIdx);
    const isHeader = (i: number) =>
      i + 3 < sec.length && sec[i + 1] === ':' && /^\((Required|Optional)\)$/.test(sec[i + 3]);
    let i = 0;
    while (i < sec.length) {
      if (isHeader(i)) {
        const name = sec[i];
        const required = sec[i + 3] === '(Required)';
        let j = i + 4;
        const descParts: string[] = [];
        let allowed: string[] | undefined;
        let dflt: string | undefined;
        while (j < sec.length && !isHeader(j)) {
          const cur = sec[j];
          if (cur.replace(/:$/, '').trim() === 'Allowed Values') {
            if (j + 1 < sec.length) {
              allowed = sec[j + 1]
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean);
            }
            j += 2;
            continue;
          }
          if (cur.replace(/:$/, '').trim() === 'Default Value') {
            if (j + 1 < sec.length) dflt = sec[j + 1].trim();
            j += 2;
            continue;
          }
          descParts.push(cur);
          j += 1;
        }
        const rec: JobStepParameter = {name, required, description: descParts.join(' ').trim()};
        if (dflt) rec.default = dflt;
        if (allowed?.length) rec.allowedValues = allowed;
        params.push(rec);
        i = j;
      } else {
        i += 1;
      }
    }
  }

  return {typeId, kind: kindFor(typeId), scope: scopeLabel(ctx), purpose, parameters: params};
}

function main(): void {
  const inputDir = process.argv[2];
  // Optional platform version (e.g. "26.7"), forwarded by refresh-docs-data.ts.
  // Falls back to the previously bundled version when run standalone.
  const platformVersion = process.argv[3] ?? '26.7';
  if (!inputDir) {
    console.error('Usage: build-job-steps-dataset.ts <dir-with-jobstep-html> [platform-version]');
    console.error('  The directory must contain jobstep.<TypeID>.html files from the');
    console.error('  jobstepapi section of a downloaded B2C Commerce documentation archive.');
    process.exit(1);
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => /^jobstep\.[A-Za-z0-9_]+\.html$/.test(f))
    .sort();
  if (files.length === 0) {
    console.error(`No jobstep.*.html files found in ${inputDir}`);
    process.exit(1);
  }

  const steps: JobStep[] = files.map((f) => {
    const typeId = f.replace(/^jobstep\./, '').replace(/\.html$/, '');
    return parseStep(typeId, htmlToText(fs.readFileSync(path.join(inputDir, f), 'utf-8')));
  });

  steps.sort((a, b) => (a.kind === b.kind ? a.typeId.localeCompare(b.typeId) : a.kind.localeCompare(b.kind)));

  const dataset = {
    version: '2.0.0',
    provenance: {
      description:
        'Catalog of standard (system) B2C Commerce job step type IDs available in Business Manager job flows and jobs.xml site-import flows.',
      derivation:
        'Generated from the public B2C Commerce Job Step API documentation (the jobstepapi section of the Script API documentation archive obtained via `b2c docs download`). Each step lists its purpose, execution scope, and input parameters (required, description, allowed values, default) as published in that documentation.',
      platformDocVersion: `DWAPP ${platformVersion}`,
      regenerate:
        'pnpm --filter @salesforce/b2c-tooling-sdk run refresh:docs-data (or, standalone: build:job-steps-dataset -- <jobstep-html-dir> [version]; then generate:job-steps-docs)',
    },
    steps,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
  const byKind = (k: string) => steps.filter((s) => s.kind === k).length;
  console.log(
    `Wrote ${steps.length} job steps to ${OUTPUT_PATH} ` +
      `(Import=${byKind('Import')} Export=${byKind('Export')} Process=${byKind('Process')})`,
  );
}

main();
