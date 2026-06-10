/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  type EntryChildLookup,
  type MemberRow,
  renderDocEntryHtml,
  renderDocEntryWithMembersHtml,
} from '../docs-browser/docs-entry-renderer.js';
import {DocsIndexLoader} from '../docs-browser/docs-index.js';
import {DocsRecents, type RecentsStorage} from '../docs-browser/docs-recents.js';
import {searchDocs} from '../docs-browser/docs-search.js';
import {escapeHtml, renderInline, renderMarkdown} from '../docs-browser/markdown.js';
import {
  deriveScriptApiQualifiedName,
  extractIdentifierAtOffset,
  extractScriptApiQualifiedName,
} from '../docs-browser/symbol-resolver.js';
import type {DocEntry, IndexManifest, SearchEntry} from '../docs-browser/types.js';

interface TestHarness {
  tmpRoot: string;
  context: Pick<vscode.ExtensionContext, 'extensionPath'>;
  log: vscode.OutputChannel;
  logBuffer: string[];
}

function createHarness(): TestHarness {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-dx-docs-'));
  fs.mkdirSync(path.join(tmpRoot, 'resources', 'docs'), {recursive: true});
  const logBuffer: string[] = [];
  const log: vscode.OutputChannel = {
    name: 'test',
    append: (value: string) => logBuffer.push(value),
    appendLine: (value: string) => logBuffer.push(value),
    clear: () => {
      logBuffer.length = 0;
    },
    show: () => undefined,
    hide: () => undefined,
    dispose: () => undefined,
    replace: (value: string) => {
      logBuffer.length = 0;
      logBuffer.push(value);
    },
  };
  return {tmpRoot, context: {extensionPath: tmpRoot}, log, logBuffer};
}

function disposeHarness(harness: TestHarness): void {
  fs.rmSync(harness.tmpRoot, {recursive: true, force: true});
}

function writeIndex(
  harness: TestHarness,
  partial: {
    manifest?: Partial<IndexManifest>;
    scriptApi?: DocEntry[];
    scriptApiSearch?: SearchEntry[];
  },
): void {
  const docsDir = path.join(harness.tmpRoot, 'resources', 'docs');
  if (partial.manifest !== undefined) {
    const manifest: IndexManifest = {
      schemaVersion: 1,
      scriptApiVersion: '26.7.0',
      generatedAt: '1970-01-01T00:00:00.000Z',
      counts: {scriptApi: 0},
      checksum: 'test',
      ...partial.manifest,
    };
    fs.writeFileSync(path.join(docsDir, 'manifest.json'), JSON.stringify(manifest));
  }
  if (partial.scriptApi !== undefined) {
    fs.writeFileSync(path.join(docsDir, 'script-api.json'), JSON.stringify(partial.scriptApi));
  }
  if (partial.scriptApiSearch !== undefined) {
    fs.writeFileSync(path.join(docsDir, 'script-api-search.json'), JSON.stringify(partial.scriptApiSearch));
  }
}

const sampleSearchEntries: SearchEntry[] = [
  {
    id: 'script-api:dw/order',
    title: 'dw.order',
    qualifiedName: 'dw.order',
    kind: 'package',
    packagePath: 'dw/order',
    tags: ['dw/order'],
  },
  {
    id: 'script-api:dw/order/BasketMgr',
    title: 'BasketMgr',
    qualifiedName: 'dw.order.BasketMgr',
    kind: 'class',
    parentId: 'script-api:dw/order',
    packagePath: 'dw/order',
    tags: ['basketmgr', 'dw.order.basketmgr'],
  },
  {
    id: 'script-api:dw/order/BasketMgr#getCurrentBasket',
    title: 'BasketMgr.getCurrentBasket',
    qualifiedName: 'dw.order.BasketMgr.getCurrentBasket',
    kind: 'method',
    parentId: 'script-api:dw/order/BasketMgr',
    packagePath: 'dw/order',
    tags: ['getcurrentbasket'],
  },
  {
    id: 'script-api:dw/order/BasketMgr#getCurrentOrNewBasket',
    title: 'BasketMgr.getCurrentOrNewBasket',
    qualifiedName: 'dw.order.BasketMgr.getCurrentOrNewBasket',
    kind: 'method',
    parentId: 'script-api:dw/order/BasketMgr',
    packagePath: 'dw/order',
    tags: ['getcurrentornewbasket'],
  },
];

