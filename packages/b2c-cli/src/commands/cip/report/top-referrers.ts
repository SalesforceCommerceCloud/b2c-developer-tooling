/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {createLimitFlag, createSiteIdFlag} from '../../../utils/cip/report-flags.js';

export default class CipReportTopReferrers extends CipReportCommand<typeof CipReportTopReferrers> {
  static description = withDocs(
    'Identify top traffic referrers and visit share',
    '/cli/cip.html#b2c-cip-report-top-referrers',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    limit: createLimitFlag(),
    'site-id': createSiteIdFlag(),
  };

  protected readonly reportName = 'top-referrers';

  protected getReportParams(): Record<string, string> {
    return this.getBaseReportParams();
  }
}
