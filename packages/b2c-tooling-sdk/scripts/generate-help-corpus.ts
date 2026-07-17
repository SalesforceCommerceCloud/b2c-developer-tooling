/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generates the **Salesforce Help** documentation corpus (help.salesforce.com
 * administration + merchandising content) from a local clone of the
 * `content-commerce-cloud` DITA source repository.
 *
 * Unlike the Developer Center guides (which fetch raw `.md` from
 * developer.salesforce.com at read time), Help content is fully JS-rendered and
 * exposes no fetchable source. So this generator does two things:
 *
 *  1. Converts the DITA topic XML to Markdown (one `.md` per published Help
 *     article) and packs the tree into `docs/help-content.tar.gz` — the single
 *     committed artifact (instead of ~1000 loose files). The docs build extracts
 *     it into the VitePress output at `<base>/help/<category>/<id>.md` (see the
 *     docs `buildEnd` hook), where it is served verbatim as the raw `.md` that
 *     `b2c docs read` fetches (`sourceUrl`). Extraction is production-build only
 *     (dev never serves it). The generator stages the tree under the SDK's `tmp/`
 *     purely to build the tarball; that staging dir is git-ignored.
 *  2. Emits the lightweight bundled search index at `data/help/index.json` (title,
 *     section headings, `<shortdesc>` summary, merged-section keywords, related
 *     entry ids, and the two URLs). The index ships in the SDK package; content
 *     does not.
 *
 * ## DITA chunking
 *
 * Help publishes ONE article from MANY DITA topics via `chunk="to-content"`: a
 * chunk-root topicref becomes a published page (its id → the `cc.<id>.htm` URL),
 * and its non-chunked descendants merge into that page as heading-shifted
 * sections. A nested `chunk="to-content"` starts a new page. This generator walks
 * the ditamaps with those semantics so the corpus cardinality matches the real
 * site navigation (no phantom per-fragment entries), while the merged sections'
 * titles/shortdescs still enrich the parent page's searchable signal.
 * Non-chunked child pages remain separate entries and are also emitted as the
 * parent's related-content list, matching the linked cards on Salesforce Help.
 * Nodes marked `otherprops="future"` are excluded from both map traversal and
 * topic conversion so unpublished content does not leak into the corpus.
 *
 * ## Category assignment
 *
 * Each leaf ditamap is classed `help-admin` (platform ops: import/export, jobs,
 * replication, security, Account Manager, permissions, logs, inventory ops) or
 * `help-merchant` (merchandising: catalogs, products, promotions, search, content,
 * analytics, SEO). A few maps are excluded (Data Cloud, Agentforce, Einstein, CDP
 * connector) — that content is feature-marketing or covered by other corpora.
 *
 * ## URL derivation
 *
 *   topic id `b2c_ab_testing`
 *     -> url:       https://help.salesforce.com/s/articleView?id=cc.b2c_ab_testing.htm&type=5
 *     -> sourceUrl: https://salesforcecommercecloud.github.io/b2c-developer-tooling/help/<category>/b2c_ab_testing.md
 *
 * The id is read from the topic's root `@id` (not the filename) because ~1% of
 * files have a basename that differs from the published id; a handful with an
 * empty id are skipped (they are not standalone-published).
 *
 * Usage:
 *   CONTENT_COMMERCE_CLOUD_REPO=/path/to/content-commerce-cloud \
 *     pnpm --filter @salesforce/b2c-tooling-sdk run generate:help-corpus
 *
 * Defaults to ~/code/content-commerce-cloud when the env var is unset.
 */

import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

import {XMLParser} from 'fast-xml-parser';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SDK_ROOT, '../..');
const HELP_DATA_DIR = path.join(SDK_ROOT, 'data/help');
// The converted .md tree is packed into this committed tarball (one file, not
// ~1000). The docs build extracts it into its output at build time (see the docs
// VitePress `buildEnd` hook). We stage the tree under the SDK's build dir purely
// to create the tarball — it is not itself committed or served.
const STAGING_DIR = path.join(SDK_ROOT, 'tmp/help-content');
const CONTENT_DIR = path.join(STAGING_DIR, 'help');
const TARBALL = path.join(REPO_ROOT, 'docs/help-content.tar.gz');

