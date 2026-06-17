/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {buildReportFlags, requireReport} from '../../../utils/cip/report-flags.js';

const REPORT_NAME = 'new-vs-returning-buyer-revenue';

/**
 * `b2c cip report new-vs-returning-buyer-revenue` — flags are auto-derived from the catalog
 * definition; param parsing/validation lives in {@link CipReportCommand} and the SDK.
 */
export default class CipReportNewVsReturningBuyerRevenue extends CipReportCommand<
  typeof CipReportNewVsReturningBuyerRevenue
> {
  static description = withDocs(
    'Split revenue, orders, AOV, and discount depth between first-time and returning buyers',
    '/cli/cip.html#b2c-cip-report-new-vs-returning-buyer-revenue',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    ...buildReportFlags(requireReport(REPORT_NAME)),
  };

  protected readonly reportName = REPORT_NAME;
}
