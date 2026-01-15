/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import sinon, {type SinonStub} from 'sinon';

/**
 * Helper to stub the parse method on oclif commands.
 * The parse method is protected in oclif's Command class, so we need to cast.
 *
 * @param command - The command instance to stub
 * @param flags - The flags to return from parse
 * @param args - The args to return from parse
 * @returns The sinon stub for the parse method
 */
export function stubParse(
  command: unknown,
  flags: Record<string, unknown> = {},
  args: Record<string, unknown> = {},
): SinonStub {
  return sinon.stub(command as {parse: unknown}, 'parse').resolves({
    args,
    flags,
    metadata: {},
    argv: [],
    raw: [],
    nonExistentFlags: {},
  });
}
