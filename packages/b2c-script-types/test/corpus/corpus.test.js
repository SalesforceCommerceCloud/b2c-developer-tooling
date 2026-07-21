/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {describe, it} = require('node:test');

const ts = require('typescript');

const {
  collectParameterMemberUsage,
  createInferenceContext,
  describeTypes,
  inferParameterType,
  inferTypeForNode,
} = require('../../plugin/usage-inference');
const {createFixtureLanguageService, findFunctionDeclaration} = require('../helpers/fixture-language-service');
const {realTypesPrelude} = require('../helpers/real-dw-types');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));

function findCallbackParam(sourceFile, paramIndex = 0) {
  let param;
  const visit = (node) => {
    if (ts.isFunctionExpression(node) && !param) {
      param = node.parameters[paramIndex];
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!param) throw new Error('callback parameter not found');
  return param;
}

function findVariableDeclaration(sourceFile, name) {
  let decl;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      decl = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!decl) throw new Error(`variable declaration not found: ${name}`);
  return decl;
}

function buildFiles(corpusCase) {
  const files = {...corpusCase.files};
  if (corpusCase.dwTypes?.length) {
    files['/types.d.ts'] = realTypesPrelude(corpusCase.dwTypes, corpusCase.globals ?? '');
  } else if (corpusCase.globals) {
    files['/types.d.ts'] = `declare global {\n${corpusCase.globals}\n}\n`;
  }
  return files;
}

function resolveTarget(ctx, corpusCase) {
  const sourceFile = ctx.program.getSourceFile(corpusCase.target.file);
  assert.ok(sourceFile, `missing fixture file ${corpusCase.target.file}`);
  if (corpusCase.target.kind === 'callbackParam') {
    return {kind: 'param', node: findCallbackParam(sourceFile, corpusCase.target.param ?? 0)};
  }
  if (corpusCase.target.kind === 'variable') {
    return {kind: 'variable', node: findVariableDeclaration(sourceFile, corpusCase.target.name)};
  }
  const fn = findFunctionDeclaration(sourceFile, corpusCase.target.function);
  return {kind: 'param', node: fn.parameters[corpusCase.target.param ?? 0]};
}

describe('usage-inference golden corpus (real-storefront shapes)', () => {
  for (const corpusCase of cases) {
    it(`${corpusCase.id}: ${corpusCase.description}`, () => {
      const languageService = createFixtureLanguageService(buildFiles(corpusCase));
      const ctx = createInferenceContext(ts, languageService);
      assert.ok(ctx, 'expected an inference context');
      const target = resolveTarget(ctx, corpusCase);

      if (corpusCase.expectMembers) {
        assert.equal(target.kind, 'param', `${corpusCase.id}: expectMembers requires a parameter target`);
        const members = [...collectParameterMemberUsage(ctx, target.node)].sort();
        assert.deepEqual(members, [...corpusCase.expectMembers].sort());
        return;
      }

      const types =
        target.kind === 'variable' ? inferTypeForNode(ctx, target.node.name) : inferParameterType(ctx, target.node);
      if (corpusCase.expect === null) {
        assert.deepEqual(types, [], `expected silence for ${corpusCase.id}`);
        return;
      }

      const described = describeTypes(ctx.checker, types);
      assert.ok(
        described.includes(corpusCase.expect),
        `expected type mentioning ${corpusCase.expect}, got: ${described || '(empty)'}`,
      );
    });
  }
});