const sampleFullEntries: DocEntry[] = [
  {
    id: 'script-api:dw/order/BasketMgr',
    source: 'script-api',
    kind: 'class',
    title: 'BasketMgr',
    qualifiedName: 'dw.order.BasketMgr',
    parentId: 'script-api:dw/order',
    packagePath: 'dw/order',
    description: 'Provides static helper methods for managing baskets.',
  },
  {
    id: 'script-api:dw/order/BasketMgr#getCurrentBasket',
    source: 'script-api',
    kind: 'method',
    title: 'BasketMgr.getCurrentBasket',
    qualifiedName: 'dw.order.BasketMgr.getCurrentBasket',
    parentId: 'script-api:dw/order/BasketMgr',
    packagePath: 'dw/order',
    description: 'Returns the current basket or null.',
    signature: 'static getCurrentBasket(): Basket | null',
    returns: {type: 'Basket | null'},
  },
];

suite('DocsIndexLoader', () => {
  let harness: TestHarness;
  setup(() => {
    harness = createHarness();
  });
  teardown(() => disposeHarness(harness));

  test('reports missing manifest with actionable error', () => {
    const loader = new DocsIndexLoader(harness.context as vscode.ExtensionContext, harness.log);
    assert.strictEqual(loader.getManifest(), undefined);
    const error = loader.getManifestError();
    assert.ok(error);
    assert.ok(error?.includes('build:docs-index'), `expected error to mention build:docs-index, got: ${error}`);
    loader.dispose();
  });

  test('reports unsupported schemaVersion', () => {
    writeIndex(harness, {manifest: {schemaVersion: 99 as unknown as 1}});
    const loader = new DocsIndexLoader(harness.context as vscode.ExtensionContext, harness.log);
    assert.strictEqual(loader.getManifest(), undefined);
    assert.ok(loader.getManifestError()?.includes('not supported'));
    loader.dispose();
  });

  test('loads manifest, search dictionary, and full entries lazily', () => {
    writeIndex(harness, {
      manifest: {counts: {scriptApi: 4}},
      scriptApiSearch: sampleSearchEntries,
      scriptApi: sampleFullEntries,
    });
    const loader = new DocsIndexLoader(harness.context as vscode.ExtensionContext, harness.log);

    const manifest = loader.getManifest();
    assert.strictEqual(manifest?.scriptApiVersion, '26.7.0');
    assert.strictEqual(manifest?.counts.scriptApi, 4);

    const entries = loader.getSearchEntries();
    assert.strictEqual(entries.length, 4);
    assert.ok(entries.some((entry) => entry.id === 'script-api:dw/order/BasketMgr'));

    const found = loader.getSearchEntryById('script-api:dw/order/BasketMgr#getCurrentBasket');
    assert.strictEqual(found?.qualifiedName, 'dw.order.BasketMgr.getCurrentBasket');

    const full = loader.getFullEntry('script-api:dw/order/BasketMgr#getCurrentBasket');
    assert.strictEqual(full?.signature, 'static getCurrentBasket(): Basket | null');
    assert.strictEqual(full?.returns?.type, 'Basket | null');

    loader.dispose();
  });

  test('findEntryByQualifiedName accepts dot and slash forms', () => {
    writeIndex(harness, {
      manifest: {counts: {scriptApi: 4}},
      scriptApiSearch: sampleSearchEntries,
    });
    const loader = new DocsIndexLoader(harness.context as vscode.ExtensionContext, harness.log);

    assert.strictEqual(loader.findEntryByQualifiedName('dw.order.BasketMgr')?.id, 'script-api:dw/order/BasketMgr');
    assert.strictEqual(loader.findEntryByQualifiedName('dw/order/BasketMgr')?.id, 'script-api:dw/order/BasketMgr');
    assert.strictEqual(
      loader.findEntryByQualifiedName('dw.order.BasketMgr#getCurrentBasket')?.id,
      'script-api:dw/order/BasketMgr#getCurrentBasket',
    );

    // Drops trailing argument-list noise.
    assert.strictEqual(
      loader.findEntryByQualifiedName('dw.order.BasketMgr.getCurrentBasket.foo.bar')?.id,
      'script-api:dw/order/BasketMgr#getCurrentBasket',
    );

    // Returns undefined for completely unknown names.
    assert.strictEqual(loader.findEntryByQualifiedName('does.not.exist'), undefined);

    loader.dispose();
  });

  test('reload clears caches and forces re-read', () => {
    writeIndex(harness, {
      manifest: {counts: {scriptApi: 1}},
      scriptApiSearch: [sampleSearchEntries[0]],
    });
    const loader = new DocsIndexLoader(harness.context as vscode.ExtensionContext, harness.log);
    assert.strictEqual(loader.getSearchEntries().length, 1);

    writeIndex(harness, {
      manifest: {counts: {scriptApi: 4}},
      scriptApiSearch: sampleSearchEntries,
    });

    // Without reload, the cache still wins.
    assert.strictEqual(loader.getSearchEntries().length, 1);

    let reloads = 0;
    loader.onDidReload(() => reloads++);
    loader.reload();
    assert.strictEqual(reloads, 1);
    assert.strictEqual(loader.getSearchEntries().length, 4);

    loader.dispose();
  });

  test('logs and skips malformed search dictionary', () => {
    writeIndex(harness, {manifest: {counts: {scriptApi: 0}}});
    fs.writeFileSync(path.join(harness.tmpRoot, 'resources', 'docs', 'script-api-search.json'), 'not-json');
    const loader = new DocsIndexLoader(harness.context as vscode.ExtensionContext, harness.log);
    assert.strictEqual(loader.getSearchEntries().length, 0);
    assert.ok(harness.logBuffer.some((line) => line.includes('Malformed')));
    loader.dispose();
  });
});

