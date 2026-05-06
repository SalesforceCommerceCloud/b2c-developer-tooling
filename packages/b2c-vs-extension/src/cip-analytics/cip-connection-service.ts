/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createCipClient, DEFAULT_CIP_HOST, DEFAULT_CIP_STAGING_HOST} from '@salesforce/b2c-tooling-sdk/clients';
import {listCipTables} from '@salesforce/b2c-tooling-sdk/operations/cip';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

export type CipEnv = 'prod' | 'staging' | 'custom';
export type CipStatus = 'disconnected' | 'testing' | 'connected';

export interface CipConnection {
  tenantId: string;
  env: CipEnv;
  host: string;
  status: CipStatus;
  message?: string;
}

const STATE_KEY = 'b2c-dx.cipAnalytics.connection';

/**
 * Single source of truth for the CIP connection (tenant + host + status).
 *
 * Held process-wide so every webview panel shares the same configuration.
 * The VS Code status bar item consumes `onDidChange` to reflect health.
 */
export class CipConnectionService implements vscode.Disposable {
  private connection: CipConnection;
  private readonly _onDidChange = new vscode.EventEmitter<CipConnection>();
  readonly onDidChange = this._onDidChange.event;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly workspaceState: vscode.Memento,
    private readonly log: vscode.OutputChannel,
  ) {
    this.connection = this.loadInitial();
  }

  get(): CipConnection {
    return {...this.connection};
  }

  /**
   * Host to use for a CIP client call, respecting the current env selection.
   */
  resolvedHost(): string {
    if (this.connection.env === 'custom' && this.connection.host) {
      return this.connection.host;
    }
    return this.connection.env === 'staging' ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST;
  }

  /**
   * Persist a new connection configuration. Resets status to `disconnected`
   * because any config change invalidates the previous handshake.
   */
  async update(partial: Partial<Pick<CipConnection, 'tenantId' | 'env' | 'host'>>): Promise<void> {
    const next: CipConnection = {
      ...this.connection,
      ...partial,
      status: 'disconnected',
      message: undefined,
    };

    // Always keep host aligned with env for prod/staging; custom preserves whatever the user typed.
    if (next.env === 'prod') next.host = DEFAULT_CIP_HOST;
    else if (next.env === 'staging') next.host = DEFAULT_CIP_STAGING_HOST;

    this.connection = next;
    await this.persist();
    this._onDidChange.fire(this.get());
  }

  /**
   * Run a live connection test and update status accordingly.
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

    this.setStatus('testing', `Connecting to CIP host ${this.resolvedHost()}`);

    try {
      const config = this.configProvider.getConfig();
      if (!config) throw new Error('No B2C configuration found');
      const host = this.resolvedHost();
      const client = createCipClient({instance: this.connection.tenantId, host}, config.createOAuth());
      const result = await listCipTables(client, {fetchSize: 1});
      this.log.appendLine(
        `[CIP Connection] OK · tenant=${this.connection.tenantId} host=${host} tables=${result.tableCount}`,
      );
      this.setStatus('connected', `${result.tableCount} tables available @ ${host}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[CIP Connection] FAILED · ${message}`);
      this.setStatus('disconnected', message);
    }
    return this.get();
  }

  /** Marks the connection healthy without a fresh handshake (e.g., after a successful query). */
  markConnected(detail?: string): void {
    if (this.connection.status !== 'connected') {
      this.setStatus('connected', detail);
    }
  }

  /** Marks the connection unhealthy (e.g., after a failed query). */
  markDisconnected(detail?: string): void {
    this.setStatus('disconnected', detail);
  }

  dispose(): void {
    this._onDidChange.dispose();
  }

  private setStatus(status: CipStatus, message?: string): void {
    this.connection = {...this.connection, status, message};
    // Status changes are session-only; only persist tenant/env/host.
    this._onDidChange.fire(this.get());
  }

  private async persist(): Promise<void> {
    await this.workspaceState.update(STATE_KEY, {
      tenantId: this.connection.tenantId,
      env: this.connection.env,
      host: this.connection.host,
    });
  }

  private loadInitial(): CipConnection {
    const stored = this.workspaceState.get<Partial<CipConnection>>(STATE_KEY);
    const config = this.configProvider.getConfig();
    const cfgTenant = (config?.values.tenantId ?? '').toString();
    const cfgHost = config?.values.cipHost?.toString();

    let env: CipEnv = 'prod';
    let host = DEFAULT_CIP_HOST;

    if (stored?.env) {
      env = stored.env;
      host = stored.host ?? (env === 'staging' ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);
    } else if (cfgHost && cfgHost !== DEFAULT_CIP_HOST && cfgHost !== DEFAULT_CIP_STAGING_HOST) {
      env = 'custom';
      host = cfgHost;
    } else if (cfgHost === DEFAULT_CIP_STAGING_HOST) {
      env = 'staging';
      host = DEFAULT_CIP_STAGING_HOST;
    }

    return {
      tenantId: stored?.tenantId ?? cfgTenant,
      env,
      host,
      status: 'disconnected',
    };
  }
}
