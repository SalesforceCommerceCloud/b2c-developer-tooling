/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Run the B2C tooling inside an NVIDIA OpenShell sandbox.
 *
 * Builds provider profiles, providers, and a network policy from a resolved
 * B2C configuration, then applies them with the `openshell` CLI. Secrets stay
 * on the gateway; the sandbox receives placeholders.
 *
 * @example
 * ```typescript
 * import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
 * import {
 *   applyOpenShellSetup,
 *   buildOpenShellDockerfile,
 *   buildOpenShellSetup,
 *   writeOpenShellFiles,
 * } from '@salesforce/b2c-tooling-sdk/openshell';
 *
 * const config = resolveConfig().values;
 * const setup = buildOpenShellSetup(config, {accessLevel: 'READ_ONLY'});
 * const options = {image: 'b2c-openshell:latest', dockerfile: buildOpenShellDockerfile()};
 * const files = await writeOpenShellFiles(setup, '.openshell/b2c', options);
 * await applyOpenShellSetup(setup, files, {...options, secrets: {SFCC_CLIENT_SECRET: config.clientSecret!}});
 * ```
 *
 * @module openshell
 */
export {
  buildOpenShellDockerfile,
  buildOpenShellSetup,
  OPENSHELL_ACCESS_LEVELS,
  OPENSHELL_SAFETY_CONFIG_PATH,
  secretNeedsBodyAuth,
} from './setup.js';
export type {
  OpenShellAccessLevel,
  OpenShellProfile,
  OpenShellProvider,
  OpenShellSetup,
  OpenShellSetupOptions,
} from './setup.js';
export {
  applyOpenShellSetup,
  runCommand,
  formatOpenShellScript,
  OpenShellCommandError,
  writeOpenShellFiles,
} from './apply.js';
export type {
  ApplyOpenShellSetupOptions,
  CommandResult,
  CommandRunner,
  OpenShellApplyOptions,
  OpenShellFiles,
  OpenShellStep,
} from './apply.js';
