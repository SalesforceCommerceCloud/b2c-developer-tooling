/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createCipClient, DEFAULT_CIP_HOST, DEFAULT_CIP_STAGING_HOST} from '@salesforce/b2c-tooling-sdk/clients';
import {listCipTables} from '@salesforce/b2c-tooling-sdk/operations/cip';
import {randomUUID} from 'node:crypto';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

export type CipEnv = 'prod' | 'staging' | 'custom';
export type CipStatus = 'disconnected' | 'testing' | 'connected';

/** A named realm group (e.g. "bjmp"). Contains one or more connections. */
export interface CipRealmGroup {
  id: string;
  label: string;
}

/** Persisted configuration for a single connection within a realm group. */
export interface CipRealm {
  id: string;
  groupId: string;
  label: string;
  tenantId: string;
  env: CipEnv;
  host: string;
}

/** Runtime connection state (realm config + live status). */
export interface CipConnection extends CipRealm {
  status: CipStatus;
  message?: string;
}

const GROUPS_KEY = 'b2c-dx.cipAnalytics.groups';
const REALMS_KEY = 'b2c-dx.cipAnalytics.realms';
const ACTIVE_REALM_KEY = 'b2c-dx.cipAnalytics.activeRealm';
/** Legacy key — migrated on first load. */
const LEGACY_KEY = 'b2c-dx.cipAnalytics.connection';

/**
 * Single source of truth for CIP realm connections.
 *
 * Supports multiple saved realms (tenant + env + host) with a single active
 * realm at any time. Every webview panel shares the same active connection.
 */
