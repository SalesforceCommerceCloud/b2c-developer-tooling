/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Parse @salesforce/b2c-script-types `.d.ts` files into the docs-index DocEntry shape.
 *
 * Output is two files:
 *   - script-api.json        full DocEntry[] (loaded lazily on first lookup)
 *   - script-api-search.json lightweight {id,title,qualifiedName,kind,packagePath,tags}[]
 *                            for the search dictionary (loaded on first panel open)
 *
 * Source of truth is the JSDoc on each declaration, mirroring what
 * b2c-script-types ships for IntelliSense. We do NOT make network calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {Project, SyntaxKind} from 'ts-morph';

import {assertValidDocEntry} from './schema.mjs';

const __filename = fileURLToPath(import.meta.url);

/**
 * @param {object} opts
 * @param {string} opts.typesRoot        absolute path to b2c-script-types/types
 * @param {string} [opts.scriptApiVersion] for logging only
 * @returns {{entries: import('./schema.mjs').DocEntry[], search: object[]}}
 */
export function buildScriptApiIndex({typesRoot, scriptApiVersion}) {
  if (!fs.existsSync(typesRoot)) {
    throw new Error(`Script types not found at ${typesRoot}`);
  }

  const project = new Project({
    compilerOptions: {
      allowJs: false,
      noEmit: true,
      skipLibCheck: true,
      strict: false,
    },
  });

  // Limit to dw/ to avoid pulling in TopLevel + global ambient declarations.
  // Those globals are useful for IntelliSense but noisy in a Script API browser.
  const dwRoot = path.join(typesRoot, 'dw');
  if (!fs.existsSync(dwRoot)) {
    throw new Error(`Expected dw/ folder under ${typesRoot}`);
  }
  project.addSourceFilesAtPaths(path.join(dwRoot, '**/*.d.ts'));

  /** @type {import('./schema.mjs').DocEntry[]} */
  const entries = [];

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(typesRoot, filePath).replace(/\\/g, '/');
    // Skip aggregator index.d.ts files — they only re-export and produce no docs.
    if (path.basename(relativePath) === 'index.d.ts') continue;

    const declaration = pickPrimaryDeclaration(sourceFile);
    if (!declaration) continue;

    const packagePath = path.posix.dirname(relativePath); // e.g. dw/order
    const declName = declaration.getName() ?? path.basename(relativePath, '.d.ts');
    const qualifiedName = packagePath.replace(/\//g, '.') + '.' + declName; // dw.order.BasketMgr

    const kind = classifyDeclaration(declaration);
    const parentEntry = buildParentEntry({declaration, kind, declName, qualifiedName, packagePath});

    entries.push(parentEntry);

    // Members. Walk in declaration order so that overloads (same name, different
    // signatures) get a stable per-name index appended to their id.
    const members = collectMembers(declaration);
    /** @type {Map<string, number>} */
    const nameSeen = new Map();
    /** @type {Map<string, number>} */
    const nameTotal = new Map();
    for (const member of members) {
      const memberName = typeof member.getName === 'function' ? member.getName() : undefined;
      if (!memberName) continue;
      nameTotal.set(memberName, (nameTotal.get(memberName) ?? 0) + 1);
    }
    for (const member of members) {
      const memberName = typeof member.getName === 'function' ? member.getName() : undefined;
      let overloadIndex;
      if (memberName && (nameTotal.get(memberName) ?? 0) > 1) {
        overloadIndex = nameSeen.get(memberName) ?? 0;
        nameSeen.set(memberName, overloadIndex + 1);
      }
      const entry = buildMemberEntry({
        member,
        parent: parentEntry,
        overloadIndex,
      });
      if (entry) entries.push(entry);
    }
  }

  // Add synthetic package entries so the tree provider has nodes to expand.
  const packageEntries = synthesizePackageEntries(entries);
  entries.push(...packageEntries);

  // Validate every entry. Throws on first malformed one.
  for (const entry of entries) assertValidDocEntry(entry, entry.id);

  // Belt-and-suspenders: id collisions are silent disasters at runtime
  // (search returns duplicates, member rows render the wrong source).
  // Fail the build immediately if any future ts-morph behavior change
  // reintroduces them.
  /** @type {Map<string, number>} */
  const idCounts = new Map();
  for (const entry of entries) idCounts.set(entry.id, (idCounts.get(entry.id) ?? 0) + 1);
  const dupes = [...idCounts.entries()].filter(([, n]) => n > 1);
  if (dupes.length > 0) {
    const sample = dupes
      .slice(0, 5)
      .map(([id, n]) => `  ${n}× ${id}`)
      .join('\n');
    throw new Error(
      `Duplicate Script API ids detected (${dupes.length} colliding ids).\n` +
        `Each id must be unique across the index. Sample:\n${sample}`,
    );
  }

  // Deterministic order.
  entries.sort(byId);

  // Search-dictionary projection. The runtime relies on this NEVER touching
  // the full source file — class-page member tables read straight from these
  // fields. Keep the projection small but enough to render rows.
  //
  // Only members of a class/interface/enum carry the heavy fields (signature,
  // description, deprecated, sinceApiVersion). Package nodes and the parent
  // declarations themselves don't need them — packages don't have signatures
  // and the parent's full entry is loaded when the user opens it directly.
  // This keeps script-api-search.json roughly the size of just the names.
  /** @type {object[]} */
  const search = entries.map((entry) => {
    const isMemberRow = entry.kind === 'method' || entry.kind === 'property' || entry.kind === 'constant';
    return removeUndefined({
      id: entry.id,
      title: entry.title,
      qualifiedName: entry.qualifiedName,
      kind: entry.kind,
      packagePath: entry.packagePath,
      parentId: entry.parentId,
      tags: entry.tags,
      signature: isMemberRow ? entry.signature : undefined,
      description: isMemberRow ? entry.description : undefined,
      deprecated: isMemberRow && entry.deprecated ? true : undefined,
      sinceApiVersion: isMemberRow ? entry.sinceApiVersion : undefined,
    });
  });

  if (scriptApiVersion) {
    process.stdout.write(`[docs-index] script-api v${scriptApiVersion}: ${entries.length} entries\n`);
  }

  return {entries, search};
}

