/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// An index of every ambient class and interface the program declares in a
// `.d.ts` file (the vendored dw.* Script API, chiefly), by member names. It
// answers "which classes have all of these members?" for usage-based
// matching (see ./policy) and "which class is called X?" for framework
// contracts (see ./framework-contracts).
//
// The index holds only names and declaration nodes, never a Type: a Type
// pins the checker, and through it the whole Program it came from. Types are
// resolved on demand with the current request's checker. Entries are cached
// per declaration SourceFile, which tsserver reuses across Programs for as
// long as the file is unchanged, so editing a cartridge `.js` file never
// re-indexes the Script API. A file is indexed with the members its classes
// had when it was first seen; a declaration file that changes is a new
// SourceFile and is indexed afresh.

import type tsserver from 'typescript/lib/tsserverlibrary';

import type {InferenceContext} from './context';

/** One indexed class or interface. */
export interface AmbientClass {
  readonly name: string;
  readonly memberNames: ReadonlySet<string>;
  readonly declaration: tsserver.ClassDeclaration | tsserver.InterfaceDeclaration;
}

const classesByFile = new WeakMap<tsserver.SourceFile, readonly AmbientClass[]>();
const classesByProgram = new WeakMap<tsserver.Program, readonly AmbientClass[]>();

function indexDeclaration(ctx: InferenceContext, statement: tsserver.Statement): AmbientClass | undefined {
  const {ts, checker} = ctx;
  if (!(ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)) || !statement.name) return undefined;
  const symbol = checker.getSymbolAtLocation(statement.name);
  if (!symbol) return undefined;
  const memberNames = new Set(checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol)).map((m) => m.name));
  if (memberNames.size === 0) return undefined;
  return {name: statement.name.text, memberNames, declaration: statement};
}

function indexFile(ctx: InferenceContext, sourceFile: tsserver.SourceFile): readonly AmbientClass[] {
  const cached = classesByFile.get(sourceFile);
  if (cached) return cached;
  const classes = sourceFile.statements.flatMap((statement) => indexDeclaration(ctx, statement) ?? []);
  classesByFile.set(sourceFile, classes);
  return classes;
}

/**
 * Every top-level class and interface in the program's declaration files,
 * except TypeScript's own default library (DOM and ES classes such as
 * `HTMLDataElement` would otherwise match ordinary SFCC usage).
 */
export function getAmbientClasses(ctx: InferenceContext): readonly AmbientClass[] {
  const {program} = ctx;
  const cached = classesByProgram.get(program);
  if (cached) return cached;
  const classes = program
    .getSourceFiles()
    .filter((sourceFile) => sourceFile.isDeclarationFile && !program.isSourceFileDefaultLibrary(sourceFile))
    .flatMap((sourceFile) => indexFile(ctx, sourceFile));
  classesByProgram.set(program, classes);
  return classes;
}

/** The class's declared (uninstantiated) type, resolved with the current checker. */
export function ambientClassType(ctx: InferenceContext, ambientClass: AmbientClass): tsserver.Type | undefined {
  const {checker} = ctx;
  const name = ambientClass.declaration.name;
  const symbol = name && checker.getSymbolAtLocation(name);
  return symbol ? checker.getDeclaredTypeOfSymbol(symbol) : undefined;
}

/**
 * The declared type of the ambient class called `name`, preferring the
 * vendored Script API's declaration (under a `/dw/` directory) when a
 * project declares another class of the same name.
 */
export function findAmbientClassType(ctx: InferenceContext, name: string): tsserver.Type | undefined {
  const named = getAmbientClasses(ctx).filter((ambientClass) => ambientClass.name === name);
  const preferred =
    named.find((ambientClass) => ambientClass.declaration.getSourceFile().fileName.includes('/dw/')) ?? named[0];
  return preferred && ambientClassType(ctx, preferred);
}