const PAGES_BASE = 'https://salesforcecommercecloud.github.io/b2c-developer-tooling/help';
const helpArticleUrl = (id: string): string => `https://help.salesforce.com/s/articleView?id=cc.${id}.htm&type=5`;
const pagesSourceUrl = (category: string, id: string): string => `${PAGES_BASE}/${category}/${id}.md`;

// ---------------------------------------------------------------------------
// Category assignment (leaf ditamap -> corpus category, or excluded)
// ---------------------------------------------------------------------------
type HelpCategory = 'help-admin' | 'help-merchant';

/** Maps whose content is intentionally NOT indexed (feature marketing / covered elsewhere). */
const EXCLUDED_MAPS = new Set(['b2c_data_cloud', 'b2c_agentforce', 'b2c_einstein', 'b2c_cdp_connector']);

/** Aggregator maps that only compose other maps via <mapref>; never walked directly. */
const AGGREGATOR_MAPS = new Set(['b2c_merchandiser_administrator', 'b2c_merch', 'b2c_administer']);

const ADMIN_MAPS = new Set([
  'b2c_getting_started',
  'b2c_permissions',
  'b2c_jobs_refactored',
  'b2c_import_export',
  'b2c_replication',
  'b2c_commerce_security_guide',
  'b2c_account_manager',
  'b2c_log_center_central',
  'b2c_data_protection_and_privacy',
  'b2c_storefront_toolkit',
  'b2c_openai_feed',
  'b2c_salesforce_payments',
  'b2c_inventory', // OCI integration/ops content -> admin, not merchandising
]);

const MERCHANT_MAPS = new Set([
  'b2c_catalogs',
  'b2c_categories',
  'b2c_products',
  'b2c_change_history',
  'b2c_image_management',
  'b2c_price_books',
  'b2c_recommendations',
  'b2c_page_designer_merchandising',
  'b2c_content_blocks',
  'b2c_content',
  'b2c_promotions',
  'b2c_qualifiers',
  'b2c_gift_certificates',
  'b2c_content_slots',
  'b2c_customers',
  'b2c_search',
  'b2c_merchant_agent',
  'b2c_visual_merchandising',
  'b2c_seo',
  'b2c_acs_admin_guide',
  'b2c_ordering',
  'b2c_bm_stores',
  'b2c_analytics',
  'b2c_active_merchandising',
  'b2c_ab_testing',
  'b2c_marketing',
]);

function categoryFor(mapName: string): HelpCategory | null {
  if (EXCLUDED_MAPS.has(mapName) || AGGREGATOR_MAPS.has(mapName)) return null;
  if (ADMIN_MAPS.has(mapName)) return 'help-admin';
  if (MERCHANT_MAPS.has(mapName)) return 'help-merchant';
  return null; // unclassified leaf map -> excluded until explicitly placed
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HelpEntry {
  id: string;
  title: string;
  category: HelpCategory;
  filePath: string; // relative to HELP_DATA_DIR's sibling docs/public/help — kept for parity/debug
  url: string;
  sourceUrl: string;
  headings?: string;
  summary?: string;
  keywords?: string[];
  relatedEntries?: string[];
}

interface SearchIndex {
  version: string;
  generatedAt: string;
  entries: HelpEntry[];
}

/** A preserveOrder XML node: one tag key (+ optional ':@' attrs), or {'#text'}. */
type XmlNode = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Repo resolution
// ---------------------------------------------------------------------------
function resolveContentRepo(): string {
  const env = process.env.CONTENT_COMMERCE_CLOUD_REPO;
  const repo = env ? path.resolve(env) : path.join(os.homedir(), 'code', 'content-commerce-cloud');
  const base = path.join(repo, 'content/ht/en-us/b2c_merchandiser_administrator');
  if (!fs.existsSync(base)) {
    throw new Error(
      `content-commerce-cloud English content not found at ${base}. ` +
        `Clone the repo and set CONTENT_COMMERCE_CLOUD_REPO to its root (default: ~/code/content-commerce-cloud).`,
    );
  }
  return base;
}

// ---------------------------------------------------------------------------
// DITA -> Markdown converter
// ---------------------------------------------------------------------------
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  trimValues: false,
  processEntities: true,
  htmlEntities: true,
});

