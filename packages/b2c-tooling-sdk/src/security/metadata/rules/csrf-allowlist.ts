/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineMetadataRule} from '../types.js';
import {childNamed, childrenNamed} from '../xml.js';

export const csrfAllowlist = defineMetadataRule({
  id: 'csrf-allowlist',
  severity: 'medium',
  confidence: 'medium',
  category: 'csrf',
  cwe: ['CWE-352'],
  description:
    'Entries in the Business Manager CSRF allowlist (csrf-whitelists.xml) that exempt pipelines, controllers, or user agents from CSRF protection, especially whole pipelines (no start node) and user agents allowed on production.',
  remediation:
    'Remove entries you no longer need. Exempt a single start node rather than a whole pipeline, and avoid user-agent exemptions on production: user agents are easy to fake.',
  kinds: ['csrf-allowlist'],
  check(document, report) {
    if (document.format !== 'xml') return;
    const pipelines = childNamed(document.root, 'pipelines');
    for (const pipeline of pipelines ? childrenNamed(pipelines, 'pipeline') : []) {
      const name = pipeline.attributes.name ?? '(unnamed)';
      const node = pipeline.attributes['start-node'];
      report({
        line: pipeline.line,
        column: pipeline.column,
        message: node
          ? `"${name}-${node}" is exempt from Business Manager CSRF protection.`
          : `Every start node of "${name}" is exempt from Business Manager CSRF protection (no start-node given).`,
      });
    }
    const agents = childNamed(document.root, 'user-agents');
    if (!agents) return;
    const production = childNamed(agents, 'production');
    for (const ua of production ? childrenNamed(production, 'user-agent') : []) {
      report({
        line: ua.line,
        column: ua.column,
        message: `User agent "${ua.text}" is exempt from Business Manager CSRF protection on production.`,
      });
    }
    // Legacy entries directly under <user-agents> apply to every instance type.
    for (const ua of childrenNamed(agents, 'user-agent')) {
      report({
        line: ua.line,
        column: ua.column,
        message: `User agent "${ua.text}" is exempt from Business Manager CSRF protection on every instance.`,
      });
    }
  },
});
