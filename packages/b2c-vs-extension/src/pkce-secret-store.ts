/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthSession, AuthSessionBackend} from '@salesforce/b2c-tooling-sdk/auth';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import * as vscode from 'vscode';

const INDEX_KEY = 'b2c.auth.sessions.index';

function recordKey(clientId: string): string {
  return `b2c.auth.session.${clientId}`;
}

/**
 * Auth-session backend backed by VS Code's SecretStorage.
 *
 * SecretStorage delegates to the platform's native secret backend (macOS
 * Keychain, Windows Credential Manager, Linux libsecret/gnome-keyring) with
 * an encrypted in-process fallback when no keyring is available.
 *
 * The session-store interface is synchronous, but SecretStorage is async, so
 * this backend hydrates an in-memory snapshot at startup via {@link hydrate}
 * and writes through asynchronously: callers see immediate sync reads of the
 * in-memory snapshot, while serialized persistence to SecretStorage runs in
 * the background. {@link flush} lets extension shutdown wait for every queued
 * write.
 */
export class VsCodeSecretsAuthSessionBackend implements AuthSessionBackend {
  private readonly snapshot: Map<string, AuthSession> = new Map();
  /** Serializes native storage writes so index read-modify-write operations cannot race. */
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Load all stored sessions into the in-memory snapshot. Call once at
   * extension activation before registering this backend with the SDK.
   */
  async hydrate(): Promise<void> {
    this.snapshot.clear();
    for (const clientId of this.readIndex()) {
      const raw = await this.context.secrets.get(recordKey(clientId));
      if (!raw) continue;
      try {
        this.snapshot.set(clientId, JSON.parse(raw) as AuthSession);
      } catch {
        // Drop corrupted records.
      }
    }
  }

  find(clientId: string): AuthSession | null {
    return this.snapshot.get(clientId) ?? null;
  }

  save(session: AuthSession): void {
    const persisted: AuthSession = {...session, lastUsedAt: new Date().toISOString()};
    this.snapshot.set(session.clientId, persisted);
    this.enqueueWrite('save session', async () => {
      const key = recordKey(session.clientId);
      await this.context.secrets.store(key, JSON.stringify(persisted));
      try {
        await this.addToIndex(session.clientId);
      } catch (error) {
        // A secret without an index entry cannot be hydrated or cleared later.
        // Roll it back if the second half of the write fails.
        try {
          await this.context.secrets.delete(key);
        } catch (rollbackError) {
          getLogger().error(
            {err: rollbackError, clientId: session.clientId},
            '[AuthStore] Failed to roll back unindexed VS Code auth secret',
          );
        }
        throw error;
      }
    });
  }

  delete(clientId: string): void {
    this.snapshot.delete(clientId);
    this.enqueueWrite('delete session', async () => {
      await this.context.secrets.delete(recordKey(clientId));
      await this.removeFromIndex(clientId);
    });
  }

  list(): AuthSession[] {
    return [...this.snapshot.values()];
  }

  clearAll(): void {
    const snapshotIds = [...this.snapshot.keys()];
    this.snapshot.clear();
    this.enqueueWrite('clear sessions', async () => {
      // Include indexed records that hydration skipped (for example corrupted
      // JSON) so logout truly clears every auth secret owned by this backend.
      const ids = [...new Set([...snapshotIds, ...this.readIndex()])];
      for (const clientId of ids) {
        await this.context.secrets.delete(recordKey(clientId));
      }
      await this.context.globalState.update(INDEX_KEY, undefined);
    });
  }

  /** Wait until every queued SecretStorage/index write has completed. */
  async flush(): Promise<void> {
    await this.writeQueue;
  }

  private readIndex(): string[] {
    const raw = this.context.globalState.get<string[]>(INDEX_KEY);
    return Array.isArray(raw) ? raw : [];
  }

  private async addToIndex(clientId: string): Promise<void> {
    const ids = this.readIndex();
    if (!ids.includes(clientId)) {
      ids.push(clientId);
      await this.context.globalState.update(INDEX_KEY, ids);
    }
  }

  private async removeFromIndex(clientId: string): Promise<void> {
    const ids = this.readIndex().filter((id) => id !== clientId);
    await this.context.globalState.update(INDEX_KEY, ids);
  }

  private enqueueWrite(operation: string, write: () => Promise<void>): void {
    this.writeQueue = this.writeQueue.then(write).catch((error: unknown) => {
      // Keep the queue usable after a failed native write and prevent an
      // unhandled rejection from destabilizing the extension host.
      getLogger().error({err: error, operation}, '[AuthStore] VS Code SecretStorage write failed');
    });
  }
}
