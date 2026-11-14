/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  applyBaseline,
  collectSecurityScanFiles,
  createBaseline,
  listSecurityRules,
  parseBaseline,
  parseSuppressions,
  scanSecurity,
  scanSecurityText,
  selectSecurityRules,
  toSarif,
} from '@salesforce/b2c-tooling-sdk/security';

const EVAL_LINE = 'module.exports = function (code) { return eval(code); };';

describe('security engine', () => {
  describe('scanSecurityText', () => {
    it('turns reports into findings with rule metadata, snippet, and fingerprint', () => {
      const [finding] = scanSecurityText(EVAL_LINE, 'cartridge/scripts/a.js');
      expect(finding).to.include({ruleId: 'dynamic-code', severity: 'high', category: 'injection'});
      expect(finding.location).to.deep.include({file: 'cartridge/scripts/a.js', startLine: 1});
      expect(finding.snippet).to.equal(EVAL_LINE);
      expect(finding.fingerprint).to.match(/^[a-f\d]{32}$/);
      expect(finding.docsUrl).to.match(/security-rules#dynamic-code$/);
    });

    it('records parse errors instead of throwing', () => {
      const errors: {file: string; message: string}[] = [];
      expect(scanSecurityText('function f(a : String) {}', 'x.ds', undefined, errors)).to.deep.equal([]);
      expect(errors[0].file).to.equal('x.ds');
      expect(errors[0].message).to.match(/^Could not parse/);
    });

    it('parses ES modules as a fallback', () => {
      expect(scanSecurityText('import x from "y";\nexport default eval(x);', 'm.js')).to.have.length(1);
    });

    it('keeps fingerprints stable when lines move, and distinct for repeated lines', () => {
      const a = scanSecurityText(`${EVAL_LINE}\n`, 'a.js');
      const b = scanSecurityText(`\n\n${EVAL_LINE}\n`, 'a.js');
      expect(a[0].fingerprint).to.equal(b[0].fingerprint);
      const twice = scanSecurityText(`${EVAL_LINE}\n${EVAL_LINE}\n`, 'a.js');
      expect(twice[0].fingerprint).to.not.equal(twice[1].fingerprint);
    });
  });

  describe('suppressions', () => {
    it('applies next-line and same-line suppressions that name the rule, with an optional reason', () => {
      const text = [
        '// b2c-dx-disable-next-line dynamic-code -- trusted template code',
        'eval(a);',
        'eval(b); // b2c-dx-disable-line b2c-security/dynamic-code',
        '/* b2c-dx-disable-next-line weak-crypto */',
        'eval(c);',
        'eval(d);',
      ].join('\n');
      const findings = scanSecurityText(text, 'a.js');
      expect(findings.map((f) => [f.location.startLine, f.suppression ?? null])).to.deep.equal([
        [2, {kind: 'inline', reason: 'trusted template code'}],
        [3, {kind: 'inline'}],
        [5, null],
        [6, null],
      ]);
    });

    it('ignores directives without a rule ID', () => {
      const loc = {start: {line: 1}, end: {line: 1}};
      expect(parseSuppressions([{value: ' b2c-dx-disable-next-line ', loc}])).to.deep.equal([]);
      expect(parseSuppressions([{value: ' b2c-dx-disable-next-line -- because', loc}])).to.deep.equal([]);
    });

    it('accepts several comma- or space-separated IDs', () => {
      const loc = {start: {line: 4}, end: {line: 4}};
      const [s] = parseSuppressions([{value: ' b2c-dx-disable-line open-redirect, dynamic-code weak-crypto', loc}]);
      expect([...s.ruleIds]).to.deep.equal(['open-redirect', 'dynamic-code', 'weak-crypto']);
      expect(s.line).to.equal(4);
    });
  });

  describe('baselines', () => {
    it('marks known findings and round-trips through JSON', () => {
      const findings = scanSecurityText(`${EVAL_LINE}\n// b2c-dx-disable-next-line dynamic-code\neval(x);`, 'a.js');
      const baseline = parseBaseline(JSON.stringify(createBaseline(findings)));
      expect(baseline.findings, 'suppressed findings are not baselined').to.have.length(1);
      const next = applyBaseline([...findings, ...scanSecurityText('eval(y);', 'b.js')], baseline);
      expect(next.map((f) => Boolean(f.baselined))).to.deep.equal([true, false, false]);
    });

    it('rejects files that are not baselines', () => {
      expect(() => parseBaseline('{"findings": []}')).to.throw(/Not a security baseline/);
    });
  });

  describe('toSarif', () => {
    it('produces SARIF 2.1.0 with rules, locations, fingerprints, and suppressions', () => {
      const findings = scanSecurityText(
        `${EVAL_LINE}\neval(b); // b2c-dx-disable-line dynamic-code -- ok`,
        'cartridge/a.js',
      );
      const sarif = toSarif(findings, listSecurityRules(), {toolVersion: '1.2.3'}) as {
        version: string;
        runs: {
          tool: {driver: {version: string; rules: {id: string; properties: Record<string, unknown>}[]}};
          results: Record<string, unknown>[];
        }[];
      };
      expect(sarif.version).to.equal('2.1.0');
      const [run] = sarif.runs;
      expect(run.tool.driver.version).to.equal('1.2.3');
      const rule = run.tool.driver.rules.find((r) => r.id === 'dynamic-code')!;
      expect(rule.properties['security-severity']).to.equal('8.0');
      expect(run.results).to.have.length(2);
      expect(run.results[0]).to.deep.include({ruleId: 'dynamic-code', level: 'error'});
      expect(run.results[1].suppressions).to.deep.equal([{kind: 'inSource', justification: 'ok'}]);
      expect(toSarif(findings, listSecurityRules(), {includeSuppressed: false})).to.have.nested.property(
        'runs[0].results.length',
        1,
      );
    });
  });

  describe('rule selection', () => {
    it('filters by include and exclude lists and rejects unknown IDs', () => {
      expect(selectSecurityRules(['weak-crypto']).map((r) => r.meta.b2c.id)).to.deep.equal(['weak-crypto']);
      expect(selectSecurityRules(undefined, ['weak-crypto']).map((r) => r.meta.b2c.id)).to.not.include('weak-crypto');
      expect(() => selectSecurityRules(['nope'])).to.throw(/Unknown security rule ID\(s\): nope/);
    });
  });

  describe('scanSecurity', () => {
    let dir: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-security-'));
      const write = (rel: string, text: string) => {
        fs.mkdirSync(path.dirname(path.join(dir, rel)), {recursive: true});
        fs.writeFileSync(path.join(dir, rel), text);
      };
      write('cartridges/app_custom/.project', '<xml/>');
      write('cartridges/app_custom/cartridge/scripts/a.js', 'eval(a);');
      write('cartridges/app_custom/cartridge/scripts/legacy.ds', 'function f(a : String) {}');
      write('cartridges/app_custom/cartridge/client/default/js/b.js', 'eval(b);');
      write('cartridges/app_custom/cartridge/static/default/js/c.js', 'eval(c);');
      write('cartridges/app_custom/cartridge/scripts/lib.min.js', 'eval(d);');
      write('cartridges/modules/.project', '<xml/>');
      write('cartridges/modules/server/server.js', 'var x = new (require("dw/crypto/WeakCipher"))();');
      write('not-a-cartridge/e.js', 'eval(e);');
    });

    afterEach(() => {
      fs.rmSync(dir, {recursive: true, force: true});
    });

    it('scans server-side scripts in cartridges only, skipping client, static, and minified files', () => {
      const files = collectSecurityScanFiles([dir]).map((f) => path.relative(dir, f).split(path.sep).join('/'));
      expect(files).to.deep.equal([
        'cartridges/app_custom/cartridge/scripts/a.js',
        'cartridges/app_custom/cartridge/scripts/legacy.ds',
        'cartridges/modules/server/server.js',
      ]);
    });

    it('includes explicitly named files even outside cartridges', () => {
      expect(collectSecurityScanFiles([path.join(dir, 'not-a-cartridge/e.js')])).to.have.length(1);
    });

    it('reports findings relative to root, parse errors, and the rules that ran', () => {
      const result = scanSecurity({root: dir});
      expect(result.filesScanned).to.equal(3);
      expect(result.findings.map((f) => `${f.location.file}:${f.ruleId}`)).to.deep.equal([
        'cartridges/app_custom/cartridge/scripts/a.js:dynamic-code',
        'cartridges/modules/server/server.js:weak-crypto',
      ]);
      expect(result.errors.map((e) => e.file)).to.deep.equal(['cartridges/app_custom/cartridge/scripts/legacy.ds']);
      expect(result.rules.length).to.equal(listSecurityRules().length);
    });

    it('applies minSeverity, rule filters, and a baseline', () => {
      expect(scanSecurity({root: dir, minSeverity: 'high'}).findings.map((f) => f.ruleId)).to.deep.equal([
        'dynamic-code',
      ]);
      expect(scanSecurity({root: dir, rules: ['weak-crypto']}).findings).to.have.length(1);
      const baseline = createBaseline(scanSecurity({root: dir}).findings);
      expect(scanSecurity({root: dir, baseline}).findings.every((f) => f.baselined)).to.equal(true);
    });

    it('throws for missing paths', () => {
      expect(() => scanSecurity({root: dir, paths: [path.join(dir, 'missing')]})).to.throw(/Path not found/);
    });
  });
});
