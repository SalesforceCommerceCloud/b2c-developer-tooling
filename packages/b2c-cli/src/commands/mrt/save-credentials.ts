/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import path from 'node:path';
import {Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {t, withDocs} from '../../i18n/index.js';
import {confirm} from '../../prompts.js';

interface MobifyConfigFile {
  username?: string;
  api_key?: string;
}

/**
 * Save MRT credentials to the ~/.mobify file.
 */
export default class MrtSaveCredentials extends BaseCommand<typeof MrtSaveCredentials> {
  static description = withDocs(
    t('commands.mrt.save-credentials.description', 'Save MRT credentials to the ~/.mobify file'),
    '/cli/mrt.html#b2c-mrt-save-credentials',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> --user user@example.com --api-key abc123',
    '<%= config.bin %> <%= command.id %> --user user@example.com --api-key abc123 --yes',
    '<%= config.bin %> <%= command.id %> --user user@example.com --api-key abc123 --credentials-file ./my-creds',
    '<%= config.bin %> <%= command.id %> --user user@example.com --api-key abc123 --cloud-origin https://custom.example.com',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    user: Flags.string({
      description: 'MRT username (email)',
      required: true,
    }),
    'api-key': Flags.string({
      description: 'MRT API key',
      required: true,
    }),
    'cloud-origin': Flags.string({
      description: `MRT cloud origin URL (determines credentials file path; default: ${DEFAULT_MRT_ORIGIN})`,
      env: 'MRT_CLOUD_ORIGIN',
      default: async () => process.env.SFCC_MRT_CLOUD_ORIGIN || undefined,
    }),
    'credentials-file': Flags.string({
      description: 'Path to MRT credentials file (overrides default ~/.mobify)',
      env: 'MRT_CREDENTIALS_FILE',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Overwrite existing credentials without confirmation',
      default: false,
    }),
  };

  /** Wraps shared confirm for testability. */
  protected async confirm(message: string): Promise<boolean> {
    return confirm(message);
  }

  async run(): Promise<MobifyConfigFile> {
    const {user, 'api-key': apiKey, 'cloud-origin': cloudOrigin, 'credentials-file': credentialsFile, yes} = this.flags;

    const mobifyPath = credentialsFile ?? this.getMobifyPath(cloudOrigin);

    const credentials: MobifyConfigFile = {
      username: user,
      api_key: apiKey,
    };

    // Check if file already exists
    if (!yes) {
      let fileExists = false;
      try {
        await fsp.access(mobifyPath);
        fileExists = true;
      } catch {
        // File does not exist, proceed
      }

      if (fileExists) {
        const confirmed = await this.confirm(
          t('commands.mrt.save-credentials.confirm', 'Credentials file already exists at {{path}}. Overwrite?', {
            path: mobifyPath,
          }),
        );
        if (!confirmed) {
          this.error('Save cancelled.');
        }
      }
    }

    await fsp.writeFile(mobifyPath, JSON.stringify(credentials, null, 2) + '\n', {encoding: 'utf8', mode: 0o600});

    this.log(t('commands.mrt.save-credentials.success', 'Credentials saved to {{path}}', {path: mobifyPath}));

    return credentials;
  }

  private getMobifyPath(cloudOrigin?: string): string {
    if (cloudOrigin) {
      try {
        const url = new URL(cloudOrigin);
        return path.join(os.homedir(), `.mobify--${url.hostname}`);
      } catch {
        return path.join(os.homedir(), `.mobify--${cloudOrigin}`);
      }
    }
    return path.join(os.homedir(), '.mobify');
  }
}
