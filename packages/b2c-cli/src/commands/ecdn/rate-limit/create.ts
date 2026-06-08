/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type RateLimitingRule = CdnZonesComponents['schemas']['RateLimitingRule'];
type RateLimitingRulesPostRequest = CdnZonesComponents['schemas']['RateLimitingRulesPostRequest'];

const VALID_PERIODS = [10, 60, 120, 300, 600];
const VALID_MITIGATION_TIMEOUTS = [0, 60, 120, 300, 600, 3600, 86_400];

interface CreateOutput {
  rule: RateLimitingRule;
}

export default class EcdnRateLimitCreate extends EcdnZoneCommand<typeof EcdnRateLimitCreate> {
  static description = withDocs(
    t('commands.ecdn.rate-limit.create.description', 'Create a rate limiting rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-rate-limit-create',
  );

  static enableJsonFlag = true;

  static examples = [
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --description "Rate limit /checkout" --expression '(http.request.uri.path matches "^/checkout")' --characteristics cf.unique_visitor_id --action block --period 60 --requests-per-period 50 --mitigation-timeout 600`,
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --description "Log spikes" --expression '(http.request.uri.path matches "^/api")' --characteristics cf.colo.id --action log --period 60 --requests-per-period 100 --mitigation-timeout 0 --enabled false`,
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    description: Flags.string({
      description: t('flags.description.description', 'Rule description'),
      required: true,
    }),
    expression: Flags.string({
      description: t('flags.expression.description', 'Expression for when to evaluate this rule'),
      required: true,
    }),
    characteristics: Flags.string({
      description: t('flags.characteristics.description', 'Comma-separated characteristics used to group requests'),
      required: true,
    }),
    action: Flags.string({
      description: t('flags.action.description', 'Action applied when the rule threshold is exceeded'),
      required: true,
      options: ['block', 'managed_challenge', 'js_challenge', 'legacy_captcha', 'log'],
    }),
    period: Flags.integer({
      description: t('flags.period.description', 'Rate limit evaluation period in seconds'),
      required: true,
    }),
    'requests-per-period': Flags.integer({
      description: t('flags.requestsPerPeriod.description', 'Maximum requests allowed within the period'),
      required: true,
    }),
    'mitigation-timeout': Flags.integer({
      description: t(
        'flags.mitigationTimeout.description',
        'Duration in seconds to apply action after threshold is reached',
      ),
      required: true,
    }),
    'counting-expression': Flags.string({
      description: t('flags.countingExpression.description', 'Optional expression for what requests to count'),
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Whether the rule is enabled'),
      allowNo: true,
      default: true,
    }),
    'position-before': Flags.string({
      description: t('flags.positionBefore.description', 'Insert this rule before the specified rule ID'),
      exclusive: ['position-after'],
    }),
    'position-after': Flags.string({
      description: t('flags.positionAfter.description', 'Insert this rule after the specified rule ID'),
      exclusive: ['position-before'],
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const description = this.flags.description as string;
    const expression = this.flags.expression as string;
    const characteristicsRaw = this.flags.characteristics as string;
    const action = this.flags.action as string;
    const period = this.flags.period as number;
    const requestsPerPeriod = this.flags['requests-per-period'] as number;
    const mitigationTimeout = this.flags['mitigation-timeout'] as number;
    const countingExpression = this.flags['counting-expression'] as string | undefined;
    const enabled = this.flags.enabled as boolean;
    const positionBefore = this.flags['position-before'] as string | undefined;
    const positionAfter = this.flags['position-after'] as string | undefined;

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.rate-limit.create.creating', 'Creating rate limiting rule...'));
    }

    if (!VALID_PERIODS.includes(period)) {
      this.error(
        t('commands.ecdn.rate-limit.create.invalidPeriod', 'Invalid period: {{period}}. Valid values: {{valid}}.', {
          period: String(period),
          valid: VALID_PERIODS.join(', '),
        }),
      );
    }

    if (!VALID_MITIGATION_TIMEOUTS.includes(mitigationTimeout)) {
      this.error(
        t(
          'commands.ecdn.rate-limit.create.invalidMitigationTimeout',
          'Invalid mitigation timeout: {{timeout}}. Valid values: {{valid}}.',
          {
            timeout: String(mitigationTimeout),
            valid: VALID_MITIGATION_TIMEOUTS.join(', '),
          },
        ),
      );
    }

    const characteristics = characteristicsRaw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (characteristics.length === 0) {
      this.error(
        t('commands.ecdn.rate-limit.create.characteristicsRequired', 'At least one characteristic must be provided.'),
      );
    }

    const body: RateLimitingRulesPostRequest = {
      description,
      expression,
      characteristics,
      action,
      period,
      requestsPerPeriod,
      mitigationTimeout,
      enabled,
    };

    if (countingExpression) {
      body.countingExpression = countingExpression;
    }

    if (positionBefore) {
      body.position = {before: positionBefore};
    }

    if (positionAfter) {
      body.position = {after: positionAfter};
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/rate-limiting/rules', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.rate-limit.create.error', 'Failed to create rate limiting rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.rate-limit.create.noData', 'No rate limiting rule data returned from API'));
    }

    const output: CreateOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 22;

    ui.div('');
    ui.div({text: t('commands.ecdn.rate-limit.create.success', 'Rate limiting rule created successfully!')});
    ui.div('');
    ui.div({text: 'Rule ID:', width: labelWidth}, {text: rule.ruleId});
    ui.div({text: 'Description:', width: labelWidth}, {text: rule.description});
    ui.div({text: 'Action:', width: labelWidth}, {text: rule.action});
    ui.div({text: 'Period (seconds):', width: labelWidth}, {text: String(rule.period)});
    ui.div({text: 'Requests Per Period:', width: labelWidth}, {text: String(rule.requestsPerPeriod)});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: rule.enabled ? 'yes' : 'no'});

    this.log(ui.toString());

    return output;
  }
}
