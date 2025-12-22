/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * CLI utilities and base command classes for building B2C Commerce CLI commands.
 *
 * This module provides reusable base classes, configuration loading, and table
 * rendering utilities for oclif-based CLI applications.
 *
 * ## Base Command Classes
 *
 * Extend these classes to create CLI commands with pre-configured functionality:
 *
 * - {@link BaseCommand} - Foundation class with logging, JSON output, and error handling
 * - {@link OAuthCommand} - Adds OAuth authentication setup
 * - {@link InstanceCommand} - Adds B2C Commerce instance configuration
 * - {@link CartridgeCommand} - Adds cartridge path configuration for code operations
 * - {@link JobCommand} - Adds job execution configuration
 * - {@link WebDavCommand} - Adds WebDAV root directory configuration for file operations
 * - {@link MrtCommand} - Adds Managed Runtime API authentication
 * - {@link OdsCommand} - Adds On-Demand Sandbox configuration
 *
 * ## Command Hierarchy
 *
 * Commands inherit in a chain, each adding specific functionality:
 *
 * ```
 * BaseCommand
 *   └─ OAuthCommand (adds OAuth)
 *        └─ InstanceCommand (adds instance config)
 *             ├─ CartridgeCommand (adds cartridge paths)
 *             ├─ JobCommand (adds job config)
 *             └─ WebDavCommand (adds WebDAV root config)
 *        └─ MrtCommand (adds MRT API auth)
 *        └─ OdsCommand (adds ODS config)
 * ```
 *
 * ## Example Usage
 *
 * ```typescript
 * import { InstanceCommand, createTable, type ColumnDef } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * export default class ListSites extends InstanceCommand {
 *   static description = 'List all sites on the instance';
 *
 *   async run() {
 *     const client = await this.createOcapiClient();
 *     const sites = await client.getSites();
 *
 *     const columns: Record<string, ColumnDef<Site>> = {
 *       id: { header: 'ID', get: (s) => s.id },
 *       name: { header: 'Name', get: (s) => s.display_name },
 *     };
 *
 *     createTable(columns).render(sites, ['id', 'name']);
 *   }
 * }
 * ```
 *
 * ## Configuration Loading
 *
 * Use {@link loadConfig} to resolve configuration from multiple sources:
 *
 * ```typescript
 * import { loadConfig } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * const config = await loadConfig({
 *   flags: { hostname: 'example.com' },
 *   configPath: './dw.json',
 * });
 * ```
 *
 * ## Table Rendering
 *
 * Use {@link createTable} for consistent tabular output:
 *
 * ```typescript
 * import { createTable, type ColumnDef } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * const columns: Record<string, ColumnDef<Item>> = {
 *   id: { header: 'ID', get: (item) => item.id },
 *   status: { header: 'Status', get: (item) => item.status },
 * };
 *
 * createTable(columns).render(items, ['id', 'status']);
 * ```
 *
 * @module cli
 */

// Base command classes
export {BaseCommand} from './base-command.js';
export type {Flags, Args} from './base-command.js';
export {OAuthCommand} from './oauth-command.js';
export {InstanceCommand} from './instance-command.js';
export {CartridgeCommand} from './cartridge-command.js';
export {JobCommand} from './job-command.js';
export {MrtCommand} from './mrt-command.js';
export {OdsCommand} from './ods-command.js';
export {WebDavCommand, WEBDAV_ROOTS, VALID_ROOTS} from './webdav-command.js';
export type {WebDavRootKey} from './webdav-command.js';

// Config utilities
export {loadConfig, findDwJson} from './config.js';
export type {ResolvedConfig, LoadConfigOptions} from './config.js';

// Table rendering utilities
export {TableRenderer, createTable} from './table.js';
export type {ColumnDef, TableRenderOptions} from './table.js';
