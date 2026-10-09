"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_CALLBACK_USES = void 0;
exports.callbackUses = callbackUses;
const ast_helpers_1 = require("./ast-helpers");
/** A helper that never calls or hands on its callback. */
exports.NO_CALLBACK_USES = { passed: [], forwarded: [] };
/**
 * True when `call`'s result is assigned back to the variable `argument`
 * names: an accumulator (`value = callback(value, item)`), which holds an
 * initial value, an element or the callback's own result, by call. Like the
 * accumulator of a native `reduce`, it stays unknown.
 */
function isFedBack(ctx, call, argument) {
    const { ts, checker } = ctx;
    const assignment = call.parent;
    const assigns = ts.isBinaryExpression(assignment) &&
        assignment.right === call &&
        assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(assignment.left);
    return (assigns &&
        ts.isIdentifier(argument) &&
        checker.getSymbolAtLocation(assignment.left) === checker.getSymbolAtLocation(argument));
}
/**
 * How `helper` uses its parameter `callbackIndex`: the argument each call of
 * it (`callback(item)`, `callback.call(scope, item)`) passes as parameter
 * `paramIndex`, and the calls it is handed on to. Arguments after a spread
 * are not known by position and are left out, and so is an accumulator (see
 * {@link isFedBack}).
 */
function callbackUses(ctx, helper, callbackIndex, paramIndex) {
    const { ts, checker } = ctx;
    const parameter = helper.parameters[callbackIndex];
    const body = helper.body;
    if (!body || !parameter || parameter.dotDotDotToken || !ts.isIdentifier(parameter.name))
        return exports.NO_CALLBACK_USES;
    const { text } = parameter.name;
    const symbol = checker.getSymbolAtLocation(parameter.name);
    const namesCallback = (node) => ts.isIdentifier(node) && node.text === text && checker.getSymbolAtLocation(node) === symbol;
    const passed = [];
    const forwarded = [];
    const record = (call) => {
        const invocation = (0, ast_helpers_1.invocationOf)(call, ts);
        if (invocation && namesCallback(invocation.callee)) {
            const argument = argumentAt(ts, invocation.args, paramIndex);
            if (argument && !isFedBack(ctx, call, argument))
                passed.push(argument);
            return;
        }
        const argIndex = call.arguments.findIndex(namesCallback);
        if (argIndex >= 0)
            forwarded.push({ call, argIndex });
    };
    const spellsCallback = (0, ast_helpers_1.spellingFilter)(body, [text]);
    const visit = (node) => {
        if (!spellsCallback(node))
            return;
        if (ts.isCallExpression(node))
            record(node);
        ts.forEachChild(node, visit);
    };
    visit(body);
    return { passed, forwarded };
}
/** The argument at `index`, unless a spread at or before it leaves its position unknown. */
function argumentAt(ts, args, index) {
    const known = args.slice(0, index + 1);
    return known.length > index && !known.some((arg) => ts.isSpreadElement(arg)) ? known[index] : undefined;
}
