/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {parseEnv} from 'node:util';

/** Read all variables from a project's `.env` file without mutating `process.env`. */
export function readProjectEnvironment(projectDirectory?: string): Record<string, string | undefined> | undefined {
  if (!projectDirectory) return undefined;

  const environmentPath = path.join(projectDirectory, '.env');
  if (!existsSync(environmentPath)) return undefined;

  return parseEnv(readFileSync(environmentPath, 'utf8'));
}

/** Merge project variables with an ambient environment, with ambient values taking precedence. */
export function mergeProjectEnvironment(
  projectEnvironment?: Record<string, string | undefined>,
  ambientEnvironment: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  return {...projectEnvironment, ...ambientEnvironment};
}
