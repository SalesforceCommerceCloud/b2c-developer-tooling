/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Loader for the libxml2 WebAssembly module in `data/xml-validator/`.
 *
 * The module is built from source by `wasm/xml-validator/build.sh`. It runs entirely in memory: documents and
 * schemas are copied into its in-memory filesystem, and it has no access to the host filesystem or network.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {XSD_DATA_DIR} from '../docs/types.js';
import type {XmlDiagnostic, XmlDiagnosticSeverity} from './types.js';

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'));

/** Directory containing the built validator (`xml-validator.mjs`, `xml-validator.wasm`). */
export const XML_VALIDATOR_DATA_DIR = path.join(packageRoot, 'data/xml-validator');

interface EmscriptenFS {
  mkdir(path: string): void;
  readdir(path: string): string[];
  unlink(path: string): void;
  writeFile(path: string, data: Uint8Array | string): void;
}

interface ValidatorModule {
  _xv_diagnostics(): number;
  _xv_diagnostics_truncated(): number;
  _xv_libxml_version(): number;
  cwrap(name: string, returnType: null | string, argTypes: string[]): (...args: unknown[]) => unknown;
  FS: EmscriptenFS;
  UTF8ToString(ptr: number): string;
}

/** Names, sizes, and modification times of the schema files in a directory. */
function fingerprint(dir: string, schemaPath: string): string {
  const names = fs.readdirSync(dir).filter((name) => name.endsWith('.xsd'));
  if (!schemaPath.endsWith('.xsd')) names.push(path.basename(schemaPath));
  return names
    .sort()
    .map((name) => {
      const stat = fs.statSync(path.join(dir, name));
      return `${name}:${stat.size}:${stat.mtimeMs}`;
    })
    .join('|');
}

const SEVERITY_BY_LEVEL: Record<number, XmlDiagnosticSeverity> = {1: 'warning', 2: 'error', 3: 'fatal'};

/** Outcome of validating one document in the engine. */
export interface EngineValidation {
  diagnostics: XmlDiagnostic[];
  /** 0 = valid, 1 = invalid, 2 = could not be opened. */
  status: 0 | 1 | 2;
  truncated: boolean;
}

/**
 * Thin wrapper over the compiled module. One instance is shared per process; calls are synchronous inside
 * WebAssembly, so they never interleave.
 */
export class XmlValidatorEngine {
  private readonly loadSchema: (path: string) => number;
  private readonly module: ValidatorModule;
  private readonly schemaDirs = new Map<string, string>();
  private readonly schemaHandles = new Map<string, number>();
  private readonly validate: (schema: number, path: string) => number;
  private documentCount = 0;

  private constructor(module: ValidatorModule) {
    this.module = module;
    this.loadSchema = module.cwrap('xv_schema_load', 'number', ['string']) as (path: string) => number;
    this.validate = module.cwrap('xv_validate', 'number', ['number', 'string']) as (
      schema: number,
      path: string,
    ) => number;
  }

  /**
   * Load the compiled module.
   */
  static async load(): Promise<XmlValidatorEngine> {
    const moduleUrl = pathToFileURL(path.join(XML_VALIDATOR_DATA_DIR, 'xml-validator.mjs')).href;
    const factory = (await import(moduleUrl)) as {default: () => Promise<ValidatorModule>};
    return new XmlValidatorEngine(await factory.default());
  }

  /**
   * Run a call into the module. If it traps (for example on running out of memory), the module's state is
   * undefined, so the shared engine is discarded and the next call loads a fresh one.
   */
  private guard<T>(call: () => T): T {
    try {
      return call();
    } catch (error) {
      enginePromise = undefined;
      throw error;
    }
  }

  /** The libxml2 version compiled into the module (for example `21504` for 2.15.4). */
  get libxmlVersion(): string {
    return this.module.UTF8ToString(this.module._xv_libxml_version());
  }