export class CipConnectionService implements vscode.Disposable {
  private connection: CipConnection;
  private groups: CipRealmGroup[];
  private realms: CipRealm[];
  /** Session-only per-connection status. Not persisted. */
  private readonly realmStatusMap = new Map<string, CipStatus>();
  private readonly _onDidChange = new vscode.EventEmitter<CipConnection>();
  readonly onDidChange = this._onDidChange.event;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly workspaceState: vscode.Memento,
    private readonly log: vscode.OutputChannel,
  ) {
    const {groups, realms, active} = this.loadInitial();
    this.groups = groups;
    this.realms = realms;
    this.connection = {...active, status: 'disconnected'};

    // Re-sync tenantId/host from dw.json whenever the config file changes.
    this.configProvider.onDidReset(() => {
      const {groups: refreshedGroups, realms: refreshed, active: refreshedActive} = this.loadInitial();
      this.groups = refreshedGroups;
      this.realms = refreshed;
      this.connection = {...refreshedActive, status: 'disconnected'};
      this.realmStatusMap.clear();
      this._onDidChange.fire(this.get());
    });
  }

  /** Current active connection (realm config + live status). */
  get(): CipConnection {
    return {...this.connection};
  }

  /** All realm groups. */
  getRealmGroups(): CipRealmGroup[] {
    return [...this.groups];
  }

  /** All connections belonging to a group. */
  getConnectionsForGroup(groupId: string): CipRealm[] {
    return this.realms.filter((r) => r.groupId === groupId);
  }

  /** All saved realms (connections). */
  getRealms(): CipRealm[] {
    return [...this.realms];
  }

  /** Session status for a specific realm (defaults to disconnected). */
  getRealmStatus(realmId: string): CipStatus {
    return this.realmStatusMap.get(realmId) ?? 'disconnected';
  }

  /** Resolved host for the active connection. */
  resolvedHost(): string {
    return resolveHost(this.connection);
  }

  /**
   * Clear all persisted realms/groups and reload purely from dw.json.
   * Called when the user clicks the Refresh button — only dw.json-derived
   * realms survive; manually added realms and the legacy single-connection
   * fallback are discarded.
   */
  async resetToDefaults(): Promise<void> {
    // Derive fresh data from dw.json only, ignoring any legacy stored state.
    const {groups, realms, active} = this.deriveFromConfig({ignoreLegacy: true});

    // Overwrite stored state with the fresh dw.json-derived data.
    this.groups = groups;
    this.realms = realms;
    this.connection = {...active, status: 'disconnected'};
    this.realmStatusMap.clear();

    await this.workspaceState.update(GROUPS_KEY, this.groups);
    await this.workspaceState.update(REALMS_KEY, this.realms);
    await this.workspaceState.update(ACTIVE_REALM_KEY, undefined);
    // Drop the legacy single-connection key so it can't resurrect stale state
    // on the next reload — dw.json is now the sole source of truth.
    await this.workspaceState.update(LEGACY_KEY, undefined);
    this._onDidChange.fire(this.get());
  }

  /**
   * Derive realm group + connection from dw.json config.
   *
   * On normal load we honor the legacy single-connection key as a fallback so
   * users who upgraded from the older single-realm extension don't lose their
   * settings. On a hard refresh (`ignoreLegacy: true`) we skip the legacy key
   * entirely, making dw.json the sole source of truth.
   */
  private deriveFromConfig(opts: {ignoreLegacy?: boolean} = {}): {
    groups: CipRealmGroup[];
    realms: CipRealm[];
    active: CipConnection;
  } {
    const legacy = opts.ignoreLegacy ? undefined : this.workspaceState.get<Partial<CipRealm>>(LEGACY_KEY);
    const config = this.configProvider.getConfig();
    const cfgTenant = (config?.values.tenantId ?? '').toString();
    const cfgHost = config?.values.cipHost?.toString();

    let env: CipEnv = 'prod';
    let host = DEFAULT_CIP_HOST;

    // dw.json wins over legacy when both are present — the user-edited file
    // is always more authoritative than the older single-connection cache.
    if (cfgHost && cfgHost !== DEFAULT_CIP_HOST && cfgHost !== DEFAULT_CIP_STAGING_HOST) {
      env = 'custom';
      host = cfgHost;
    } else if (cfgHost === DEFAULT_CIP_STAGING_HOST) {
      env = 'staging';
      host = DEFAULT_CIP_STAGING_HOST;
    } else if (legacy?.env) {
      env = legacy.env;
      host = legacy.host ?? (env === 'staging' ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);
    }

    const tenantId = cfgTenant || legacy?.tenantId || '';
    if (!tenantId) {
      return {groups: [], realms: [], active: makeBlankConnection()};
    }

    const groupLabel = labelFromTenantId(tenantId);
    const group: CipRealmGroup = {id: generateId(), label: groupLabel};
    const realm: CipRealm = {
      id: generateId(),
      groupId: group.id,
      label: groupLabel,
      tenantId,
      env,
      host,
    };
    return {groups: [group], realms: [realm], active: {...realm, status: 'disconnected'}};
  }

  /**
   * Add a new realm group (just a label). Returns the group id.
   */
  async addRealmGroup(label: string): Promise<string> {
    const existing = this.groups.find((g) => g.label.toLowerCase() === label.toLowerCase());
    if (existing) return existing.id;
    const group: CipRealmGroup = {id: generateId(), label};
    this.groups.push(group);
    await this.workspaceState.update(GROUPS_KEY, this.groups);
    this._onDidChange.fire(this.get());
    return group.id;
  }

  /**
   * Add a new connection within a group. If a connection with the same tenantId+env already exists,
   * updates it in place. Returns the connection id.
   */
  async addRealm(config: Omit<CipRealm, 'id'>): Promise<string> {
    const existing = this.realms.find((r) => r.tenantId === config.tenantId && r.env === config.env);
    if (existing) {
      Object.assign(existing, config);
      await this.persistRealms();
      return existing.id;
    }
    const realm: CipRealm = {id: generateId(), ...config};
    this.realms.push(realm);
    await this.persistRealms();
    return realm.id;
  }

  /** Remove a realm group and all connections within it. */
  async removeRealmGroup(groupId: string): Promise<void> {
    const exists = this.groups.some((g) => g.id === groupId);
    if (!exists) return;

    const removedRealmIds = new Set(this.realms.filter((r) => r.groupId === groupId).map((r) => r.id));

    this.groups = this.groups.filter((g) => g.id !== groupId);
    this.realms = this.realms.filter((r) => r.groupId !== groupId);
    for (const realmId of removedRealmIds) {
      this.realmStatusMap.delete(realmId);
    }

    await this.workspaceState.update(GROUPS_KEY, this.groups);
    await this.persistRealms();

    if (this.connection.groupId === groupId || removedRealmIds.has(this.connection.id)) {
      const fallback = this.realms[0];
      if (fallback) {
        this.connection = {...fallback, status: 'disconnected', message: undefined};
        await this.workspaceState.update(ACTIVE_REALM_KEY, fallback.id);
      } else {
        this.connection = makeBlankConnection();
        await this.workspaceState.update(ACTIVE_REALM_KEY, undefined);
      }
    }

    this._onDidChange.fire(this.get());
  }

  /** Remove a saved realm by id. If it was active, falls back to the first remaining realm. */
  async removeRealm(id: string): Promise<void> {
    const before = this.realms.length;
    this.realms = this.realms.filter((r) => r.id !== id);
    if (this.realms.length === before) return;
    this.realmStatusMap.delete(id);
    await this.persistRealms();
    if (this.connection.id === id) {
      const fallback = this.realms[0];
      if (fallback) {
        await this.switchRealm(fallback.id);
      } else {
        this.connection = makeBlankConnection();
        this._onDidChange.fire(this.get());
      }
    } else {
      // Always notify subscribers (tree, status bar) even when the active realm
      // didn't change — a non-active realm went away and the sidebar needs to
      // re-render to reflect it.
      this._onDidChange.fire(this.get());
    }
  }

  /**
   * Switch the active realm. Resets status to disconnected.
   */
  async switchRealm(id: string): Promise<void> {
    const realm = this.realms.find((r) => r.id === id);
    if (!realm) return;
    this.connection = {...realm, status: 'disconnected', message: undefined};
    await this.workspaceState.update(ACTIVE_REALM_KEY, id);
    this._onDidChange.fire(this.get());
  }

  /**
   * Update the active realm configuration. Resets status to `disconnected`.
   */
  async update(partial: Partial<Pick<CipRealm, 'label' | 'tenantId' | 'env' | 'host'>>): Promise<void> {
    const next: CipConnection = {
      ...this.connection,
      ...partial,
      status: 'disconnected',
      message: undefined,
    };
    // Auto-derive label from tenantId if not explicitly set.
    if (!partial.label && partial.tenantId) {
      next.label = labelFromTenantId(partial.tenantId);
    }

    if (next.env === 'prod') next.host = DEFAULT_CIP_HOST;
    else if (next.env === 'staging') next.host = DEFAULT_CIP_STAGING_HOST;

    this.connection = next;

    // Keep the realm list in sync.
    const idx = this.realms.findIndex((r) => r.id === this.connection.id);
    if (idx >= 0) {
      this.realms[idx] = realmFrom(next);
    } else {
      this.realms.push(realmFrom(next));
    }
    await this.persistRealms();
    await this.workspaceState.update(ACTIVE_REALM_KEY, this.connection.id);
    this._onDidChange.fire(this.get());
  }

  /**
   * Run a live connection test against the active realm and update status.
   */
  async testConnection(): Promise<CipConnection> {
    if (!this.connection.tenantId) {
      this.setStatus('disconnected', 'Tenant ID not set');
      return this.get();
    }
    if (this.connection.env === 'custom' && !this.connection.host) {
      this.setStatus('disconnected', 'Custom host not set');
      return this.get();
    }

    const host = resolveHost(this.connection);
    this.setStatus('testing', `Connecting to CIP host ${host}`);

    const TIMEOUT_MS = 15_000;
    // Track the timer so we can clear it once the handshake settles. Without
    // the clear, a fast-returning request still keeps the timer pending and
    // its rejection runs later as a no-op against an already-resolved race —
    // not user-visible, but pollutes the event loop.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Connection timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS);
    });

    try {
      const config = this.configProvider.getConfig();
      if (!config) throw new Error('No B2C configuration found');
      const client = createCipClient({instance: this.connection.tenantId, host}, config.createOAuth());
      const result = await Promise.race([listCipTables(client, {fetchSize: 1}), timeoutPromise]);
      this.log.appendLine(
        `[CIP Connection] OK · realm=${this.connection.label} tenant=${this.connection.tenantId} host=${host} tables=${result.tableCount}`,
      );
      this.setStatus('connected', `${result.tableCount} tables available @ ${host}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[CIP Connection] FAILED · ${message}`);
      this.setStatus('disconnected', message);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
    return this.get();
  }

  /** Marks the connection healthy without a fresh handshake. */
  markConnected(detail?: string): void {
    if (this.connection.status !== 'connected') {
      this.setStatus('connected', detail);
    }
  }

  /** Marks the connection unhealthy. */
  markDisconnected(detail?: string): void {
    this.setStatus('disconnected', detail);
  }

  dispose(): void {
    this._onDidChange.dispose();
  }

  private setStatus(status: CipStatus, message?: string): void {
    this.connection = {...this.connection, status, message};
    this.realmStatusMap.set(this.connection.id, status);
    this._onDidChange.fire(this.get());
  }

  private async persistRealms(): Promise<void> {
    await this.workspaceState.update(REALMS_KEY, this.realms);
  }

  private loadInitial(): {groups: CipRealmGroup[]; realms: CipRealm[]; active: CipConnection} {
    const storedGroups = this.workspaceState.get<CipRealmGroup[]>(GROUPS_KEY);
    const storedRealms = this.workspaceState.get<CipRealm[]>(REALMS_KEY);
    const activeId = this.workspaceState.get<string>(ACTIVE_REALM_KEY);

    if (storedRealms && storedRealms.length > 0) {
      const config = this.configProvider.getConfig();
      const cfgHost = config?.values.cipHost?.toString().trim();

      // Build group map from stored groups, or auto-create from realm labels.
      const groupMap = new Map<string, CipRealmGroup>();
      if (storedGroups) {
        for (const g of storedGroups) groupMap.set(g.id, g);
      }

      // Fix stale labels, sync custom host, and backfill missing groupId.
      let fixed = storedRealms.map((r) => {
        let updated: CipRealm = r as CipRealm;
        if (updated.label === updated.tenantId) {
          updated = {...updated, label: labelFromTenantId(updated.tenantId)};
        }
        if (updated.env === 'custom' && cfgHost && cfgHost !== updated.host) {
          updated = {...updated, host: cfgHost};
        }
        // Backfill groupId for realms saved before groups existed.
        if (!updated.groupId) {
          const groupLabel = updated.label;
          const existing = [...groupMap.values()].find((g) => g.label === groupLabel);
          if (existing) {
            updated = {...updated, groupId: existing.id};
          } else {
            const g: CipRealmGroup = {id: generateId(), label: groupLabel};
            groupMap.set(g.id, g);
            updated = {...updated, groupId: g.id};
          }
        }
        return updated;
      });

      // Deduplicate by tenantId — keep the first occurrence.
      const seen = new Set<string>();
      fixed = fixed.filter((r) => {
        if (seen.has(r.tenantId)) return false;
        seen.add(r.tenantId);
        return true;
      });

      const groups = [...groupMap.values()];
      const changed = fixed.length !== storedRealms.length || fixed.some((r, i) => r !== storedRealms[i]);
      if (changed) {
        void this.workspaceState.update(REALMS_KEY, fixed);
        void this.workspaceState.update(GROUPS_KEY, groups);
      }
      const active = (activeId && fixed.find((r) => r.id === activeId)) || fixed[0]!;
      return {groups, realms: fixed, active: {...active, status: 'disconnected'}};
    }

    // No stored realms — derive fresh from dw.json / legacy key.
    return this.deriveFromConfig();
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function resolveHost(realm: Pick<CipRealm, 'env' | 'host'>): string {
  if (realm.env === 'custom' && realm.host) return realm.host;
  return realm.env === 'staging' ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST;
}

function realmFrom(conn: CipConnection): CipRealm {
  return {
    id: conn.id,
    groupId: conn.groupId,
    label: conn.label,
    tenantId: conn.tenantId,
    env: conn.env,
    host: conn.host,
  };
}

function generateId(): string {
  return randomUUID();
}

/** Derive a short friendly label from a tenant ID by stripping common env suffixes.
 *  e.g. "bjmp_prd" → "bjmp", "acme_sbx001" → "acme", "myorg" → "myorg"
 */
function labelFromTenantId(tenantId: string): string {
  return tenantId.replace(/_(?:prd|prod|pr|sbx|sandbox|sb|stg|staging|st|dev|dv|uat|qa)\w*$/i, '') || tenantId;
}

function makeBlankConnection(): CipConnection {
  return {
    id: generateId(),
    groupId: '',
    label: '',
    tenantId: '',
    env: 'prod',
    host: DEFAULT_CIP_HOST,
    status: 'disconnected',
  };
}
