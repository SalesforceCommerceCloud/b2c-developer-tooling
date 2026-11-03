/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Args, Flags, ux} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {
  applyObjectTypeSync,
  importObjectTypeExtensions,
  parseObjectTypeExtensions,
  planObjectTypeSync,
  type ObjectTypeExtension,
  type ObjectTypeSyncAction,
  type ObjectTypeSyncPlan,
  type ObjectTypeSyncWarning,
} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, forceFlag} from '../../utils/object-types.js';
import {t, withDocs} from '../../i18n/index.js';

interface ApplyResult extends ObjectTypeSyncPlan {
  applied: boolean;
  /** Whether enum values and default values were imported with a site import. */
  imported: boolean;
  dryRun: boolean;
  files: string[];
  skippedCustomTypes: string[];
}

function describe(action: ObjectTypeSyncAction): string {
  switch (action.action) {
    case 'assign': {
      return `assign to group ${action.group}`;
    }
    case 'create-attribute': {
      return `create (${action.body.valueType})`;
    }
    case 'create-group': {
      return 'create group';
    }
    default: {
      return `update ${action.changes.join(', ')}`;
    }
  }
}

const ACTION_COLUMNS: Record<string, ColumnDef<ObjectTypeSyncAction>> = {
  objectType: {header: 'Object Type', get: (a) => a.objectType},
  id: {header: 'ID', get: (a) => a.id},
  change: {header: 'Change', get: (a) => describe(a)},
};
const actionTable = new TableRenderer(ACTION_COLUMNS);

/** Metadata XML files to read: the file itself, or `*.xml` in a directory and its `meta/` folder. */
function collectFiles(target: string): string[] {
  if (!fs.statSync(target).isDirectory()) return [target];
  const files: string[] = [];
  for (const dir of [target, path.join(target, 'meta')]) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.toLowerCase().endsWith('.xml')) files.push(path.join(dir, name));
    }
  }
  return files;
}

function merge(target: Map<string, ObjectTypeExtension>, ext: ObjectTypeExtension): void {
  const existing = target.get(ext.objectType);
  if (!existing) {
    target.set(ext.objectType, {...ext});
    return;
  }
  existing.attributes = [...existing.attributes, ...ext.attributes];
  existing.systemAttributes = [...existing.systemAttributes, ...ext.systemAttributes];
  existing.groups = [...existing.groups, ...ext.groups];
}

/** Reads and merges the object type definitions of every metadata XML or JSON file under `target`. */
async function loadDefinitions(target: string): Promise<{
  files: string[];
  byType: Map<string, ObjectTypeExtension>;
  skippedCustomTypes: string[];
}> {
  const files = collectFiles(target);
  const byType = new Map<string, ObjectTypeExtension>();
  const skippedCustomTypes: string[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (file.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(content) as ObjectTypeExtension[] | {objectTypes: ObjectTypeExtension[]};
      for (const ext of Array.isArray(parsed) ? parsed : (parsed.objectTypes ?? [])) merge(byType, ext);
      continue;
    }
    if (!content.includes('<metadata')) continue;
    // eslint-disable-next-line no-await-in-loop -- files are small and parsed in order
    const parsed = await parseObjectTypeExtensions(content);
    for (const ext of parsed.extensions) merge(byType, ext);
    skippedCustomTypes.push(...parsed.skippedCustomTypes);
  }
  return {files, byType, skippedCustomTypes};
}

