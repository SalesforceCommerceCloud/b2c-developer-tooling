/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Writable} from 'node:stream';

/**
 * Creates a null stream that discards all output.
 * Useful for silencing logger output in tests.
 * Creates a new instance each time to avoid listener accumulation.
 */
export function createNullStream(): Writable {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
}

// Convenience constant for backward compatibility (use createNullStream() in beforeEach for cleaner tests)
export const nullStream = createNullStream();

/**
 * A capturing stream that stores output for later inspection.
 * Useful for verifying logger output in tests.
 */
export class CapturingStream extends Writable {
  output: string[] = [];

  _write(chunk: Buffer | string, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.output.push(chunk.toString());
    callback();
  }

  clear(): void {
    this.output = [];
  }

  getOutput(): string {
    return this.output.join('');
  }
}
