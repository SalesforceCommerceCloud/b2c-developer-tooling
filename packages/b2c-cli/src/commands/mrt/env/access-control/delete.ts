/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteAccessControlHeaderWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Delete an access control header from an MRT environment.
 */
export default class MrtAccessControlDelete extends MrtCommand<typeof MrtAccessControlDelete> {
  static args = {
    id: Args.string({
      description: 'Access control header ID (UUID)',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.mrt.access-control.delete.description',
      'Delete an access control header from a Managed Runtime environment',
    ),
    '/cli/mrt.html#b2c-mrt-env-access-control-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ff832a9e-0e55-11ef-8f23-0242ac110002 --project my-storefront --environment production',
    '<%= config.bin %> <%= command.id %> ff832a9e-0e55-11ef-8f23-0242ac110002 -p my-storefront -e production --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    deleteAccessControlHeaderWithBackend,
  };

  async run(): Promise<{id: string; project: string; environment: string}> {
    // Prevent deletion in safe mode
    this.assertDestructiveOperationAllowed('delete access control header');

    const {id} = this.args;
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    // The resolved backend is surfaced via `onResolve` (debug log) only — it is
    // deliberately kept out of the `--json` payload so the legacy `--json`
    // output stays byte-identical and matches the rest of the MRT commands.
    await this.operations.deleteAccessControlHeaderWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      headerId: id,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Deleting access control header via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(
        t(
          'commands.mrt.access-control.delete.success',
          'Deleted access control header {{id}} from {{project}}/{{environment}}',
          {
            id,
            project,
            environment,
          },
        ),
      );
    }

    return {id, project, environment};
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
