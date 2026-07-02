/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Refreshes ALL bundled documentation data sets at once from a single B2C
 * Commerce documentation archive, then regenerates every derived index.
 *
 * The bundled corpora all originate from the same `demandware-mock.zip` archive
 * that `b2c docs download` fetches from an instance, but historically each was
 * synced by hand and drifted independently. This script makes the whole refresh
 * one reproducible step:
 *
 *   1. Download the archive from the user's default instance via the CLI
 *      (`b2c docs download` — reuses the user's instance/auth config).
 *   2. From the inner `DWAPP-<version>-API-doc.zip`, repopulate:
 *        - data/script-api/*.md          (Script API reference)
 *        - data/content-schemas/*.json   (Page Designer / content metadefinitions)
 *        - data/xsd/*.xsd                (import/export XSD schemas)
 *      and extract `jobstepapi/html/api/jobstep.*.html` for the job-step dataset.
 *   3. Regenerate the job-step dataset + markdown (build:job-steps-dataset,
 *      generate:job-steps-docs) and the search indexes (generate:docs-index).
 *   4. Rebuild the Developer Center guides index (generate:guides-index) from a
 *      local commerce-cloud-docs clone, and the tooling-docs index
 *      (generate:tooling-index) from this repo's own docs/. Guides content is
 *      NOT bundled (fetched online on read); only the metadata index is written.
 *
 * Usage (from repo root or the SDK package):
 *   pnpm --filter @salesforce/b2c-tooling-sdk run refresh:docs-data
 *
 * Options (env vars):
 *   B2C_INSTANCE       forwarded to `b2c docs download --instance <name>` to pick
 *                      a non-default instance.
 *   COMMERCE_DOCS_REPO local commerce-cloud-docs clone for the guides index
 *                      (default ~/code/commerce-cloud-docs). If absent, the
 *                      guides step is skipped with a warning.
 *   KEEP_WORKDIR=1     keep the temp download/extract directory for inspection.
 *
 * Note: LLM enrichment of the guides (summaries/keywords) is a separate optional
 * step — run `pnpm --filter @salesforce/b2c-tooling-sdk run enrich:docs` before
 * generate:guides-index to include it. It is intentionally not run here so this
 * refresh has no LLM/API-key dependency.
 */

import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SDK_ROOT, '../..');
const DATA_DIR = path.join(SDK_ROOT, 'data');

const SCRIPT_API_DIR = path.join(DATA_DIR, 'script-api');
const CONTENT_SCHEMAS_DIR = path.join(DATA_DIR, 'content-schemas');
const XSD_DIR = path.join(DATA_DIR, 'xsd');

/** Run a command, inheriting stdio so progress/auth prompts are visible. */
function run(cmd: string, args: string[], cwd: string): void {
  execFileSync(cmd, args, {cwd, stdio: 'inherit'});
}

/** Replace every file matching `keep`-excluded predicate in a dir, then copy fresh files in. */
function syncDir(targetDir: string, files: {name: string; content: Buffer}[], removeExt: string): void {
  fs.mkdirSync(targetDir, {recursive: true});
  for (const existing of fs.readdirSync(targetDir)) {
    if (existing.endsWith(removeExt)) {
      fs.rmSync(path.join(targetDir, existing));
    }
  }
  for (const {name, content} of files) {
    fs.writeFileSync(path.join(targetDir, name), content);
  }
}

/** Pull all entries under `prefix` (non-directory) out of a loaded zip. */
async function entriesUnder(zip: JSZip, prefix: string): Promise<{name: string; content: Buffer}[]> {
  const out: {name: string; content: Buffer}[] = [];
  for (const [relPath, entry] of Object.entries(zip.files)) {
    if (!relPath.startsWith(prefix) || entry.dir) continue;
    const name = relPath.slice(prefix.length);
    if (!name || name.includes('/')) continue; // flat only
    out.push({name, content: await entry.async('nodebuffer')});
  }
  return out;
}

