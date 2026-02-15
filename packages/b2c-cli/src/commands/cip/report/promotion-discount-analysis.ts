/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';

export default class CipReportPromotionDiscountAnalysis extends CipReportCommand<
  typeof CipReportPromotionDiscountAnalysis
> {
  static description = withDocs(
    'Measure promotional discount impact on orders',
    '/cli/cip.html#b2c-cip-report-promotion-discount-analysis',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
  };

  protected readonly reportName = 'promotion-discount-analysis';

  protected getReportParams(): Record<string, string> {
    return this.getBaseReportParams();
  }
}
