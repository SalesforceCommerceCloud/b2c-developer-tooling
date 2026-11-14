/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {SECRET_NAME, looksLikeSecret} from '../../secrets.js';
import {defineMetadataRule} from '../types.js';
import {childNamed, descendantsNamed} from '../xml.js';

export const secretAttributeNotPassword = defineMetadataRule({
  id: 'secret-attribute-not-password',
  severity: 'medium',
  confidence: 'medium',
  category: 'secrets',
  cwe: ['CWE-312'],
  description:
    'Custom attribute definitions (site preferences, system object extensions, custom objects) whose ID names a secret (password, secret, API key, token) but whose type is not password, so values are shown and exported in clear text.',
  remediation:
    'Use the password type for attributes that hold credentials, so Business Manager masks them and exports encrypt them. Better still, keep credentials in service credentials.',
  kinds: ['metadata'],
  check(document, report) {
    if (document.format !== 'xml') return;
    for (const definition of descendantsNamed(document.root, 'attribute-definition')) {
      const id = definition.attributes['attribute-id'];
      const type = childNamed(definition, 'type')?.text;
      if (id && type && SECRET_NAME.test(id) && type !== 'password') {
        report({
          line: definition.line,
          column: definition.column,
          message: `Attribute "${id}" looks like it holds a secret but has type "${type}" instead of "password".`,
        });
      }
    }
  },
});

export const preferenceSecretValue = defineMetadataRule({
  id: 'preference-secret-value',
  severity: 'high',
  confidence: 'medium',
  category: 'secrets',
  cwe: ['CWE-798', 'CWE-312'],
  description:
    'Site or global preference values in preferences.xml that look like credentials (a preference named like a password, secret, API key, or token with a secret-looking value).',
  remediation:
    'Remove the value from site data in source control and set it per instance in Business Manager, using a password-type preference or a service credential. Rotate any credential that was committed.',
  kinds: ['preferences'],
  check(document, report) {
    if (document.format !== 'xml') return;
    for (const preference of descendantsNamed(document.root, 'preference')) {
      const id = preference.attributes['preference-id'];
      if (id && SECRET_NAME.test(id) && looksLikeSecret(preference.text)) {
        report({
          line: preference.line,
          column: preference.column,
          message: `Preference "${id}" has a value that looks like a credential.`,
        });
      }
    }
  },
});
