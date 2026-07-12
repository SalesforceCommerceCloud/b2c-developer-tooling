/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {scanIsmlTags} from './tags.js';

export interface IsmlHoverInfo {
  tagName: string;
  summary: string;
  syntax: string;
  attributes: string[];
  tips: string[];
  isClosing: boolean;
  isSelfClosing: boolean;
}

interface IsmlHoverDoc {
  summary: string;
  syntax: string;
  attributes?: string[];
  tips?: string[];
}

const HOVER_DOCS: Record<string, IsmlHoverDoc> = {
  isif: {
    summary: 'Conditional block. Renders body when `condition` evaluates to true.',
    syntax: '<isif condition="${condition}">...</isif>',
    attributes: ['condition'],
    tips: ['Use `<iselseif/>` and `<iselse/>` for additional branches.'],
  },
  iselseif: {
    summary: 'Branch condition inside an `isif` block.',
    syntax: '<iselseif condition="${condition}"/>',
    attributes: ['condition'],
  },
  iselse: {
    summary: 'Fallback branch for an `isif` block.',
    syntax: '<iselse/>',
  },
  isloop: {
    summary: 'Iterates over a collection or iterator.',
    syntax: '<isloop items="${collection}" var="item" status="loopState">...</isloop>',
    attributes: ['items', 'var', 'status', 'begin', 'end', 'step'],
    tips: ['The `status` object exposes `count`, `index`, `first`, `last`, `odd`, and `even`.'],
  },
  isinclude: {
    summary: 'Includes another template by `template` or `url` attribute.',
    syntax: '<isinclude template="common/header"/>',
    attributes: ['template', 'url', 'sf-toolkit'],
    tips: ['Use `template` for local includes and `url` for remote includes.'],
  },
  isdecorate: {
    summary: 'Wraps current output in a decorator template.',
    syntax: '<isdecorate template="common/layout/page">...</isdecorate>',
    attributes: ['template'],
  },
  ismodule: {
    summary: 'Declares a custom ISML tag module.',
    syntax: '<ismodule template="components/banner" name="banner" attribute="type"/>',
    attributes: ['template', 'name', 'attribute'],
  },
  isslot: {
    summary: 'Renders a content slot by `id` and optional context attributes.',
    syntax: '<isslot id="hero-slot" context="global"/>',
    attributes: ['id', 'description', 'context', 'context-object'],
  },
  isscript: {
    summary: 'Server-side script block in B2C Commerce Script (scriptlet).',
    syntax: '<isscript>\n  var helper = require("*/cartridge/scripts/util/foo");\n</isscript>',
    tips: [
      'Top-level variables available in the block: `session`, `request`, `pdict`, `out`.',
      'Prefer controllers for complex logic; keep inline scripts minimal.',
    ],
  },
  isprint: {
    summary: 'Prints a value with optional encoding, style, or formatter.',
    syntax: '<isprint value="${value}" encoding="htmlcontent"/>',
    attributes: ['value', 'encoding', 'style', 'formatter', 'timezone', 'padding'],
    tips: ['Use `style` (e.g. `MONEY_LONG`, `DATE_SHORT`) or `formatter` for output formatting — not both.'],
  },
  isset: {
    summary: 'Assigns a variable in page/request/session scope.',
    syntax: '<isset name="myVar" value="${value}" scope="page"/>',
    attributes: ['name', 'value', 'scope'],
  },
  iscontent: {
    summary: 'Sets response content metadata such as type and charset.',
    syntax: '<iscontent type="text/html" charset="UTF-8"/>',
    attributes: ['type', 'charset', 'encoding', 'compact'],
    tips: ['Place first in the template — it must precede any output to take effect.'],
  },
  iscomment: {
    summary: 'ISML comment block not rendered in output.',
    syntax: '<iscomment>internal note</iscomment>',
  },
};

export function findIsmlHoverInfo(text: string, offset: number): IsmlHoverInfo | undefined {
  for (const token of scanIsmlTags(text)) {
    if (offset < token.nameStartOffset || offset > token.nameEndOffset) continue;
    const doc = HOVER_DOCS[token.name];
    if (!doc) return undefined;
    return {
      tagName: token.name,
      summary: doc.summary,
      syntax: doc.syntax,
      attributes: doc.attributes ?? [],
      tips: doc.tips ?? [],
      isClosing: token.isClosing,
      isSelfClosing: token.isSelfClosing,
    };
  }
  return undefined;
}
