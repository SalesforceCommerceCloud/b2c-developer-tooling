/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// ISML empty (void) elements: tags that never have a body or a closing tag.
// Auto-close, "not closed" diagnostics, folding, and symbol nesting all key off
// this set, so a missing entry produces invalid closing-tag insertion and false
// diagnostics. Keep in sync with the self-closing tags rendered by hover.ts and
// snippets.ts (e.g. isslot/ismodule/iscomponent).
export const VOID_TAGS = new Set([
  'iselse',
  'iselseif',
  'isnext',
  'isbreak',
  'iscontinue',
  'isinclude',
  'isset',
  'isprint',
  'isredirect',
  'isreplace',
  'iscontent',
  'iscache',
  'isstatus',
  'isactivedatahead',
  'isactivedatacontext',
  'isanalyticsoff',
  'iscookies',
  'isslot',
  'ismodule',
  'iscomponent',
]);