/**
 * Pick the primary class/interface/enum declaration from a source file.
 * `b2c-script-types` puts one declaration per file by convention.
 *
 * @param {import('ts-morph').SourceFile} sourceFile
 * @returns {import('ts-morph').ClassDeclaration | import('ts-morph').InterfaceDeclaration | import('ts-morph').EnumDeclaration | undefined}
 */
function pickPrimaryDeclaration(sourceFile) {
  const cls = sourceFile.getClasses()[0];
  if (cls) return cls;
  const iface = sourceFile.getInterfaces()[0];
  if (iface) return iface;
  const enm = sourceFile.getEnums()[0];
  if (enm) return enm;
  return undefined;
}

/**
 * @param {ReturnType<typeof pickPrimaryDeclaration>} decl
 * @returns {'class' | 'interface' | 'enum'}
 */
function classifyDeclaration(decl) {
  const k = decl.getKind();
  if (k === SyntaxKind.InterfaceDeclaration) return 'interface';
  if (k === SyntaxKind.EnumDeclaration) return 'enum';
  return 'class';
}

/**
 * @param {object} args
 * @param {ReturnType<typeof pickPrimaryDeclaration>} args.declaration
 * @param {'class' | 'interface' | 'enum'} args.kind
 * @param {string} args.declName
 * @param {string} args.qualifiedName
 * @param {string} args.packagePath
 * @returns {import('./schema.mjs').DocEntry}
 */
function buildParentEntry({declaration, kind, declName, qualifiedName, packagePath}) {
  const jsDoc = extractJsDoc(declaration);

  const sections = [];
  if (jsDoc.body) {
    sections.push({heading: 'Description', body: jsDoc.body});
  }

  const examples = jsDoc.examples;

  /** @type {string[]} */
  const tags = [declName.toLowerCase(), qualifiedName.toLowerCase(), packagePath.toLowerCase()];

  // Inheritance for classes only.
  let extendsList;
  let implementsList;
  if (kind === 'class' && typeof declaration.getExtends === 'function') {
    const baseExpr = declaration.getExtends?.();
    if (baseExpr) extendsList = [baseExpr.getText()];
    const impls = declaration.getImplements?.() ?? [];
    if (impls.length > 0) implementsList = impls.map((i) => i.getText());
  } else if (kind === 'interface' && typeof declaration.getExtends === 'function') {
    const exts = declaration.getExtends?.() ?? [];
    if (exts.length > 0) extendsList = exts.map((i) => i.getText());
  }

  if (extendsList?.length) {
    sections.push({
      heading: 'Inheritance',
      body: `Extends \`${extendsList.join('`, `')}\``,
    });
  }
  if (implementsList?.length) {
    sections.push({
      heading: 'Implements',
      body: `Implements \`${implementsList.join('`, `')}\``,
    });
  }

  /** @type {import('./schema.mjs').DocEntry} */
  const entry = {
    id: `script-api:${packagePath}/${declName}`,
    source: 'script-api',
    kind,
    title: declName,
    qualifiedName,
    parentId: `script-api:${packagePath}`,
    packagePath,
    description: jsDoc.summary,
    sections: sections.length > 0 ? sections : undefined,
    examples: examples.length > 0 ? examples : undefined,
    tags,
    sinceApiVersion: jsDoc.since,
    deprecated: jsDoc.deprecated,
  };

  // Drop undefined for clean JSON.
  return removeUndefined(entry);
}