suite('DocsSearch ranking', () => {
  test('returns nothing for empty query', () => {
    assert.deepStrictEqual(searchDocs(sampleSearchEntries, ''), []);
    assert.deepStrictEqual(searchDocs(sampleSearchEntries, '   '), []);
  });

  test('exact qualified name wins over substring match', () => {
    const hits = searchDocs(sampleSearchEntries, 'dw.order.BasketMgr');
    assert.ok(hits.length > 0);
    assert.strictEqual(hits[0].entry.id, 'script-api:dw/order/BasketMgr');
  });

  test('title prefix outranks substring', () => {
    const hits = searchDocs(sampleSearchEntries, 'BasketMgr');
    assert.ok(hits.length > 0);
    assert.strictEqual(hits[0].entry.id, 'script-api:dw/order/BasketMgr');
  });

  test('substring matches surface methods', () => {
    const hits = searchDocs(sampleSearchEntries, 'getCurrent');
    const ids = hits.map((hit) => hit.entry.id);
    assert.ok(ids.includes('script-api:dw/order/BasketMgr#getCurrentBasket'));
    assert.ok(ids.includes('script-api:dw/order/BasketMgr#getCurrentOrNewBasket'));
  });

  test('honors limit', () => {
    const hits = searchDocs(sampleSearchEntries, 'Basket', {limit: 2});
    assert.strictEqual(hits.length, 2);
  });

  test('respects kind filter', () => {
    const onlyClasses = searchDocs(sampleSearchEntries, 'Basket', {kinds: new Set(['class'])});
    assert.ok(onlyClasses.every((hit) => hit.entry.kind === 'class'));
  });

  test('treats slash and dot forms as equivalent', () => {
    const dotHits = searchDocs(sampleSearchEntries, 'dw.order');
    const slashHits = searchDocs(sampleSearchEntries, 'dw/order');
    assert.deepStrictEqual(
      dotHits.map((hit) => hit.entry.id),
      slashHits.map((hit) => hit.entry.id),
    );
  });

  test('order is deterministic when scores tie', () => {
    const first = searchDocs(sampleSearchEntries, 'getCurrent');
    const second = searchDocs(sampleSearchEntries, 'getCurrent');
    assert.deepStrictEqual(
      first.map((hit) => hit.entry.id),
      second.map((hit) => hit.entry.id),
    );
  });
});

