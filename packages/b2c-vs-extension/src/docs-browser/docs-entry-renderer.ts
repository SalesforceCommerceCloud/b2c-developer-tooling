/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {escapeHtml, renderInline, renderMarkdown} from './markdown.js';
import type {DocAttribute, DocEntry, DocParam, DocReturn, DocThrows} from './types.js';

/**
 * Render a `DocEntry` as a self-contained HTML fragment. Output goes inside
 * `<main>` in the webview shell. All values are escaped via the markdown
 * renderer's escape helpers — there is no path that emits raw HTML from the
 * source data.
 */
export function renderDocEntryHtml(entry: DocEntry): string {
  const parts: string[] = [];

  parts.push(renderHeader(entry));
  if (entry.signature) parts.push(renderSignature(entry.signature));
  if (entry.description) parts.push(`<p class="entry-summary">${renderInline(entry.description)}</p>`);

  if (entry.params && entry.params.length > 0) parts.push(renderParams(entry.params));
  if (entry.attributes && entry.attributes.length > 0) parts.push(renderAttributes(entry.attributes));
  if (entry.returns) parts.push(renderReturns(entry.returns));
  if (entry.throws && entry.throws.length > 0) parts.push(renderThrows(entry.throws));

  if (entry.examples && entry.examples.length > 0) {
    parts.push('<section class="entry-section"><h2>Examples</h2>');
    for (const example of entry.examples) {
      parts.push(`<pre><code class="language-javascript">${escapeHtml(example)}</code></pre>`);
    }
    parts.push('</section>');
  }

  if (entry.sections && entry.sections.length > 0) {
    for (const section of entry.sections) {
      // The summary is already shown above; "Description" sections duplicate
      // it, so skip when their body starts with the same text.
      if (section.heading === 'Description' && entry.description && section.body.startsWith(entry.description)) {
        const remainder = section.body.slice(entry.description.length).trim();
        if (!remainder) continue;
        parts.push('<section class="entry-section">');
        parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
        parts.push(renderMarkdown(remainder));
        parts.push('</section>');
        continue;
      }
      parts.push('<section class="entry-section">');
      parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
      parts.push(renderMarkdown(section.body));
      parts.push('</section>');
    }
  }

  return parts.join('\n');
}

function renderHeader(entry: DocEntry): string {
  const breadcrumbs: string[] = [];
  if (entry.packagePath) {
    breadcrumbs.push(escapeHtml(entry.packagePath.replace(/\//g, '.')));
  }
  const breadcrumb = breadcrumbs.length > 0 ? `<div class="entry-breadcrumb">${breadcrumbs.join(' › ')}</div>` : '';

  const kindBadge = `<span class="entry-kind-badge">${escapeHtml(entry.kind)}</span>`;
  const sinceBadge = entry.sinceApiVersion
    ? `<span class="entry-since-badge" title="API version">since ${escapeHtml(entry.sinceApiVersion)}</span>`
    : '';
  const deprecatedBadge = entry.deprecated
    ? `<span class="entry-deprecated-badge" title="Deprecated">deprecated</span>`
    : '';

  const deprecatedNote = entry.deprecated?.message
    ? `<p class="entry-deprecated-message">⚠️ ${renderInline(entry.deprecated.message)}</p>`
    : entry.deprecated
      ? `<p class="entry-deprecated-message">⚠️ Deprecated.</p>`
      : '';

  return [
    '<header class="entry-header">',
    breadcrumb,
    `<h1 class="entry-title">${escapeHtml(entry.title)}</h1>`,
    `<div class="entry-badges">${kindBadge}${sinceBadge}${deprecatedBadge}</div>`,
    `<code class="entry-qualified-name">${escapeHtml(entry.qualifiedName)}</code>`,
    deprecatedNote,
    '</header>',
  ]
    .filter(Boolean)
    .join('\n');
}

function renderSignature(signature: string): string {
  return `<pre class="entry-signature"><code class="language-typescript">${escapeHtml(signature)}</code></pre>`;
}

function renderParams(params: DocParam[]): string {
  const rows = params
    .map(
      (param) => `
        <tr>
          <td><code>${escapeHtml(param.name)}${param.optional ? '?' : ''}</code></td>
          <td>${param.type ? `<code>${escapeHtml(param.type)}</code>` : '<span class="entry-empty">—</span>'}</td>
          <td>${param.description ? renderInline(param.description) : '<span class="entry-empty">—</span>'}</td>
        </tr>`,
    )
    .join('');
  return `
    <section class="entry-section">
      <h2>Parameters</h2>
      <table class="entry-params"><thead>
        <tr><th>Name</th><th>Type</th><th>Description</th></tr>
      </thead><tbody>${rows}</tbody></table>
    </section>`;
}

function renderAttributes(attributes: DocAttribute[]): string {
  const rows = attributes
    .map(
      (attr) => `
        <tr>
          <td><code>${escapeHtml(attr.name)}</code></td>
          <td>${attr.required ? '<span class="entry-required">yes</span>' : '<span class="entry-empty">no</span>'}</td>
          <td>${attr.description ? renderInline(attr.description) : '<span class="entry-empty">—</span>'}</td>
        </tr>`,
    )
    .join('');
  return `
    <section class="entry-section">
      <h2>Attributes</h2>
      <table class="entry-params"><thead>
        <tr><th>Name</th><th>Required</th><th>Description</th></tr>
      </thead><tbody>${rows}</tbody></table>
    </section>`;
}

function renderReturns(returns: DocReturn): string {
  const type = returns.type ? `<code>${escapeHtml(returns.type)}</code>` : '<span class="entry-empty">—</span>';
  const description = returns.description ? `<p>${renderInline(returns.description)}</p>` : '';
  return `
    <section class="entry-section">
      <h2>Returns</h2>
      <p>${type}</p>
      ${description}
    </section>`;
}

function renderThrows(throws: DocThrows[]): string {
  const items = throws
    .map(
      (item) =>
        `<li><code>${escapeHtml(item.type)}</code>${item.description ? ` — ${renderInline(item.description)}` : ''}</li>`,
    )
    .join('');
  return `
    <section class="entry-section">
      <h2>Throws</h2>
      <ul>${items}</ul>
    </section>`;
}