/**
 * Collect every property and method declared on a class/interface/enum.
 *
 * IMPORTANT: ts-morph's `getProperties()` / `getMethods()` already return
 * **all** declared members (instance + static). The `getStaticProperties()`
 * / `getStaticMethods()` accessors are filtered subsets — calling them too
 * produces byte-for-byte duplicate rows. The static-ness of each member is
 * preserved on the node itself and surfaced downstream via `isStatic()`.
 *
 * @param {ReturnType<typeof pickPrimaryDeclaration>} declaration
 */
function collectMembers(declaration) {
  /** @type {Array<import('ts-morph').Node>} */
  const members = [];
  if (typeof declaration.getProperties === 'function') {
    members.push(...declaration.getProperties());
  }
  if (typeof declaration.getMethods === 'function') {
    members.push(...declaration.getMethods());
  }
  if (typeof declaration.getMembers === 'function' && declaration.getKind() === SyntaxKind.EnumDeclaration) {
    // Enum members come through getMembers(); treat each as a constant.
    members.push(...declaration.getMembers());
  }
  return members;
}

/**
 * @param {object} args
 * @param {import('ts-morph').Node} args.member
 * @param {import('./schema.mjs').DocEntry} args.parent
 * @param {number} [args.overloadIndex] zero-based index when the parent has
 *        multiple members with this name. Appended to the id as `~N` so
 *        each overload gets a unique entry.
 * @returns {import('./schema.mjs').DocEntry | undefined}
 */
function buildMemberEntry({member, parent, overloadIndex}) {
  const name = typeof member.getName === 'function' ? member.getName() : undefined;
  if (!name) return undefined;

  const memberKind = classifyMember(member);
  if (!memberKind) return undefined;

  const jsDoc = extractJsDoc(member);

  /** @type {import('./schema.mjs').DocParam[] | undefined} */
  let params;
  /** @type {import('./schema.mjs').DocReturn | undefined} */
  let returns;
  let signature;

  if (memberKind === 'method') {
    params = collectParams(member, jsDoc.paramDocs);
    returns = collectReturns(member, jsDoc.returnDoc);
    signature = formatMethodSignature(member, name);
  } else {
    signature = formatMemberSignature(member, name);
  }

  const sections = [];
  if (jsDoc.body) sections.push({heading: 'Description', body: jsDoc.body});

  // Overload disambiguator. Single-overload members keep a clean id; only
  // overloads receive a `~N` suffix in declaration order so each gets its
  // own URL-safe stable identifier.
  const idSuffix = typeof overloadIndex === 'number' ? `~${overloadIndex}` : '';

  /** @type {import('./schema.mjs').DocEntry} */
  const entry = {
    id: `${parent.id}#${name}${idSuffix}`,
    source: 'script-api',
    kind: memberKind,
    title: `${parent.title}.${name}`,
    qualifiedName: `${parent.qualifiedName}.${name}`,
    parentId: parent.id,
    packagePath: parent.packagePath,
    signature,
    description: jsDoc.summary,
    params,
    returns,
    throws: jsDoc.throws.length > 0 ? jsDoc.throws : undefined,
    sections: sections.length > 0 ? sections : undefined,
    examples: jsDoc.examples.length > 0 ? jsDoc.examples : undefined,
    tags: [name.toLowerCase(), `${parent.title.toLowerCase()}.${name.toLowerCase()}`],
    sinceApiVersion: jsDoc.since,
    deprecated: jsDoc.deprecated,
  };
  return removeUndefined(entry);
}

