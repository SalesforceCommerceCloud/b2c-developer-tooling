/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {OdsComponents} from '@salesforce/b2c-tooling-sdk';

export type SandboxModel = OdsComponents['schemas']['SandboxModel'];

/**
 * Available log prefixes for tailing.
 */
export const LOG_PREFIXES = [
  // Error logs
  {key: 'error', label: 'Error', description: 'System error logs'},
  {key: 'customerror', label: 'Custom Error', description: 'Custom error logs'},
  {key: 'fatal', label: 'Fatal', description: 'Fatal error logs'},
  {key: 'customfatal', label: 'Custom Fatal', description: 'Custom fatal logs'},
  // Warning logs
  {key: 'warn', label: 'Warn', description: 'Warning logs'},
  {key: 'customwarn', label: 'Custom Warn', description: 'Custom warning logs'},
  // Info logs
  {key: 'info', label: 'Info', description: 'Info logs'},
  {key: 'custominfo', label: 'Custom Info', description: 'Custom info logs'},
  {key: 'debug', label: 'Debug', description: 'Debug logs'},
  {key: 'customdebug', label: 'Custom Debug', description: 'Custom debug logs'},
  // System logs
  {key: 'api', label: 'API', description: 'API call logs'},
  {key: 'deprecation', label: 'Deprecation', description: 'Deprecation warnings'},
  {key: 'jobs', label: 'Jobs', description: 'Job execution logs'},
  {key: 'staging', label: 'Staging', description: 'Staging logs'},
  {key: 'quota', label: 'Quota', description: 'Quota usage logs'},
  {key: 'sql', label: 'SQL', description: 'SQL query logs'},
  {key: 'service', label: 'Service', description: 'Service call logs'},
  {key: 'syslog', label: 'Syslog', description: 'System logs'},
  {key: 'security', label: 'Security', description: 'Security audit logs'},
] as const;

export type LogPrefixKey = (typeof LOG_PREFIXES)[number]['key'];

/**
 * Available log levels for filtering.
 */
export const LOG_LEVELS = ['ERROR', 'FATAL', 'WARN', 'INFO', 'DEBUG', 'TRACE'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Configuration for log tailing.
 */
export interface LogTailConfig {
  /** Log prefixes to tail (e.g., ['error', 'customerror']) */
  prefixes: string[];
  /** Log levels to filter by (e.g., ['ERROR', 'WARN']) */
  levels?: string[];
  /** Search text to filter entries */
  search?: string;
  /** Polling interval in milliseconds */
  pollInterval?: number;
}

/**
 * Default log tail configuration.
 */
export const DEFAULT_LOG_CONFIG: LogTailConfig = {
  prefixes: ['error', 'customerror'],
  levels: undefined, // All levels
  search: undefined,
  pollInterval: 1000,
};

/**
 * WebDAV root directory definitions.
 */
export const WEBDAV_ROOTS = [
  {description: 'Import/Export files', key: 'Impex', name: 'Impex'},
  {description: 'Cartridge code', key: 'Cartridges', name: 'Cartridges'},
  {description: 'Application logs', key: 'Logs', name: 'Logs'},
  {description: 'Security audit logs', key: 'Securitylogs', name: 'Security Logs'},
  {description: 'Temporary files', key: 'Temp', name: 'Temp'},
  {description: 'Realm configuration', key: 'Realmdata', name: 'Realm Data'},
  {description: 'Product catalogs', key: 'Catalogs', name: 'Catalogs'},
  {description: 'Content libraries', key: 'Libraries', name: 'Libraries'},
  {description: 'Static resources', key: 'Static', name: 'Static'},
] as const;

export type WebDavRootKey = (typeof WEBDAV_ROOTS)[number]['key'];

/**
 * View state types for navigation.
 */
export type ViewType = 'file-browser' | 'file-viewer' | 'log-tail' | 'sandbox-detail' | 'sandbox-list';

export interface SandboxListView {
  type: 'sandbox-list';
}

export interface SandboxDetailView {
  sandbox: SandboxModel;
  type: 'sandbox-detail';
}

export interface FileBrowserView {
  path: string;
  sandbox: SandboxModel;
  type: 'file-browser';
}

export interface FileViewerView {
  path: string;
  sandbox: SandboxModel;
  type: 'file-viewer';
}

export interface LogTailView {
  config: LogTailConfig;
  sandbox: SandboxModel;
  type: 'log-tail';
}

export type ViewState = FileBrowserView | FileViewerView | LogTailView | SandboxDetailView | SandboxListView;

/**
 * Command palette command definitions.
 */
export interface SandboxCommand {
  /** Unique command identifier */
  id: string;
  /** Display label in command palette */
  label: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Command description */
  description: string;
  /** Color for the command label */
  color?: string;
  /** Whether this command requires confirmation */
  requiresConfirmation: boolean;
  /** Confirmation message to display */
  confirmationMessage?: string;
  /** Function to determine if command is available for given sandbox state */
  isAvailable: (sandboxState: string | undefined) => boolean;
}

/**
 * Sort options for sandbox list.
 */
export type SortField = 'realm-instance' | 'size' | 'state';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  id: SortField;
  label: string;
  description: string;
}

export const SORT_OPTIONS: SortOption[] = [
  {description: 'Sort by realm and instance number', id: 'realm-instance', label: 'Realm/Instance'},
  {description: 'Sort by resource profile size', id: 'size', label: 'Size'},
  {description: 'Sort by sandbox state', id: 'state', label: 'State'},
];

export interface SortState {
  direction: SortDirection;
  field: SortField;
}

export const DEFAULT_SORT: SortState = {
  direction: 'asc',
  field: 'realm-instance',
};

export const SANDBOX_COMMANDS: SandboxCommand[] = [
  {
    color: 'green',
    confirmationMessage: 'Start this sandbox?',
    description: 'Start the sandbox instance',
    id: 'start',
    isAvailable: (state) => state === 'stopped',
    label: 'Start',
    requiresConfirmation: true,
    shortcut: 's',
  },
  {
    color: 'yellow',
    confirmationMessage: 'Stop this sandbox?',
    description: 'Stop the sandbox instance',
    id: 'stop',
    isAvailable: (state) => state === 'started',
    label: 'Stop',
    requiresConfirmation: true,
    shortcut: 'S',
  },
  {
    color: 'cyan',
    confirmationMessage: 'Restart this sandbox?',
    description: 'Restart the sandbox instance',
    id: 'restart',
    isAvailable: (state) => state === 'started',
    label: 'Restart',
    requiresConfirmation: true,
    shortcut: 'r',
  },
  {
    color: 'red',
    confirmationMessage: 'DELETE this sandbox? This cannot be undone!',
    description: 'Permanently delete the sandbox',
    id: 'delete',
    isAvailable: () => true,
    label: 'Delete',
    requiresConfirmation: true,
    shortcut: 'd',
  },
  {
    color: 'blue',
    description: 'Open Business Manager in browser',
    id: 'open-bm',
    isAvailable: (state) => state === 'started',
    label: 'Open BM',
    requiresConfirmation: false,
    shortcut: 'b',
  },
  {
    description: 'Copy hostname to clipboard',
    id: 'copy-host',
    isAvailable: () => true,
    label: 'Copy Host',
    requiresConfirmation: false,
    shortcut: 'c',
  },
];
