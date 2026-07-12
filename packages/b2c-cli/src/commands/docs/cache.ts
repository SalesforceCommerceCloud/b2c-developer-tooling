/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getContentCacheStats, purgeContentCache, type ContentCacheStats} from '@salesforce/b2c-tooling-sdk/docs';
import {t} from '../../i18n/index.js';

interface CacheResult {
  /** The action taken: reported stats only, or cleared the cache. */
  action: 'clear' | 'status';
  /** Cache directory. */
  dir: string;
  /** Number of cached files (before clearing, when `--clear`). */
  files: number;
  /** Total bytes (before clearing, when `--clear`). */
  bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default class DocsCache extends BaseCommand<typeof DocsCache> {
  static description = t(
    'commands.docs.cache.description',
    'Show or clear the local documentation content cache (online docs cached after first read)',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --clear',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    clear: Flags.boolean({
      description: 'Delete all cached documentation content (memory + on-disk)',
      default: false,
    }),
  };

  async run(): Promise<CacheResult> {
    const {clear} = this.flags;

    if (clear) {
      const purged: ContentCacheStats = purgeContentCache();
      if (!this.jsonEnabled()) {
        this.log(
          t(
            'commands.docs.cache.cleared',
            'Cleared documentation cache: removed {{files}} file(s) ({{size}}) from {{dir}}',
            {files: purged.files, size: formatBytes(purged.bytes), dir: purged.dir},
          ),
        );
      }
      return {action: 'clear', dir: purged.dir, files: purged.files, bytes: purged.bytes};
    }

    const stats = getContentCacheStats();
    if (!this.jsonEnabled()) {
      this.log(
        t('commands.docs.cache.status', 'Documentation cache: {{files}} file(s), {{size}} at {{dir}}', {
          files: stats.files,
          size: formatBytes(stats.bytes),
          dir: stats.dir,
        }),
      );
      if (stats.files > 0) {
        this.log(t('commands.docs.cache.clearHint', 'Run with --clear to empty it.'));
      }
    }
    return {action: 'status', dir: stats.dir, files: stats.files, bytes: stats.bytes};
  }
}
