/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {SafetyBlockedError} from '@salesforce/b2c-tooling-sdk';
import type {ObjectAttributeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {
  attributeSummary,
  definitionFromDocument,
  describeObjectTypesError,
  describeSyncPlan,
  effectiveAttributeId,
  isValuesUnavailable,
  mergeAttributeGroups,
  splitAttributes,
  validateAttributeId,
  withEnumValues,
} from '../object-types/model.js';

const attr = (overrides: Partial<ObjectAttributeDefinition> & {id: string}): ObjectAttributeDefinition =>
  ({system: false, valueType: 'string', ...overrides}) as ObjectAttributeDefinition;

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), {status});

suite('object types: describeObjectTypesError', () => {
  test('explains access errors with the required scope', () => {
    for (const status of [401, 403]) {
      const info = describeObjectTypesError(httpError(status));
      assert.strictEqual(info.kind, 'access');
      assert.ok(info.message.includes('sfcc.object-definitions'));
    }
    assert.strictEqual(describeObjectTypesError(new Error('invalid_scope: nope')).kind, 'access');
  });

  test('reports a missing API as unavailable', () => {
    assert.strictEqual(describeObjectTypesError(httpError(404)).kind, 'unavailable');
    assert.ok(describeObjectTypesError(httpError(404), 'Nope').message.includes('Nope was not found'));
  });

  test('reports safety blocks', () => {
    const error = new SafetyBlockedError('blocked', 'POST', 'https://example.com', 'READ_ONLY');
    assert.strictEqual(describeObjectTypesError(error).kind, 'blocked');
  });

  test('passes other errors through', () => {
    const info = describeObjectTypesError(new Error('short-code is not configured.'));
    assert.deepStrictEqual(info, {kind: 'other', message: 'short-code is not configured.'});
    assert.strictEqual(describeObjectTypesError(httpError(500)).kind, 'other');
  });
});

suite('object types: isValuesUnavailable', () => {
  test('treats scope and safety failures as missing values, not hard errors', () => {
    assert.strictEqual(isValuesUnavailable(httpError(403)), true);
    assert.strictEqual(
      isValuesUnavailable(new SafetyBlockedError('blocked', 'POST', 'https://example.com', 'READ_ONLY')),
      true,
    );
    assert.strictEqual(isValuesUnavailable(httpError(500)), false);
  });
});

suite('object types: attributes', () => {
  test('effective IDs prefix custom attributes', () => {
    assert.strictEqual(effectiveAttributeId(attr({id: 'color'})), 'c_color');
    assert.strictEqual(effectiveAttributeId(attr({id: 'name', system: true})), 'name');
    assert.strictEqual(effectiveAttributeId(attr({id: 'x', effectiveId: 'c_x'})), 'c_x');
  });

  test('summaries list the value type and flags', () => {
    assert.strictEqual(
      attributeSummary(attr({id: 'a', valueType: 'enum_of_string', multiValueType: true, localizable: true})),
      'enum_of_string, multi-value, localizable',
    );
  });

  test('splits and sorts custom and system attributes', () => {
    const {custom, system} = splitAttributes([attr({id: 'b'}), attr({id: 'name', system: true}), attr({id: 'a'})]);
    assert.deepStrictEqual(
      custom.map((a) => a.id),
      ['a', 'b'],
    );
    assert.deepStrictEqual(
      system.map((a) => a.id),
      ['name'],
    );
  });

  test('overlays enum values without dropping attributes', () => {
    const merged = withEnumValues(
      [attr({id: 'color', valueType: 'enum_of_string'}), attr({id: 'plain'})],
      [attr({id: 'color', valueType: 'enum_of_string', valueDefinitions: [{value: 'red'}]})],
    );
    assert.strictEqual(merged.length, 2);
    assert.deepStrictEqual(merged[0].valueDefinitions, [{value: 'red'}]);
    assert.strictEqual(merged[1].valueDefinitions, undefined);
  });
});

suite('object types: mergeAttributeGroups', () => {
  test('merges duplicate group IDs and sorts by position', () => {
    const groups = mergeAttributeGroups([
      {id: 'storefront', position: 2, attributeDefinitions: [attr({id: 'a'})]},
      {id: 'general', position: 1},
      {id: 'storefront', position: 5, attributeDefinitions: [attr({id: 'a'}), attr({id: 'b'})]},
    ]);
    assert.deepStrictEqual(
      groups.map((g) => g.id),
      ['general', 'storefront'],
    );
    assert.deepStrictEqual(
      groups[1].attributeDefinitions!.map((a) => a.id),
      ['a', 'b'],
    );
  });
});

suite('object types: saving attribute documents', () => {
  test('drops read-only fields and keeps value definitions', () => {
    const desired = definitionFromDocument(
      JSON.stringify({
        id: 'activity',
        system: false,
        effectiveId: 'c_activity',
        creationDate: '2020-01-01',
        defaultValue: null,
        valueType: 'enum_of_string',
        valueDefinitions: [{id: 'Hiking', position: 0, value: 'Hiking', displayValue: {default: 'Hiking2'}}],
      }),
      'activity',
    );
    assert.deepStrictEqual(desired, {
      id: 'activity',
      valueType: 'enum_of_string',
      valueDefinitions: [{value: 'Hiking', displayValue: {default: 'Hiking2'}}],
    });
  });

  test('rejects invalid JSON and changed IDs', () => {
    assert.throws(() => definitionFromDocument('{', 'a'), /not valid JSON/);
    assert.throws(() => definitionFromDocument('[]', 'a'), /JSON object/);
    assert.throws(() => definitionFromDocument('{"id": "b"}', 'a'), /cannot be changed/);
  });

  test('describes API and import changes for the confirmation', () => {
    const lines = describeSyncPlan({
      unchanged: 0,
      warnings: [{objectType: 'Product', id: 'a', message: 'note'}],
      actions: [{action: 'update-attribute', objectType: 'Product', id: 'a', changes: ['displayName'], body: {}}],
      importRequired: [{objectType: 'Product', id: 'a', changes: ['display value of x'], attribute: {id: 'a'}}],
    });
    assert.deepStrictEqual(lines, {
      api: ['Update a: displayName'],
      importItems: ['a: display value of x'],
      warnings: ['note'],
    });
  });
});

suite('object types: validateAttributeId', () => {
  test('accepts plain IDs and rejects prefixes and bad characters', () => {
    assert.strictEqual(validateAttributeId('myAttr_2'), undefined);
    assert.ok(validateAttributeId(''));
    assert.ok(validateAttributeId('c_myAttr')?.includes('c_'));
    assert.ok(validateAttributeId('2bad'));
    assert.ok(validateAttributeId('has-dash'));
  });
});
