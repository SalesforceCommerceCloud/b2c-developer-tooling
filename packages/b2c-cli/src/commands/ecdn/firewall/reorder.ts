/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {readFileSync} from 'node:fs';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type CustomRule = CdnZonesComponents['schemas']['CustomRule'];
type CustomRulesPatchOrderRequest = CdnZonesComponents['schemas']['CustomRulesPatchOrderRequest'];

interface ReorderOutput {
  rules: CustomRule[];
  total: number;
}

export default class EcdnFirewallReorder extends EcdnZoneCommand<typeof EcdnFirewallReorder> {
  static description = withDocs(
    t('commands.ecdn.firewall.reorder.description', 'Update the evaluation order of all custom firewall rules'),
    '/cli/ecdn.html#b2c-ecdn-firewall-reorder',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-ids ffffe61cf25e4ec49c34b029ff3060f7,2c0fc9fa937b11eaa1b71c4d701ab86e',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-ids-file ./order.json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-ids': Flags.string({
      description: t('flags.ruleIds.description', 'Comma-separated list of rule IDs in the desired order'),
      exclusive: ['rule-ids-file'],
    }),
    'rule-ids-file': Flags.string({
      description: t(
        'flags.ruleIdsFile.description',
        'Path to a JSON file containing a string array of rule IDs in the desired order',
      ),
      exclusive: ['rule-ids'],
    }),
    force: Flags.boolean({
      char: 'f',
      description: t('flags.force.description', 'Skip confirmation prompt'),
      default: false,
    }),
  };

  async run(): Promise<ReorderOutput> {
    // Reordering changes which rules fire first; treat as destructive so it
    // routes through the same safety guard as delete and other rule mutations.
    this.assertDestructiveOperationAllowed('reorder custom firewall rules');

    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleIds = this.parseRuleIds();

    if (!this.flags.force && !this.jsonEnabled()) {
      this.warn(
        t(
          'commands.ecdn.firewall.reorder.warning',
          'Reordering custom firewall rules changes traffic behavior. Use --force to confirm.',
        ),
      );
      return {rules: [], total: 0};
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.firewall.reorder.updating', 'Reordering {{count}} custom firewall rule(s)...', {
          count: ruleIds.length,
        }),
      );
    }

    const body: CustomRulesPatchOrderRequest = {ruleIds};

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH('/organizations/{organizationId}/zones/{zoneId}/firewall-custom/rules', {
      params: {path: {organizationId, zoneId}},
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.firewall.reorder.error', 'Failed to reorder custom firewall rules: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rules = data?.data ?? [];
    const output: ReorderOutput = {rules, total: rules.length};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(
      t('commands.ecdn.firewall.reorder.success', 'Custom firewall rules reordered. New order ({{count}}):', {
        count: rules.length,
      }),
    );
    for (const [index, rule] of rules.entries()) {
      this.log(`  ${index + 1}. ${rule.ruleId}  ${rule.description}`);
    }

    return output;
  }

  /**
   * Resolve the desired ordering from either --rule-ids (csv) or
   * --rule-ids-file (path to a JSON array). Centralizing this here keeps run()
   * focused on the API call and makes the inputs easy to validate uniformly.
   */
  private parseRuleIds(): string[] {
    const csv = this.flags['rule-ids'] as string | undefined;
    const file = this.flags['rule-ids-file'] as string | undefined;

    if (!csv && !file) {
      this.error(
        t(
          'commands.ecdn.firewall.reorder.idsRequired',
          'Provide --rule-ids or --rule-ids-file with the desired order.',
        ),
      );
    }

    const ids = csv
      ? csv
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : this.readRuleIdsFile(file as string);

    if (ids.length === 0) {
      this.error(t('commands.ecdn.firewall.reorder.idsEmpty', 'At least one rule ID is required.'));
    }

    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        this.error(t('commands.ecdn.firewall.reorder.idsDuplicate', 'Duplicate rule ID in order list: {{id}}', {id}));
      }
      seen.add(id);
    }

    return ids;
  }

  private readRuleIdsFile(filePath: string): string[] {
    let raw: string;
    try {
      raw = readFileSync(filePath, 'utf8');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        t('commands.ecdn.firewall.reorder.fileReadError', 'Failed to read rule IDs file {{path}}: {{message}}', {
          path: filePath,
          message,
        }),
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        t('commands.ecdn.firewall.reorder.fileParseError', 'Rule IDs file {{path}} is not valid JSON: {{message}}', {
          path: filePath,
          message,
        }),
      );
    }

    if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
      this.error(
        t('commands.ecdn.firewall.reorder.fileShapeError', 'Rule IDs file {{path}} must be a JSON array of strings.', {
          path: filePath,
        }),
      );
    }

    return (parsed as string[]).map((value) => value.trim()).filter(Boolean);
  }
}
