/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {stub, type SinonStub} from 'sinon';

export function stubParse(
  command: unknown,
  flags: Record<string, unknown> = {},
  args: Record<string, unknown> = {},
  argv: string[] = [],
): SinonStub {
  // Include silent log level by default to reduce test output noise.
  // Point config to /dev/null to prevent dw.json discovery from the working
  // directory — mirrors what isolateConfig() does via SFCC_CONFIG env var,
  // but stubParse bypasses oclif's env-to-flag mapping so we need it here.
  const defaultFlags = {'log-level': 'silent', config: '/dev/null'};
  return stub(command as {parse: unknown}, 'parse').resolves({
    args,
    flags: {...defaultFlags, ...flags},
    metadata: {},
    argv,
    raw: [],
    nonExistentFlags: {},
  });
}
