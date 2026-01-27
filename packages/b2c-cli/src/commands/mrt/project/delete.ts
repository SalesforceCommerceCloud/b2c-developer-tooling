/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteProject} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Simple confirmation prompt.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Delete result for JSON output.
 */
interface DeleteResult {
  slug: string;
  deleted: boolean;
}

/**
 * Delete an MRT project.
 */
export default class MrtProjectDelete extends MrtCommand<typeof MrtProjectDelete> {
  static args = {
    slug: Args.string({
      description: 'Project slug',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.project.delete.description', 'Delete a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-old-project',
    '<%= config.bin %> <%= command.id %> my-old-project --force',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<DeleteResult> {
    this.requireMrtCredentials();

    const {slug} = this.args;
    const {force} = this.flags;

    // Confirm deletion unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.project.delete.confirm', 'Are you sure you want to delete project "{{slug}}"? (y/n)', {slug}),
      );

      if (!confirmed) {
        this.log(t('commands.mrt.project.delete.cancelled', 'Deletion cancelled.'));
        return {slug, deleted: false};
      }
    }

    this.log(t('commands.mrt.project.delete.deleting', 'Deleting project "{{slug}}"...', {slug}));

    try {
      await deleteProject(
        {
          projectSlug: slug,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.project.delete.success', 'Project "{{slug}}" deleted successfully.', {slug}));
      }

      return {slug, deleted: true};
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.project.delete.failed', 'Failed to delete project: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
