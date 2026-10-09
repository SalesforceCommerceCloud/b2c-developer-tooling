"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.frameworkParameterTypes = frameworkParameterTypes;
const ambient_index_1 = require("./ambient-index");
const call_sites_1 = require("./call-sites");
const FRAMEWORK_CONTRACTS = [
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
function frameworkParameterTypes(ctx, fn, paramIndex) {
    const functionName = (0, call_sites_1.getReferenceNameNode)(fn, ctx.ts)?.text;
    if (!functionName)
        return [];
    const fileName = fn.getSourceFile().fileName.replace(/\\/g, '/');
    const contract = FRAMEWORK_CONTRACTS.find((candidate) => candidate.functionName === functionName && fileName.includes(candidate.directory));
    const typeName = contract?.parameterTypes[paramIndex];
    const type = typeName ? (0, ambient_index_1.findAmbientClassType)(ctx, typeName) : undefined;
    return type ? [type] : [];
}
