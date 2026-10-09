"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmbientClasses = getAmbientClasses;
exports.ambientClassType = ambientClassType;
exports.findAmbientClassType = findAmbientClassType;
const classesByFile = new WeakMap();
const classesByProgram = new WeakMap();
function indexDeclaration(ctx, statement) {
    const { ts, checker } = ctx;
    if (!(ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)) || !statement.name)
        return undefined;
    const symbol = checker.getSymbolAtLocation(statement.name);
    if (!symbol)
        return undefined;
    const memberNames = new Set(checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol)).map((m) => m.name));
    if (memberNames.size === 0)
        return undefined;
    return { name: statement.name.text, memberNames, declaration: statement };
}
function indexFile(ctx, sourceFile) {
    const cached = classesByFile.get(sourceFile);
    if (cached)
        return cached;
    const classes = sourceFile.statements.flatMap((statement) => indexDeclaration(ctx, statement) ?? []);
    classesByFile.set(sourceFile, classes);
    return classes;
}
/**
 * Every top-level class and interface in the program's declaration files,
 * except TypeScript's own default library (DOM and ES classes such as
 * `HTMLDataElement` would otherwise match ordinary SFCC usage).
 */
function getAmbientClasses(ctx) {
    const { program } = ctx;
    const cached = classesByProgram.get(program);
    if (cached)
        return cached;
    const classes = program
        .getSourceFiles()
        .filter((sourceFile) => sourceFile.isDeclarationFile && !program.isSourceFileDefaultLibrary(sourceFile))
        .flatMap((sourceFile) => indexFile(ctx, sourceFile));
    classesByProgram.set(program, classes);
    return classes;
}
/** The class's declared (uninstantiated) type, resolved with the current checker. */
function ambientClassType(ctx, ambientClass) {
    const { checker } = ctx;
    const name = ambientClass.declaration.name;
    const symbol = name && checker.getSymbolAtLocation(name);
    return symbol ? checker.getDeclaredTypeOfSymbol(symbol) : undefined;
}
/**
 * The declared type of the ambient class called `name`, preferring the
 * vendored Script API's declaration (under a `/dw/` directory) when a
 * project declares another class of the same name.
 */
function findAmbientClassType(ctx, name) {
    const named = getAmbientClasses(ctx).filter((ambientClass) => ambientClass.name === name);
    const preferred = named.find((ambientClass) => ambientClass.declaration.getSourceFile().fileName.includes('/dw/')) ?? named[0];
    return preferred && ambientClassType(ctx, preferred);
}
