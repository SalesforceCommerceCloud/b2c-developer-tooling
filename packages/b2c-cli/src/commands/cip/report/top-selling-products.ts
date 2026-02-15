/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {createSiteIdFlag} from '../../../utils/cip/report-flags.js';

export default class CipReportTopSellingProducts extends CipReportCommand<typeof CipReportTopSellingProducts> {
  static description = withDocs(
    'Identify top selling products across channels',
    '/cli/cip.html#b2c-cip-report-top-selling-products',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    'site-id': createSiteIdFlag(),
  };

  protected readonly reportName = 'top-selling-products';

  protected getReportParams(): Record<string, string> {
    return this.getBaseReportParams();
  }
}
