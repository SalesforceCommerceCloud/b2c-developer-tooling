/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateCap} from '../../../src/operations/cap/validate.js';

const FIXTURE_CAP = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/commerce-avalara-tax-app-v0.2.5',
);

/** Build a minimal valid CAP in a temp directory, then call the callback */
async function withTempCap(setup: (dir: string) => void, callback: (dir: string) => Promise<void>): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-validate-'));
  try {
    setup(tempDir);
    await callback(tempDir);
  } finally {
    fs.rmSync(tempDir, {recursive: true, force: true});
  }
}

const REQUIRED_BM_LOCALES = ['ar-MA', 'de', 'en-US', 'es', 'fr', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'zh-CN', 'zh-TW'];

function writeTaskTranslations(
  dir: string,
  tasks: Array<{taskKey: string; name: string; description: string}>,
  locales: string[] = REQUIRED_BM_LOCALES,
): void {
  const translationsDir = path.join(dir, 'app-configuration', 'translations');
  fs.mkdirSync(translationsDir, {recursive: true});
  const translatedTasks = Object.fromEntries(
    tasks.map((task) => [task.taskKey, {name: task.name, description: task.description}]),
  );
  const body = JSON.stringify({tasks: translatedTasks});
  for (const locale of locales) {
    fs.writeFileSync(path.join(translationsDir, `${locale}.json`), body);
  }
}

function writeAdminTranslations(dir: string, components: Record<string, Record<string, string>>): void {
  const translationsDir = path.join(dir, 'app-configuration', 'translations');
  const adminComponents = Object.fromEntries(
    Object.entries(components).map(([componentKey, attributes]) => [
      componentKey,
      {attributes: Object.fromEntries(Object.entries(attributes).map(([id, label]) => [id, {label}]))},
    ]),
  );
  for (const file of fs.readdirSync(translationsDir)) {
    if (!file.endsWith('.json')) continue;
    const localePath = path.join(translationsDir, file);
    const locale = JSON.parse(fs.readFileSync(localePath, 'utf-8')) as Record<string, unknown>;
    locale.adminComponents = adminComponents;
    fs.writeFileSync(localePath, JSON.stringify(locale));
  }
}

