/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {randomUUID} from 'node:crypto';
import * as vscode from 'vscode';

/** A single query the user has saved for reuse from the Query Builder. */
export interface CipSavedQuery {
  id: string;
  name: string;
  sql: string;
  description?: string;
  /** Tenant the query was authored against. Used to scope visibility per realm. */
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

/** Persistence key inside `vscode.Memento` (workspaceState). */
const STORE_KEY = 'b2c-dx.cipAnalytics.savedQueries';

/**
 * Workspace-scoped saved-query store for the Query Builder. Mirrors the shape of
 * {@link CipConnectionService}: in-memory cache + persisted Memento + onDidChange event.
 *
 * Queries carry the tenant they were authored against so the UI can foreground
 * the active tenant's queries and dim cross-tenant ones — handy when the same
 * workspace switches between e.g. `zzat_prd` and `bjmp_prd`.
 */
export class CipQueryLibraryService implements vscode.Disposable {
  private queries: CipSavedQuery[];
  private readonly _onDidChange = new vscode.EventEmitter<CipSavedQuery[]>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly workspaceState: vscode.Memento) {
    const stored = this.workspaceState.get<CipSavedQuery[]>(STORE_KEY);
    this.queries = Array.isArray(stored) ? stored.filter(this.isValid) : [];
  }

  /** All saved queries across all tenants, newest-updated first. */
  list(): CipSavedQuery[] {
    return [...this.queries].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /** Saved queries scoped to a tenant, newest-updated first. */
  listForTenant(tenantId: string): CipSavedQuery[] {
    return this.list().filter((q) => q.tenantId === tenantId);
  }

  get(id: string): CipSavedQuery | undefined {
    return this.queries.find((q) => q.id === id);
  }

  async save(input: {name: string; sql: string; description?: string; tenantId: string}): Promise<CipSavedQuery> {
    const now = Date.now();
    const entry: CipSavedQuery = {
      id: randomUUID(),
      name: input.name.trim(),
      sql: input.sql,
      description: input.description?.trim() || undefined,
      tenantId: input.tenantId,
      createdAt: now,
      updatedAt: now,
    };
    this.queries = [entry, ...this.queries];
    await this.persist();
    return entry;
  }

  /** Update name / description / sql on an existing entry. Bumps `updatedAt`. */
  async update(
    id: string,
    patch: Partial<Pick<CipSavedQuery, 'name' | 'sql' | 'description'>>,
  ): Promise<CipSavedQuery | undefined> {
    const idx = this.queries.findIndex((q) => q.id === id);
    if (idx < 0) return undefined;
    const prev = this.queries[idx];
    const next: CipSavedQuery = {
      ...prev,
      ...(patch.name !== undefined ? {name: patch.name.trim()} : {}),
      ...(patch.sql !== undefined ? {sql: patch.sql} : {}),
      ...(patch.description !== undefined ? {description: patch.description.trim() || undefined} : {}),
      updatedAt: Date.now(),
    };
    this.queries = [...this.queries.slice(0, idx), next, ...this.queries.slice(idx + 1)];
    await this.persist();
    return next;
  }

  async delete(id: string): Promise<void> {
    const before = this.queries.length;
    this.queries = this.queries.filter((q) => q.id !== id);
    if (this.queries.length !== before) {
      await this.persist();
    }
  }

  dispose(): void {
    this._onDidChange.dispose();
  }

  private async persist(): Promise<void> {
    await this.workspaceState.update(STORE_KEY, this.queries);
    this._onDidChange.fire(this.list());
  }

  /** Defensive validator — discards malformed entries from older versions of the schema. */
  private isValid = (q: unknown): q is CipSavedQuery => {
    if (!q || typeof q !== 'object') return false;
    const v = q as Record<string, unknown>;
    return (
      typeof v.id === 'string' &&
      typeof v.name === 'string' &&
      typeof v.sql === 'string' &&
      typeof v.tenantId === 'string' &&
      typeof v.createdAt === 'number' &&
      typeof v.updatedAt === 'number'
    );
  };
}
