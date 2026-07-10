/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {VOID_TAGS} from './constants.js';
import {scanIsmlTags} from './tags.js';

export type IsmlDiagnosticSeverity = 'error' | 'warning' | 'info';

/**
 * Stable rule identifiers. These are shown as the diagnostic `code` in the
 * Problems panel and are the handle used by both inline `<iscomment>`
 * suppression directives and the `b2c-dx.isml.diagnostics.disabledRules`
 * setting. Keep them stable — users reference them by string.
 */
export type IsmlDiagnosticCode =
  | 'unexpected-closing-tag'
  | 'mismatched-closing-tag'
  | 'unclosed-tag'
  | 'void-tag-not-self-closing'
  | 'void-closing-tag'
  | 'missing-required-attribute'
  | 'encoding-off';

export interface IsmlDiagnostic {
  code: IsmlDiagnosticCode;
  message: string;
  startOffset: number;
  endOffset: number;
  severity: IsmlDiagnosticSeverity;
}

export interface IsmlQuickFixEdit {
  startOffset: number;
  endOffset: number;
  newText: string;
}

export interface IsmlQuickFix {
  title: string;
  edits: IsmlQuickFixEdit[];
}

/**
 * Rules that are OFF by default. Users opt in by removing them from
 * `b2c-dx.isml.diagnostics.disabledRules` (which defaults to this list). These
 * are legitimate-but-notable patterns that would be noise if always on.
 */
export const DEFAULT_DISABLED_RULES: readonly IsmlDiagnosticCode[] = ['encoding-off'];

// Inline suppression directives, written inside an ISML comment, e.g.:
//   <iscomment> b2c-dx-disable-next-line encoding-off </iscomment>
//   <iscomment> b2c-dx-disable-line unclosed-tag mismatched-closing-tag </iscomment>
// With no rule codes, the directive suppresses ALL rules on the target line.
const DISABLE_NEXT_LINE = 'b2c-dx-disable-next-line';
const DISABLE_LINE = 'b2c-dx-disable-line';

interface OpenTag {
  name: string;
  startOffset: number;
  endOffset: number;
}

// Required attributes per ISML tag. Each entry is either a single attribute
// name (required) or an array of alternatives ("one of these is required",
// e.g. <isinclude> needs template OR url). Only tags with a meaningful,
// well-defined requirement are listed — absence means "no attribute check".
const REQUIRED_ATTRIBUTES: Record<string, Array<string | string[]>> = {
  isif: ['condition'],
  iselseif: ['condition'],
  isloop: [
    ['items', 'iterator', 'begin'],
    ['alias', 'var', 'end'],
  ],
  isinclude: [['template', 'url']],
  ismodule: ['template', 'name'],
  isslot: ['id', 'context', 'description'],
  isdecorate: ['template'],
  isset: ['name', 'value'],
  isprint: ['value'],
  isredirect: ['location'],
  isstatus: ['value'],
};

/**
 * Parse the attribute names present on a tag from its raw source (e.g.
 * `<isinclude template="x" sf-toolkit="off"/>`). Returns a Set of lowercased
 * attribute names and a map of name→raw value (value undefined for valueless
 * attributes). Bounded regex — the tag source is a single element, already
 * delimited by the scanner.
 */
function parseTagAttributes(tagSource: string): {names: Set<string>; values: Map<string, string>} {
  const names = new Set<string>();
  const values = new Map<string, string>();
  // name  |  optional = "double" | 'single' | bare
  const attrRe = /([a-zA-Z_][\w-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>/]+))?/g;
  // Skip the leading `<tagname` so it isn't read as an attribute.
  const afterName = tagSource.replace(/^<\s*[a-zA-Z][\w-]*/, '');
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(afterName)) !== null) {
    const name = match[1].toLowerCase();
    names.add(name);
    if (match[2] !== undefined) {
      const raw = match[2];
      const unquoted =
        raw.length >= 2 && (raw[0] === '"' || raw[0] === "'") && raw[0] === raw[raw.length - 1]
          ? raw.slice(1, -1)
          : raw;
      values.set(name, unquoted);
    }
  }
  return {names, values};
}

/** Human-readable label for a required-attribute entry. */
function describeRequirement(requirement: string | string[]): string {
  return Array.isArray(requirement) ? requirement.join(' or ') : requirement;
}

/**
 * Attribute-level checks for a single open (or self-closing) tag: required
 * attributes and the `encoding="off"` output-encoding warning. Structural
 * nesting is handled separately in collectIsmlDiagnostics.
 */
