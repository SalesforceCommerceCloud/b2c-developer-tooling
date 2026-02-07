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
  // Include silent log level by default to reduce test output noise
  const defaultFlags = {'log-level': 'silent'};
  return stub(command as {parse: unknown}, 'parse').resolves({
    args,
    flags: {...defaultFlags, ...flags},
    metadata: {},
    argv,
    raw: [],
    nonExistentFlags: {},
  });
}
