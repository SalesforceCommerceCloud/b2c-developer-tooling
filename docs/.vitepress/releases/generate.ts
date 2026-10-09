/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {buildHistory, escapeHtml, products, renderMarkdown} from './history.js';
import type {Editorial, HistoryEntry, Product, ProductChange, ProductVersion, ReleaseSnapshot} from './history.js';

export function readEditorials(directory: string): Editorial[] {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const parsed = matter(fs.readFileSync(path.join(directory, file), 'utf8'));
      const data: Record<string, unknown> = parsed.data;
      const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
      if (
        typeof data.title !== 'string' ||
        !data.title.trim() ||
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Array.isArray(data.products) ||
        !data.products.length ||
        data.products.some((product: unknown) => typeof product !== 'string' || !Object.hasOwn(products, product)) ||
        (data.release !== undefined && typeof data.release !== 'string')
      ) {
        throw new Error(`Invalid release entry ${file}: expected title, date, products, and optional release tag`);
      }
      return {
        title: data.title,
        products: data.products as Product[],
        release: data.release,
        date,
        body: parsed.content.trim(),
        id: file.slice(0, -3),
      };
    });
}

const labels = (ids: Product[]): string => ids.map((id) => products[id].name).join(', ');
const badges = (versions: ProductVersion[]): string =>
  versions
    .map(
      ({product, version}) =>
        `<span class="release-badge">${escapeHtml(products[product].name)} <strong>${escapeHtml(version)}</strong></span>`,
    )
    .join('');

export interface RenderedHistory {
  html: string;
  markdown: string;
}

export function renderHistory(history: HistoryEntry[], since?: string): RenderedHistory {
  const markdown = [
    '# Release Notes',
    'New features, improvements, and fixes across the Agentic B2C Developer Toolkit.',
  ];
  const html: string[] = [];
  let currentDate: string | undefined;
  for (const group of history) {
    const date = new Date(`${group.date}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    if (group.date !== currentDate) {
      if (currentDate) html.push('</section>');
      currentDate = group.date;
      const dayProducts = [
        ...new Set(history.filter((entry) => entry.date === group.date).flatMap((entry) => entry.products)),
      ];
      const dateId = `release-date-${group.date}`;
      html.push(
        `<section class="release-day" data-products="${dayProducts.join(' ')}">`,
        `<h2 id="${dateId}">${date}`,
        `<a class="header-anchor" href="#${dateId}" aria-label="Permalink to ${date}">&#8203;</a></h2>`,
      );
      markdown.push(`## ${date}`);
    }
    html.push(
      `<article id="${escapeHtml(group.id)}" class="release-entry" data-products="${group.products.join(' ')}">`,
      '<header>',
      `<div class="release-badges">${badges(group.versions)}</div>`,
      '</header>',
    );
    markdown.push(group.versions.map(({product, version}) => `${products[product].name} ${version}`).join(' · '));
    for (const entry of group.highlights) {
      html.push(
        `<div class="release-highlight" data-products="${entry.products.join(' ')}">`,
        `<h3>${escapeHtml(entry.title)}</h3>`,
        renderMarkdown(entry.body),
        '</div>',
      );
      markdown.push(`### ${entry.title}`);
      markdown.push(entry.body);
    }
    const main = group.changes.filter((change) => !change.dependency);
    // Keep supporting SDK-only updates after changes to the end-user tools.
    main.sort(
      (a, b) => Number(a.products.every((id) => id === 'sdk')) - Number(b.products.every((id) => id === 'sdk')),
    );
    html.push(renderChanges(main));
    const dependencies = group.changes.filter((change) => change.dependency);
    if (dependencies.length) {
      const affected = [...new Set(dependencies.flatMap((change) => change.products))].join(' ');
      html.push(
        `<details class="release-dependencies" data-products="${affected}">`,
        '<summary>Dependency updates</summary>',
        renderChanges(dependencies),
        '</details>',
      );
    }
    const sourceLinks = group.sources.map((source, i) => {
      const label = i === 0 ? 'View on GitHub' : escapeHtml(source.tag);
      return `<a href="${escapeHtml(source.url)}">${label}</a>`;
    });
    html.push(
      '<p class="release-sources">',
      sourceLinks.join(' <span aria-hidden="true">&middot;</span> '),
      '</p></article>',
    );
    for (const changes of [main, dependencies]) {
      for (const group of groupChanges(changes)) {
        markdown.push(`### ${labels(group.products)}`);
        markdown.push(group.notes.map((note) => `- ${note.text.replace(/\n/g, '\n  ')}`).join('\n\n'));
      }
    }
    markdown.push(group.sources.map((source) => `[${source.tag}](${source.url})`).join(' · '));
  }
  if (currentDate) html.push('</section>');
  const older = 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases';
  const startingMonth = since
    ? new Date(since).toLocaleDateString('en-US', {month: 'long', year: 'numeric', timeZone: 'UTC'})
    : undefined;
  const olderLabel = startingMonth ? `Releases before ${startingMonth} on GitHub` : 'Browse older releases on GitHub';
  const olderLink = `[${olderLabel}](${older})`;
  return {
    html: [
      '<ReleaseFeed>',
      `<div v-pre class="release-history">${html.join('')}</div>`,
      '</ReleaseFeed>',
      '## Older Releases',
      olderLink,
      '',
    ].join('\n\n'),
    markdown: [...markdown.filter(Boolean), '## Older Releases', olderLink, ''].join('\n\n'),
  };
}

function groupChanges(changes: ProductChange[]): {products: Product[]; notes: ProductChange[]}[] {
  const groups = new Map<string, {products: Product[]; notes: ProductChange[]}>();
  for (const change of changes) {
    const key = change.products.join(' ');
    const group = groups.get(key) ?? {products: change.products, notes: []};
    group.notes.push(change);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function renderChanges(changes: ProductChange[]): string {
  return groupChanges(changes)
    .map((group) =>
      [
        `<section class="release-change-group" data-products="${group.products.join(' ')}">`,
        `<p class="release-products">${labels(group.products)}</p>`,
        '<ul class="release-changes">',
        ...group.notes.map((note) => `<li class="release-change">${renderMarkdown(note.text)}</li>`),
        '</ul></section>',
      ].join(''),
    )
    .join('');
}

export function generateReleaseNotes(docsDir: string): RenderedHistory {
  const dataDir = path.join(docsDir, '.vitepress/releases');
  const seed: ReleaseSnapshot = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed.json'), 'utf8'));
  const livePath = path.join(dataDir, 'live.json');
  const live = fs.existsSync(livePath)
    ? (JSON.parse(fs.readFileSync(livePath, 'utf8')) as ReleaseSnapshot).releases
    : [];
  const byTag = new Map(seed.releases.map((release) => [release.tag_name, release]));
  for (const release of live) byTag.set(release.tag_name, release);
  const result = renderHistory(
    buildHistory([...byTag.values()], readEditorials(path.join(docsDir, 'releases/_entries'))),
    seed.since,
  );
  const partial = path.join(docsDir, '_partials/releases.generated.md');
  const raw = path.join(docsDir, 'public/releases/index.md');
  for (const [file, text] of [
    [partial, result.html],
    [raw, result.markdown],
  ]) {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text);
  }
  return result;
}