async function main(): Promise<void> {
  const keepWorkdir = process.env.KEEP_WORKDIR === '1';
  const instance = process.env.B2C_INSTANCE;

  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-docs-refresh-'));
  const downloadDir = path.join(workdir, 'download');
  fs.mkdirSync(downloadDir, {recursive: true});

  try {
    // 1. Download the archive via the CLI (uses the user's default instance/auth).
    console.log('→ Downloading documentation archive via `b2c docs download`...');
    const cliArgs = ['docs', 'download', downloadDir, '--keep-archive'];
    if (instance) cliArgs.push('--instance', instance);
    run(path.join(REPO_ROOT, 'cli'), cliArgs, REPO_ROOT);

    // 2. Open the outer archive and locate the inner API-doc zip.
    const outerZipPath = path.join(downloadDir, 'demandware-mock.zip');
    const outerZip = await JSZip.loadAsync(fs.readFileSync(outerZipPath));
    const apiDocName = Object.keys(outerZip.files).find((n) => /DWAPP-.*API-doc\.zip$/i.test(n));
    if (!apiDocName) throw new Error('API documentation archive not found in downloaded package');

    const versionMatch = apiDocName.match(/DWAPP-([\d.]+)-API-doc\.zip$/i);
    const version = versionMatch?.[1] ?? 'unknown';
    console.log(`→ Archive version: DWAPP ${version}`);

    const innerZip = await JSZip.loadAsync(await outerZip.files[apiDocName].async('nodebuffer'));

    // 3. Script API markdown.
    const scriptApi = await entriesUnder(innerZip, 'sfdocs/script-api/');
    const scriptApiMd = scriptApi.filter((f) => f.name.endsWith('.md'));
    syncDir(SCRIPT_API_DIR, scriptApiMd, '.md');
    console.log(`→ Script API: ${scriptApiMd.length} markdown files`);

    // 4. Content / Page Designer JSON schemas.
    const contentSchemas = (await entriesUnder(innerZip, 'content/')).filter((f) => f.name.endsWith('.json'));
    syncDir(CONTENT_SCHEMAS_DIR, contentSchemas, '.json');
    console.log(`→ Content schemas: ${contentSchemas.length} JSON files`);

    // 5. XSD schemas (index.json is regenerated below, so only .xsd is swapped).
    const xsds = (await entriesUnder(innerZip, 'xsd/')).filter((f) => f.name.endsWith('.xsd'));
    syncDir(XSD_DIR, xsds, '.xsd');
    console.log(`→ XSD schemas: ${xsds.length} files`);

    // 6. Job-step HTML → temp dir for the dataset builder.
    const jobStepHtmlDir = path.join(workdir, 'jobstep-html');
    fs.mkdirSync(jobStepHtmlDir, {recursive: true});
    const jobStepHtml = (await entriesUnder(innerZip, 'jobstepapi/html/api/')).filter((f) =>
      /^jobstep\.[A-Za-z0-9_]+\.html$/.test(f.name),
    );
    for (const {name, content} of jobStepHtml) {
      fs.writeFileSync(path.join(jobStepHtmlDir, name), content);
    }
    console.log(`→ Job-step HTML: ${jobStepHtml.length} files`);

    // 7. Regenerate derived artifacts via the existing scripts.
    console.log('→ Building job-step dataset...');
    run('pnpm', ['exec', 'tsx', 'scripts/build-job-steps-dataset.ts', jobStepHtmlDir, version], SDK_ROOT);

    console.log('→ Generating job-step docs...');
    run('pnpm', ['exec', 'tsx', 'scripts/generate-job-steps-docs.ts'], SDK_ROOT);

    console.log('→ Generating search indexes...');
    run('pnpm', ['exec', 'tsx', 'scripts/generate-docs-index.ts'], SDK_ROOT);

    // 8. Developer Center guides index (from a local commerce-cloud-docs clone).
    //    Metadata only — guide content is fetched online at read time.
    const docsRepo = process.env.COMMERCE_DOCS_REPO;
    const docsRepoContent = docsRepo
      ? path.join(path.resolve(docsRepo), 'content', 'en-us')
      : path.join(os.homedir(), 'code', 'commerce-cloud-docs', 'content', 'en-us');
    if (fs.existsSync(docsRepoContent)) {
      console.log('→ Generating Developer Center guides index...');
      run('pnpm', ['exec', 'tsx', 'scripts/generate-guides-index.ts'], SDK_ROOT);
    } else {
      console.log(
        `→ Skipping guides index: commerce-cloud-docs not found at ${docsRepoContent} ` +
          '(set COMMERCE_DOCS_REPO to enable).',
      );
    }

    // 9. Tooling-docs index (this repo's own conceptual guides).
    console.log('→ Generating tooling-docs index...');
    run('pnpm', ['exec', 'tsx', 'scripts/generate-tooling-index.ts'], SDK_ROOT);

    console.log(`\n✓ Bundled documentation data refreshed to DWAPP ${version}.`);
    console.log('  Review the diff under packages/b2c-tooling-sdk/data/ before committing.');
  } finally {
    if (keepWorkdir) {
      console.log(`(workdir kept at ${workdir})`);
    } else {
      fs.rmSync(workdir, {recursive: true, force: true});
    }
  }
}

main().catch((err) => {
  console.error('Failed to refresh documentation data:', err);
  process.exit(1);
});
