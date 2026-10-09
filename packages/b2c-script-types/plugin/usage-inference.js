"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsageInferenceHooks = exports.matchAmbientTypesByUsage = exports.usageProfileOf = exports.inferTypeForNode = exports.inferReturnType = exports.inferParameterType = exports.collectSuperModuleAugmentedMembers = exports.typesToCompletionEntries = exports.describeTypes = exports.memberCompletionAccess = exports.createInferenceContext = exports.INFERRED_COMPLETION_SOURCE = void 0;
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
//   inference/reference-search    - where a name is used, read from the files that can name it
//   inference/call-sites          - find where a function is called across the project
//   inference/signatures          - the function a call invokes and its declared callback types
//   inference/generic-calls       - generic calls whose result is an argument or a callback's return
//   inference/member-values       - the values an untyped member is built with
//   inference/super-module        - module.superModule detection and resolution
//   inference/this-properties     - constructor arguments kept on `this` and read in prototype methods
//   inference/usage-profile       - what a value's own scope says about it (members, guards, uses)
//   inference/bindings            - a helper's parameters bound to one call's arguments
//   inference/ambient-index       - every ambient class by member names
//   inference/naming              - identifier-name tiebreak between usage matches
//   inference/framework-contracts - parameters the platform itself passes (Page Designer)
//   inference/policy              - turning evidence into the type(s) shown
//   inference/core                - the recursive evidence-gathering engine
//   inference/editor-hooks        - hover and completion decoration for the plugin
var constants_1 = require("./inference/constants");
Object.defineProperty(exports, "INFERRED_COMPLETION_SOURCE", { enumerable: true, get: function () { return constants_1.INFERRED_COMPLETION_SOURCE; } });
var context_1 = require("./inference/context");
Object.defineProperty(exports, "createInferenceContext", { enumerable: true, get: function () { return context_1.createInferenceContext; } });
var ast_helpers_1 = require("./inference/ast-helpers");
Object.defineProperty(exports, "memberCompletionAccess", { enumerable: true, get: function () { return ast_helpers_1.memberCompletionAccess; } });
var type_helpers_1 = require("./inference/type-helpers");
Object.defineProperty(exports, "describeTypes", { enumerable: true, get: function () { return type_helpers_1.describeTypes; } });
Object.defineProperty(exports, "typesToCompletionEntries", { enumerable: true, get: function () { return type_helpers_1.typesToCompletionEntries; } });
var super_module_1 = require("./inference/super-module");
Object.defineProperty(exports, "collectSuperModuleAugmentedMembers", { enumerable: true, get: function () { return super_module_1.collectSuperModuleAugmentedMembers; } });
var core_1 = require("./inference/core");
Object.defineProperty(exports, "inferParameterType", { enumerable: true, get: function () { return core_1.inferParameterType; } });
Object.defineProperty(exports, "inferReturnType", { enumerable: true, get: function () { return core_1.inferReturnType; } });
Object.defineProperty(exports, "inferTypeForNode", { enumerable: true, get: function () { return core_1.inferTypeForNode; } });
var usage_profile_1 = require("./inference/usage-profile");
Object.defineProperty(exports, "usageProfileOf", { enumerable: true, get: function () { return usage_profile_1.usageProfileOf; } });
var policy_1 = require("./inference/policy");
Object.defineProperty(exports, "matchAmbientTypesByUsage", { enumerable: true, get: function () { return policy_1.matchAmbientTypesByUsage; } });
var editor_hooks_1 = require("./inference/editor-hooks");
Object.defineProperty(exports, "createUsageInferenceHooks", { enumerable: true, get: function () { return editor_hooks_1.createUsageInferenceHooks; } });
