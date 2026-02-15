/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags} from '@oclif/core';
import {withDocs} from '../../../i18n/index.js';
import {CipReportCommand} from '../../../utils/cip/report-command.js';
import {createSiteIdFlag} from '../../../utils/cip/report-flags.js';

export default class CipReportSearchQueryPerformance extends CipReportCommand<typeof CipReportSearchQueryPerformance> {
  static description = withDocs(
    'Identify search terms driving revenue and conversion',
    '/cli/cip.html#b2c-cip-report-search-query-performance',
  );

  static enableJsonFlag = true;

  static flags = {
    ...CipReportCommand.baseFlags,
    ...CipReportCommand.reportFlags,
    'has-results': Flags.string({
      description: 'Filter by result-bearing searches',
      helpGroup: 'QUERY',
      options: ['false', 'true'],
      required: false,
    }),
    'site-id': createSiteIdFlag(),
  };

  protected readonly reportName = 'search-query-performance';

  protected getReportParams(): Record<string, string> {
    if (!this.flags['has-results']) {
      this.error('--has-results is required for this report. Use true or false.');
    }

    return {
      ...this.getBaseReportParams(),
      hasResults: this.flags['has-results'],
    };
  }
}
