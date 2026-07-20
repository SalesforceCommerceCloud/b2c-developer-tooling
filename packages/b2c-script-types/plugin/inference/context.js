"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInferenceContext = createInferenceContext;
const constants_1 = require("./constants");
/**
 * Builds a fresh inference context for one top-level hover/completion
 * request, or `undefined` if the language service has no program yet.
 */
function createInferenceContext(ts, languageService, resolveSuperModulePath) {
    const program = languageService.getProgram();
    if (!program)
        return undefined;
    return {
        ts,
        program,
        checker: program.getTypeChecker(),
        languageService,
        visiting: new Set(),
        memo: new Map(),
        referenceBudget: constants_1.MAX_REFERENCES_PER_REQUEST,
        searchBudget: constants_1.MAX_SEARCHES_PER_REQUEST,
        callSiteMemo: new Map(),
        typeDisplayStrings: new Map(),
        cycleHits: 0,
        resolveSuperModulePath,
    };
}