  private readDiagnostics(): XmlDiagnostic[] {
    const raw = this.module.UTF8ToString(this.module._xv_diagnostics());
    const diagnostics: XmlDiagnostic[] = [];
    for (const record of raw.split('\n')) {
      if (!record) continue;
      const [level, line, column, , code, ...message] = record.split('\t');
      diagnostics.push({
        severity: SEVERITY_BY_LEVEL[Number(level)] ?? 'error',
        line: Number(line),
        ...(Number(column) > 0 ? {column: Number(column)} : {}),
        code: Number(code),
        message: message.join('\t'),
      });
    }
    return diagnostics;
  }

  /**
   * Compile a schema and cache it. The `.xsd` files next to it are copied into the module so that `xs:include`
   * and `xs:import` references to them resolve. Throws {@link XmlSchemaLoadError} if the schema does not compile.
   */
  schemaHandle(xsdPath: string): number {
    const absolute = path.resolve(xsdPath);
    const sourceDir = path.dirname(absolute);
    // Bundled schemas never change; for others, recompile when any schema file in the directory changes.
    const key = sourceDir === XSD_DATA_DIR ? absolute : `${absolute}\0${fingerprint(sourceDir, absolute)}`;
    const cached = this.schemaHandles.get(key);
    if (cached) return cached;

    const dir = this.schemaDir(sourceDir, key);
    const target = `${dir}/${path.basename(absolute)}`;
    if (!absolute.endsWith('.xsd')) this.module.FS.writeFile(target, fs.readFileSync(absolute));

    const handle = this.guard(() => this.loadSchema(target));
    if (!handle) throw new XmlSchemaLoadError(xsdPath, this.readDiagnostics());
    this.schemaHandles.set(key, handle);
    return handle;
  }

  /** Copy the `.xsd` files of a host directory into a new in-module directory, reused for the same `key`. */
  private schemaDir(sourceDir: string, key: string): string {
    const dirKey = sourceDir === XSD_DATA_DIR ? sourceDir : key;
    const existing = this.schemaDirs.get(dirKey);
    if (existing) return existing;
    if (this.schemaDirs.size === 0) this.module.FS.mkdir('/schemas');
    const dir = `/schemas/${this.schemaDirs.size}`;
    this.module.FS.mkdir(dir);
    for (const name of fs.readdirSync(sourceDir)) {
      if (name.endsWith('.xsd'))
        this.module.FS.writeFile(`${dir}/${name}`, fs.readFileSync(path.join(sourceDir, name)));
    }
    this.schemaDirs.set(dirKey, dir);
    return dir;
  }

  /**
   * Validate a document against a compiled schema, or check well-formedness only when `schema` is 0.
   */
  validateDocument(contents: Uint8Array, schema: number): EngineValidation {
    if (this.documentCount === 0) this.module.FS.mkdir('/documents');
    const docPath = `/documents/${this.documentCount++}.xml`;
    this.module.FS.writeFile(docPath, contents);
    try {
      const status = this.guard(() => this.validate(schema, docPath)) as 0 | 1 | 2;
      return {
        status,
        diagnostics: this.readDiagnostics(),
        truncated: this.module._xv_diagnostics_truncated() !== 0,
      };
    } finally {
      this.module.FS.unlink(docPath);
    }
  }
}

/**
 * Thrown when an XSD cannot be compiled.
 */
export class XmlSchemaLoadError extends Error {
  readonly diagnostics: XmlDiagnostic[];

  constructor(schemaPath: string, diagnostics: XmlDiagnostic[]) {
    const detail = diagnostics.find((d) => d.severity !== 'warning')?.message;
    super(`Failed to compile schema ${schemaPath}${detail ? `: ${detail}` : ''}`);
    this.name = 'XmlSchemaLoadError';
    this.diagnostics = diagnostics;
  }
}

let enginePromise: Promise<XmlValidatorEngine> | undefined;

/**
 * Get the shared engine, loading the module on first use.
 */
export function getXmlValidatorEngine(): Promise<XmlValidatorEngine> {
  enginePromise ??= XmlValidatorEngine.load().catch((error: unknown) => {
    enginePromise = undefined;
    throw error;
  });
  return enginePromise;
}
