/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, '..');
const sdkXsdDir = path.resolve(pkgRoot, '..', 'b2c-tooling-sdk', 'data', 'xsd');
const extensionXsdDir = path.join(pkgRoot, 'resources', 'xsd');
const xmlValidationConfigPath = path.join(pkgRoot, 'src', 'xml-validation', 'index.ts');

function fail(message) {
  console.error(`[xsd-sync] ${message}`);
  process.exit(1);
}

function listXsdFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.xsd'))
    .sort((left, right) => left.localeCompare(right));
}

function readMappedSchemas() {
  if (!fs.existsSync(xmlValidationConfigPath)) {
    fail(`XML validation mapping file not found: ${xmlValidationConfigPath}`);
  }

  const source = fs.readFileSync(xmlValidationConfigPath, 'utf8');
  const matches = [...source.matchAll(/schemaFile:\s*'([^']+)'/g)].map((match) => match[1]);

  if (matches.length === 0) {
    fail('No schemaFile mappings found in src/xml-validation/index.ts');
  }

  return [...new Set(matches)].sort((left, right) => left.localeCompare(right));
}

function filesEqual(leftPath, rightPath) {
  if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath)) return false;
  const left = fs.readFileSync(leftPath);
  const right = fs.readFileSync(rightPath);
  return left.equals(right);
}

if (!fs.existsSync(sdkXsdDir)) {
  fail(`SDK XSD source directory not found: ${sdkXsdDir}`);
}

fs.mkdirSync(extensionXsdDir, {recursive: true});

const sourceFiles = listXsdFiles(sdkXsdDir);
if (sourceFiles.length === 0) {
  fail(`No .xsd files found in source directory: ${sdkXsdDir}`);
}

const mappedSchemas = readMappedSchemas();
const sourceFileSet = new Set(sourceFiles);
for (const mappedSchema of mappedSchemas) {
  if (!sourceFileSet.has(mappedSchema)) {
    fail(`Mapped schema "${mappedSchema}" is missing from SDK source directory`);
  }
}

const destinationFiles = listXsdFiles(extensionXsdDir);
let removedCount = 0;
for (const destinationFile of destinationFiles) {
  if (!sourceFileSet.has(destinationFile)) {
    fs.rmSync(path.join(extensionXsdDir, destinationFile), {force: true});
    removedCount += 1;
  }
}

let copiedCount = 0;
let unchangedCount = 0;
for (const sourceFile of sourceFiles) {
  const sourcePath = path.join(sdkXsdDir, sourceFile);
  const destinationPath = path.join(extensionXsdDir, sourceFile);

  if (filesEqual(sourcePath, destinationPath)) {
    unchangedCount += 1;
    continue;
  }

  fs.copyFileSync(sourcePath, destinationPath);
  copiedCount += 1;
}

console.log(
  `[xsd-sync] complete: ${sourceFiles.length} source files, ${copiedCount} copied, ${unchangedCount} unchanged, ${removedCount} removed`,
);
