/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {
  catalogFromExperienceTypes,
  catalogFromLocalCartridges,
  mergeTypeCatalogs,
  validatePageRequest,
  type ExperienceComponentType,
  type ExperiencePageRequest,
  type ExperiencePageType,
} from '../../../src/operations/content/index.js';

const pageTypes = [
  {
    id: 'homePage',
    name: {default: 'Home'},
    regionDefinitions: [{id: 'main', maxComponents: 2, componentTypeExclusions: [{typeId: 'Layout.header'}]}],
    attributeDefinitionGroups: [],
  },
] as unknown as ExperiencePageType[];

const componentTypes = [
  {
    id: 'Content.hero',
    attributeDefinitionGroups: [
      {
        attributeDefinitions: [
          {id: 'title', type: 'string', required: true},
          {id: 'height', type: 'enum', values: ['sm', 'md']},
          {id: 'visible', type: 'boolean'},
          {id: 'count', type: 'integer'},
          {id: 'image', type: 'image'},
        ],
      },
    ],
    regionDefinitions: [],
  },
  {id: 'Layout.grid', regionDefinitions: [{id: 'column_1'}], attributeDefinitionGroups: []},
  {id: 'Layout.header', regionDefinitions: [], attributeDefinitionGroups: []},
] as unknown as ExperienceComponentType[];

const catalog = catalogFromExperienceTypes({pageTypes, componentTypes});

function page(components: unknown[]): ExperiencePageRequest {
  return {id: 'p', name: 'P', typeId: 'homePage', regions: [{id: 'main', components}]} as ExperiencePageRequest;
}

function messages(p: ExperiencePageRequest) {
  const r = validatePageRequest(p, catalog);
  return {errors: r.errors.map((e) => `${e.path} ${e.message}`), warnings: r.warnings.map((w) => w.message), r};
}

describe('operations/content/page-validate', () => {
  it('accepts a valid page with nested layout regions', () => {
    const {r} = messages(
      page([
        {
          id: 'g',
          typeId: 'Layout.grid',
          regions: [{id: 'column_1', components: [{id: 'h', typeId: 'Content.hero', data: {title: 'x'}}]}],
        },
      ]),
    );
    expect(r.valid).to.equal(true);
    expect(r.errors).to.deep.equal([]);
  });

  it('requires id, name and typeId', () => {
    const r = validatePageRequest({} as ExperiencePageRequest, catalog);
    expect(r.errors.map((e) => e.path)).to.deep.equal(['/id', '/name', '/typeId']);
  });

  it('rejects library XML prefixes', () => {
    const r = validatePageRequest({id: 'p', name: 'P', typeId: 'page.homePage'}, catalog);
    expect(r.errors[0].message).to.include('use "homePage"');
    const {errors} = messages(page([{id: 'h', typeId: 'component.Content.hero'}]));
    expect(errors[0]).to.include('use "Content.hero"');
  });

  it('reports unknown page types, regions and component types', () => {
    expect(validatePageRequest({id: 'p', name: 'P', typeId: 'nope'}, catalog).errors[0].message).to.include(
      'known: homePage',
    );
    const r = validatePageRequest(
      {id: 'p', name: 'P', typeId: 'homePage', regions: [{id: 'side', components: []}]},
      catalog,
    );
    expect(r.errors[0].message).to.include('defined: main');
    expect(messages(page([{id: 'x', typeId: 'Content.nope'}])).errors[0]).to.include('is not defined');
  });

  it('enforces region exclusions and warns past maxComponents', () => {
    const {errors, warnings} = messages(
      page([
        {id: 'a', typeId: 'Layout.header'},
        {id: 'b', typeId: 'Content.hero', data: {title: 't'}},
        {id: 'c', typeId: 'Content.hero', data: {title: 't'}},
      ]),
    );
    expect(errors[0]).to.include('excluded from region "main"');
    expect(warnings[0]).to.include('only 2 are rendered');
  });

  it('checks required attributes, value types and unknown keys', () => {
    const {errors, warnings} = messages(
      page([
        {id: 'h', typeId: 'Content.hero', data: {height: 'xl', visible: 'yes', count: 1.5, image: 'a.jpg', foo: 1}},
      ]),
    );
    expect(errors).to.have.length(5);
    expect(errors.join('\n')).to.include('Required attribute "title"');
    expect(errors.join('\n')).to.include('not one of: sm, md');
    expect(errors.join('\n')).to.include('must be a boolean');
    expect(errors.join('\n')).to.include('must be an integer');
    expect(errors.join('\n')).to.include('must be an image object');
    expect(warnings[0]).to.include('"foo" is not defined');
  });

  it('reports duplicate component IDs', () => {
    const {errors} = messages(
      page([
        {id: 'h', typeId: 'Content.hero', data: {title: 't'}},
        {id: 'h', typeId: 'Content.hero', data: {title: 't'}},
      ]),
    );
    expect(errors[0]).to.include('already used');
  });

  describe('local cartridge catalog', () => {
    let dir: string;
    before(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-types-'));
      const comp = path.join(dir, 'app_custom/cartridge/experience/components/assets');
      fs.mkdirSync(comp, {recursive: true});
      fs.writeFileSync(
        path.join(comp, 'banner.json'),
        JSON.stringify({
          name: 'Banner',
          region_definitions: [{id: 'slot', component_type_inclusions: [{type_id: 'Content.hero'}]}],
          attribute_definition_groups: [{attribute_definitions: [{id: 'title', type: 'string', required: true}]}],
        }),
      );
      fs.writeFileSync(path.join(comp, 'broken.json'), '{not json');
    });
    after(() => fs.rmSync(dir, {recursive: true, force: true}));

    it('derives type IDs from the path and maps snake_case meta', async () => {
      const local = await catalogFromLocalCartridges([dir]);
      const banner = local.componentTypes.get('assets.banner');
      expect(banner).to.include({kind: 'component', source: 'local', name: 'Banner'});
      expect(banner!.regions[0].inclusions).to.deep.equal(['Content.hero']);
      expect(banner!.attributes[0]).to.include({id: 'title', required: true});
      expect(local.componentTypes.has('assets.broken')).to.equal(false);
    });

    it('lets later catalogs override and enforces inclusions', async () => {
      const merged = mergeTypeCatalogs(catalog, await catalogFromLocalCartridges([dir]));
      const r = validatePageRequest(
        page([
          {
            id: 'b',
            typeId: 'assets.banner',
            data: {title: 't'},
            regions: [{id: 'slot', components: [{id: 'g', typeId: 'Layout.grid'}]}],
          },
        ]),
        merged,
      );
      expect(r.errors[0].message).to.include('only allows: Content.hero');
    });
  });
});