function collectAttributeDiagnostics(
  name: string,
  tagSource: string,
  startOffset: number,
  endOffset: number,
): IsmlDiagnostic[] {
  const diagnostics: IsmlDiagnostic[] = [];
  const required = REQUIRED_ATTRIBUTES[name];
  if (!required) return diagnostics;

  const {names, values} = parseTagAttributes(tagSource);

  for (const requirement of required) {
    const satisfied = Array.isArray(requirement) ? requirement.some((alt) => names.has(alt)) : names.has(requirement);
    if (!satisfied) {
      diagnostics.push({
        code: 'missing-required-attribute',
        message: `<${name}> is missing required attribute "${describeRequirement(requirement)}".`,
        startOffset,
        endOffset,
        severity: 'error',
      });
    }
  }

  // Disabling output encoding is a stored-XSS risk; surface it so it is a
  // deliberate, reviewed choice. A warning (idiomatic for a security lint, and
  // matching Prophet's `encoding-off-warn`), but this rule is disabled by
  // default (see DEFAULT_DISABLED_RULES) because it is legitimate and common in
  // real storefronts — teams opt in via disabledRules.
  if (values.get('encoding')?.toLowerCase() === 'off') {
    diagnostics.push({
      code: 'encoding-off',
      message: `<${name}> sets encoding="off", which disables output escaping. Ensure the value is trusted (XSS risk).`,
      startOffset,
      endOffset,
      severity: 'warning',
    });
  }

  return diagnostics;
}

/**
 * Build a line-start offset index so we can map a character offset to its
 * 0-based line number with a binary search.
 */
function buildLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineOfOffset(lineStarts: number[], offset: number): number {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Parse inline suppression directives and drop the diagnostics they cover.
 *
 * A directive lives inside an ISML comment on its own concern:
 *   `b2c-dx-disable-next-line [code...]` suppresses the FOLLOWING line;
 *   `b2c-dx-disable-line [code...]` suppresses the line the directive is ON.
 * With no codes listed, every rule on the target line is suppressed; otherwise
 * only the listed codes are.
 */
function applySuppressions(text: string, diagnostics: IsmlDiagnostic[]): IsmlDiagnostic[] {
  if (!text.includes('b2c-dx-disable')) return diagnostics;

  const lineStarts = buildLineStarts(text);
  // line number -> set of suppressed codes, or 'all'
  const suppressed = new Map<number, Set<string> | 'all'>();

  const directiveRe = new RegExp(`(${DISABLE_NEXT_LINE}|${DISABLE_LINE})([^\\n<]*)`, 'g');
  let match: RegExpExecArray | null;
  while ((match = directiveRe.exec(text)) !== null) {
    const kind = match[1];
    const codes = match[2]
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    const directiveLine = lineOfOffset(lineStarts, match.index);
    const targetLine = kind === DISABLE_NEXT_LINE ? directiveLine + 1 : directiveLine;

    if (codes.length === 0) {
      suppressed.set(targetLine, 'all');
    } else {
      const existing = suppressed.get(targetLine);
      if (existing === 'all') continue;
      const set = existing ?? new Set<string>();
      codes.forEach((c) => set.add(c));
      suppressed.set(targetLine, set);
    }
  }

  if (suppressed.size === 0) return diagnostics;

  return diagnostics.filter((d) => {
    const line = lineOfOffset(lineStarts, d.startOffset);
    const rule = suppressed.get(line);
    if (!rule) return true;
    if (rule === 'all') return false;
    return !rule.has(d.code);
  });
}

export function collectIsmlDiagnostics(text: string): IsmlDiagnostic[] {
  const diagnostics: IsmlDiagnostic[] = [];
  const stack: OpenTag[] = [];

  for (const token of scanIsmlTags(text)) {
    if (!token.isClosing) {
      // Attribute-level checks apply to any opening/self-closing tag.
      const tagSource = text.slice(token.startOffset, token.endOffset);
      diagnostics.push(...collectAttributeDiagnostics(token.name, tagSource, token.startOffset, token.endOffset));

      if (VOID_TAGS.has(token.name) && !token.isSelfClosing) {
        diagnostics.push({
          code: 'void-tag-not-self-closing',
          message: `ISML void tag <${token.name}> should be self-closing.`,
          startOffset: token.startOffset,
          endOffset: token.endOffset,
          severity: 'warning',
        });
      }

      if (!token.isSelfClosing && !VOID_TAGS.has(token.name)) {
        stack.push({name: token.name, startOffset: token.startOffset, endOffset: token.endOffset});
      }
      continue;
    }

    if (VOID_TAGS.has(token.name)) {
      diagnostics.push({
        code: 'void-closing-tag',
        message: `ISML void tag </${token.name}> is not valid.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
      continue;
    }

    if (stack.length === 0) {
      diagnostics.push({
        code: 'unexpected-closing-tag',
        message: `Unexpected closing tag </${token.name}>.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
      continue;
    }

    const matchingIndex = stack.map((item) => item.name).lastIndexOf(token.name);
    if (matchingIndex < 0) {
      diagnostics.push({
        code: 'unexpected-closing-tag',
        message: `Unexpected closing tag </${token.name}>.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
      continue;
    }

    if (matchingIndex !== stack.length - 1) {
      const expected = stack[stack.length - 1];
      diagnostics.push({
        code: 'mismatched-closing-tag',
        message: `Mismatched closing tag </${token.name}>. Expected </${expected.name}>.`,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        severity: 'error',
      });
    }

    for (let i = stack.length - 1; i > matchingIndex; i--) {
      const unclosed = stack[i];
      diagnostics.push({
        code: 'unclosed-tag',
        message: `Tag <${unclosed.name}> is not closed.`,
        startOffset: unclosed.startOffset,
        endOffset: unclosed.endOffset,
        severity: 'error',
      });
    }

    stack.length = matchingIndex;
  }

  for (const unclosed of stack) {
    diagnostics.push({
      code: 'unclosed-tag',
      message: `Tag <${unclosed.name}> is not closed.`,
      startOffset: unclosed.startOffset,
      endOffset: unclosed.endOffset,
      severity: 'error',
    });
  }

  return applySuppressions(text, diagnostics);
}

function extractTagName(message: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(message);
  return match?.[1];
}

function makeSelfClosingTagSnippet(tagSource: string): string | undefined {
  if (!tagSource.endsWith('>') || /\/\s*>$/.test(tagSource)) return undefined;

  const gtIndex = tagSource.lastIndexOf('>');
  let insertIndex = gtIndex;
  while (insertIndex > 0 && /\s/.test(tagSource[insertIndex - 1])) {
    insertIndex--;
  }

  return `${tagSource.slice(0, insertIndex)}/${tagSource.slice(insertIndex)}`;
}

export function getIsmlQuickFixes(text: string, diagnostic: IsmlDiagnostic): IsmlQuickFix[] {
  const fixes: IsmlQuickFix[] = [];

  const shouldSelfCloseTagName = extractTagName(
    diagnostic.message,
    /^ISML void tag <([a-z][\w-]*)> should be self-closing\.$/i,
  );
  if (shouldSelfCloseTagName) {
    const source = text.slice(diagnostic.startOffset, diagnostic.endOffset);
    const replacement = makeSelfClosingTagSnippet(source);
    if (replacement) {
      fixes.push({
        title: `Make <${shouldSelfCloseTagName}> self-closing`,
        edits: [{startOffset: diagnostic.startOffset, endOffset: diagnostic.endOffset, newText: replacement}],
      });
    }
  }

  const invalidVoidClosingTagName = extractTagName(
    diagnostic.message,
    /^ISML void tag <\/([a-z][\w-]*)> is not valid\.$/i,
  );
  if (invalidVoidClosingTagName) {
    fixes.push({
      title: `Replace </${invalidVoidClosingTagName}> with <${invalidVoidClosingTagName}/>`,
      edits: [
        {
          startOffset: diagnostic.startOffset,
          endOffset: diagnostic.endOffset,
          newText: `<${invalidVoidClosingTagName}/>`,
        },
      ],
    });
  }

  // Always offer to suppress this diagnostic inline via an ISML comment
  // directive on the preceding line (matching its indentation).
  fixes.push(buildSuppressionFix(text, diagnostic));

  return fixes;
}

/**
 * Build a quick-fix that inserts a `b2c-dx-disable-next-line <code>` directive
 * (inside an ISML comment) on the line above the diagnostic, indented to match.
 */
function buildSuppressionFix(text: string, diagnostic: IsmlDiagnostic): IsmlQuickFix {
  const lineStart = text.lastIndexOf('\n', diagnostic.startOffset - 1) + 1;
  const indentMatch = /^[ \t]*/.exec(text.slice(lineStart, diagnostic.startOffset));
  const indent = indentMatch ? indentMatch[0] : '';
  const directive = `${indent}<iscomment> ${DISABLE_NEXT_LINE} ${diagnostic.code} </iscomment>\n`;
  return {
    title: `Suppress "${diagnostic.code}" for this line`,
    edits: [{startOffset: lineStart, endOffset: lineStart, newText: directive}],
  };
}
