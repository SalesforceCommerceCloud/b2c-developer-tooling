'use strict';

const assert = require('node:assert/strict');
const ts = require('typescript');

// Word-based completion entries from tsserver use ScriptElementKind.warning
// (VS Code maps them to CompletionItemKind.Text). Typed API members use
// memberFunctionElement, memberVariableElement, etc. — filtering warning kind
// avoids false greens when a name also appears as literal text in the fixture.
const WORD_BASED_COMPLETION_KIND = ts.ScriptElementKind.warning;

/**
 * Collects the human-readable hover text from a QuickInfo response.
 * Inferred-usage notes live in `documentation`; type/display text may also
 * appear in `displayParts`, so both are joined for pattern matching.
 *
 * @param {import('typescript').QuickInfo | undefined} info
 * @returns {string}
 */
function quickInfoText(info) {
  return [...(info?.displayParts ?? []), ...(info?.documentation ?? [])].map((p) => p.text).join('');
}

/**
 * @param {import('typescript').LanguageService} languageService or proxy
 * @param {string} fileName
 * @param {number} position
 * @param {RegExp|string} expectedTypePattern - must appear in hover text
 */
function assertInferredHover(languageService, fileName, position, expectedTypePattern) {
  const info = languageService.getQuickInfoAtPosition(fileName, position);
  const text = quickInfoText(info);
  assert.ok(
    text.includes('Inferred from usage'),
    `expected an "Inferred from usage" hover note at ${fileName}:${position}, got: ${text}`,
  );
  const matches =
    expectedTypePattern instanceof RegExp ? expectedTypePattern.test(text) : text.includes(expectedTypePattern);
  assert.ok(matches, `expected hover to match ${expectedTypePattern}, got: ${text}`);
}

/**
 * Assert hover has NO "Inferred from usage" note (silence).
 *
 * @param {import('typescript').LanguageService} languageService or proxy
 * @param {string} fileName
 * @param {number} position
 */
function assertNoInferredHover(languageService, fileName, position) {
  const info = languageService.getQuickInfoAtPosition(fileName, position);
  const docText = (info?.documentation ?? []).map((p) => p.text).join('');
  assert.ok(
    !docText.includes('Inferred from usage'),
    `expected no inferred-usage hover note at ${fileName}:${position}, got: ${docText}`,
  );
}

/**
 * Returns completion entry names, optionally excluding word-based suggestions.
 *
 * @param {import('typescript').CompletionEntry[]} entries
 * @param {boolean} typedOnly
 * @returns {string[]}
 */
function completionNames(entries, typedOnly) {
  const filtered = typedOnly ? entries.filter((e) => e.kind !== WORD_BASED_COMPLETION_KIND) : entries;
  return filtered.map((e) => e.name);
}

/**
 * @param {import('typescript').LanguageService} languageService or proxy
 * @param {string} fileName
 * @param {number} position
 * @param {object} opts
 * @param {string[]} opts.required - member names that must be present
 * @param {string[]} [opts.forbidden] - must not be present
 * @param {boolean} [opts.typedOnly=true] - if true, ignore word-based (warning kind) entries
 */
function assertTypedCompletions(languageService, fileName, position, opts) {
  const {required, forbidden = [], typedOnly = true} = opts;
  const completions = languageService.getCompletionsAtPosition(fileName, position, undefined);
  const names = completionNames(completions?.entries ?? [], typedOnly);

  for (const name of required) {
    assert.ok(names.includes(name), `expected ${name} among typed completions, got: ${names.join(', ')}`);
  }
  for (const name of forbidden) {
    assert.ok(!names.includes(name), `expected ${name} to be absent from typed completions, got: ${names.join(', ')}`);
  }
}

/**
 * Finds the byte offset of `needle` in `sourceText`.
 *
 * @param {string} sourceText
 * @param {string} needle
 * @returns {number}
 */
function positionOf(sourceText, needle) {
  const idx = sourceText.indexOf(needle);
  if (idx === -1) {
    throw new Error(`needle not found in source: ${needle}`);
  }
  return idx;
}

module.exports = {
  assertInferredHover,
  assertNoInferredHover,
  assertTypedCompletions,
  completionNames,
  positionOf,
  quickInfoText,
  WORD_BASED_COMPLETION_KIND,
};
