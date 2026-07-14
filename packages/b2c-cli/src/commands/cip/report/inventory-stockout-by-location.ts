/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {buildReportFlags, requireReport} from '../../../utils/cip/report-flags.js';

const REPORT_NAME = 'inventory-stockout-by-location';

/**
 * `b2c cip report inventory-stockout-by-location` — flags are auto-derived from the catalog
 * definition; param parsing/validation lives in {@link CipReportCommand} and the SDK.
 */
export default class CipReportInventoryStockoutByLocation extends CipReportCommand<
  typeof CipReportInventoryStockoutByLocation
> {
  static description = withDocs(
    'Surface out-of-stock and low-stock SKUs by location for replenishment',
    '/cli/cip.html#b2c-cip-report-inventory-stockout-by-location',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    ...buildReportFlags(requireReport(REPORT_NAME)),
  };

  protected readonly reportName = REPORT_NAME;
}
