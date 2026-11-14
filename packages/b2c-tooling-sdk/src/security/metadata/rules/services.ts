/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineMetadataRule} from '../types.js';
import {childNamed, descendantsNamed} from '../xml.js';

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/i;

export const serviceCredentialPassword = defineMetadataRule({
  id: 'service-credential-password',
  severity: 'high',
  confidence: 'high',
  category: 'secrets',
  cwe: ['CWE-256', 'CWE-798'],
  description:
    'Service credentials in services.xml with a plaintext password (not encrypted or masked), or a URL with a user name and password in it.',
  remediation:
    'Keep real credentials out of site data in source control: commit services.xml without passwords and set them per instance in Business Manager (Administration > Operations > Services), or export with encryption. Rotate any password that was committed.',
  kinds: ['services'],
  check(document, report) {
    if (document.format !== 'xml') return;
    for (const credential of descendantsNamed(document.root, 'service-credential')) {
      const id = credential.attributes['service-credential-id'] ?? '(unnamed)';
      const password = childNamed(credential, 'password');
      if (
        password &&
        password.text.length > 0 &&
        password.attributes.encrypted !== 'true' &&
        password.attributes.masked !== 'true'
      ) {
        report({
          line: password.line,
          column: password.column,
          message: `Service credential "${id}" has a plaintext password.`,
        });
      }
      const url = childNamed(credential, 'url');
      if (url && /^[a-z][a-z\d+.-]*:\/\/[^/@\s]+:[^/@\s]+@/i.test(url.text)) {
        report({
          line: url.line,
          column: url.column,
          message: `Service credential "${id}" has a user name and password in its URL.`,
        });
      }
    }
  },
});

export const serviceInsecureUrl = defineMetadataRule({
  id: 'service-insecure-url',
  severity: 'medium',
  confidence: 'high',
  category: 'config',
  cwe: ['CWE-319'],
  description:
    'Service credentials in services.xml whose URL uses plain http://, so requests and credentials travel unencrypted.',
  remediation: 'Use the https:// endpoint of the service.',
  kinds: ['services'],
  check(document, report) {
    if (document.format !== 'xml') return;
    for (const credential of descendantsNamed(document.root, 'service-credential')) {
      const url = childNamed(credential, 'url');
      if (url && /^http:\/\//i.test(url.text) && !LOCAL.test(url.text)) {
        const id = credential.attributes['service-credential-id'] ?? '(unnamed)';
        report({
          line: url.line,
          column: url.column,
          message: `Service credential "${id}" uses an http:// URL (${url.text}).`,
        });
      }
    }
  },
});

export const serviceCommunicationLog = defineMetadataRule({
  id: 'service-communication-log',
  severity: 'medium',
  confidence: 'medium',
  category: 'pii',
  cwe: ['CWE-532'],
  description:
    'Services in services.xml with communication logging enabled (comm-log-enabled), which writes full request and response bodies to the service log, often including personal data, tokens, or payment details.',
  remediation:
    'Disable communication logging except while debugging on a sandbox, and filter sensitive fields with filterLogMessage in the service callback when you need it.',
  kinds: ['services'],
  check(document, report) {
    if (document.format !== 'xml') return;
    for (const service of descendantsNamed(document.root, 'service')) {
      const flag = childNamed(service, 'comm-log-enabled');
      if (flag?.text === 'true') {
        const id = service.attributes['service-id'] ?? '(unnamed)';
        report({
          line: flag.line,
          column: flag.column,
          message: `Service "${id}" logs full request and response bodies (comm-log-enabled).`,
        });
      }
    }
  },
});
