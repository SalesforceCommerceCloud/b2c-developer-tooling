/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Public entry point for the usage-inference engine. The implementation is
// split across the ./inference/ modules by responsibility; this barrel just
// re-exports the pieces the tsserver plugin (and the test suite) consume, so
// callers have one stable import path and don't need to know the internal
// layout. The engine gathers evidence (./inference/core) and then applies one
// decision policy (./inference/policy) at every parameter, return value and
// variable. Read the modules in this order to understand it:
//   inference/constants           - the tunable limits that keep a request bounded
//   inference/context             - the per-request scratchpad (program, budgets, memo, guards)
//   inference/ast-helpers         - pure AST navigation (find node, return exprs, ...)
//   inference/type-helpers        - Type utilities + hover text / completion entries
//   inference/value-flow          - where a function value goes: calls, exports, factories, parameters
//   inference/call-sites          - find where a function is called across the project
//   inference/signatures          - the function a call invokes and its declared callback types
//   inference/generic-calls       - generic calls whose result is an argument or a callback's return
//   inference/member-values       - the values an untyped member is built with
//   inference/super-module        - module.superModule detection and export scanning
//   inference/this-properties     - constructor arguments kept on `this` and read in prototype methods
//   inference/usage-profile       - what a value's own scope says about it (members, guards, uses)
//   inference/ambient-index       - every ambient class by member names
//   inference/naming              - identifier-name tiebreak between usage matches
//   inference/framework-contracts - parameters the platform itself passes (Page Designer)
//   inference/policy              - turning evidence into the type(s) shown
//   inference/core                - the recursive evidence-gathering engine
//   inference/editor-hooks        - hover and completion decoration for the plugin

export {INFERRED_COMPLETION_SOURCE} from './inference/constants';
export {createInferenceContext} from './inference/context';
export {memberCompletionAccess} from './inference/ast-helpers';
export {describeTypes, typesToCompletionEntries} from './inference/type-helpers';
export {collectSuperModuleAugmentedMembers} from './inference/super-module';
export {inferParameterType, inferReturnType, inferTypeForNode} from './inference/core';
export {usageProfileOf} from './inference/usage-profile';
export {matchAmbientTypesByUsage} from './inference/policy';
export {createUsageInferenceHooks} from './inference/editor-hooks';
