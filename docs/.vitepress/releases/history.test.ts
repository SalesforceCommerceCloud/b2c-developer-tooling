/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {buildHistory, changesFromMarkdown, releaseSections, renderMarkdown} from './history.js';
import {generateReleaseNotes, readEditorials, renderHistory} from './generate.js';
import type {Editorial, PublishedRelease, ReleaseSnapshot} from './history.js';

const snapshot: ReleaseSnapshot = JSON.parse(fs.readFileSync(new URL('./seed.json', import.meta.url), 'utf8'));
const seed = {
  ...snapshot,
  releases: snapshot.releases.filter((release) => release.published_at.startsWith('2026-08-25')),
};
const release = (overrides: Partial<PublishedRelease> = {}): PublishedRelease => ({
  tag_name: '@salesforce/b2c-cli@1.0.0',
  published_at: '2026-08-26T10:00:00Z',
  body: '## @salesforce/b2c-cli@1.0.0\n\n### Minor Changes\n\n- A new feature.\n',
  html_url: 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases',
  commit: 'abc',
  draft: false,
  prerelease: false,
  ...overrides,
});

test('real release: merges artifacts by commit, deduplicates shared changes, omits docs', () => {
  const history = buildHistory(seed.releases);
  assert.equal(history.length, 1);
  assert.equal(history[0].versions.length, 6);
  assert.equal(history[0].changes.filter((c) => c.text.includes('server-affinity')).length, 1);
  assert.deepEqual(history[0].changes.find((c) => c.text.includes('server-affinity'))?.products.sort(), [
    'mcp',
    'sdk',
    'skills',
  ]);
  assert.equal(history[0].changes.filter((c) => c.dependency).length, 1);
  const rendered = renderHistory(history);
  assert.ok(rendered.html.includes('<details'));
  assert.ok(!rendered.markdown.includes('Documentation'));
  assert.ok(!rendered.markdown.includes('<ReleaseFeed'));
});

test('ignores docs-only, drafts and prereleases, keeps independent same-day releases separate', () => {
  const history = buildHistory([
    release({tag_name: 'docs@1.0.0', body: '## Documentation\n\n- Doc fix.'}),
    release({draft: true}),
    release({prerelease: true}),
    release(),
    release({
      tag_name: '@salesforce/b2c-cli@1.0.1',
      body: '## @salesforce/b2c-cli@1.0.1\n\n- Fix.',
      commit: 'def',
      published_at: '2026-08-26T11:00:00Z',
    }),
  ]);
  assert.equal(history.length, 2);
  assert.equal(history[0].versions[0].version, '1.0.1');
  const rendered = renderHistory(history);
  assert.equal((rendered.html.match(/<h2 /g) ?? []).length, 1);
  assert.match(rendered.html, /## Older Releases/);
});

test('does not mistake headings inside code fences for package sections', () => {
  const sections = releaseSections(
    release({
      body: '## @salesforce/b2c-cli@1.0.0\n\n- Example:\n\n  ```md\n  ## Documentation\n  ```\n\n## Documentation\n\n- Hidden.',
    }),
  );
  assert.equal(sections.length, 1);
  assert.ok(sections[0].body.includes('## Documentation'));
  assert.ok(!sections[0].body.includes('Hidden'));
});

test('preserves nested lists, code blocks and prose when reading Changesets notes', () => {
  const changes = changesFromMarkdown(
    '### Minor Changes\n\n- New command:\n\n  - Nested detail\n\n  ```sh\n  b2c code list\n  ```\n\nMigration instructions.\n\n1. Keep this ordered step.\n2. And this step.',
  );
  const text = changes.map((c) => c.text).join('\n');
  assert.match(text, /- Nested detail/);
  assert.match(text, /```sh\nb2c code list\n```/);
  assert.match(text, /Migration instructions/);
  assert.match(text, /Keep this ordered step/);
});

test('supports exact product-tag highlights and standalone announcements; future highlights stay unpublished', () => {
  const entries: Editorial[] = [
    {
      id: 'highlight',
      title: 'Better debugging',
      date: '2026-08-25',
      products: ['mcp'],
      release: '@salesforce/b2c-dx-mcp@2.1.2',
      body: 'An authored highlight.',
    },
    {id: 'announcement', title: 'A new guide', date: '2026-08-27', products: ['cli'], body: 'An announcement.'},
    {
      id: 'future',
      title: 'Upcoming',
      date: '2026-09-01',
      products: ['cli'],
      release: '@salesforce/b2c-cli@99.0.0',
      body: 'Unpublished.',
    },
  ];
  const history = buildHistory(seed.releases, entries);
  assert.equal(history.length, 2);
  assert.equal(history[0].highlights[0].title, 'A new guide');
  assert.equal(history[1].highlights[0].title, 'Better debugging');
  assert.ok(!renderHistory(history).html.includes('Unpublished'));
});

test('external Markdown cannot inject HTML or Vue expressions', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(renderHistory(buildHistory([release({body: '- {{ dangerous() }}'})])).html.includes('<div v-pre'));
});

test('local generation works with seed only, then merges refreshed history and editorial files', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-release-test-'));
  try {
    fs.mkdirSync(path.join(directory, '.vitepress/releases'), {recursive: true});
    fs.mkdirSync(path.join(directory, 'releases/_entries'), {recursive: true});
    fs.writeFileSync(path.join(directory, '.vitepress/releases/seed.json'), JSON.stringify(seed));
    const initial = generateReleaseNotes(directory);
    assert.match(initial.markdown, /August 25, 2026/);
    fs.writeFileSync(path.join(directory, '.vitepress/releases/live.json'), JSON.stringify({releases: [release()]}));
    fs.writeFileSync(
      path.join(directory, 'releases/_entries/example.md'),
      '---\ntitle: My announcement\ndate: 2026-08-27\nproducts: [cli]\n---\n\nHello.',
    );
    const updated = generateReleaseNotes(directory);
    assert.match(updated.markdown, /August 25, 2026/);
    assert.match(updated.markdown, /August 26, 2026/);
    assert.match(updated.markdown, /My announcement/);
    assert.equal(fs.readFileSync(path.join(directory, 'public/releases/index.md'), 'utf8'), updated.markdown);
    fs.writeFileSync(path.join(directory, '.vitepress/releases/live.json'), 'invalid');
    assert.throws(() => generateReleaseNotes(directory));
    fs.writeFileSync(
      path.join(directory, 'releases/_entries/invalid.md'),
      '---\ntitle: Broken\ndate: 2026-08-27\nproducts: [unknown]\n---',
    );
    assert.throws(() => readEditorials(path.join(directory, 'releases/_entries')), /Invalid release entry/);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
