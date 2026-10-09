/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Functions the platform itself calls, so no call site exists in the project
// to infer from. Their parameter types are fixed by the platform contract
// rather than guessed: Page Designer invokes the `render(context, modelIn)`
// export of every component and page script with a script context and an
// optional model map.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {findAmbientClassType} from './ambient-index';
import {getReferenceNameNode} from './value-flow';
import type {InferenceContext} from './context';

interface FrameworkContract {
  /** Path segment identifying the scripts the platform calls. */
  readonly directory: string;
  /** Name of the exported function the platform calls. */
  readonly functionName: string;
  /** Ambient class names of its parameters, by index. */
  readonly parameterTypes: readonly string[];
}

const FRAMEWORK_CONTRACTS: readonly FrameworkContract[] = [
  {
    directory: '/cartridge/experience/components/',
    functionName: 'render',
    parameterTypes: ['ComponentScriptContext', 'Map'],
  },
  {
    directory: '/cartridge/experience/pages/',
    functionName: 'render',
    parameterTypes: ['PageScriptContext', 'Map'],
  },
];

/** The contract-defined type of `fn`'s parameter at `paramIndex`, if `fn` is a platform entry point. */
export function frameworkParameterTypes(
  ctx: InferenceContext,
  fn: tsserver.SignatureDeclaration,
  paramIndex: number,
): tsserver.Type[] {
  const functionName = getReferenceNameNode(fn, ctx.ts)?.text;
  if (!functionName) return [];
  const fileName = fn.getSourceFile().fileName.replace(/\\/g, '/');
  const contract = FRAMEWORK_CONTRACTS.find(
    (candidate) => candidate.functionName === functionName && fileName.includes(candidate.directory),
  );
  const typeName = contract?.parameterTypes[paramIndex];
  const type = typeName ? findAmbientClassType(ctx, typeName) : undefined;
  return type ? [type] : [];
}
