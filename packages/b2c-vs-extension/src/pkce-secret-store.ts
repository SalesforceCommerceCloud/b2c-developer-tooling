/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthSession, AuthSessionBackend} from '@salesforce/b2c-tooling-sdk/auth';
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
 * in-memory snapshot, while persistence to SecretStorage runs in the
 * background. This matches the pattern VS Code itself uses for cached
 * SecretStorage state in extensions.
 */
export class VsCodeSecretsAuthSessionBackend implements AuthSessionBackend {
  private readonly snapshot: Map<string, AuthSession> = new Map();

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
    void (async () => {
      await this.context.secrets.store(recordKey(session.clientId), JSON.stringify(persisted));
      await this.addToIndex(session.clientId);
    })();
  }

  delete(clientId: string): void {
    this.snapshot.delete(clientId);
    void (async () => {
      await this.context.secrets.delete(recordKey(clientId));
      await this.removeFromIndex(clientId);
    })();
  }

  list(): AuthSession[] {
    return [...this.snapshot.values()];
  }

  clearAll(): void {
    const ids = [...this.snapshot.keys()];
    this.snapshot.clear();
    void (async () => {
      for (const clientId of ids) {
        await this.context.secrets.delete(recordKey(clientId));
      }
      await this.context.globalState.update(INDEX_KEY, undefined);
    })();
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
}
