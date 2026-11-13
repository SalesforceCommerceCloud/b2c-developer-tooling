/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Args, Flags, ux} from '@oclif/core';
import {
  buildObjectTypeExtensionsXml,
  exportObjectTypes,
  type ObjectTypeExtension,
} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand} from '../../utils/object-types.js';
import {t, withDocs} from '../../i18n/index.js';

interface ExportResult {
  objectTypes: ObjectTypeExtension[];
  output?: string;
}

export default class ObjectTypesExport extends ObjectTypesCommand<typeof ObjectTypesExport> {
  static args = {
    'object-type': Args.string({
      description: 'System object types to export (for example Product Order)',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.objectTypes.export.description',
      'Export custom attribute definitions and attribute groups as metadata XML (system-objecttype-extensions.xml)',
    ),
    '/cli/object-types.html#b2c-object-types-export',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product',
    '<%= config.bin %> <%= command.id %> Product Order -o meta/system-objecttype-extensions.xml',
    '<%= config.bin %> <%= command.id %> Product --format json -o product.json',
  ];

  static flags = {
    format: Flags.string({
      description: 'Output format',
      options: ['xml', 'json'],
      default: 'xml',
    }),
    output: Flags.string({
      char: 'o',
      description: 'File to write (default: stdout)',
    }),
    'include-internal': Flags.boolean({
      description: 'Include attribute groups marked internal',
      default: false,
    }),
  };

  static strict = false;

  async run(): Promise<ExportResult> {
    this.requireOAuthCredentials();
    const {argv} = await this.parse(ObjectTypesExport);
    const types = [...new Set(argv as string[])];
    const objectTypes = await exportObjectTypes(this.objectTypes, types, {
      includeInternalGroups: this.flags['include-internal'],
    });
    const content =
      this.flags.format === 'json'
        ? JSON.stringify(objectTypes, null, 2) + '\n'
        : buildObjectTypeExtensionsXml(objectTypes);

    const output = this.flags.output;
    if (output) {
      fs.mkdirSync(path.dirname(path.resolve(output)), {recursive: true});
      fs.writeFileSync(output, content);
      if (!this.jsonEnabled()) {
        const attributes = objectTypes.reduce((sum, ext) => sum + ext.attributes.length, 0);
        const groups = objectTypes.reduce((sum, ext) => sum + ext.groups.length, 0);
        this.log(
          t(
            'commands.objectTypes.export.written',
            'Wrote {{attributes}} attributes and {{groups}} groups from {{types}} to {{output}}.',
            {attributes, groups, types: types.join(', '), output},
          ),
        );
      }
    } else if (!this.jsonEnabled()) {
      ux.stdout(content.trimEnd());
    }
    return {objectTypes, ...(output ? {output} : {})};
  }
}