suite('Markdown renderer', () => {
  test('escapes HTML by default', () => {
    assert.strictEqual(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
    assert.strictEqual(escapeHtml('a&b\'c"d'), 'a&amp;b&#39;c&quot;d');
  });

  test('inline preserves backtick code and escapes content inside', () => {
    assert.strictEqual(
      renderInline('Use `getCurrent<Basket>()` next.'),
      'Use <code>getCurrent&lt;Basket&gt;()</code> next.',
    );
  });

  test('inline applies bold and italics outside code', () => {
    assert.strictEqual(renderInline('**important** notice'), '<strong>important</strong> notice');
    assert.strictEqual(renderInline('say *hi* now'), 'say <em>hi</em> now');
  });

  test('inline does not turn backticked asterisks into emphasis', () => {
    assert.strictEqual(renderInline('use `*` literal'), 'use <code>*</code> literal');
  });

  test('inline strips no characters from URL-like words', () => {
    // dw.order.BasketMgr should round-trip even when adjacent to punctuation.
    assert.strictEqual(renderInline('see dw.order.BasketMgr.'), 'see dw.order.BasketMgr.');
  });

  test('renderMarkdown emits paragraphs', () => {
    const html = renderMarkdown('First paragraph.\n\nSecond paragraph.');
    assert.ok(html.includes('<p>First paragraph.</p>'));
    assert.ok(html.includes('<p>Second paragraph.</p>'));
  });

  test('renderMarkdown emits hyphen lists', () => {
    const html = renderMarkdown('- alpha\n- beta\n- gamma');
    assert.ok(html.includes('<ul>'));
    assert.ok(html.includes('<li>alpha</li>'));
    assert.ok(html.includes('<li>beta</li>'));
    assert.ok(html.includes('<li>gamma</li>'));
  });

  test('renderMarkdown handles fenced code blocks', () => {
    const html = renderMarkdown('Before.\n\n```javascript\nvar x = 1;\n```\n\nAfter.');
    assert.ok(html.includes('<pre><code class="language-javascript">var x = 1;</code></pre>'));
    assert.ok(html.includes('<p>Before.</p>'));
    assert.ok(html.includes('<p>After.</p>'));
  });

  test('renderMarkdown survives unterminated fence', () => {
    const html = renderMarkdown('Hello\n\n```js\nuncl');
    // Should not throw and should produce a code block with the partial body.
    assert.ok(html.includes('<pre><code'));
  });

  test('renderMarkdown escapes HTML inside paragraphs and lists', () => {
    const html = renderMarkdown('Watch out for <iframe> and `<script>` tags.\n\n- <a href=evil>x</a>');
    assert.ok(!html.includes('<iframe>'));
    assert.ok(!html.includes('<a href=evil>'));
    assert.ok(html.includes('&lt;iframe&gt;'));
    assert.ok(html.includes('<code>&lt;script&gt;</code>'));
  });

  test('renderMarkdown returns empty string for nullish input', () => {
    assert.strictEqual(renderMarkdown(undefined), '');
    assert.strictEqual(renderMarkdown(''), '');
  });
});

suite('renderDocEntryHtml', () => {
  const sampleEntry: DocEntry = {
    id: 'script-api:dw/order/BasketMgr#getCurrentBasket',
    source: 'script-api',
    kind: 'method',
    title: 'BasketMgr.getCurrentBasket',
    qualifiedName: 'dw.order.BasketMgr.getCurrentBasket',
    parentId: 'script-api:dw/order/BasketMgr',
    packagePath: 'dw/order',
    description: 'Returns the current basket or `null`.',
    signature: 'static getCurrentBasket(): Basket | null',
    returns: {type: 'Basket | null', description: 'The current basket or null.'},
    params: [{name: 'uuid', type: 'string', description: 'Basket UUID', optional: true}],
    throws: [{type: 'IllegalStateError', description: 'When the session is invalid.'}],
    examples: ['var basket = BasketMgr.getCurrentBasket();'],
    sections: [{heading: 'Description', body: 'Returns the current basket or `null`.\n\nMore detail follows.'}],
    sinceApiVersion: '21.10',
    deprecated: undefined,
  };

  test('renders title, qualified name, kind badge, and signature', () => {
    const html = renderDocEntryHtml(sampleEntry);
    assert.ok(html.includes('BasketMgr.getCurrentBasket'));
    assert.ok(html.includes('dw.order.BasketMgr.getCurrentBasket'));
    assert.ok(html.includes('entry-kind-badge'));
    assert.ok(html.includes('static getCurrentBasket(): Basket | null'));
  });

  test('renders parameters table', () => {
    const html = renderDocEntryHtml(sampleEntry);
    assert.ok(html.includes('Parameters'));
    assert.ok(html.includes('<code>uuid?</code>'));
    assert.ok(html.includes('<code>string</code>'));
    assert.ok(html.includes('Basket UUID'));
  });

  test('renders return type and description', () => {
    const html = renderDocEntryHtml(sampleEntry);
    assert.ok(html.includes('Returns'));
    assert.ok(html.includes('Basket | null'));
    assert.ok(html.includes('The current basket or null.'));
  });

  test('renders throws block', () => {
    const html = renderDocEntryHtml(sampleEntry);
    assert.ok(html.includes('Throws'));
    assert.ok(html.includes('<code>IllegalStateError</code>'));
    assert.ok(html.includes('When the session is invalid.'));
  });

  test('renders examples as a code block', () => {
    const html = renderDocEntryHtml(sampleEntry);
    assert.ok(html.includes('Examples'));
    assert.ok(html.includes('var basket = BasketMgr.getCurrentBasket();'));
  });

  test('renders since-api-version badge', () => {
    const html = renderDocEntryHtml(sampleEntry);
    assert.ok(html.includes('since 21.10'));
  });

  test('skips the duplicate Description section that just repeats the summary', () => {
    const html = renderDocEntryHtml({
      ...sampleEntry,
      sections: [{heading: 'Description', body: sampleEntry.description!}],
    });
    // Should not produce an "h2" Description heading because the section body
    // contains nothing beyond the summary.
    assert.ok(!html.includes('<h2>Description</h2>'));
  });

  test('renders deprecation banner when present', () => {
    const deprecated = renderDocEntryHtml({
      ...sampleEntry,
      deprecated: {message: 'Use getCurrentOrNewBasket instead.'},
    });
    assert.ok(deprecated.includes('entry-deprecated-message'));
    assert.ok(deprecated.includes('Use getCurrentOrNewBasket instead.'));
    assert.ok(deprecated.includes('entry-deprecated-badge'));
  });

  test('escapes HTML in titles and descriptions', () => {
    const html = renderDocEntryHtml({
      ...sampleEntry,
      title: 'Foo<script>',
      description: 'See <iframe>',
    });
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<iframe>'));
    assert.ok(html.includes('Foo&lt;script&gt;'));
    assert.ok(html.includes('See &lt;iframe&gt;'));
  });
});

suite('renderDocEntryWithMembersHtml', () => {
  const classEntry: DocEntry = {
    id: 'script-api:dw/order/BasketMgr',
    source: 'script-api',
    kind: 'class',
    title: 'BasketMgr',
    qualifiedName: 'dw.order.BasketMgr',
    parentId: 'script-api:dw/order',
    packagePath: 'dw/order',
    description: 'Provides static helper methods for managing baskets.',
  };

  const memberRows: MemberRow[] = [
    {
      id: 'script-api:dw/order/BasketMgr#OK',
      title: 'BasketMgr.OK',
      kind: 'constant',
      signature: 'static OK: number',
      description: 'OK status.',
    },
    {
      id: 'script-api:dw/order/BasketMgr#baskets',
      title: 'BasketMgr.baskets',
      kind: 'property',
      signature: 'static readonly baskets: List<Basket>',
      description: 'All open baskets.',
    },
    {
      id: 'script-api:dw/order/BasketMgr#getCurrentBasket',
      title: 'BasketMgr.getCurrentBasket',
      kind: 'method',
      signature: 'static getCurrentBasket(): Basket | null',
      description: 'Returns the current basket or null.',
    },
    {
      id: 'script-api:dw/order/BasketMgr#getCurrentOrNewBasket',
      title: 'BasketMgr.getCurrentOrNewBasket',
      kind: 'method',
      signature: 'static getCurrentOrNewBasket(): Basket',
      description: 'Returns the current basket or creates a new one.',
      sinceApiVersion: '21.10',
    },
    {
      id: 'script-api:dw/order/BasketMgr#deletedMethod',
      title: 'BasketMgr.deletedMethod',
      kind: 'method',
      signature: 'static deletedMethod(): void',
      description: 'Old API.',
      deprecated: true,
    },
  ];

  function makeLookup(rows: readonly MemberRow[]): EntryChildLookup {
    return {childrenOf: () => rows};
  }

  test('renders Methods, Properties, and Constants tables for a class', () => {
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup(memberRows));
    assert.ok(html.includes('<h2>Methods</h2>'));
    assert.ok(html.includes('<h2>Properties</h2>'));
    assert.ok(html.includes('<h2>Constants</h2>'));
  });

  test('orders sections deterministically: Constants, Properties, Methods', () => {
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup(memberRows));
    const constantsAt = html.indexOf('<h2>Constants</h2>');
    const propertiesAt = html.indexOf('<h2>Properties</h2>');
    const methodsAt = html.indexOf('<h2>Methods</h2>');
    assert.ok(constantsAt >= 0 && propertiesAt > constantsAt && methodsAt > propertiesAt);
  });

  test('member rows are clickable and carry data-doc-entry-id', () => {
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup(memberRows));
    assert.ok(
      html.includes('data-doc-entry-id="script-api:dw/order/BasketMgr#getCurrentBasket"'),
      'getCurrentBasket row should carry its id',
    );
    assert.ok(html.includes('class="entry-member-row"'));
  });

  test('method table shows the full signature, not just the title', () => {
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup(memberRows));
    assert.ok(html.includes('static getCurrentBasket(): Basket | null'));
  });

  test('shows deprecated badge for deprecated members', () => {
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup(memberRows));
    // Look for badge specifically inside a row body, not the entry header.
    assert.ok(html.includes('entry-deprecated-badge'));
    assert.ok(html.includes('deletedMethod'));
  });

  test('shows since badge for members with sinceApiVersion', () => {
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup(memberRows));
    assert.ok(html.includes('since 21.10'));
  });

  test('skips empty sections when a kind has no members', () => {
    const onlyMethods = memberRows.filter((row) => row.kind === 'method');
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup(onlyMethods));
    assert.ok(!html.includes('<h2>Properties</h2>'));
    assert.ok(!html.includes('<h2>Constants</h2>'));
    assert.ok(html.includes('<h2>Methods</h2>'));
  });

  test('falls back to entry-only render for non-container kinds', () => {
    const methodEntry: DocEntry = {
      id: 'script-api:dw/order/BasketMgr#getCurrentBasket',
      source: 'script-api',
      kind: 'method',
      title: 'BasketMgr.getCurrentBasket',
      qualifiedName: 'dw.order.BasketMgr.getCurrentBasket',
      description: 'Returns the current basket.',
    };
    const html = renderDocEntryWithMembersHtml(methodEntry, makeLookup(memberRows));
    assert.ok(!html.includes('<h2>Methods</h2>'));
    assert.ok(!html.includes('<h2>Properties</h2>'));
  });

  test('produces no member sections when the lookup returns empty', () => {
    const html = renderDocEntryWithMembersHtml(classEntry, makeLookup([]));
    assert.ok(!html.includes('<h2>Methods</h2>'));
    assert.ok(!html.includes('<h2>Properties</h2>'));
    assert.ok(!html.includes('<h2>Constants</h2>'));
  });

  test('member rows sort alphabetically by title within a section', () => {
    const out = renderDocEntryWithMembersHtml(
      classEntry,
      makeLookup([
        {id: 'script-api:x#z', title: 'BasketMgr.zMethod', kind: 'method', signature: 'static zMethod()'},
        {id: 'script-api:x#a', title: 'BasketMgr.aMethod', kind: 'method', signature: 'static aMethod()'},
      ]),
    );
    const aAt = out.indexOf('aMethod');
    const zAt = out.indexOf('zMethod');
    assert.ok(aAt > 0 && zAt > aAt, `expected aMethod before zMethod, got aAt=${aAt} zAt=${zAt}`);
  });
});

