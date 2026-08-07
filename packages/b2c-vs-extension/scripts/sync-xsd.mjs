/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Single source of truth: resources/xsd-mappings.json
 *
 * Reads the mappings file and:
 *   1. Copies the listed XSDs from the SDK (`b2c-tooling-sdk/data/xsd/`) into
 *      `resources/xsd/`. Any unrelated *.xsd previously written under that dir
 *      is removed so the bundle never carries unused schemas.
 *   2. Regenerates the `contributes.xmlValidation` block in package.json from
 *      the same mappings — keeping the VS Code contribution and the bundled
 *      schemas in lockstep.
 *
 * Invoked automatically at the start of esbuild-bundle.mjs (build/watch),
 * so a developer never needs to run it as a separate step.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultPkgRoot = path.resolve(__dirname, '..');

function listXsdFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.xsd'))
    .sort((left, right) => left.localeCompare(right));
}

function filesEqual(leftPath, rightPath) {
  if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath)) return false;
  return fs.readFileSync(leftPath).equals(fs.readFileSync(rightPath));
}

function readMappings(mappingsPath) {
  if (!fs.existsSync(mappingsPath)) {
    throw new Error(`[xsd-sync] Mappings file not found: ${mappingsPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  const entries = parsed?.mappings;
  const bundleOnly = parsed?.bundleOnly ?? [];
  const skipped = parsed?.skipped ?? [];
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('[xsd-sync] xsd-mappings.json must contain a non-empty "mappings" array');
  }
  if (!Array.isArray(bundleOnly)) {
    throw new Error('[xsd-sync] xsd-mappings.json "bundleOnly" must be an array of filenames');
  }
  if (!Array.isArray(skipped)) {
    throw new Error('[xsd-sync] xsd-mappings.json "skipped" must be an array of filenames');
  }
  for (const entry of entries) {
    if (typeof entry?.schema !== 'string' || !entry.schema.endsWith('.xsd')) {
      throw new Error(`[xsd-sync] Invalid mapping entry — "schema" must end in .xsd: ${JSON.stringify(entry)}`);
    }
    if (!Array.isArray(entry.fileMatch) || entry.fileMatch.length === 0) {
      throw new Error(`[xsd-sync] Mapping for ${entry.schema} must have a non-empty fileMatch[]`);
    }
  }
  for (const name of [...bundleOnly, ...skipped]) {
    if (typeof name !== 'string' || !name.endsWith('.xsd')) {
      throw new Error(
        `[xsd-sync] Invalid bundleOnly/skipped entry — must be a filename ending in .xsd: ${JSON.stringify(name)}`,
      );
    }
  }
  return {mappings: entries, bundleOnly, skipped};
}

/**
 * Extract the `targetNamespace` declared by an XSD. B2C schemas declare it on
 * the root <xsd:schema> element (with or without spaces around `=`). Returns
 * undefined for a no-namespace schema.
 */
function readTargetNamespace(xsdPath) {
  const text = fs.readFileSync(xsdPath, 'utf8');
  const match = text.match(/targetNamespace\s*=\s*"([^"]+)"/);
  return match ? match[1] : undefined;
}

function assertFullSdkCoverage(mappings, bundleOnly, skipped, sdkXsdDir) {
  const sdkFiles = new Set(listXsdFiles(sdkXsdDir));
  const accounted = new Set([...mappings.map((m) => m.schema), ...bundleOnly, ...skipped]);

  const unaccounted = [...sdkFiles].filter((file) => !accounted.has(file)).sort();
  if (unaccounted.length > 0) {
    const list = unaccounted.map((f) => `  - ${f}`).join('\n');
    throw new Error(
      `[xsd-sync] ${unaccounted.length} SDK schema(s) are not accounted for:\n${list}\n` +
        `[xsd-sync] Edit resources/xsd-mappings.json — add each to one of:\n` +
        `[xsd-sync]   mappings[]    (bundled + contributed as fileMatch) for user-facing schemas\n` +
        `[xsd-sync]   bundleOnly[]  (bundled, no fileMatch) for schemas imported by other XSDs\n` +
        `[xsd-sync]   skipped[]     (excluded entirely) for internal/feed/non-workspace schemas.`,
    );
  }

  const phantom = [...accounted].filter((file) => !sdkFiles.has(file)).sort();
  if (phantom.length > 0) {
    const list = phantom.map((f) => `  - ${f}`).join('\n');
    throw new Error(
      `[xsd-sync] ${phantom.length} schema(s) listed in xsd-mappings.json no longer exist in the SDK:\n${list}\n` +
        `[xsd-sync] Remove them from mappings[]/bundleOnly[]/skipped[] in resources/xsd-mappings.json.`,
    );
  }
}

function syncSchemas(mappings, bundleOnly, sdkXsdDir, extensionXsdDir) {
  if (!fs.existsSync(sdkXsdDir)) {
    throw new Error(`[xsd-sync] SDK XSD source directory not found: ${sdkXsdDir}`);
  }
  fs.mkdirSync(extensionXsdDir, {recursive: true});

  const sourceFiles = new Set(listXsdFiles(sdkXsdDir));
  // Bundle both: schemas users validate against AND their transitive imports.
  const requested = new Set([...mappings.map((m) => m.schema), ...bundleOnly]);

  for (const schema of requested) {
    if (!sourceFiles.has(schema)) {
      throw new Error(`[xsd-sync] Schema "${schema}" is missing from SDK source directory ${sdkXsdDir}`);
    }
  }

  let removedCount = 0;
  for (const file of listXsdFiles(extensionXsdDir)) {
    if (!requested.has(file)) {
      fs.rmSync(path.join(extensionXsdDir, file), {force: true});
      removedCount += 1;
    }
  }

  let copiedCount = 0;
  let unchangedCount = 0;
  for (const schema of requested) {
    const src = path.join(sdkXsdDir, schema);
    const dest = path.join(extensionXsdDir, schema);
    if (filesEqual(src, dest)) {
      unchangedCount += 1;
      continue;
    }
    fs.copyFileSync(src, dest);
    copiedCount += 1;
  }

  return {total: requested.size, copiedCount, unchangedCount, removedCount};
}

function buildContribution(mappings) {
  const entries = [];
  for (const mapping of mappings) {
    for (const fileMatch of mapping.fileMatch) {
      entries.push({fileMatch, url: `./resources/xsd/${mapping.schema}`});
    }
  }
  return entries;
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Resolve each mapped schema's targetNamespace and split the mappings into:
 *   - catalogEntries: {namespace, schema} for schemas bound BY NAMESPACE via the
 *     OASIS catalog. This is the primary mechanism — LemMinX picks the schema
 *     from the document's declared namespace, independent of file path/name.
 *   - associationSchemas: schemas whose namespace is shared by another mapped
 *     schema. A catalog <uri name> maps a namespace to exactly one file, so a
 *     shared namespace cannot disambiguate them (they typically have different
 *     root elements — e.g. customer.xsd's <customers> vs customerlist2.xsd's
 *     <customer-list>). ALL schemas in a colliding namespace are dropped from
 *     the catalog and routed to path-glob file associations, whose distinct
 *     globs resolve each file to the right schema.
 *
 * Throws on any mapped schema with no targetNamespace — it could be neither
 * catalogued nor safely handled, and would silently miss validation.
 */
function buildCatalogModel(mappings, sdkXsdDir) {
  const byNamespace = new Map(); // namespace -> [schema, ...]
  for (const mapping of mappings) {
    const ns = readTargetNamespace(path.join(sdkXsdDir, mapping.schema));
    if (!ns) {
      throw new Error(
        `[xsd-sync] ${mapping.schema} declares no targetNamespace, so it cannot be catalogued by namespace. ` +
          `Move it to "skipped" or give the schema a targetNamespace.`,
      );
    }
    if (!byNamespace.has(ns)) byNamespace.set(ns, []);
    byNamespace.get(ns).push(mapping.schema);
  }

  const catalogEntries = []; // {namespace, schema}
  const associationSchemas = new Set(); // schemas handled by fileMatch fallback

  for (const [ns, schemas] of byNamespace) {
    if (schemas.length === 1) {
      catalogEntries.push({namespace: ns, schema: schemas[0]});
    } else {
      // Shared namespace — cannot disambiguate via catalog; route all to path globs.
      for (const s of schemas) associationSchemas.add(s);
    }
  }

  catalogEntries.sort((a, b) => a.namespace.localeCompare(b.namespace));
  return {catalogEntries, associationSchemas};
}

/** Render the OASIS XML catalog. `uri` paths are relative to the catalog file. */
function buildCatalogXml(catalogEntries) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- GENERATED by scripts/sync-xsd.mjs from resources/xsd-mappings.json — do not edit by hand. -->',
    '<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">',
  ];
  for (const {namespace, schema} of catalogEntries) {
    lines.push(`  <uri name="${escapeXml(namespace)}" uri="./xsd/${escapeXml(schema)}" />`);
  }
  lines.push('</catalog>', '');
  return lines.join('\n');
}

/**
 * File-association fallbacks for schemas that lost a namespace collision. Each
 * glob is emitted as {pattern, systemId} — the shape redhat.vscode-xml's
 * addXMLFileAssociations() API expects. systemId is a path relative to the
 * extension root (resolved to absolute at runtime).
 */
function buildAssociations(mappings, associationSchemas) {
  const associations = [];
  for (const mapping of mappings) {
    if (!associationSchemas.has(mapping.schema)) continue;
    for (const pattern of mapping.fileMatch) {
      associations.push({pattern, systemId: `./resources/xsd/${mapping.schema}`});
    }
  }
  return associations;
}

function writeIfChanged(filePath, contents) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === contents) return false;
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, contents);
  return true;
}

/**
 * Ensure package.json carries NO `contributes.xmlValidation` block. That
 * contribution point is not read by redhat.vscode-xml from a third-party
 * extension (verified against vscode-xml's src/plugin.ts + src/extension.ts,
 * which scan only `xml.javaExtensions` and `xmlLanguageParticipants`). We now
 * associate schemas at runtime by NAMESPACE via the addXMLCatalogs() API, so a
 * lingering xmlValidation block would be inert and misleading. Returns true when
 * it removed a stale block.
 */
function removeStaleContribution(packageJsonPath) {
  const raw = fs.readFileSync(packageJsonPath, 'utf8');
  const trailingNewline = raw.endsWith('\n');
  const pkg = JSON.parse(raw);
  if (!pkg.contributes || !('xmlValidation' in pkg.contributes)) return false;
  delete pkg.contributes.xmlValidation;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + (trailingNewline ? '\n' : ''));
  return true;
}

/**
 * Run the full sync. Safe to call multiple times — copies only when source/dest
 * differ and rewrites package.json only when the contribution array would change.
 */
export function syncXsd({pkgRoot = defaultPkgRoot} = {}) {
  const sdkXsdDir = path.resolve(pkgRoot, '..', 'b2c-tooling-sdk', 'data', 'xsd');
  const extensionXsdDir = path.join(pkgRoot, 'resources', 'xsd');
  const mappingsPath = path.join(pkgRoot, 'resources', 'xsd-mappings.json');
  const packageJsonPath = path.join(pkgRoot, 'package.json');

  const catalogPath = path.join(pkgRoot, 'resources', 'xsd-catalog.xml');
  const runtimeConfigPath = path.join(pkgRoot, 'resources', 'xml-validation.generated.json');

  const {mappings, bundleOnly, skipped} = readMappings(mappingsPath);
  assertFullSdkCoverage(mappings, bundleOnly, skipped, sdkXsdDir);
  const stats = syncSchemas(mappings, bundleOnly, sdkXsdDir, extensionXsdDir);
  // `contribution` is the flat {fileMatch,url} list. We no longer write it into
  // package.json (see removeStaleContribution) — it feeds detectionGlobs below.
  const contribution = buildContribution(mappings);
  const wrotePkg = removeStaleContribution(packageJsonPath);

  // Namespace-based catalog (primary) + path-glob associations (collision fallback).
  const {catalogEntries, associationSchemas} = buildCatalogModel(mappings, sdkXsdDir);
  const associations = buildAssociations(mappings, associationSchemas);
  const wroteCatalog = writeIfChanged(catalogPath, buildCatalogXml(catalogEntries));

  // Single runtime sidecar the extension reads to register with vscode-xml.
  // Paths are relative to the extension root; the runtime resolves them to
  // absolute. `detectionGlobs` recognizes a B2C metadata XML on open.
  const runtimeConfig = {
    _comment: 'GENERATED by scripts/sync-xsd.mjs from resources/xsd-mappings.json — do not edit by hand.',
    catalog: './resources/xsd-catalog.xml',
    fileAssociations: associations,
    detectionGlobs: contribution.map((entry) => entry.fileMatch),
  };
  const wroteRuntime = writeIfChanged(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2) + '\n');

  console.log(
    `[xsd-sync] ${mappings.length} mapped, ${bundleOnly.length} bundleOnly, ${skipped.length} skipped; ` +
      `${contribution.length} fileMatch entries (${stats.copiedCount} copied, ${stats.unchangedCount} unchanged, ${stats.removedCount} removed); ` +
      `catalog: ${catalogEntries.length} namespaces, ${associations.length} association fallback(s)` +
      `${wrotePkg ? ' — removed stale xmlValidation block' : ''}${wroteCatalog ? ' — wrote catalog' : ''}${wroteRuntime ? ' — wrote runtime config' : ''}`,
  );
  return {
    ...stats,
    mappedCount: mappings.length,
    bundleOnlyCount: bundleOnly.length,
    skippedCount: skipped.length,
    contributionEntries: contribution.length,
    catalogNamespaces: catalogEntries.length,
    associationCount: associations.length,
    wrotePackageJson: wrotePkg,
    wroteCatalog,
    wroteRuntimeConfig: wroteRuntime,
  };
}

// Allow direct invocation (e.g. `node scripts/sync-xsd.mjs`) for emergencies,
// even though the build pipeline calls syncXsd() directly.
const isDirectInvoke = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectInvoke) {
  try {
    syncXsd();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
