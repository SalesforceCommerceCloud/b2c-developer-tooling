/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineScriptRule} from '../rule.js';
import {controllerName} from '../script/project.js';
import {callsCsrfValidation, readsFormInput, sgControllerExport} from '../script/routes.js';

export default defineScriptRule({
  id: 'sg-post-without-csrf',
  severity: 'high',
  confidence: 'medium',
  category: 'csrf',
  cwe: ['CWE-352'],
  description:
    "SiteGenesis controller actions exposed with guard.ensure(['post', ...]) or guard.httpsPost without the 'csrf' filter or a CSRFProtection.validateRequest() check, and actions with no method filter that handle form input.",
  remediation:
    "Add the 'csrf' filter: guard.ensure(['post', 'https', 'csrf'], action), and include the CSRF token field in the form that submits to it.",
  create(context) {
    return {
      AssignmentExpression(node) {
        const sg = sgControllerExport(node, context.sourceCode);
        if (!sg || sg.filters.includes('csrf') || sg.filters.includes('include')) return;
        const acceptsPost = sg.filters.includes('post');
        const anyMethod = !acceptsPost && !sg.filters.includes('get');
        if (!acceptsPost && !(anyMethod && sg.action && readsFormInput(sg.action))) return;
        if (sg.action && callsCsrfValidation(sg.action, context.sourceCode)) return;
        const id = `${controllerName(context.filename)}-${sg.name}`;
        const how = acceptsPost ? 'accepts POST' : 'accepts any method and handles form input';
        context.report({node, message: `Controller action "${id}" ${how} without the 'csrf' guard filter.`});
      },
    };
  },
});
