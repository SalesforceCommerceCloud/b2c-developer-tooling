/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Public API exported by the Core extension's activate() function.
 *
 * Dependent extensions (Admin, Analytics, Storefront Next) access this via:
 *   const coreExt = vscode.extensions.getExtension<B2CDXApi>('salesforce.b2c-dx-core');
 *   const api = coreExt.isActive ? coreExt.exports : await coreExt.activate();
 *
 * This is a typed contract — dependent extensions import it as a type-only import
 * (stripped at bundle time by esbuild). At runtime, they access it through VS Code's
 * extension API, not via direct module imports.
 *
 * Design constraints (see PLAN_vscode_multi_extension.md § Risk 1):
 * - All client creation goes through Core to share SDK singleton state
 * - All auth goes through Core to share the implicit OAuth token cache
 * - Dependent extensions never call configureLogger(), initializePlugins(), or create B2CInstance directly
 */
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {ResolvedB2CConfig, CreateOAuthOptions} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import type {Logger} from '@salesforce/b2c-tooling-sdk/logging';
import type * as vscode from 'vscode';

export type {AuthStrategy};

export interface B2CDXApi {
  // --- Config & state ---

  /** Current resolved B2C config, or undefined if not configured. */
  getConfig(): ResolvedB2CConfig | undefined;

  /** Current B2CInstance with pre-configured auth and clients, or undefined. */
  getInstance(): B2CInstance | undefined;

  /** Working directory used for config resolution (pinned or auto-detected). */
  getWorkingDirectory(): string;

  /** Fires when config changes (dw.json edit, instance switch, project root change). */
  onDidConfigChange: vscode.Event<void>;

  // --- Shared services ---

  /** SDK logger configured to write to the "B2C DX" output channel. */
  getLogger(): Logger;

  /**
   * Two-tier error handler: short notification + "View Details" button → output channel.
   * Dependent extensions should use this instead of raw vscode.window.showErrorMessage.
   */
  showError(error: unknown, options?: {suggestion?: string}): Promise<void>;

  // --- Shared auth (single token cache, single browser flow) ---

  /**
   * Create an OAuth auth strategy using Core's shared token cache.
   * Prevents multiple browser login prompts across extensions.
   */
  createOAuth(options?: CreateOAuthOptions): AuthStrategy;

  /** Create a WebDAV auth strategy using Core's shared instance config. */
  createWebDavAuth(): AuthStrategy;
}
