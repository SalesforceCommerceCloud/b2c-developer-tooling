/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {createSiteIdFlag} from '../../../utils/cip/report-flags.js';

export default class CipReportProductCoPurchaseAnalysis extends CipReportCommand<
  typeof CipReportProductCoPurchaseAnalysis
> {
  static description = withDocs(
    'Analyze frequently co-purchased products',
    '/cli/cip.html#b2c-cip-report-product-co-purchase-analysis',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    'site-id': createSiteIdFlag(),
  };

  protected readonly reportName = 'product-co-purchase-analysis';

  protected getReportParams(): Record<string, string> {
    return this.getBaseReportParams();
  }
}
