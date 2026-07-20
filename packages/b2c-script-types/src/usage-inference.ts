/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Public entry point for the usage-inference engine. The implementation is
// split across the ./inference/ modules by responsibility; this barrel just
// re-exports the pieces the tsserver plugin (and the test suite) consume, so
// callers have one stable import path and don't need to know the internal
// layout. Read the modules in this order to understand the engine:
//   inference/constants     - the tunable limits that keep a request bounded
//   inference/context       - the per-request scratchpad (program, budgets, memo)
//   inference/ast-helpers   - pure AST navigation (find node, return exprs, ...)
//   inference/call-sites    - find where a function is called across the project
//   inference/type-helpers  - Type utilities + hover text / completion entries
//   inference/super-module  - module.superModule detection and export scanning
//   inference/core          - the recursive engine that ties it all together

export {INFERRED_COMPLETION_SOURCE} from './inference/constants';
export {createInferenceContext} from './inference/context';
export {getNodeAtPosition, findEnclosingPropertyAccess} from './inference/ast-helpers';
export {describeTypes, isAnyType, typesToCompletionEntries} from './inference/type-helpers';
export {collectSuperModuleAugmentedMembers, traceSuperModuleAccess} from './inference/super-module';
export {inferParameterType, inferReturnType, inferTypeForExpression, inferTypeForNode} from './inference/core';

export type {InferenceContext} from './inference/context';