const tagOf = (node: XmlNode): string => Object.keys(node).find((k) => k !== ':@') as string;
const attrsOf = (node: XmlNode): Record<string, string> => (node[':@'] as Record<string, string>) ?? {};
const isFuture = (node: XmlNode): boolean => /(^|\s)future($|\s)/i.test(attrsOf(node)['@_otherprops']?.trim() ?? '');
const childrenOf = (node: XmlNode): XmlNode[] =>
  ((node[tagOf(node)] as XmlNode[]) ?? []).filter((child) => !isFuture(child));
const findChild = (arr: XmlNode[] | undefined, name: string): XmlNode | undefined =>
  (arr ?? []).find((n) => tagOf(n) === name);
const findChildren = (arr: XmlNode[] | undefined, name: string): XmlNode[] =>
  (arr ?? []).filter((n) => tagOf(n) === name);
const idFromHref = (href: string | undefined): string | null => href?.match(/([a-z0-9_]+)\.xml$/i)?.[1] ?? null;

/** Collapse insignificant XML pretty-print whitespace into single spaces. */
function textEsc(s: string): string {
  return String(s)
    .replace(/\r/g, '')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');
}

/** Render mixed inline content (text + <xref>/<uicontrol>/<codeph>/…) to Markdown. */
function inline(children: XmlNode[] | undefined): string {
  if (!children) return '';
  let out = '';
  for (const node of children) {
    const tag = tagOf(node);
    if (tag === '#text') {
      out += textEsc(node['#text'] as string);
      continue;
    }
    const kids = childrenOf(node);
    switch (tag) {
      case 'b':
      case 'uicontrol':
      case 'wintitle':
      case 'parmname':
        out += `**${inline(kids)}**`;
        break;
      case 'menucascade':
        out += `**${menuCascade(kids)}**`;
        break;
      case 'i':
      case 'varname':
        out += `*${inline(kids)}*`;
        break;
      case 'u':
        out += inline(kids);
        break;
      case 'codeph':
      case 'filepath':
      case 'userinput':
      case 'systemoutput':
      case 'cmdname':
        out += `\`${plain(kids)}\``;
        break;
      case 'xref':
        out += mdLink(inline(kids) || attrsOf(node)['@_href'] || '', attrsOf(node)['@_href'] ?? '');
        break;
      case 'ph':
      case 'keyword':
      case 'term':
      case 'cite':
        out += inline(kids);
        break;
      case 'image':
        out += `_(image: ${plain(kids) || 'image'})_`;
        break;
      case 'sup':
        out += `^${inline(kids)}^`;
        break;
      case 'sub':
        out += `~${inline(kids)}~`;
        break;
      case 'q':
        out += `"${inline(kids)}"`;
        break;
      default:
        out += inline(kids);
    }
  }
  return out;
}

/** <menucascade> -> "A > B > C" from its <uicontrol> children. */
function menuCascade(kids: XmlNode[]): string {
  const parts: string[] = [];
  for (const n of kids) if (tagOf(n) === 'uicontrol') parts.push(inline(childrenOf(n)));
  return parts.join(' > ');
}

/** Flatten to text only (collapses whitespace); used for inline code. */
function plain(children: XmlNode[] | undefined): string {
  if (!children) return '';
  let out = '';
  for (const n of children) {
    const t = tagOf(n);
    out += t === '#text' ? String(n['#text']) : plain(childrenOf(n));
  }
  return out.replace(/[ \t]*\n[ \t]*/g, ' ').trim();
}

