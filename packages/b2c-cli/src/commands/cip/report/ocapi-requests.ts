/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {createSiteIdFlag} from '../../../utils/cip/report-flags.js';

export default class CipReportOcapiRequests extends CipReportCommand<typeof CipReportOcapiRequests> {
  static description = withDocs(
    'Analyze OCAPI request volume and response latency',
    '/cli/cip.html#b2c-cip-report-ocapi-requests',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    'site-id': createSiteIdFlag(),
  };

  protected readonly reportName = 'ocapi-requests';

  protected getReportParams(): Record<string, string> {
    return this.getBaseReportParams();
  }
}
