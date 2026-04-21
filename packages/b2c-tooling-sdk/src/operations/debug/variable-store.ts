/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Maps DAP integer variableReference values to SDAPI object_path strings.
 *
 * DAP clients request variables by integer reference. The SDAPI uses
 * dot-delimited object paths for navigating the object tree. This store
 * bridges the two models and supports scope-filtered variable requests.
 *
 * References are cleared whenever execution resumes (continue/step) because
 * SDAPI variable state is only valid while a thread is halted.
 *
 * @module operations/debug/variable-store
 */

export interface VariableRef {
  threadId: number;
  frameIndex: number;
  objectPath: string;
  /** If set, this reference is for a scope — filter /variables by this scope. */
  scope?: 'local' | 'closure' | 'global';
}

export class VariableStore {
  private nextRef = 1;
  private readonly refs = new Map<number, VariableRef>();

  /**
   * Get or create an integer reference for the given variable context.
   */
  getOrCreateReference(
    threadId: number,
    frameIndex: number,
    objectPath: string,
    scope?: 'local' | 'closure' | 'global',
  ): number {
    // Check for existing reference with same parameters
    for (const [ref, entry] of this.refs) {
      if (
        entry.threadId === threadId &&
        entry.frameIndex === frameIndex &&
        entry.objectPath === objectPath &&
        entry.scope === scope
      ) {
        return ref;
      }
    }

    const ref = this.nextRef++;
    this.refs.set(ref, {threadId, frameIndex, objectPath, scope});
    return ref;
  }

  /**
   * Resolve an integer reference back to its variable context.
   */
  resolve(ref: number): VariableRef | undefined {
    return this.refs.get(ref);
  }

  /**
   * Clear all references. Call on continue/step since variable state becomes stale.
   */
  clear(): void {
    this.refs.clear();
    this.nextRef = 1;
  }
}
