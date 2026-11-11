/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getStorefrontManageAccess} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';
import {
  formatManageAccess,
  toManageAccessState,
  type ManageAccessGetResult,
} from '../../../../utils/mrt/manage-access.js';

/**
 * Show which surface manages an MRT project's storefront and its API access.
 */
export default class MrtProjectManageAccessGet extends MrtCommand<typeof MrtProjectManageAccessGet> {
  static aliases = ['mrt:storefront:manage-access:get'];

  static description = withDocs(
    t(
      'commands.mrt.project.manage-access.get.description',
      'Show where a storefront is managed (Runtime Admin or Business Manager) and whether SCAPI and direct MRT API access are enabled',
    ),
    '/cli/mrt.html#b2c-mrt-project-manage-access-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> -p my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
    '<%= config.bin %> mrt storefront manage-access get -s my-storefront',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<ManageAccessGetResult> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const access = await getStorefrontManageAccess(
      {projectSlug: project, origin: this.resolvedConfig.values.mrtOrigin},
      this.getMrtAuth(),
    );

    const result: ManageAccessGetResult = {
      project: access.slug,
      ...toManageAccessState(access),
      environments: access.environments,
      instances: access.instanceIds,
    };

    if (!this.jsonEnabled()) {
      ux.stdout(formatManageAccess(result));
    }

    return result;
  }
}
