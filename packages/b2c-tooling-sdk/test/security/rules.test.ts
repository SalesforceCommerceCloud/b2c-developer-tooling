/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Fixture-driven tests for every built-in security rule.
 *
 * Each rule has a directory test/security/fixtures/<rule-id>/. Every .js file
 * under it is a fixture: lines that should produce a finding end with
 * `// expect`, and files without markers must produce none. Fixtures can be
 * single files (bad.js, good.js) or a project tree with cartridges (folders
 * with a .project file); an optional project.json sets {"cartridgePath": [...]}.
 * A project index is built from the rule's directory and passed to every
 * runner as settings.b2cSecurity.projectIndex.
 *
 * Every rule runs under three runners — the SDK runner, ESLint, and oxlint's JS
 * plugins — and all three must agree with the markers. Each rule must also
 * have a section in docs/guide/security-rules.md.
 */
import {expect} from 'chai';
import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Linter} from 'eslint';
import {buildProjectIndex, type ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';
import {SCRIPT_RULES, SECURITY_SETTINGS_KEY, runScriptRules} from '@salesforce/b2c-tooling-sdk/security';

const here = path.dirname(fileURLToPath(import.meta.url));
const sdkRoot = path.resolve(here, '..', '..');
const fixturesDir = path.join(here, 'fixtures');
const docsPath = path.resolve(sdkRoot, '..', '..', 'docs', 'guide', 'security-rules.md');

const ruleIds = SCRIPT_RULES.map((r) => r.meta.b2c.id);

function listFiles(dir: string, match: (name: string) => boolean): string[] {
  return fs
    .readdirSync(dir, {withFileTypes: true, recursive: true})
    .filter((d) => d.isFile() && match(d.name))
    .map((d) => path.join(d.parentPath, d.name))
    .sort();
}

function listJsFiles(dir: string): string[] {
  return listFiles(dir, (name) => name.endsWith('.js'));
}

function expectedLines(file: string): number[] {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line, i) => (/\/\/ expect\s*$/.test(line) ? i + 1 : 0))
    .filter(Boolean);
}

function uniqueSorted(lines: number[]): number[] {
  return [...new Set(lines)].sort((a, b) => a - b);
}

/** Builds the project index for a rule's fixture directory (cartridges anywhere below it). */
function indexFor(id: string): ProjectIndex {
  const dir = path.join(fixturesDir, id);
  const projectJson = listFiles(dir, (name) => name === 'project.json')[0];
  const cartridgePath = projectJson
    ? (JSON.parse(fs.readFileSync(projectJson, 'utf8')) as {cartridgePath?: string[]}).cartridgePath
    : undefined;
  return buildProjectIndex({root: dir, cartridgePath});
}

function settingsFor(index: ProjectIndex): Record<string, unknown> {
  return {[SECURITY_SETTINGS_KEY]: {projectIndex: index}};
}

function sdkLines(id: string, file: string, index: ProjectIndex): number[] {
  const rule = SCRIPT_RULES.find((r) => r.meta.b2c.id === id)!;
  const result = runScriptRules(fs.readFileSync(file, 'utf8'), file, [rule], settingsFor(index));
  expect(result.parseError, `${file} should parse`).to.equal(undefined);
  return uniqueSorted(result.reports.map((r) => r.line));
}

function eslintLines(id: string, file: string, index: ProjectIndex): number[] {
  const rule = SCRIPT_RULES.find((r) => r.meta.b2c.id === id)!;
  const linter = new Linter({configType: 'flat'});
  const messages = linter.verify(
    fs.readFileSync(file, 'utf8'),
    [
      {
        files: ['**/*.js'],
        languageOptions: {ecmaVersion: 'latest', sourceType: 'commonjs'},
        // The rule shape is ESLint's; the extra `meta.b2c` field is ignored by ESLint.
        plugins: {'b2c-security': {rules: {[id]: rule as unknown as never}}},
        rules: {[`b2c-security/${id}`]: 'error'},
        settings: settingsFor(index),
      },
    ],
    file,
  );
  const fatal = messages.find((m) => m.fatal);
  expect(fatal, fatal?.message).to.equal(undefined);
  return uniqueSorted(messages.filter((m) => m.ruleId === `b2c-security/${id}`).map((m) => m.line));
}