/**
 * @param {import('ts-morph').Node} member
 * @returns {'method' | 'property' | 'constant' | undefined}
 */
function classifyMember(member) {
  const k = member.getKind();
  if (k === SyntaxKind.MethodDeclaration || k === SyntaxKind.MethodSignature || k === SyntaxKind.FunctionDeclaration) {
    return 'method';
  }
  if (k === SyntaxKind.EnumMember) return 'constant';
  if (k === SyntaxKind.PropertyDeclaration || k === SyntaxKind.PropertySignature) {
    // Static + readonly + has an initializer ⇒ treat as constant for nicer rendering.
    const isStatic = typeof member.isStatic === 'function' && member.isStatic();
    const isReadonly = typeof member.isReadonly === 'function' && member.isReadonly();
    const hasInitializer = typeof member.getInitializer === 'function' && member.getInitializer() !== undefined;
    if (isStatic && isReadonly && hasInitializer) return 'constant';
    return 'property';
  }
  return undefined;
}

/**
 * @param {import('ts-morph').Node} method
 * @param {Map<string,string>} paramDocs
 */
function collectParams(method, paramDocs) {
  if (typeof method.getParameters !== 'function') return undefined;
  const params = method.getParameters();
  if (params.length === 0) return undefined;
  return params.map((p) => {
    const name = p.getName();
    const typeNode = p.getTypeNode();
    return removeUndefined({
      name,
      type: typeNode ? typeNode.getText() : undefined,
      description: paramDocs.get(name),
      optional: p.isOptional() || p.hasInitializer() || undefined,
    });
  });
}

/**
 * @param {import('ts-morph').Node} method
 * @param {string | undefined} returnDescription
 */
function collectReturns(method, returnDescription) {
  if (typeof method.getReturnTypeNode !== 'function') return undefined;
  const node = method.getReturnTypeNode();
  if (!node && !returnDescription) return undefined;
  return removeUndefined({type: node ? node.getText() : undefined, description: returnDescription});
}

/**
 * @param {import('ts-morph').Node} method
 * @param {string} name
 */
function formatMethodSignature(method, name) {
  if (typeof method.getParameters !== 'function') return name;
  const params = method.getParameters().map((p) => {
    const t = p.getTypeNode();
    const optional = p.isOptional() || p.hasInitializer() ? '?' : '';
    return `${p.getName()}${optional}${t ? `: ${t.getText()}` : ''}`;
  });
  const ret = typeof method.getReturnTypeNode === 'function' ? method.getReturnTypeNode() : undefined;
  const isStatic = typeof method.isStatic === 'function' && method.isStatic();
  return `${isStatic ? 'static ' : ''}${name}(${params.join(', ')})${ret ? `: ${ret.getText()}` : ''}`;
}

/**
 * @param {import('ts-morph').Node} prop
 * @param {string} name
 */
function formatMemberSignature(prop, name) {
  const isStatic = typeof prop.isStatic === 'function' && prop.isStatic();
  const isReadonly = typeof prop.isReadonly === 'function' && prop.isReadonly();
  const t = typeof prop.getTypeNode === 'function' ? prop.getTypeNode() : undefined;
  const init = typeof prop.getInitializer === 'function' ? prop.getInitializer() : undefined;
  let suffix = '';
  if (t) suffix += `: ${t.getText()}`;
  if (init) suffix += ` = ${init.getText()}`;
  return `${isStatic ? 'static ' : ''}${isReadonly ? 'readonly ' : ''}${name}${suffix}`;
}

/**
 * Extract structured info from a node's JSDoc.
 *
 * @param {import('ts-morph').Node} node
 */