export default class ObjectTypesApply extends ObjectTypesCommand<typeof ObjectTypesApply> {
  static args = {
    path: Args.string({
      description:
        'Metadata XML file (system-objecttype-extensions.xml), JSON file from "object-types export --format json", or a directory containing them',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.objectTypes.apply.description',
      'Create and update attribute definitions and groups on an instance from metadata XML or JSON',
    ),
    '/cli/object-types.html#b2c-object-types-apply',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> meta/system-objecttype-extensions.xml --dry-run',
    '<%= config.bin %> <%= command.id %> ./site-data --force',
    '<%= config.bin %> <%= command.id %> product.json --type Product',
    '<%= config.bin %> <%= command.id %> meta/system-objecttype-extensions.xml --import',
  ];

  static flags = {
    'dry-run': Flags.boolean({
      description: 'Show the changes without applying them',
      default: false,
    }),
    force: forceFlag,
    import: Flags.boolean({
      description:
        'Also set enum values and default values with a site import (needs --server and WebDAV and job access)',
      default: false,
    }),
    type: Flags.string({
      char: 't',
      description: 'Only apply these object types (repeatable)',
      multiple: true,
    }),
  };

  /** Imports enum values and default values with a site import. */
  protected async importValues(plan: ObjectTypeSyncPlan): Promise<void> {
    const instance = this.resolvedConfig.createB2CInstance({oauthStrategy: () => this.getOAuthStrategy()});
    await importObjectTypeExtensions(instance, plan.importRequired);
  }

  async run(): Promise<ApplyResult> {
    this.requireOAuthCredentials();
    const target = this.args.path;
    if (!fs.existsSync(target)) {
      this.error(t('commands.objectTypes.apply.notFound', 'Path not found: {{target}}', {target}));
    }

    const {files, byType, skippedCustomTypes} = await loadDefinitions(target);

    const only = this.flags.type;
    const extensions = [...byType.values()].filter((ext) => !only || only.includes(ext.objectType));
    if (extensions.length === 0) {
      this.error(
        t('commands.objectTypes.apply.empty', 'No system object type definitions found in {{target}}.', {target}),
      );
    }

    const plan = await planObjectTypeSync(this.objectTypes, extensions);
    const result: ApplyResult = {
      ...plan,
      applied: false,
      imported: false,
      dryRun: this.flags['dry-run'],
      files,
      skippedCustomTypes,
    };
    const interactive = !this.jsonEnabled();

    if (interactive) this.printPlan(plan, skippedCustomTypes);
    const runImport = this.flags.import && plan.importRequired.length > 0;
    const total = plan.actions.length + (runImport ? plan.importRequired.length : 0);
    if (total === 0 || this.flags['dry-run']) return result;
    if (runImport && !this.resolvedConfig.hasB2CInstanceConfig()) {
      this.error(
        t('commands.objectTypes.apply.serverRequired', '--import needs the instance hostname (--server or dw.json).'),
      );
    }

    if (!this.flags.force && interactive) {
      const ok = await confirm(t('commands.objectTypes.apply.confirm', 'Apply {{count}} changes?', {count: total}));
      if (!ok) {
        this.log(t('commands.objectTypes.cancelled', 'Cancelled.'));
        return result;
      }
    }

    if (plan.actions.length > 0) {
      await applyObjectTypeSync(this.objectTypes, plan);
      result.applied = true;
    }
    if (runImport) {
      await this.importValues(plan);
      result.imported = true;
    }
    if (interactive) {
      this.log(t('commands.objectTypes.apply.done', 'Applied {{count}} changes.', {count: total}));
    }
    return result;
  }

  private printPlan(plan: ObjectTypeSyncPlan, skippedCustomTypes: string[]): void {
    if (plan.actions.length > 0) {
      actionTable.render(plan.actions, ['objectType', 'id', 'change']);
    }
    this.log(
      t('commands.objectTypes.apply.summary', '{{changes}} changes, {{unchanged}} unchanged.', {
        changes: plan.actions.length,
        unchanged: plan.unchanged,
      }),
    );
    const warnings: ObjectTypeSyncWarning[] = [...plan.warnings];
    if (skippedCustomTypes.length > 0) {
      warnings.push({
        objectType: '-',
        message: t(
          'commands.objectTypes.apply.customTypes',
          'Custom object types are not supported by this API and were skipped: {{types}}',
          {types: [...new Set(skippedCustomTypes)].join(', ')},
        ),
      });
    }
    for (const warning of warnings) {
      this.warn(`${warning.objectType}${warning.id ? `.${warning.id}` : ''}: ${warning.message}`);
    }
    if (plan.importRequired.length === 0) return;
    for (const item of plan.importRequired) {
      ux.stdout(`  ${item.objectType}.${item.id}: ${item.changes.join(', ')}`);
    }
    ux.stdout(
      this.flags.import
        ? t(
            'commands.objectTypes.apply.importPlanned',
            '{{count}} attributes have enum or default value changes and will be imported with a site import.',
            {count: plan.importRequired.length},
          )
        : t(
            'commands.objectTypes.apply.importHint',
            '{{count}} attributes have enum or default value changes the API cannot set. Rerun with --import to apply them with a site import.',
            {count: plan.importRequired.length},
          ),
    );
  }
}