function writeMinimalCap(dir: string, overrides: {manifest?: Record<string, unknown>} = {}): void {
  const manifest = {
    id: 'test-app',
    name: 'Test App',
    version: '1.0.0',
    domain: 'tax',
    ...overrides.manifest,
  };
  fs.writeFileSync(path.join(dir, 'commerce-app.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test App');
  fs.mkdirSync(path.join(dir, 'app-configuration'));
  const tasks = [{taskKey: 'step_1', taskNumber: '1', name: 'Step 1', description: 'Do step 1', link: '/bm/step1'}];
  fs.writeFileSync(path.join(dir, 'app-configuration', 'tasksList.json'), JSON.stringify(tasks));
  writeTaskTranslations(dir, tasks);
  fs.mkdirSync(path.join(dir, 'impex', 'install'), {recursive: true});
}

describe('operations/cap/validate', () => {
  describe('validateCap', () => {
    it('should validate the sample Avalara CAP fixture successfully', async () => {
      if (!fs.existsSync(FIXTURE_CAP)) {
        console.warn('Skipping fixture test — fixture not found:', FIXTURE_CAP);
        return;
      }
      const result = await validateCap(FIXTURE_CAP);
      expect(result.errors).to.deep.equal([]);
      expect(result.valid).to.be.true;
      expect(result.manifest).to.include({id: 'avalara-tax', domain: 'tax', version: '0.2.5'});
    });

    it('should error when target does not exist', async () => {
      const result = await validateCap('/nonexistent/path');
      expect(result.valid).to.be.false;
      expect(result.errors[0]).to.include('not found');
    });

    it('should error when commerce-app.json is missing', async () => {
      await withTempCap(
        (dir) => {
          fs.writeFileSync(path.join(dir, 'README.md'), '# Test');
          fs.mkdirSync(path.join(dir, 'app-configuration'));
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'tasksList.json'),
            JSON.stringify([{taskNumber: '1', name: 'x', description: 'x', link: '/x'}]),
          );
          fs.mkdirSync(path.join(dir, 'impex'), {recursive: true});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('commerce-app.json'))).to.be.true;
        },
      );
    });

    it('should error when README.md is missing', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.unlinkSync(path.join(dir, 'README.md'));
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('README.md'))).to.be.true;
        },
      );
    });

    it('should error when tasksList.json is present without translations', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.rmSync(path.join(dir, 'app-configuration', 'translations'), {recursive: true, force: true});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'app-configuration/translations/ is required when tasksList.json is present',
          );
        },
      );
    });

    it('should error when a required BM locale translation is missing', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.unlinkSync(path.join(dir, 'app-configuration', 'translations', 'ja.json'));
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('missing required locale file(s): ja.json'))).to.be.true;
        },
      );
    });

    it('should error when a locale filename is not BM-supported BCP-47', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'translations', 'zh_CN.json'),
            fs.readFileSync(path.join(dir, 'app-configuration', 'translations', 'en-US.json')),
          );
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('misformatted locale file(s): zh_CN.json'))).to.be.true;
        },
      );
    });

    it('should error when a taskKey is missing from en-US translations', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'tasksList.json'),
            JSON.stringify([
              {taskKey: 'missing_task', taskNumber: '1', name: 'Step 1', description: 'Do step 1', link: '/bm/step1'},
            ]),
          );
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'tasksList.json references taskKey(s) not present in translations/en-US.json: missing_task',
          );
        },
      );
    });

    it('should error when a non-default locale does not match en-US task keys', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'translations', 'de.json'),
            JSON.stringify({tasks: {extra_task: {name: 'Extra', description: 'Extra task'}}}),
          );
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'de.json tasks key parity mismatch with en-US.json — missing: step_1 — extra: extra_task',
          );
        },
      );
    });

    it('should accept admin component translations that cover every attribute', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          writeAdminTranslations(dir, {visibility: {show_banner: 'Show banner'}});
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'adminComponents.json'),
            JSON.stringify({
              configuration: [{componentKey: 'visibility', attributes: [{id: 'show_banner'}]}],
            }),
          );
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.errors).to.deep.equal([]);
          expect(result.valid).to.be.true;
        },
      );
    });

    it('should accept an additional BM-supported locale file', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const translationsDir = path.join(dir, 'app-configuration', 'translations');
          fs.copyFileSync(path.join(translationsDir, 'en-US.json'), path.join(translationsDir, 'pt-BR.json'));
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.errors).to.deep.equal([]);
          expect(result.valid).to.be.true;
        },
      );
    });

    it('should error when a locale file is not valid JSON', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.writeFileSync(path.join(dir, 'app-configuration', 'translations', 'fr.json'), '{');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include('app-configuration/translations/fr.json: not valid JSON');
        },
      );
    });

    it('should error when a task translation name is empty', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const localePath = path.join(dir, 'app-configuration', 'translations', 'en-US.json');
          const locale = JSON.parse(fs.readFileSync(localePath, 'utf-8')) as {
            tasks: Record<string, {name: string; description: string}>;
          };
          locale.tasks.step_1.name = '';
          fs.writeFileSync(localePath, JSON.stringify(locale));
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'app-configuration/translations/en-US.json: tasks with missing/invalid name or description: step_1',
          );
        },
      );
    });

    it('should error when an admin component attribute is missing from en-US translations', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'adminComponents.json'),
            JSON.stringify({
              configuration: [{componentKey: 'visibility', attributes: [{id: 'show_banner'}]}],
            }),
          );
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'adminComponents.json references componentKey/attribute pair(s) not present in translations/en-US.json: visibility/show_banner',
          );
        },
      );
    });

    it('should error when an admin component is missing componentKey', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'adminComponents.json'),
            JSON.stringify({configuration: [{attributes: [{id: 'show_banner'}]}]}),
          );
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'app-configuration/adminComponents.json: configuration[0] missing componentKey',
          );
        },
      );
    });

    it('should error when an admin attribute has no id', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'adminComponents.json'),
            JSON.stringify({configuration: [{componentKey: 'visibility', attributes: [{}]}]}),
          );
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'app-configuration/adminComponents.json: configuration[0] attribute[0] missing id',
          );
          expect(result.errors.some((error) => error.includes('/null'))).to.be.false;
        },
      );
    });

    it('should error when an admin attribute label is empty', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          writeAdminTranslations(dir, {visibility: {show_banner: 'Show banner'}});
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'adminComponents.json'),
            JSON.stringify({
              configuration: [{componentKey: 'visibility', attributes: [{id: 'show_banner'}]}],
            }),
          );
          const localePath = path.join(dir, 'app-configuration', 'translations', 'en-US.json');
          const locale = JSON.parse(fs.readFileSync(localePath, 'utf-8')) as {
            adminComponents: Record<string, {attributes: Record<string, {label: string}>}>;
          };
          locale.adminComponents.visibility.attributes.show_banner.label = '';
          fs.writeFileSync(localePath, JSON.stringify(locale));
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'app-configuration/translations/en-US.json: adminComponents shape invalid: visibility.attributes.show_banner: "label" missing or invalid',
          );
        },
      );
    });

    it('should error when a non-default locale is missing an admin attribute', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          writeAdminTranslations(dir, {visibility: {show_banner: 'Show banner'}});
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'adminComponents.json'),
            JSON.stringify({
              configuration: [{componentKey: 'visibility', attributes: [{id: 'show_banner'}]}],
            }),
          );
          const localePath = path.join(dir, 'app-configuration', 'translations', 'de.json');
          const locale = JSON.parse(fs.readFileSync(localePath, 'utf-8')) as {adminComponents?: unknown};
          delete locale.adminComponents;
          fs.writeFileSync(localePath, JSON.stringify(locale));
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include(
            'de.json adminComponents key parity mismatch with en-US.json — missing: visibility/show_banner',
          );
        },
      );
    });

    it('should error when tasksList.json is missing', async () => {
      await withTempCap(
        (dir) => {
          fs.writeFileSync(
            path.join(dir, 'commerce-app.json'),
            JSON.stringify({id: 'a', name: 'a', version: '1.0.0', domain: 'tax'}),
          );
          fs.writeFileSync(path.join(dir, 'README.md'), '# test');
          fs.mkdirSync(path.join(dir, 'impex'), {recursive: true});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('tasksList.json'))).to.be.true;
          expect(result.errors.some((e) => e.includes('translations/'))).to.be.false;
        },
      );
    });

    it('should error when no substantive directory is present', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.rmSync(path.join(dir, 'impex'), {recursive: true, force: true});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('at least one'))).to.be.true;
        },
      );
    });

    it('should allow controllers/ in site cartridges', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const siteCartridgeDir = path.join(
            dir,
            'cartridges',
            'site_cartridges',
            'int_myapp',
            'cartridge',
            'controllers',
          );
          fs.mkdirSync(siteCartridgeDir, {recursive: true});
          fs.writeFileSync(path.join(siteCartridgeDir, 'MyController.js'), '// controller');
          fs.writeFileSync(path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', '.project'), '');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.errors).to.deep.equal([]);
          expect(result.valid).to.be.true;
        },
      );
    });

    it('should error when pipeline/ directory is present', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const pipelineDir = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', 'cartridge', 'pipeline');
          fs.mkdirSync(pipelineDir, {recursive: true});
          fs.writeFileSync(path.join(pipelineDir, 'Start.xml'), '<pipeline/>');
          fs.writeFileSync(path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', '.project'), '');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('pipeline'))).to.be.true;
        },
      );
    });

    it('should error when .ds pipeline file is present', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const cartDir = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', 'cartridge');
          fs.mkdirSync(cartDir, {recursive: true});
          fs.writeFileSync(path.join(cartDir, 'Start.ds'), '<pipeline/>');
          fs.writeFileSync(path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', '.project'), '');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('.ds'))).to.be.true;
        },
      );
    });

    it('should warn when icons/icon.png is missing', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.true;
          expect(result.warnings.some((w) => w.includes('icon.png'))).to.be.true;
        },
      );
    });

    it('should warn when impex/uninstall/ is missing', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          // impex/install exists but no uninstall
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.true;
          expect(result.warnings.some((w) => w.includes('uninstall'))).to.be.true;
        },
      );
    });

    it('should error when manifest version is not semver', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir, {manifest: {version: 'not-semver'}});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('semver'))).to.be.true;
        },
      );
    });

    it('should error when a site cartridge is missing .project', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const cartridgeDir = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', 'cartridge');
          fs.mkdirSync(cartridgeDir, {recursive: true});
          fs.writeFileSync(path.join(cartridgeDir, 'index.js'), '// noop');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include('Cartridge missing .project file: site_cartridges/int_myapp');
        },
      );
    });

    it('should error when a bm cartridge is missing .project', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const cartridgeDir = path.join(dir, 'cartridges', 'bm_cartridges', 'bm_myapp', 'cartridge');
          fs.mkdirSync(cartridgeDir, {recursive: true});
          fs.writeFileSync(path.join(cartridgeDir, 'index.js'), '// noop');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors).to.include('Cartridge missing .project file: bm_cartridges/bm_myapp');
        },
      );
    });

    it('should pass when a cartridge has an empty .project file', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const cartridgeRoot = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp');
          fs.mkdirSync(path.join(cartridgeRoot, 'cartridge'), {recursive: true});
          fs.writeFileSync(path.join(cartridgeRoot, '.project'), '');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.errors.some((e) => e.includes('missing .project'))).to.be.false;
        },
      );
    });

    it('should pass when a cartridge has a full Eclipse XML .project file', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const cartridgeRoot = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp');
          fs.mkdirSync(path.join(cartridgeRoot, 'cartridge'), {recursive: true});
          const eclipseProjectXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<projectDescription>',
            '\t<name>int_myapp</name>',
            '\t<comment></comment>',
            '\t<projects></projects>',
            '\t<buildSpec></buildSpec>',
            '\t<natures></natures>',
            '</projectDescription>',
            '',
          ].join('\n');
          fs.writeFileSync(path.join(cartridgeRoot, '.project'), eclipseProjectXml);
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.errors.some((e) => e.includes('missing .project'))).to.be.false;
        },
      );
    });

    it('should allow controllers in bm_cartridges', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const bmControllers = path.join(dir, 'cartridges', 'bm_cartridges', 'bm_myapp', 'cartridge', 'controllers');
          fs.mkdirSync(bmControllers, {recursive: true});
          fs.writeFileSync(path.join(bmControllers, 'BM_Controller.js'), '// bm controller');
          fs.writeFileSync(path.join(dir, 'cartridges', 'bm_cartridges', 'bm_myapp', '.project'), '');
        },
        async (dir) => {
          const result = await validateCap(dir);
          // BM cartridge controllers are allowed
          expect(result.errors.some((e) => e.includes('controllers'))).to.be.false;
        },
      );
    });
  });
});
