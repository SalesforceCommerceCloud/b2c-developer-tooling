/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import {z, type ZodRawShape} from 'zod';
import type {InstanceAuthPath, InstanceAuthSummary} from '@salesforce/b2c-tooling-sdk/auth';

/** Input shared by MCP tools that resolve files or configuration from a project. */
export interface ProjectContextInput {
  /** Per-call project directory override. */
  projectDirectory?: string;
  /** Per-call explicit primary dw.json-format configuration path. */
  configPath?: string;
  /** Per-call named instance selection. */
  instanceName?: string;
}

/** Effective project directory and the source that selected it. */
export interface ProjectDirectoryInfo {
  path: string;
  source: 'argument' | 'config' | 'cwd';
}

/** How the selected dw.json file entered the configuration resolver. */
export type ConfigurationResolutionSource =
  | 'argument'
  | 'globalDefault'
  | 'none'
  | 'projectDirectory'
  | 'projectEnvironment'
  | 'server';

/** Compact selected-configuration provenance returned by project-aware tools. */
export interface ConfigurationResolutionInfo {
  hostname?: string;
  instanceName?: string;
  path?: string;
  source: ConfigurationResolutionSource;
}

/** Provenance for a specialized project-relative directory. */
export interface DirectoryResolutionInfo {
  path: string;
  source: 'argument' | 'projectDirectory';
}

/**
 * How one kind of request to the instance authenticates. `browser-login` is an
 * Account Manager sign-in in the user's browser; its session belongs to the
 * client, not the instance, so it can also serve other instances.
 */
export interface AuthPathResolutionInfo {
  method: 'basic' | 'browser-login' | 'client-credentials' | 'jwt' | 'none';
  /** `built-in` for the toolkit's public client, otherwise the client ID. */
  client?: string;
  /** Browser-login session state; `none` means the next call opens a sign-in. */
  session?: 'expired' | 'none' | 'renewable' | 'signed-in';
  /** Account Manager user of the session, when signed in. */
  user?: string;
}

/** How a tool call authenticated against the instance, per request type. */
export interface AuthResolutionInfo {
  ocapi: AuthPathResolutionInfo;
  scapi: AuthPathResolutionInfo;
  webdav: AuthPathResolutionInfo;
}

/** Compact, common provenance block returned by project/config-aware tools. */
export interface ToolResolution {
  auth?: AuthResolutionInfo;
  configuration?: ConfigurationResolutionInfo;
  directories?: Record<string, DirectoryResolutionInfo>;
  projectDirectory: ProjectDirectoryInfo;
}

/** Reduce an instance auth summary to the compact form attached to tool results. */
export function toAuthResolution(summary: InstanceAuthSummary): AuthResolutionInfo {
  const describe = (path: InstanceAuthPath): AuthPathResolutionInfo => {
    const info: AuthPathResolutionInfo = {method: path.method === 'user' ? 'browser-login' : path.method};
    if (path.clientId) info.client = path.builtInClient ? 'built-in' : path.clientId;
    if (path.method === 'user') {
      const session = summary.sessions.find((s) => s.clientId === path.clientId);
      if (session) {
        info.session = session.accessTokenValid ? 'signed-in' : session.canRefresh ? 'renewable' : 'expired';
        if (session.user) info.user = session.user;
      } else {
        info.session = 'none';
      }
    }
    return info;
  };
  return {ocapi: describe(summary.ocapi), scapi: describe(summary.scapi), webdav: describe(summary.webdav)};
}

/** Whether a tool needs only a project root or full configuration selection. */
export type ProjectContextKind = 'configuration' | 'project';

/** Build the canonical project-directory field. */
export function createProjectDirectoryInput() {
  return z
    .string()
    .refine((value) => path.isAbsolute(value), 'projectDirectory must be an absolute path')
    .optional()
    .describe('Absolute project root; overrides the server default.');
}

/** Build the canonical explicit primary dw.json field. */
export function createConfigPathInput() {
  return z.string().optional().describe('Path to dw.json-format config; relative to projectDirectory.');
}

/** Build the canonical named-instance selection field. */
export function createInstanceNameInput() {
  return z.string().min(1).optional().describe('Named instance from dw.json.');
}

/** Build flat canonical schema fields for a local-project or configuration-aware tool. */
export function createProjectContextInputSchema(kind: ProjectContextKind): ZodRawShape {
  const project = {projectDirectory: createProjectDirectoryInput()};
  if (kind === 'project') return project;

  return {
    ...project,
    configPath: createConfigPathInput(),
    instanceName: createInstanceNameInput(),
  };
}

/** Static field for schemas declared outside the shared adapter. */
export const projectDirectoryInput = createProjectDirectoryInput();

/** Static configuration schema for legacy/manual tool definitions. */
export const projectContextInputSchema = createProjectContextInputSchema('configuration');
