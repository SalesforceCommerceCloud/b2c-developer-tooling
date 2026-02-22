/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as fs from 'fs';
import * as vscode from 'vscode';
import {getPluginConfigSources} from '../plugins.js';

/**
 * Manages B2CInstance lifecycle for the WebDAV tree view.
 * Resolves config from dw.json / env vars, caches the instance,
 * and exposes error state for the welcome view.
 */
export class WebDavConfigProvider {
  private instance: B2CInstance | null = null;
  private configError: string | null = null;
  private resolved = false;

  getInstance(): B2CInstance | null {
    if (!this.resolved) {
      this.resolve();
    }
    return this.instance;
  }

  getConfigError(): string | null {
    if (!this.resolved) {
      this.resolve();
    }
    return this.configError;
  }

  reset(): void {
    this.instance = null;
    this.configError = null;
    this.resolved = false;
  }

  private resolve(): void {
    this.resolved = true;
    try {
      let workingDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
      if (!workingDirectory || workingDirectory === '/' || !fs.existsSync(workingDirectory)) {
        workingDirectory = '';
      }
      const {sourcesBefore, sourcesAfter} = getPluginConfigSources();
      const config = resolveConfig({}, {sourcesBefore, sourcesAfter, workingDirectory});

      if (!config.hasB2CInstanceConfig()) {
        this.configError = 'No B2C Commerce instance configured.';
        this.instance = null;
        return;
      }

      this.instance = config.createB2CInstance();
      this.configError = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.configError = message;
      this.instance = null;
    }
  }
}
