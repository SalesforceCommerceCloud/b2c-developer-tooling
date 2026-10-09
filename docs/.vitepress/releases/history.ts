/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import MarkdownIt from 'markdown-it';

export const products = {
  cli: {name: 'CLI', package: '@salesforce/b2c-cli'},
  ide: {name: 'IDE Extension', package: 'b2c-vs-extension'},
  mcp: {name: 'MCP', package: '@salesforce/b2c-dx-mcp'},
  skills: {name: 'Agent Skills', package: 'b2c-agent-plugins'},
  mrt: {name: 'MRT Utilities', package: '@salesforce/mrt-utilities'},
  sdk: {name: 'TypeScript SDK', package: '@salesforce/b2c-tooling-sdk'},
};

export type Product = keyof typeof products;

export interface PublishedRelease {
  tag_name: string;
  published_at: string;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  commit?: string;
}

export interface ReleaseSnapshot {
  since?: string;
  releases: PublishedRelease[];
}

export interface ProductVersion {
  product: Product;
  version: string;
}

export interface Editorial {
  id: string;
  title: string;
  date: string;
  products: Product[];
  release?: string;
  body: string;
}

export interface Change {
  text: string;
  dependency: boolean;
}

export interface ProductChange extends Change {
  products: Product[];
}

interface ReleaseGroup {
  id: string;
  publishedAt: string;
  date: string;
  versions: ProductVersion[];
  changes: ProductChange[];
  sources: {tag: string; url: string}[];
  highlights: Editorial[];
}

export interface HistoryEntry extends ReleaseGroup {
  products: Product[];
}

// Release bodies are content, never Vue templates or executable HTML.
const md = new MarkdownIt({html: false});
export const renderMarkdown = (source: string): string => md.render(source);
export const escapeHtml = (source: string): string => md.utils.escapeHtml(source);

function packageVersion(text: string): ProductVersion | undefined {
  for (const product of Object.keys(products) as Product[]) {
    const info = products[product];
    const prefix = `${info.package}@`;
    if (text.startsWith(prefix) && /^\d+\.\d+\.\d+$/.test(text.slice(prefix.length))) {
      return {product, version: text.slice(prefix.length)};
    }
  }
}

export function releaseSections(release: PublishedRelease): (ProductVersion & {body: string})[] {
  const body = release.body ?? '';
  const lines = body.split('\n');
  const tokens = md.parse(body, {});
  const boundaries: {pkg: ProductVersion | undefined; start: number; end: number}[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const map = tokens[i].map;
    if (tokens[i].type !== 'heading_open' || tokens[i].tag !== 'h2' || !map) continue;
    const title = tokens[i + 1].content;
    const pkg = packageVersion(title);
    if (pkg || title === 'Documentation' || title === 'Agent Skills Plugins') {
      boundaries.push({pkg, start: map[0], end: map[1]});
    }
  }
  if (boundaries.length) {
    return boundaries.flatMap((section, i) =>
      section.pkg ? [{...section.pkg, body: lines.slice(section.end, boundaries[i + 1]?.start).join('\n')}] : [],
    );
  }
  const pkg = packageVersion(release.tag_name);
  if (!pkg) return [];
  const changelog = tokens.findIndex(
    (token, i) => token.type === 'heading_open' && tokens[i + 1]?.content === 'Changelog',
  );
  const changelogEnd = tokens[changelog]?.map?.[1];
  return [{...pkg, body: changelogEnd === undefined ? body : lines.slice(changelogEnd).join('\n')}];
}

