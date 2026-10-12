/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Hook registrations: which script implements which extension point. The
// platform reads the `hooks` entry of a cartridge's package.json, which names
// a hooks.json file listing `{name, script}` pairs; each script path is
// relative to that hooks.json and, like a require(), may leave out its
// extension. Usage inference reads the registrations to treat
// `HookMgr.callHook('dw.order.calculate', 'calculate', basket)` as a call of
// the `calculate` export of every script registered for `dw.order.calculate`.
//
// Both files are project content: they are only ever parsed as JSON, and every
// path they name is contained to the cartridge that declares it.

import path from 'node:path';

import type {NormalizedCartridge} from './constants';

export interface HookRegistration {
  /** The extension point (`dw.order.calculate`, `app.payment.processor.basic_credit`). */
  readonly extensionPoint: string;
  /** The script registered for it, resolved to an existing file. */
  readonly script: string;
}

export interface HookRegistryDeps {
  readFile(fileName: string): string | undefined;
  fileExists(fileName: string): boolean;
  isWithinRoot(candidate: string, root: string): boolean;
}

// A registered script resolves like a require(): as written, then with the
// extensions the platform tries for a script.
const SCRIPT_EXTENSIONS = ['', '.js', '.ds'];

function readJson(deps: HookRegistryDeps, fileName: string): unknown {
  try {
    const text = deps.readFile(fileName);
    return text === undefined ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** `value[key]` when `value` is an object and that field holds a non-empty string. */
function stringField(value: unknown, key: string): string | undefined {
  const field = value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
  return typeof field === 'string' && field.length > 0 ? field : undefined;
}

/** `relative` resolved against the directory `dir`, when that stays inside `cartridge`. */
function containedPath(
  deps: HookRegistryDeps,
  cartridge: NormalizedCartridge,
  dir: string,
  relative: string,
): string | undefined {
  const candidate = path.posix.join(dir, relative.replace(/\\/g, '/'));
  return deps.isWithinRoot(candidate, cartridge.root) ? candidate : undefined;
}

function resolveScript(
  deps: HookRegistryDeps,
  cartridge: NormalizedCartridge,
  dir: string,
  script: string,
): string | undefined {
  const base = containedPath(deps, cartridge, dir, script);
  if (base === undefined) return undefined;
  return SCRIPT_EXTENSIONS.map((ext) => base + ext).find((candidate) => deps.fileExists(candidate));
}

/** The hooks.json file a cartridge's package.json names, if any. */
function hooksFileOf(deps: HookRegistryDeps, cartridge: NormalizedCartridge): string | undefined {
  const hooksPath = stringField(readJson(deps, cartridge.rawRoot + 'package.json'), 'hooks');
  return hooksPath === undefined ? undefined : containedPath(deps, cartridge, cartridge.rawRoot, hooksPath);
}

/** The registrations one cartridge's package.json and hooks.json declare. */
function cartridgeRegistrations(deps: HookRegistryDeps, cartridge: NormalizedCartridge): HookRegistration[] {
  const hooksFile = hooksFileOf(deps, cartridge);
  const hooks = hooksFile === undefined ? undefined : readJson(deps, hooksFile);
  const entries = hooks !== null && typeof hooks === 'object' ? (hooks as {hooks?: unknown}).hooks : undefined;
  if (hooksFile === undefined || !Array.isArray(entries)) return [];
  const hooksDir = path.posix.dirname(hooksFile);
  return entries.flatMap((entry: unknown) => {
    const extensionPoint = stringField(entry, 'name');
    const script = stringField(entry, 'script');
    const resolved = extensionPoint && script ? resolveScript(deps, cartridge, hooksDir, script) : undefined;
    return extensionPoint && resolved ? [{extensionPoint, script: resolved}] : [];
  });
}

/** Every hook registration the configured cartridges declare. Unreadable or malformed files declare none. */
export function readHookRegistrations(
  cartridges: readonly NormalizedCartridge[],
  deps: HookRegistryDeps,
): HookRegistration[] {
  return cartridges.flatMap((cartridge) => cartridgeRegistrations(deps, cartridge));
}