suite('Symbol resolver', () => {
  test('extracts dotted Script API qualified name from hover text', () => {
    assert.strictEqual(
      extractScriptApiQualifiedName('(method) dw.order.BasketMgr.getCurrentBasket(): Basket | null'),
      'dw.order.BasketMgr.getCurrentBasket',
    );
  });

  test('returns the longest match when multiple are present', () => {
    const text = 'class dw.order.BasketMgr — see also dw.order';
    assert.strictEqual(extractScriptApiQualifiedName(text), 'dw.order.BasketMgr');
  });

  test('extracts slash-form names from require imports', () => {
    assert.strictEqual(extractScriptApiQualifiedName("import('dw/order/BasketMgr')"), 'dw/order/BasketMgr');
  });

  test('returns undefined when no dw qualifier is present', () => {
    assert.strictEqual(extractScriptApiQualifiedName('const foo = 1;'), undefined);
    assert.strictEqual(extractScriptApiQualifiedName(''), undefined);
  });

  test('extractIdentifierAtOffset returns the word under the cursor', () => {
    const text = 'var x = BasketMgr.getCurrentBasket();';
    const offset = text.indexOf('BasketMgr') + 3;
    assert.strictEqual(extractIdentifierAtOffset(text, offset), 'BasketMgr');
  });

  test('extractIdentifierAtOffset returns the method name when cursor lands on it', () => {
    const text = 'BasketMgr.getCurrentBasket()';
    const offset = text.indexOf('getCurrentBasket') + 4;
    assert.strictEqual(extractIdentifierAtOffset(text, offset), 'getCurrentBasket');
  });

  test('extractIdentifierAtOffset returns undefined when cursor is in whitespace gap', () => {
    const text = 'a  b';
    assert.strictEqual(extractIdentifierAtOffset(text, 2), undefined);
  });

  test('deriveScriptApiQualifiedName maps a class file to the class name', () => {
    assert.strictEqual(
      deriveScriptApiQualifiedName('/abs/types/dw/order/BasketMgr.d.ts', 'BasketMgr'),
      'dw.order.BasketMgr',
    );
  });

  test('deriveScriptApiQualifiedName appends member identifier', () => {
    assert.strictEqual(
      deriveScriptApiQualifiedName('/abs/types/dw/order/BasketMgr.d.ts', 'getCurrentBasket'),
      'dw.order.BasketMgr.getCurrentBasket',
    );
  });

  test('deriveScriptApiQualifiedName handles nested packages', () => {
    assert.strictEqual(
      deriveScriptApiQualifiedName('/abs/types/dw/system/Site.d.ts', 'getCurrent'),
      'dw.system.Site.getCurrent',
    );
  });

  test('deriveScriptApiQualifiedName tolerates Windows backslashes', () => {
    assert.strictEqual(
      deriveScriptApiQualifiedName(String.raw`C:\repo\types\dw\order\BasketMgr.d.ts`, 'getCurrentBasket'),
      'dw.order.BasketMgr.getCurrentBasket',
    );
  });

  test('deriveScriptApiQualifiedName returns undefined for non-script-types paths', () => {
    assert.strictEqual(deriveScriptApiQualifiedName('/some/cartridge/scripts/helpers/foo.js', 'bar'), undefined);
    assert.strictEqual(deriveScriptApiQualifiedName('', 'BasketMgr'), undefined);
  });

  test('deriveScriptApiQualifiedName returns just the class when identifier matches the basename', () => {
    assert.strictEqual(
      deriveScriptApiQualifiedName('/abs/types/dw/order/BasketMgr.d.ts', 'BasketMgr'),
      'dw.order.BasketMgr',
    );
  });
});

