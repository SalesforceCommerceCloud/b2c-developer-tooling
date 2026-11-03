/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Models of how MCP clients rank deferred tools for a tool-search query, used to guard
 * that tool names, descriptions and search hints contain the words users and models search with.
 */

export interface ListedTool {
  _meta?: Record<string, unknown>;
  description?: string;
  inputSchema: {properties?: Record<string, unknown>};
  name: string;
  title?: string;
}

/** NLTK English stop words, as the `bm25` crate's default tokenizer removes them. */
const STOP_WORDS = new Set(
  (
    "i me my myself we our ours ourselves you you're you've you'll you'd your yours yourself yourselves he him his " +
    "himself she she's her hers herself it it's its itself they them their theirs themselves what which who whom this " +
    "that that'll these those am is are was were be been being have has had having do does did doing a an the and but " +
    'if or because as until while of at by for with about against between into through during before after above below ' +
    'to from up down in out on off over under again further then once here there when where why how all any both each ' +
    'few more most other some such no nor not only own same so than too very s t can will just don should now d ll m o ' +
    "re ve y ain aren couldn didn doesn hadn hasn haven isn ma mightn mustn needn shan shouldn wasn weren won wouldn don't " +
    "should've aren't couldn't didn't doesn't hadn't hasn't haven't isn't mightn't mustn't needn't shan't shouldn't " +
    "wasn't weren't won't wouldn't"
  ).split(' '),
);

/**
 * Codex Snowball-stems tokens; folding plurals is enough to match its rankings for our queries
 * (no stemming at all drops "breakpoints", "orders" and "customers" matches).
 */
function stem(word: string): string {
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

const segmenter = new Intl.Segmenter('en', {granularity: 'word'});

/** Approximates the `bm25` crate's default English tokenizer: lowercase, Unicode word boundaries, stop words, stems. */
function codexTokens(text: string): string[] {
  const tokens: string[] = [];
  for (const {isWordLike, segment} of segmenter.segment(text.toLowerCase())) {
    if (isWordLike && !STOP_WORDS.has(segment)) tokens.push(stem(segment));
  }
  return tokens;
}

/**
 * Codex: BM25 (k1 1.2, b 0.75) over each tool's search text, as `build_mcp_search_text` assembles it:
 * namespaced and plain tool names, server name, title, description, server instructions (the first 1000
 * bytes for agent plugins) and sorted input property names. Underscored names stay single tokens.
 */
export function rankCodex(tools: ListedTool[], query: string, serverName: string, instructions: string): string[] {
  const documents = tools.map((tool) => {
    const parts = [
      `${serverName}${tool.name}`,
      tool.name,
      tool.name,
      serverName,
      tool.title,
      tool.description,
      instructions.slice(0, 1000),
      ...Object.keys(tool.inputSchema.properties ?? {}).sort(),
    ];
    return {name: tool.name, tokens: codexTokens(parts.filter(Boolean).join(' '))};
  });
  let totalLength = 0;
  for (const document of documents) totalLength += document.tokens.length;
  const averageLength = totalLength / documents.length;
  const containing = new Map<string, number>();
  for (const document of documents) {
    for (const token of new Set(document.tokens)) containing.set(token, (containing.get(token) ?? 0) + 1);
  }
  const queryTokens = codexTokens(query);
  return documents
    .map((document) => {
      let score = 0;
      for (const token of queryTokens) {
        const frequency = document.tokens.filter((candidate) => candidate === token).length;
        if (frequency === 0) continue;
        const count = containing.get(token) ?? 0;
        const idf = Math.log(1 + (documents.length - count + 0.5) / (count + 0.5));
        score += (idf * frequency * 2.2) / (frequency + 1.2 * (0.25 + (0.75 * document.tokens.length) / averageLength));
      }
      return {name: document.name, score};
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.name);
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);
}

/**
 * Claude Code: per query word, name parts (server and tool name split on spaces, underscores and dots)
 * score 12 exact or 6 partial, whole names 12 or 4, a whole-word search hint match 4 and a whole-word
 * description match 2. No stemming or stop words.
 */
export function rankClaudeCode(tools: ListedTool[], query: string, serverName: string): string[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return tools
    .map((tool) => {
      const coarseParts = [serverName, tool.name].map((part) => part.toLowerCase());
      const parts = coarseParts.flatMap((part) => part.split(/[\s_.]+/)).filter(Boolean);
      const full = parts.join(' ');
      const description = (tool.description ?? '').toLowerCase();
      const hint = typeof tool._meta?.['anthropic/searchHint'] === 'string' ? tool._meta['anthropic/searchHint'] : '';
      const searchHint = hint.slice(0, 4096).toLowerCase();
      let score = 0;
      for (const term of terms) {
        const word = new RegExp(String.raw`\b${escapeRegExp(term)}\b`);
        if (parts.includes(term)) score += 12;
        else if (parts.some((part) => part.includes(term))) score += 6;
        if (coarseParts.includes(term)) score += 12;
        else if (coarseParts.some((part) => part.includes(term))) score += 4;
        if (full.includes(term) && score === 0) score += 3;
        if (searchHint && word.test(searchHint)) score += 4;
        if (word.test(description)) score += 2;
      }
      return {name: tool.name, score};
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.name);
}