function cleanChange(text: string): string {
  // Remove only Changesets' generated attribution wrapper; retain the PR link.
  const match = text.match(/^(\[#\d+\]\([^)]+\)) \[`[a-f\d]+`\]\([^)]+\) - /);
  return (
    text
      .replace(/ \(Thanks \[@[^\]]+\]\([^)]+\)!\)\s*$/, '')
      .slice(match?.[0].length ?? 0)
      .trim() + (match ? ` ${match[1]}` : '')
  );
}

export function changesFromMarkdown(source: string): Change[] {
  const tokens = md.parse(source, {});
  const lines = source.split('\n');
  const changes: Change[] = [];
  let consumed = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.map || token.map[0] < consumed) continue;
    if (token.type === 'heading_open' && /^(Major|Minor|Patch) Changes$/.test(tokens[i + 1]?.content)) {
      consumed = token.map[1];
      continue;
    }
    if (token.type === 'list_item_open' && token.level === 1) {
      const text = lines
        .slice(...token.map)
        .join('\n')
        .replace(/^[-*+] /, '')
        .replace(/^ {2}/gm, '')
        .trim();
      changes.push({text: cleanChange(text), dependency: /^Updated dependencies\b/.test(text)});
      consumed = token.map[1];
    } else if (token.level === 0 && token.type !== 'bullet_list_open' && token.type !== 'ordered_list_open') {
      changes.push({text: cleanChange(lines.slice(...token.map).join('\n')), dependency: false});
      consumed = token.map[1];
    }
  }
  return changes.filter((change) => change.text);
}

export function buildHistory(releases: PublishedRelease[], editorials: Editorial[] = []): HistoryEntry[] {
  const groups = new Map<string, ReleaseGroup>();
  const tags = new Map<string, ReleaseGroup>();
  const versions = new Set<string>();
  // Dedicated artifacts repeat sections from the combined release. Sort first so
  // each product version belongs to its earliest publication, never a later recap.
  const stable = releases
    .filter((r) => !r.draft && !r.prerelease)
    .sort((a, b) => a.published_at.localeCompare(b.published_at));
  for (const release of stable) {
    const sections = releaseSections(release);
    if (!sections.length) continue;
    const key = release.commit || release.tag_name;
    let group = groups.get(key);
    if (!group) {
      group = {
        id: `release-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`,
        publishedAt: release.published_at,
        date: release.published_at.slice(0, 10),
        versions: [],
        changes: [],
        sources: [],
        highlights: [],
      };
      groups.set(key, group);
    }
    tags.set(release.tag_name, group);
    // Retain every product tag as an editorial target even when it has no separate release.
    for (const section of sections) tags.set(`${products[section.product].package}@${section.version}`, group);
    group.sources.push({tag: release.tag_name, url: release.html_url});
    for (const section of sections) {
      const versionKey = `${section.product}@${section.version}`;
      if (versions.has(versionKey)) continue;
      versions.add(versionKey);
      group.versions.push({product: section.product, version: section.version});
      for (const change of changesFromMarkdown(section.body)) {
        const existing = group.changes.find(
          (item) => item.text === change.text && item.dependency === change.dependency,
        );
        if (existing) existing.products.push(section.product);
        else group.changes.push({...change, products: [section.product]});
      }
    }
  }
  for (const entry of editorials) {
    if (entry.release) {
      const group = tags.get(entry.release);
      // An upcoming release highlight stays unpublished until its tag is present.
      if (group) group.highlights.push(entry);
    } else {
      groups.set(`announcement-${entry.id}`, {
        id: `announcement-${entry.id}`,
        publishedAt: `${entry.date}T00:00:00Z`,
        date: entry.date,
        versions: [],
        changes: [],
        sources: [],
        highlights: [entry],
      });
    }
  }
  return [...groups.values()]
    .filter((group) => group.versions.length || group.highlights.length)
    .map((group) => {
      const order = (a: Product, b: Product) => Object.keys(products).indexOf(a) - Object.keys(products).indexOf(b);
      group.versions.sort((a, b) => order(a.product, b.product));
      for (const change of group.changes) change.products.sort(order);
      return {
        ...group,
        products: [
          ...new Set([...group.versions.map((v) => v.product), ...group.highlights.flatMap((h) => h.products)]),
        ],
      };
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
}
