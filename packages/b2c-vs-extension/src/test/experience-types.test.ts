/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {ContentConfigProvider} from '../content-tree/content-config.js';
import {describeType, ExperienceTypesSource, UNAVAILABLE_LABELS} from '../content-tree/experience-types.js';

function source(options: {instance?: unknown; siteId?: string}): ExperienceTypesSource {
  const config = {
    getInstance: () => options.instance ?? null,
    getSiteId: () => options.siteId,
  } as unknown as ContentConfigProvider;
  return new ExperienceTypesSource(config);
}

suite('ExperienceTypesSource', () => {
  test('shows an info row instead of failing when no site is configured', async () => {
    const types = source({instance: {config: {}}});
    const children = await types.getChildren(types.root());
    assert.strictEqual(children.length, 1);
    assert.strictEqual(children[0].kind, 'info');
    assert.strictEqual(children[0].label, UNAVAILABLE_LABELS['no-site']);
  });

  test('explains missing Experiences API configuration without throwing', async () => {
    const types = source({instance: {config: {}}, siteId: 'RefArch'});
    const root = types.root();
    assert.strictEqual(root.description, 'RefArch');
    const children = await types.getChildren(root);
    assert.strictEqual(children[0].kind, 'info');
    assert.strictEqual(children[0].label, UNAVAILABLE_LABELS['not-configured']);
    assert.match(String(children[0].tooltip), /short code and tenant ID/);
  });

  test('describes regions and attributes for tooltips', () => {
    const text = describeType({
      id: 'Content.hero',
      name: {default: 'Hero'},
      regionDefinitions: [{id: 'main', maxComponents: 2}],
      attributeDefinitionGroups: [
        {id: 'g', attributeDefinitions: [{id: 'height', type: 'enum', required: true, values: ['sm', 'md']}]},
      ],
    } as never);
    assert.match(text, /\*\*Content\.hero\*\* — Hero/);
    assert.match(text, /`main` \(max 2\)/);
    assert.match(text, /`height` enum \(required\): sm \| md/);
  });
});
