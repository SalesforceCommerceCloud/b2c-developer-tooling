/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {buildReportFlags, requireReport} from '../../../utils/cip/report-flags.js';

const REPORT_NAME = 'scapi-cache-hit-ratio';

/**
 * `b2c cip report scapi-cache-hit-ratio` — flags are auto-derived from the catalog
 * definition; param parsing/validation lives in {@link CipReportCommand} and the SDK.
 */
export default class CipReportScapiCacheHitRatio extends CipReportCommand<typeof CipReportScapiCacheHitRatio> {
  static description = withDocs(
    'Measure SCAPI cache hit ratio per endpoint to find cacheable resources running as MISS',
    '/cli/cip.html#b2c-cip-report-scapi-cache-hit-ratio',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    ...buildReportFlags(requireReport(REPORT_NAME)),
  };

  protected readonly reportName = REPORT_NAME;
}