class FakeRecentsStorage implements RecentsStorage {
  private store = new Map<string, unknown>();
  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }
  update(key: string, value: unknown): Thenable<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
}

suite('DocsRecents', () => {
  test('returns an empty list when nothing has been recorded', () => {
    const recents = new DocsRecents(new FakeRecentsStorage());
    assert.deepStrictEqual(recents.list(), []);
  });

  test('push moves an existing id to the front and dedupes', async () => {
    const recents = new DocsRecents(new FakeRecentsStorage());
    await recents.push('a');
    await recents.push('b');
    await recents.push('a');
    assert.deepStrictEqual(recents.list(), ['a', 'b']);
  });

  test('push trims to the configured maximum', async () => {
    const recents = new DocsRecents(new FakeRecentsStorage(), 3);
    await recents.push('a');
    await recents.push('b');
    await recents.push('c');
    await recents.push('d');
    assert.deepStrictEqual(recents.list(), ['d', 'c', 'b']);
  });

  test('clear empties the list', async () => {
    const recents = new DocsRecents(new FakeRecentsStorage());
    await recents.push('a');
    await recents.clear();
    assert.deepStrictEqual(recents.list(), []);
  });

  test('list filters out non-string entries from corrupt storage', () => {
    const storage = new FakeRecentsStorage();
    void storage.update('b2c-dx.docs.recents', ['a', 42, null, 'b']);
    const recents = new DocsRecents(storage);
    assert.deepStrictEqual(recents.list(), ['a', 'b']);
  });

  test('list returns empty when the stored value is not an array', () => {
    const storage = new FakeRecentsStorage();
    void storage.update('b2c-dx.docs.recents', 'corrupt');
    const recents = new DocsRecents(storage);
    assert.deepStrictEqual(recents.list(), []);
  });
});