describe('security rules', () => {
  it('every rule has an ID, fixtures with and without findings, and a docs section', () => {
    const docs = fs.readFileSync(docsPath, 'utf8');
    for (const rule of SCRIPT_RULES) {
      const {id} = rule.meta.b2c;
      expect(id, 'rule IDs are kebab-case without slashes').to.match(/^[a-z][a-z\d]*(-[a-z\d]+)*$/);
      const dir = path.join(fixturesDir, id);
      expect(fs.existsSync(dir), `fixtures/${id}/`).to.equal(true);
      const files = listJsFiles(dir);
      expect(
        files.some((f) => expectedLines(f).length > 0),
        `${id} has a fixture with // expect markers`,
      ).to.equal(true);
      expect(
        files.some((f) => expectedLines(f).length === 0),
        `${id} has a fixture without findings`,
      ).to.equal(true);
      expect(docs, `docs/guide/security-rules.md has a "## ${id}" section`).to.match(new RegExp(`^## ${id}$`, 'm'));
    }
    expect(new Set(ruleIds).size, 'rule IDs are unique').to.equal(ruleIds.length);
  });

  for (const id of ruleIds) {
    describe(id, () => {
      const dir = path.join(fixturesDir, id);
      const files = fs.existsSync(dir) ? listJsFiles(dir) : [];
      let index: ProjectIndex;

      before(() => {
        index = indexFor(id);
      });

      for (const file of files) {
        it(`${path.relative(dir, file)}: SDK runner and ESLint report exactly the marked lines`, () => {
          const expected = expectedLines(file);
          expect(sdkLines(id, file, index), 'SDK runner').to.deep.equal(expected);
          expect(eslintLines(id, file, index), 'ESLint').to.deep.equal(expected);
        });
      }
    });
  }

  describe('oxlint JS plugin', function () {
    this.timeout(120_000);
    let tmp: string;
    const results = new Map<string, number[]>();

    before(async () => {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-security-oxlint-'));
      const pluginFile = path.join(tmp, 'plugin.mjs');
      await build({
        entryPoints: [path.join(sdkRoot, 'src', 'security', 'eslint-plugin.ts')],
        outfile: pluginFile,
        bundle: true,
        platform: 'node',
        format: 'esm',
        logLevel: 'silent',
      });
      const oxlint = path.join(
        path.dirname(fileURLToPath(import.meta.resolve('oxlint/package.json'))),
        'bin',
        'oxlint',
      );
      // One oxlint run per rule, so each gets its own project index in settings.
      for (const id of ruleIds) {
        const config = path.join(tmp, `${id}.oxlintrc.json`);
        fs.writeFileSync(
          config,
          JSON.stringify({
            jsPlugins: [pluginFile],
            categories: {correctness: 'off'},
            rules: {[`b2c-security/${id}`]: 'error'},
            settings: settingsFor(indexFor(id)),
          }),
        );
        let stdout: string;
        try {
          stdout = execFileSync(
            oxlint,
            ['-c', config, '--format', 'json', ...listJsFiles(path.join(fixturesDir, id))],
            {
              encoding: 'utf8',
            },
          );
        } catch (error) {
          // oxlint exits non-zero when it reports problems.
          stdout = (error as {stdout: string}).stdout;
        }
        const parsed = JSON.parse(stdout) as {
          diagnostics: {code: string; filename: string; labels: {span: {line: number}}[]}[];
        };
        for (const d of parsed.diagnostics) {
          const match = /^b2c-security\((.+)\)$/.exec(d.code);
          if (!match) continue;
          const key = `${match[1]}:${fs.realpathSync(path.resolve(d.filename))}`;
          results.set(key, uniqueSorted([...(results.get(key) ?? []), d.labels[0].span.line]));
        }
      }
    });

    after(() => {
      fs.rmSync(tmp, {recursive: true, force: true});
    });

    for (const id of ruleIds) {
      it(`${id} reports exactly the marked lines`, () => {
        const dir = path.join(fixturesDir, id);
        for (const file of listJsFiles(dir)) {
          expect(results.get(`${id}:${fs.realpathSync(file)}`) ?? [], path.relative(dir, file)).to.deep.equal(
            expectedLines(file),
          );
        }
      });
    }
  });
});