function extractJsDoc(node) {
  /** @type {import('ts-morph').JSDoc[]} */
  const docs = typeof node.getJsDocs === 'function' ? node.getJsDocs() : [];
  if (docs.length === 0) {
    return {
      summary: undefined,
      body: undefined,
      examples: [],
      paramDocs: new Map(),
      returnDoc: undefined,
      throws: [],
      since: undefined,
      deprecated: undefined,
    };
  }
  const lastDoc = docs[docs.length - 1];
  const rawDescription = (lastDoc.getDescription() ?? '').trim();
  const {summary, body, examples} = splitDescription(rawDescription);

  const paramDocs = new Map();
  /** @type {{type: string, description?: string}[]} */
  const throws = [];
  let returnDoc;
  let since;
  /** @type {import('./schema.mjs').DocDeprecation | undefined} */
  let deprecated;

  for (const tag of lastDoc.getTags()) {
    const tagName = tag.getTagName();
    if (tagName === 'param') {
      const struct = /** @type {{name?: string, text?: string}} */ (tag.getStructure?.() ?? {});
      const name = struct.name ?? tag.getCommentText() ?? '';
      const text = (struct.text ?? tag.getCommentText() ?? '').trim();
      if (name) paramDocs.set(name, text || undefined);
    } else if (tagName === 'returns' || tagName === 'return') {
      returnDoc = tag.getCommentText()?.trim();
    } else if (tagName === 'throws' || tagName === 'exception') {
      const text = tag.getCommentText()?.trim() ?? '';
      const match = /^\{?([\w./]+)\}?\s*-?\s*(.*)$/.exec(text);
      if (match) {
        throws.push(removeUndefined({type: match[1], description: match[2] || undefined}));
      } else if (text) {
        throws.push({type: text});
      }
    } else if (tagName === 'since') {
      since = tag.getCommentText()?.trim();
    } else if (tagName === 'deprecated') {
      deprecated = removeUndefined({message: tag.getCommentText()?.trim() || undefined});
    }
  }

  return {summary, body, examples, paramDocs, returnDoc, throws, since, deprecated};
}

/**
 * Split a JSDoc description into a one-paragraph summary, the rest, and any example blocks.
 *
 * @param {string} description
 */
function splitDescription(description) {
  if (!description) return {summary: undefined, body: undefined, examples: []};
  const lines = description.split(/\r?\n/);
  /** @type {string[]} */
  const examples = [];
  /** @type {string[]} */
  const out = [];
  let inFence = false;
  /** @type {string[]} */
  let fenceBuf = [];
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inFence) {
        examples.push(fenceBuf.join('\n').trim());
        fenceBuf = [];
        inFence = false;
      } else {
        inFence = true;
      }
      continue;
    }
    if (inFence) {
      fenceBuf.push(line);
    } else {
      out.push(line);
    }
  }
  // Trailing unterminated fence — drop it (broken JSDoc).
  const cleaned = out.join('\n').trim();
  if (!cleaned) return {summary: undefined, body: undefined, examples};
  const paragraphSplit = cleaned.split(/\n\s*\n/);
  const summary = paragraphSplit[0].replace(/\s+/g, ' ').trim() || undefined;
  const body = cleaned;
  return {summary, body, examples};
}

/**
 * Synthesize one DocEntry per package directory so the tree provider has
 * top-level navigation nodes (e.g. dw/order). Counts are derived from members.
 *
 * @param {import('./schema.mjs').DocEntry[]} memberEntries
 * @returns {import('./schema.mjs').DocEntry[]}
 */
function synthesizePackageEntries(memberEntries) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const e of memberEntries) {
    if (!e.packagePath) continue;
    if (e.kind === 'class' || e.kind === 'interface' || e.kind === 'enum') {
      counts.set(e.packagePath, (counts.get(e.packagePath) ?? 0) + 1);
    }
  }
  /** @type {import('./schema.mjs').DocEntry[]} */
  const result = [];
  for (const [packagePath, classCount] of counts) {
    const dottedName = packagePath.replace(/\//g, '.');
    result.push(
      removeUndefined({
        id: `script-api:${packagePath}`,
        source: 'script-api',
        kind: 'package',
        title: dottedName,
        qualifiedName: dottedName,
        packagePath,
        description: `${classCount} ${classCount === 1 ? 'declaration' : 'declarations'}`,
        tags: [packagePath, dottedName],
      }),
    );
  }
  return result;
}

/**
 * @template {object} T
 * @param {T} obj
 * @returns {T}
 */
function removeUndefined(obj) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) delete obj[key];
  }
  return obj;
}

/**
 * @param {import('./schema.mjs').DocEntry} a
 * @param {import('./schema.mjs').DocEntry} b
 */
function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// CLI entry — for one-off invocation outside run.mjs.
if (process.argv[1] === __filename) {
  const typesRoot = process.argv[2];
  if (!typesRoot) {
    process.stderr.write('Usage: build-script-api.mjs <path-to-b2c-script-types/types>\n');
    process.exit(1);
  }
  const {entries} = buildScriptApiIndex({typesRoot: path.resolve(typesRoot)});
  process.stdout.write(`${entries.length} entries\n`);
}