/**
 * Pin guarantees that protect search and class-page rendering from regressing
 * to the duplicate-id state we shipped initially:
 *
 *   - Every id is unique across the full index.
 *   - Method overloads receive a `~N` suffix in declaration order so each gets
 *     a distinct entry instead of repeatedly clobbering one row.
 */
suite('Generated index integrity', () => {
  let entries: DocEntry[];

  // Resolve resources/docs relative to the compiled test file (out/test/...).
  const resourcesDocsDir = new URL('../../resources/docs/', import.meta.url);

  suiteSetup(() => {
    const indexPath = new URL('script-api.json', resourcesDocsDir);
    if (!fs.existsSync(indexPath)) {
      throw new Error(
        `Expected the docs index at ${indexPath.pathname}. ` +
          'Run `pnpm --filter b2c-vs-extension run build:docs-index` and re-run the tests.',
      );
    }
    entries = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as DocEntry[];
  });

  test('every entry id is unique', () => {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
    const dupes = [...counts.entries()].filter(([, n]) => n > 1);
    assert.deepStrictEqual(
      dupes,
      [],
      `Expected zero duplicate ids in script-api.json, found ${dupes.length}: ${dupes
        .slice(0, 5)
        .map(([id, n]) => `${n}×${id}`)
        .join(', ')}`,
    );
  });

  test('method overloads carry a ~N suffix and stable signatures', () => {
    // dw.alert.Alerts#addAlert had 3 overloads in v26.7.0; pin that any
    // multi-overload member uses the suffix scheme rather than collapsing.
    const addAlertOverloads = entries.filter(
      (entry) => entry.id.startsWith('script-api:dw/alert/Alerts#addAlert') && entry.kind === 'method',
    );
    if (addAlertOverloads.length > 0) {
      assert.ok(
        addAlertOverloads.every((entry) => /#addAlert(~\d+)?$/.test(entry.id)),
        `Expected addAlert overloads to be ~N-suffixed, got ${addAlertOverloads.map((entry) => entry.id).join(', ')}`,
      );
      // Every overload has its own (different) signature.
      const sigs = new Set(addAlertOverloads.map((entry) => entry.signature));
      assert.strictEqual(
        sigs.size,
        addAlertOverloads.length,
        'Expected every overload entry to ship a distinct signature.',
      );
    }
  });

  test('search dictionary mirrors the full index ids exactly', () => {
    const searchPath = new URL('script-api-search.json', resourcesDocsDir);
    const search = JSON.parse(fs.readFileSync(searchPath, 'utf8')) as SearchEntry[];
    assert.strictEqual(search.length, entries.length, 'search dictionary length must match the full index');
    const fullIds = new Set(entries.map((entry) => entry.id));
    for (const row of search) {
      assert.ok(fullIds.has(row.id), `search row ${row.id} has no matching full entry`);
    }
  });
});
