"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchAmbientTypesByUsage = exports.collectVariableMemberUsage = exports.collectParameterMemberUsage = exports.inferTypeForNode = exports.inferTypeForExpression = exports.inferReturnType = exports.inferParameterType = exports.traceSuperModuleAccess = exports.collectSuperModuleAugmentedMembers = exports.typesToCompletionEntries = exports.isOpenForUsageInference = exports.isAnyType = exports.getMemberOfType = exports.describeTypes = exports.findEnclosingPropertyAccess = exports.getNodeAtPosition = exports.createInferenceContext = exports.INFERRED_COMPLETION_SOURCE = void 0;
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
//   inference/usage-match   - last-resort ambient-class matching from member usage
var constants_1 = require("./inference/constants");
Object.defineProperty(exports, "INFERRED_COMPLETION_SOURCE", { enumerable: true, get: function () { return constants_1.INFERRED_COMPLETION_SOURCE; } });
var context_1 = require("./inference/context");
Object.defineProperty(exports, "createInferenceContext", { enumerable: true, get: function () { return context_1.createInferenceContext; } });
var ast_helpers_1 = require("./inference/ast-helpers");
Object.defineProperty(exports, "getNodeAtPosition", { enumerable: true, get: function () { return ast_helpers_1.getNodeAtPosition; } });
Object.defineProperty(exports, "findEnclosingPropertyAccess", { enumerable: true, get: function () { return ast_helpers_1.findEnclosingPropertyAccess; } });
var type_helpers_1 = require("./inference/type-helpers");
Object.defineProperty(exports, "describeTypes", { enumerable: true, get: function () { return type_helpers_1.describeTypes; } });
Object.defineProperty(exports, "getMemberOfType", { enumerable: true, get: function () { return type_helpers_1.getMemberOfType; } });
Object.defineProperty(exports, "isAnyType", { enumerable: true, get: function () { return type_helpers_1.isAnyType; } });
Object.defineProperty(exports, "isOpenForUsageInference", { enumerable: true, get: function () { return type_helpers_1.isOpenForUsageInference; } });
Object.defineProperty(exports, "typesToCompletionEntries", { enumerable: true, get: function () { return type_helpers_1.typesToCompletionEntries; } });
var super_module_1 = require("./inference/super-module");
Object.defineProperty(exports, "collectSuperModuleAugmentedMembers", { enumerable: true, get: function () { return super_module_1.collectSuperModuleAugmentedMembers; } });
Object.defineProperty(exports, "traceSuperModuleAccess", { enumerable: true, get: function () { return super_module_1.traceSuperModuleAccess; } });
var core_1 = require("./inference/core");
Object.defineProperty(exports, "inferParameterType", { enumerable: true, get: function () { return core_1.inferParameterType; } });
Object.defineProperty(exports, "inferReturnType", { enumerable: true, get: function () { return core_1.inferReturnType; } });
Object.defineProperty(exports, "inferTypeForExpression", { enumerable: true, get: function () { return core_1.inferTypeForExpression; } });
Object.defineProperty(exports, "inferTypeForNode", { enumerable: true, get: function () { return core_1.inferTypeForNode; } });
var usage_match_1 = require("./inference/usage-match");
Object.defineProperty(exports, "collectParameterMemberUsage", { enumerable: true, get: function () { return usage_match_1.collectParameterMemberUsage; } });
Object.defineProperty(exports, "collectVariableMemberUsage", { enumerable: true, get: function () { return usage_match_1.collectVariableMemberUsage; } });
Object.defineProperty(exports, "matchAmbientTypesByUsage", { enumerable: true, get: function () { return usage_match_1.matchAmbientTypesByUsage; } });
