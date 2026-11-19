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
  createNodeFileSystemHost,
  findSiteCartridgePaths,
  selectSiteCartridgePath,
} from '@salesforce/b2c-tooling-sdk/cartridges';
import {buildProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';

describe('cartridges/site-paths', () => {
  let dir: string;
  const write = (rel: string, text = '') => {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, text);
  };
  const site = (id: string, cartridges: string) =>
    `<?xml version="1.0"?>\n<site xmlns="http://www.demandware.com/xml/impex/site/2007-04-30" site-id="${id}">\n  <custom-cartridges>${cartridges}</custom-cartridges>\n</site>\n`;
  const host = createNodeFileSystemHost();

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-site-paths-'));
    write('cartridges/app_a/.project');
    write('cartridges/app_b/.project');
    write('cartridges/app_storefront_base/.project');
  });

  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
  });

  it('takes the latest migration or import set by timestamp prefix, over undated files', () => {
    write('site_template/sites/RefArch/site.xml', site('RefArch', 'app_storefront_base'));
    write(
      'migrations/20260901T002537-add-b/sites/RefArch/site.xml',
      site('RefArch', 'app_b:app_a:app_storefront_base'),
    );
    write('migrations/20260818T223533-first/sites/RefArch/site.xml', site('RefArch', 'app_a:app_storefront_base'));
    write('migrations/2026-08-20_other/sites/RefArch/site.xml', site('RefArch', 'app_a:app_b'));
    write('migrations/20260902T000000-no-path/sites/RefArch/site.xml', '<site site-id="RefArch"><name>x</name></site>');

    const [found] = findSiteCartridgePaths(dir, host);
    expect(found).to.include({siteId: 'RefArch', timestamp: '20260901002537'});
    expect(found.cartridges).to.deep.equal(['app_b', 'app_a', 'app_storefront_base']);
    expect(found.file).to.include('20260901T002537-add-b');
  });

  it('finds site files in cartridge metadata but not in cartridge code or node_modules', () => {
    write('cartridges/app_a/metadata/sites/RefArch/site.xml', site('RefArch', 'app_a:app_storefront_base'));
    write('cartridges/app_a/cartridge/sites/Other/site.xml', site('Other', 'app_b'));
    write('node_modules/x/sites/Ignored/site.xml', site('Ignored', 'app_b'));
    expect(findSiteCartridgePaths(dir, host).map((s) => s.siteId)).to.deep.equal(['RefArch']);
  });

  it('picks the requested site, the only site, or the best match, and never Business Manager', () => {
    const sites = [
      {siteId: 'Sites-Site', cartridges: ['app_a', 'app_b', 'app_storefront_base'], file: 'a'},
      {siteId: 'A', cartridges: ['app_a', 'app_storefront_base'], file: 'b'},
      {siteId: 'B', cartridges: ['app_b', 'app_a', 'app_storefront_base'], file: 'c'},
    ];
    const local = ['app_a', 'app_b', 'app_storefront_base'];
    expect(selectSiteCartridgePath(sites, local, 'A')).to.include({siteId: 'A', selection: 'siteId'});
    expect(selectSiteCartridgePath(sites, local, 'Missing'), 'unknown siteId falls back').to.include({siteId: 'B'});
    const best = selectSiteCartridgePath(sites, local)!;
    expect(best).to.include({siteId: 'B', selection: 'best-match'});
    expect(best.alternatives).to.deep.equal(['A']);
    expect(selectSiteCartridgePath([sites[1]], local)).to.include({siteId: 'A', selection: 'only'});
  });

  describe('project index order', () => {
    beforeEach(() => {
      write('migrations/20260901T002537-x/sites/RefArch/site.xml', site('RefArch', 'app_b:app_a:app_storefront_base'));
    });

    it('falls back to the site file when no cartridge path is configured', () => {
      const index = buildProjectIndex({root: dir});
      expect(index.cartridges.map((c) => c.name)).to.deep.equal(['app_b', 'app_a', 'app_storefront_base']);
      expect(index.cartridgeOrder).to.deep.equal({
        source: 'site-file',
        siteId: 'RefArch',
        file: 'migrations/20260901T002537-x/sites/RefArch/site.xml',
      });
    });

    it('lets a configured cartridge path win', () => {
      const index = buildProjectIndex({root: dir, cartridgePath: ['app_a', 'app_b']});
      expect(index.cartridges.map((c) => c.name)).to.deep.equal(['app_a', 'app_b', 'app_storefront_base']);
      expect(index.cartridgeOrder).to.deep.equal({source: 'configured', notOnPath: ['app_storefront_base']});
    });

    it('reports a caller-provided source, such as a path read from the instance', () => {
      const index = buildProjectIndex({
        root: dir,
        cartridgePath: ['app_a', 'app_storefront_base'],
        cartridgePathSource: {source: 'instance', siteId: 'RefArch', hostname: 'my-sandbox.example.com'},
      });
      expect(index.cartridgeOrder).to.deep.equal({
        source: 'instance',
        siteId: 'RefArch',
        hostname: 'my-sandbox.example.com',
        notOnPath: ['app_b'],
      });
    });

    it('guesses when detection is off, and ignores a siteId the project has no file for', () => {
      expect(buildProjectIndex({root: dir, detectSitePath: false}).cartridgeOrder).to.deep.equal({source: 'discovery'});
      expect(buildProjectIndex({root: dir, siteId: 'Nope'}).cartridgeOrder).to.include({
        source: 'site-file',
        siteId: 'RefArch',
      });
    });
  });
});
