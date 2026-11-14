/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Fixture-driven tests for every built-in security rule.
 *
 * Each rule has test/security/fixtures/<rule-id>/bad.js and good.js. Lines in
 * bad.js that should produce a finding end with `// expect`; good.js must
 * produce none. Every rule runs under three runners — the SDK runner, ESLint,
 * and oxlint's JS plugins — and all three must agree with the markers. Each
 * rule must also have a section in docs/guide/security-rules.md.
 */
import {expect} from 'chai';
import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Linter} from 'eslint';
import {SCRIPT_RULES, runScriptRules} from '@salesforce/b2c-tooling-sdk/security';

const here = path.dirname(fileURLToPath(import.meta.url));
const sdkRoot = path.resolve(here, '..', '..');
const fixturesDir = path.join(here, 'fixtures');
const docsPath = path.resolve(sdkRoot, '..', '..', 'docs', 'guide', 'security-rules.md');

const ruleIds = SCRIPT_RULES.map((r) => r.meta.b2c.id);

function fixturePath(id: string, kind: 'bad' | 'good'): string {
  return path.join(fixturesDir, id, `${kind}.js`);
}

function expectedLines(text: string): number[] {
  return text
    .split('\n')
    .map((line, i) => (/\/\/ expect\s*$/.test(line) ? i + 1 : 0))
    .filter(Boolean);
}

function uniqueSorted(lines: number[]): number[] {
  return [...new Set(lines)].sort((a, b) => a - b);
}

function sdkLines(id: string, file: string): number[] {
  const rule = SCRIPT_RULES.find((r) => r.meta.b2c.id === id)!;
  const result = runScriptRules(fs.readFileSync(file, 'utf8'), file, [rule]);
  expect(result.parseError, `${file} should parse`).to.equal(undefined);
  return uniqueSorted(result.reports.map((r) => r.line));
}

function eslintLines(id: string, file: string): number[] {
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
      },
    ],
    file,
  );
  const fatal = messages.find((m) => m.fatal);
  expect(fatal, fatal?.message).to.equal(undefined);
  return uniqueSorted(messages.filter((m) => m.ruleId === `b2c-security/${id}`).map((m) => m.line));
}

describe('security rules', () => {
  it('every rule has an ID, fixtures, and a docs section', () => {
    const docs = fs.readFileSync(docsPath, 'utf8');
    for (const rule of SCRIPT_RULES) {
      const {id} = rule.meta.b2c;
      expect(id, 'rule IDs are kebab-case without slashes').to.match(/^[a-z][a-z\d]*(-[a-z\d]+)*$/);
      expect(fs.existsSync(fixturePath(id, 'bad')), `fixtures/${id}/bad.js`).to.equal(true);
      expect(fs.existsSync(fixturePath(id, 'good')), `fixtures/${id}/good.js`).to.equal(true);
      expect(expectedLines(fs.readFileSync(fixturePath(id, 'bad'), 'utf8')), `${id} bad.js has // expect markers`).to
        .not.be.empty;
      expect(docs, `docs/guide/security-rules.md has a "## ${id}" section`).to.match(new RegExp(`^## ${id}$`, 'm'));
    }
    expect(new Set(ruleIds).size, 'rule IDs are unique').to.equal(ruleIds.length);
  });

  for (const id of ruleIds) {
    describe(id, () => {
      const bad = fixturePath(id, 'bad');
      const good = fixturePath(id, 'good');

      it('SDK runner reports exactly the marked lines', () => {
        expect(sdkLines(id, bad)).to.deep.equal(expectedLines(fs.readFileSync(bad, 'utf8')));
        expect(sdkLines(id, good)).to.deep.equal([]);
      });

      it('ESLint reports exactly the marked lines', () => {
        expect(eslintLines(id, bad)).to.deep.equal(expectedLines(fs.readFileSync(bad, 'utf8')));
        expect(eslintLines(id, good)).to.deep.equal([]);
      });
    });
  }

  describe('oxlint JS plugin', function () {
    this.timeout(60_000);
    let tmp: string;
    let results: Map<string, number[]>;

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
      const config = path.join(tmp, '.oxlintrc.json');
      fs.writeFileSync(
        config,
        JSON.stringify({
          jsPlugins: [pluginFile],
          categories: {correctness: 'off'},
          rules: Object.fromEntries(ruleIds.map((id) => [`b2c-security/${id}`, 'error'])),
        }),
      );
      const files = ruleIds.flatMap((id) => [fixturePath(id, 'bad'), fixturePath(id, 'good')]);
      const oxlint = path.join(path.dirname(resolvePackagePath('oxlint/package.json')), 'bin', 'oxlint');
      let stdout: string;
      try {
        stdout = execFileSync(oxlint, ['-c', config, '--format', 'json', ...files], {encoding: 'utf8'});
      } catch (error) {
        // oxlint exits non-zero when it reports problems.
        stdout = (error as {stdout: string}).stdout;
      }
      const parsed = JSON.parse(stdout) as {
        diagnostics: {code: string; filename: string; labels: {span: {line: number}}[]}[];
      };
      results = new Map();
      for (const d of parsed.diagnostics) {
        const match = /^b2c-security\((.+)\)$/.exec(d.code);
        if (!match) continue;
        const key = `${match[1]}:${path.resolve(d.filename)}`;
        results.set(key, uniqueSorted([...(results.get(key) ?? []), d.labels[0].span.line]));
      }
    });

    after(() => {
      fs.rmSync(tmp, {recursive: true, force: true});
    });

    for (const id of ruleIds) {
      it(`${id} reports exactly the marked lines`, () => {
        const bad = fixturePath(id, 'bad');
        expect(results.get(`${id}:${bad}`) ?? []).to.deep.equal(expectedLines(fs.readFileSync(bad, 'utf8')));
        expect(results.get(`${id}:${fixturePath(id, 'good')}`) ?? []).to.deep.equal([]);
      });
    }
  });
});

function resolvePackagePath(specifier: string): string {
  return import.meta.resolve(specifier).replace(/^file:\/\//, '');
}
