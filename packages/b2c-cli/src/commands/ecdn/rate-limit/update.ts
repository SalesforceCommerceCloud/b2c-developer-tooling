/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type RateLimitingRule = CdnZonesComponents['schemas']['RateLimitingRule'];
type RateLimitingRulesPatchRequest = CdnZonesComponents['schemas']['RateLimitingRulesPatchRequest'];

const VALID_PERIODS = [10, 60, 120, 300, 600];
const VALID_MITIGATION_TIMEOUTS = [0, 60, 120, 300, 600, 3600, 86_400];

interface UpdateOutput {
  rule: RateLimitingRule;
}

export default class EcdnRateLimitUpdate extends EcdnZoneCommand<typeof EcdnRateLimitUpdate> {
  static description = withDocs(
    t('commands.ecdn.rate-limit.update.description', 'Update a rate limiting rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-rate-limit-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --requests-per-period 100 --mitigation-timeout 120',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --action managed_challenge --enabled false',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'Rate limiting rule ID'),
      required: true,
    }),
    description: Flags.string({
      description: t('flags.description.description', 'Rule description'),
    }),
    expression: Flags.string({
      description: t('flags.expression.description', 'Expression for when to evaluate this rule'),
    }),
    characteristics: Flags.string({
      description: t('flags.characteristics.description', 'Comma-separated characteristics used to group requests'),
    }),
    action: Flags.string({
      description: t('flags.action.description', 'Action applied when the rule threshold is exceeded'),
      options: ['block', 'managed_challenge', 'js_challenge', 'legacy_captcha', 'log'],
    }),
    period: Flags.integer({
      description: t('flags.period.description', 'Rate limit evaluation period in seconds'),
    }),
    'requests-per-period': Flags.integer({
      description: t('flags.requestsPerPeriod.description', 'Maximum requests allowed within the period'),
    }),
    'mitigation-timeout': Flags.integer({
      description: t(
        'flags.mitigationTimeout.description',
        'Duration in seconds to apply action after threshold is reached',
      ),
    }),
    'counting-expression': Flags.string({
      description: t('flags.countingExpression.description', 'Optional expression for what requests to count'),
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Whether the rule is enabled'),
      allowNo: true,
    }),
    'position-before': Flags.string({
      description: t('flags.positionBefore.description', 'Move this rule before the specified rule ID'),
      exclusive: ['position-after'],
    }),
    'position-after': Flags.string({
      description: t('flags.positionAfter.description', 'Move this rule after the specified rule ID'),
      exclusive: ['position-before'],
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'] as string;
    const description = this.flags.description as string | undefined;
    const expression = this.flags.expression as string | undefined;
    const characteristicsRaw = this.flags.characteristics as string | undefined;
    const action = this.flags.action as string | undefined;
    const period = this.flags.period as number | undefined;
    const requestsPerPeriod = this.flags['requests-per-period'] as number | undefined;
    const mitigationTimeout = this.flags['mitigation-timeout'] as number | undefined;
    const countingExpression = this.flags['counting-expression'] as string | undefined;
    const enabled = this.flags.enabled as boolean | undefined;
    const positionBefore = this.flags['position-before'] as string | undefined;
    const positionAfter = this.flags['position-after'] as string | undefined;

    const hasUpdates = [
      description,
      expression,
      characteristicsRaw,
      action,
      period,
      requestsPerPeriod,
      mitigationTimeout,
      countingExpression,
      enabled,
      positionBefore,
      positionAfter,
    ].some((value) => value !== undefined);

    if (!hasUpdates) {
      this.error(t('commands.ecdn.rate-limit.update.noChanges', 'Provide at least one field to update.'));
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.rate-limit.update.updating', 'Updating rate limiting rule {{id}}...', {id: ruleId}));
    }

    if (period !== undefined && !VALID_PERIODS.includes(period)) {
      this.error(
        t('commands.ecdn.rate-limit.update.invalidPeriod', 'Invalid period: {{period}}. Valid values: {{valid}}.', {
          period: String(period),
          valid: VALID_PERIODS.join(', '),
        }),
      );
    }

    if (mitigationTimeout !== undefined && !VALID_MITIGATION_TIMEOUTS.includes(mitigationTimeout)) {
      this.error(
        t(
          'commands.ecdn.rate-limit.update.invalidMitigationTimeout',
          'Invalid mitigation timeout: {{timeout}}. Valid values: {{valid}}.',
          {
            timeout: String(mitigationTimeout),
            valid: VALID_MITIGATION_TIMEOUTS.join(', '),
          },
        ),
      );
    }

    const body: RateLimitingRulesPatchRequest = {};

    if (description !== undefined) {
      body.description = description;
    }

    if (expression !== undefined) {
      body.expression = expression;
    }

    if (characteristicsRaw !== undefined) {
      const characteristics = characteristicsRaw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (characteristics.length === 0) {
        this.error(
          t('commands.ecdn.rate-limit.update.characteristicsRequired', 'At least one characteristic must be provided.'),
        );
      }

      body.characteristics = characteristics;
    }

    if (action !== undefined) {
      body.action = action;
    }

    if (period !== undefined) {
      body.period = period;
    }

    if (requestsPerPeriod !== undefined) {
      body.requestsPerPeriod = requestsPerPeriod;
    }

    if (mitigationTimeout !== undefined) {
      body.mitigationTimeout = mitigationTimeout;
    }

    if (countingExpression !== undefined) {
      body.countingExpression = countingExpression;
    }

    if (enabled !== undefined) {
      body.enabled = enabled;
    }

    if (positionBefore) {
      body.position = {before: positionBefore};
    }

    if (positionAfter) {
      body.position = {after: positionAfter};
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/rate-limiting/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, ruleId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.rate-limit.update.error', 'Failed to update rate limiting rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.rate-limit.update.noData', 'No rate limiting rule data returned from API'));
    }

    const output: UpdateOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    printFieldsBlock(
      t('commands.ecdn.rate-limit.update.success', 'Rate limiting rule updated successfully!'),
      [
        ['Rule ID', rule.ruleId],
        ['Description', rule.description],
        ['Action', rule.action],
        ['Period (seconds)', String(rule.period)],
        ['Requests Per Period', String(rule.requestsPerPeriod)],
        ['Enabled', rule.enabled ? 'yes' : 'no'],
      ],
      {labelWidth: 22},
    );

    return output;
  }
}
