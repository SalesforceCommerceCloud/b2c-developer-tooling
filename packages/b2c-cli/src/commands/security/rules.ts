/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listSecurityRules, type SecurityRuleInfo} from '@salesforce/b2c-tooling-sdk/security';
import {t, withDocs} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<SecurityRuleInfo>> = {
  id: {header: 'Rule', get: (r) => r.id},
  severity: {header: 'Severity', get: (r) => r.severity},
  category: {header: 'Category', get: (r) => r.category},
  cwe: {header: 'CWE', get: (r) => r.cwe.join(', ')},
  description: {header: 'Description', get: (r) => r.description},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class SecurityRules extends Command {
  static description = withDocs(
    t('commands.security.rules.description', '[PREVIEW] List the security rules that "b2c security scan" runs'),
    '/cli/security.html#b2c-security-rules',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  async run(): Promise<{rules: SecurityRuleInfo[]}> {
    await this.parse(SecurityRules);
    const rules = listSecurityRules().sort((a, b) => a.id.localeCompare(b.id));
    if (this.jsonEnabled()) return {rules};
    tableRenderer.render(rules, ['id', 'severity', 'category', 'cwe', 'description']);
    return {rules};
  }
}