/** Newline-preserving, dedented text extraction for <codeblock>/<pre>. */
function rawText(children: XmlNode[] | undefined): string {
  if (!children) return '';
  let out = '';
  for (const n of children) {
    const t = tagOf(n);
    out += t === '#text' ? String(n['#text']) : rawText(childrenOf(n));
  }
  const lines = out.replace(/\r/g, '').replace(/\t/g, '    ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(common)).join('\n');
}

/** Cross-references to other help topics (`*.xml`) rewrite to the live Help URL. */
function mdLink(label: string, href: string): string {
  if (!href) return label;
  const m = href.match(/([a-z0-9_]+)\.xml$/i);
  if (m) return `[${label}](${helpArticleUrl(m[1])})`;
  return `[${label}](${href})`;
}

const BLOCK_TAGS = new Set([
  'p',
  'ul',
  'ol',
  'sl',
  'table',
  'simpletable',
  'codeblock',
  'pre',
  'note',
  'dl',
  'parml',
  'fig',
  'section',
  'steps',
  'steps-unordered',
  'choices',
  'choicetable',
  'substeps',
]);
/** Wrapper/container elements recursed as blocks (not buffered as inline). */
const CONTAINER_TAGS = new Set([
  'conbody',
  'refbody',
  'taskbody',
  'context',
  'result',
  'postreq',
  'prereq',
  'info',
  'stepresult',
  'stepxmp',
  'refsyn',
  'bodydiv',
  'sectiondiv',
]);
const hasBlockChildren = (kids: XmlNode[] | undefined): boolean =>
  Array.isArray(kids) && kids.some((k) => BLOCK_TAGS.has(tagOf(k)));

/**
 * Render block-level content to Markdown.
 * @param baseLevel heading level for this topic's sections (2 for a page root;
 *   deeper for merged sub-topics so their headings nest under the parent page).
 */
function blocks(children: XmlNode[] | undefined, depth = 0, baseLevel = 2): string {
  if (!children) return '';
  const out: string[] = [];
  // Buffer runs of consecutive inline nodes so mixed content ("<xref>x</xref>: y")
  // renders as one line via inline() (which emits links) instead of being split
  // across blocks (which would drop hrefs and inject blank lines).
  let inlineBuf: XmlNode[] = [];
  const flushInline = (): void => {
    if (!inlineBuf.length) return;
    const t = inline(inlineBuf).replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
    inlineBuf = [];
  };

  for (const node of children) {
    const tag = tagOf(node);
    if (tag === '#text') {
      inlineBuf.push(node);
      continue;
    }
    if (!BLOCK_TAGS.has(tag) && tag !== 'title' && !CONTAINER_TAGS.has(tag)) {
      inlineBuf.push(node);
      continue;
    }
    flushInline();
    const kids = childrenOf(node);
    const attrs = attrsOf(node);
    switch (tag) {
      case 'title':
        out.push(`${'#'.repeat(Math.min(6, baseLevel + depth))} ${inline(kids)}`);
        break;
      case 'p':
        out.push(inline(kids).trim());
        break;
      case 'section':
      case 'conbody':
      case 'refbody':
      case 'taskbody':
      case 'context':
      case 'result':
      case 'postreq':
      case 'prereq':
      case 'info':
      case 'stepresult':
      case 'stepxmp':
      case 'refsyn':
      case 'bodydiv':
      case 'sectiondiv':
        out.push(blocks(kids, tag === 'section' ? depth + 1 : depth, baseLevel));
        break;
      case 'note': {
        const type = attrs['@_type'] || 'note';
        const body = (hasBlockChildren(kids) ? blocks(kids, depth, baseLevel) : inline(kids))
          .trim()
          .replace(/\n/g, '\n> ');
        out.push(`> **${type[0].toUpperCase()}${type.slice(1)}:** ${body}`);
        break;
      }
      case 'ul':
      case 'sl':
        out.push(renderList(kids, depth, false, baseLevel));
        break;
      case 'ol':
        out.push(renderList(kids, depth, true, baseLevel));
        break;
      case 'steps':
      case 'steps-unordered':
        out.push(renderSteps(kids, depth, tag === 'steps', baseLevel, 'step'));
        break;
      case 'substeps':
        out.push(renderSteps(kids, depth, true, baseLevel, 'substep'));
        break;
      case 'codeblock':
      case 'pre':
        out.push('```\n' + rawText(kids) + '\n```');
        break;
      case 'table':
      case 'simpletable':
        out.push(renderTable(node));
        break;
      case 'choicetable':
        out.push(renderChoicetable(node));
        break;
      case 'choices':
        out.push(renderList(kids, depth, false, baseLevel, 'choice'));
        break;
      case 'fig':
        out.push(blocks(kids, depth, baseLevel));
        break;
      case 'dl':
        out.push(renderDl(kids));
        break;
      case 'parml':
        out.push(renderParml(kids));
        break;
      default:
        if (hasBlockChildren(kids)) out.push(blocks(kids, depth, baseLevel));
        else {
          const t = inline(kids).trim();
          if (t) out.push(t);
        }
    }
  }
  flushInline();
  return out.filter(Boolean).join('\n\n');
}

function renderList(kids: XmlNode[], depth: number, ordered: boolean, baseLevel: number, itemTag?: string): string {
  const items: string[] = [];
  let i = 1;
  for (const node of kids) {
    const t = tagOf(node);
    if (itemTag ? t !== itemTag : t !== 'li' && t !== 'sli') continue;
    const marker = ordered ? `${i++}.` : '-';
    const body = blocks(childrenOf(node), depth + 1, baseLevel)
      .trim()
      .replace(/\n/g, '\n   ');
    items.push(`${marker} ${body}`);
  }
  return items.join('\n');
}

function renderSteps(kids: XmlNode[], depth: number, ordered: boolean, baseLevel: number, stepTag: string): string {
  const items: string[] = [];
  let i = 1;
  for (const node of kids) {
    if (tagOf(node) !== stepTag) continue;
    let cmd = '';
    const extra: string[] = [];
    for (const sk of childrenOf(node)) {
      const t = tagOf(sk);
      if (t === 'cmd') cmd = inline(childrenOf(sk)).trim();
      else if (t !== '#text') extra.push(blocks([sk], depth + 1, baseLevel));
    }
    const marker = ordered ? `${i++}.` : '-';
    let body = cmd;
    if (extra.length) body += '\n\n   ' + extra.join('\n\n').replace(/\n/g, '\n   ');
    items.push(`${marker} ${body}`);
  }
  return items.join('\n');
}

function renderParml(kids: XmlNode[]): string {
  const lines: string[] = [];
  for (const node of kids) {
    if (tagOf(node) !== 'plentry') continue;
    let term = '';
    let def = '';
    for (const e of childrenOf(node)) {
      if (tagOf(e) === 'pt') term = inline(childrenOf(e)).trim();
      if (tagOf(e) === 'pd') def = blocks(childrenOf(e), 0, 6).trim();
    }
    lines.push(`**${term}** — ${def}`);
  }
  return lines.join('\n\n');
}

function renderDl(kids: XmlNode[]): string {
  const lines: string[] = [];
  for (const node of kids) {
    if (tagOf(node) !== 'dlentry') continue;
    let term = '';
    let def = '';
    for (const e of childrenOf(node)) {
      if (tagOf(e) === 'dt') term = inline(childrenOf(e)).trim();
      if (tagOf(e) === 'dd') def = blocks(childrenOf(e), 0, 6).trim();
    }
    lines.push(`**${term}**\n: ${def}`);
  }
  return lines.join('\n\n');
}

function renderChoicetable(node: XmlNode): string {
  const rows: string[][] = [['Option', 'Description']];
  for (const r of childrenOf(node)) {
    if (tagOf(r) !== 'chrow') continue;
    let opt = '';
    let desc = '';
    for (const c of childrenOf(r)) {
      if (tagOf(c) === 'choption') opt = inline(childrenOf(c)).trim();
      if (tagOf(c) === 'chdesc') desc = inline(childrenOf(c)).trim();
    }
    rows.push([opt, desc]);
  }
  const lines = ['| ' + rows[0].join(' | ') + ' |', '| --- | --- |'];
  for (const r of rows.slice(1)) lines.push('| ' + r.map((c) => c.replace(/\|/g, '\\|')).join(' | ') + ' |');
  return lines.join('\n');
}

function renderTable(node: XmlNode): string {
  const root = childrenOf(node);
  const tgroup = findChild(root, 'tgroup');
  const groupKids = tgroup ? childrenOf(tgroup) : root;
  const thead = findChild(groupKids, 'thead');
  const tbody = findChild(groupKids, 'tbody');
  const headerRows = thead ? tableRows(childrenOf(thead)) : [];
  const bodyRows = tbody ? tableRows(childrenOf(tbody)) : tableRows(groupKids);
  if (!headerRows.length && !bodyRows.length) return '';
  const cols = Math.max(...[...headerRows, ...bodyRows].map((r) => r.length), 1);
  const header = headerRows[0] || new Array(cols).fill('');
  const lines = ['| ' + header.map(cell).join(' | ') + ' |', '| ' + new Array(cols).fill('---').join(' | ') + ' |'];
  for (const r of headerRows.slice(1).concat(bodyRows)) {
    const padded = [...r];
    while (padded.length < cols) padded.push('');
    lines.push('| ' + padded.map(cell).join(' | ') + ' |');
  }
  return lines.join('\n');
}

const cell = (c: string): string => (c || '').replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim();

function tableRows(container: XmlNode[]): string[][] {
  const out: string[][] = [];
  for (const node of container) {
    if (tagOf(node) !== 'row') continue;
    const cells: string[] = [];
    for (const e of childrenOf(node)) {
      if (tagOf(e) === 'entry') cells.push(inline(childrenOf(e)).trim() || blocks(childrenOf(e), 0, 6).trim());
    }
    out.push(cells);
  }
  return out;
}

/** Collect this topic's own <section> titles (searchable heading signal). */
function extractSectionTitles(bodyKids: XmlNode[] | undefined): string[] {
  const hs: string[] = [];
  const walk = (kids: XmlNode[] | undefined): void => {
    for (const n of kids ?? []) {
      const t = tagOf(n);
      if (t === 'section') {
        const title = findChild(childrenOf(n), 'title');
        if (title) hs.push(inline(childrenOf(title)).trim());
        walk(childrenOf(n));
      } else if (Array.isArray(n[t])) {
        walk(childrenOf(n));
      }
    }
  };
  walk(bodyKids);
  return hs.filter(Boolean);
}

interface ParsedTopic {
  id: string;
  title: string;
  summary: string;
  ownSectionTitles: string[];
  renderBody: (baseLevel: number) => string;
}

function parseTopic(file: string): ParsedTopic | null {
  const tree = parser.parse(fs.readFileSync(file, 'utf-8')) as XmlNode[];
  const rootNode = tree.find((n) => ['concept', 'task', 'reference', 'topic', 'dita'].includes(tagOf(n)));
  if (!rootNode || isFuture(rootNode)) return null;
  const id = attrsOf(rootNode)['@_id'];
  if (!id) return null; // topics with no id are not standalone-published
  const kids = childrenOf(rootNode);
  const titleNode = findChild(kids, 'title');
  const descNode = findChild(kids, 'shortdesc');
  const title = titleNode ? inline(childrenOf(titleNode)).trim() : '(untitled)';
  const summary = descNode ? inline(childrenOf(descNode)).trim() : '';
  const bodyTag = ['conbody', 'taskbody', 'refbody', 'body'].find((b) => findChild(kids, b));
  const bodyNode = bodyTag ? findChild(kids, bodyTag) : undefined;
  const ownSectionTitles = bodyNode ? extractSectionTitles(childrenOf(bodyNode)) : [];
  return {
    id,
    title,
    summary,
    ownSectionTitles,
    renderBody: (baseLevel: number) => (bodyNode ? blocks(childrenOf(bodyNode), 0, baseLevel) : ''),
  };
}

// ---------------------------------------------------------------------------
// Ditamap chunk walking
// ---------------------------------------------------------------------------
interface Page {
  id: string;
  sections: Array<{id: string; depth: number}>;
  /** Direct child pages that Help renders as linked cards below this article. */
  relatedIds: string[];
}

/** Walk a ditamap into published pages (chunk-aware); merged sections carry depth. */
function pagesFromMap(mapsDir: string, mapName: string): Page[] {
  const p = path.join(mapsDir, `${mapName}.ditamap`);
  if (!fs.existsSync(p)) return [];
  const tree = parser.parse(fs.readFileSync(p, 'utf-8')) as XmlNode[];
  const mapNode = tree.find((n) => tagOf(n) === 'map');
  if (!mapNode) return [];
  const pages: Page[] = [];

  const walk = (node: XmlNode, chunkRoot: Page | null, parentPage: Page | null, depth: number): void => {
    const attrs = attrsOf(node);
    const id = idFromHref(attrs['@_href']);
    const chunk = attrs['@_chunk'];
    let nextRoot = chunkRoot;
    let nextParent = parentPage;
    let nextDepth = depth;
    if (id) {
      if (chunk === 'to-content') {
        const page: Page = {id, sections: [], relatedIds: []};
        pages.push(page);
        parentPage?.relatedIds.push(id);
        nextRoot = page;
        nextParent = page;
        nextDepth = 1;
      } else if (chunkRoot) {
        chunkRoot.sections.push({id, depth});
        nextRoot = chunkRoot;
        // This topic is merged into the chunk root rather than published as a
        // page, so any nested chunk starts a related page of the chunk root.
        nextParent = chunkRoot;
        nextDepth = depth + 1;
      } else {
        const page: Page = {id, sections: [], relatedIds: []};
        pages.push(page);
        parentPage?.relatedIds.push(id);
        nextRoot = null;
        nextParent = page;
        nextDepth = 1;
      }
    }
    for (const c of findChildren(childrenOf(node), 'topicref')) walk(c, nextRoot, nextParent, nextDepth);
  };

  for (const tr of findChildren(childrenOf(mapNode), 'topicref')) walk(tr, null, null, 0);
  return pages;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  const contentBase = resolveContentRepo();
  const mapsDir = path.join(contentBase, 'maps');
  const topicsDir = path.join(contentBase, 'topics');

  // Index every topic file by basename so section hrefs resolve regardless of dir.
  const fileById = new Map<string, string>();
  (function indexFiles(dir: string): void {
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) indexFiles(full);
      else if (e.name.endsWith('.xml')) fileById.set(e.name.replace(/\.xml$/, ''), full);
    }
  })(topicsDir);

  const resolveTopic = (id: string): ParsedTopic | null => {
    const file = fileById.get(id);
    return file ? parseTopic(file) : null;
  };

  // Reset outputs.
  fs.rmSync(STAGING_DIR, {recursive: true, force: true});
  fs.mkdirSync(HELP_DATA_DIR, {recursive: true});

  const entries: HelpEntry[] = [];
  const seen = new Set<string>();
  const perCategory: Record<string, number> = {};
  const perMap: Record<string, number> = {};

  const allMaps = fs
    .readdirSync(mapsDir)
    .filter((f) => f.endsWith('.ditamap'))
    .map((f) => f.replace('.ditamap', ''));

  for (const mapName of allMaps) {
    const category = categoryFor(mapName);
    if (!category) continue;
    const catDir = path.join(CONTENT_DIR, category);
    fs.mkdirSync(catDir, {recursive: true});

    for (const page of pagesFromMap(mapsDir, mapName)) {
      const rootTopic = resolveTopic(page.id);
      if (!rootTopic || seen.has(rootTopic.id)) continue;
      seen.add(rootTopic.id);

      const headings = [...rootTopic.ownSectionTitles];
      const keywords: string[] = [];
      const parts = [`# ${rootTopic.title}`, ''];
      if (rootTopic.summary) parts.push(`_${rootTopic.summary}_`, '');
      const rootBody = rootTopic.renderBody(2);
      if (rootBody) parts.push(rootBody);

      for (const sec of page.sections) {
        const secTopic = resolveTopic(sec.id);
        if (!secTopic) continue;
        headings.push(secTopic.title);
        if (secTopic.summary) keywords.push(secTopic.summary);
        const level = Math.min(6, 2 + (sec.depth - 1));
        parts.push('', `${'#'.repeat(level)} ${secTopic.title}`);
        if (secTopic.summary) parts.push('', `_${secTopic.summary}_`);
        const body = secTopic.renderBody(level + 1);
        if (body) parts.push('', body);
      }

      const relatedTopics = page.relatedIds
        .map((id) => resolveTopic(id))
        .filter((topic): topic is ParsedTopic => topic !== null);
      if (relatedTopics.length > 0) {
        parts.push('', '## Related Content');
        for (const topic of relatedTopics) {
          parts.push(
            '',
            `- [${topic.title}](${helpArticleUrl(topic.id)})${topic.summary ? `\n  ${topic.summary}` : ''}`,
          );
        }
      }

      const md =
        parts
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim() + '\n';
      fs.writeFileSync(path.join(catDir, `${rootTopic.id}.md`), md);

      entries.push({
        id: `${category}/${rootTopic.id}`,
        title: rootTopic.title,
        category,
        filePath: `${category}/${rootTopic.id}.md`,
        url: helpArticleUrl(rootTopic.id),
        sourceUrl: pagesSourceUrl(category, rootTopic.id),
        ...(headings.length && {headings: headings.join(' • ')}),
        ...(rootTopic.summary && {summary: rootTopic.summary}),
        ...(keywords.length && {keywords}),
        ...(relatedTopics.length && {
          relatedEntries: relatedTopics.map((topic) => `${category}/${topic.id}`),
        }),
      });
      perCategory[category] = (perCategory[category] ?? 0) + 1;
      perMap[mapName] = (perMap[mapName] ?? 0) + 1;
    }
  }

  // A topic can be referenced from more than one map. The first published page
  // wins (matching the existing `seen` behavior), so discard any relationship
  // whose category-qualified id did not make it into the final corpus.
  const publishedIds = new Set(entries.map((entry) => entry.id));
  for (const entry of entries) {
    if (!entry.relatedEntries) continue;
    entry.relatedEntries = [...new Set(entry.relatedEntries)].filter((id) => publishedIds.has(id));
    if (entry.relatedEntries.length === 0) delete entry.relatedEntries;
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  const index: SearchIndex = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(path.join(HELP_DATA_DIR, 'index.json'), JSON.stringify(index, null, 2));

  // Pack the staged content tree into the committed tarball (the docs build's
  // VitePress buildEnd hook extracts it into the site output). `-C STAGING_DIR
  // help` yields archive paths rooted at `help/…`.
  execFileSync('tar', ['-czf', TARBALL, '-C', STAGING_DIR, 'help'], {stdio: 'inherit'});

  console.log(
    `Generated help corpus: ${entries.length} pages ` +
      `(${Object.entries(perCategory)
        .map(([c, n]) => `${c}=${n}`)
        .join(', ')})`,
  );
  console.log(`  index:   ${path.relative(REPO_ROOT, path.join(HELP_DATA_DIR, 'index.json'))}`);
  console.log(`  tarball: ${path.relative(REPO_ROOT, TARBALL)} (committed)`);
  console.log(`  staged:  ${path.relative(REPO_ROOT, CONTENT_DIR)}/ (transient, not committed)`);
  console.log(`  excluded maps: ${[...EXCLUDED_MAPS].join(', ')}`);
}

main();
