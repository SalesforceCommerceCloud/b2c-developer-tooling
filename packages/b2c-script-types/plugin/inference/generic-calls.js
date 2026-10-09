"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genericResultSource = genericResultSource;
const signatures_1 = require("./signatures");
/** True when `node` is a bare reference to the type parameter `name` (`T`). */
function isTypeParameterReference(ts, node, name) {
    return (node !== undefined &&
        ts.isTypeReferenceNode(node) &&
        ts.isIdentifier(node.typeName) &&
        node.typeName.text === name &&
        node.typeArguments === undefined);
}
/** The type parameter a generic declaration returns as is (`T` of `wrap<T>(...): T`). */
function returnedTypeParameter(ts, declaration) {
    const result = declaration.type;
    const name = result && ts.isTypeReferenceNode(result) && ts.isIdentifier(result.typeName) && result.typeName.text;
    return name && declaration.typeParameters?.some((parameter) => parameter.name.text === name) ? name : undefined;
}
/**
 * Where `call`'s result comes from when its callee's declaration returns a
 * type parameter it takes as an argument (`identity<T>(value: T): T`) or as
 * a callback's result (`wrap<T>(callback: () => T): T`).
 */
function genericResultSource(ctx, call) {
    const { ts, checker } = ctx;
    const declaration = checker.getResolvedSignature(call)?.declaration;
    if (!declaration || ts.isJSDocSignature(declaration))
        return undefined;
    const typeParameter = returnedTypeParameter(ts, declaration);
    if (!typeParameter)
        return undefined;
    for (const [index, parameter] of declaration.parameters.entries()) {
        const argument = call.arguments[index];
        const type = parameter.type;
        if (!argument || !type)
            continue;
        if (isTypeParameterReference(ts, type, typeParameter))
            return { kind: 'value', argument };
        const fn = ts.isFunctionTypeNode(type) && isTypeParameterReference(ts, type.type, typeParameter);
        const callback = fn ? (0, signatures_1.functionOf)(ctx, argument) : undefined;
        if (callback)
            return { kind: 'return', fn: callback };
    }
    return undefined;
}
