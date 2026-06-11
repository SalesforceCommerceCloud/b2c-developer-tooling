/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Tiny Markdown renderer scoped to the shapes that appear in B2C Script API
 * JSDoc:
 *
 *   - Paragraphs separated by blank lines.
 *   - Inline backtick code (`Foo`).
 *   - **bold** and *italic*.
 *   - Hyphen bulleted lists.
 *   - Fenced code blocks (passed through verbatim into <pre><code>).
 *
 * The renderer is HTML-safe by construction — every input character is escaped
 * before any markup is emitted, so it cannot produce attribute injection or
 * stray `<script>` even if upstream JSDoc were tampered with. Anything outside
 * the supported subset is rendered as escaped text. No URLs are turned into
 * links — Phase 3 doesn't have a use case for them and they widen the attack
 * surface.
 */

export interface RenderMarkdownOptions {
  /** Optional language tag applied to fenced code blocks that don't specify one. */
  defaultCodeLanguage?: string;
}

export function renderMarkdown(source: string | undefined, options: RenderMarkdownOptions = {}): string {
  if (!source) return '';
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      const fenceLang = trimmed.slice(3).trim() || options.defaultCodeLanguage || '';
      const buffer: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buffer.push(lines[i]);
        i++;
      }
      // Skip the closing fence (or EOF).
      if (i < lines.length) i++;
      out.push(renderCodeBlock(buffer.join('\n'), fenceLang));
      continue;
    }

    if (trimmed === '') {
      i++;
      continue;
    }

    if (isListItem(line)) {
      const items: string[] = [];
      while (i < lines.length && (isListItem(lines[i]) || isContinuation(lines[i]))) {
        if (isListItem(lines[i])) {
          items.push(stripListMarker(lines[i]));
        } else {
          // List-item continuation — append to the previous item.
          items[items.length - 1] += ' ' + lines[i].trim();
        }
        i++;
      }
      out.push('<ul>');
      for (const item of items) out.push(`<li>${renderInline(item)}</li>`);
      out.push('</ul>');
      continue;
    }

    // Paragraph — gather until blank line, fence, or list start.
    const paragraph: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === '' || next.trim().startsWith('```') || isListItem(next)) break;
      paragraph.push(next);
      i++;
    }
    out.push(`<p>${renderInline(paragraph.join(' ').trim())}</p>`);
  }

  return out.join('\n');
}

/** Render an inline span — escapes HTML, then re-applies `code`/bold/italic markup. */
export function renderInline(source: string): string {
  // 1. Escape everything.
  let escaped = escapeHtml(source);

  // 2. Inline code is non-overlapping; do it before bold/italic so backticked
  //    `*foo*` is not turned into <em>foo</em>.
  escaped = escaped.replace(/`([^`]+)`/g, (_match, content: string) => `<code>${content}</code>`);

  // 3. **bold** — non-greedy, no nesting.
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, (_match, content: string) => `<strong>${content}</strong>`);

  // 4. *italic* — only when not adjacent to letters/digits (avoids `foo*bar`).
  escaped = escaped.replace(
    /(^|[^A-Za-z0-9_])\*([^*]+)\*(?=[^A-Za-z0-9_]|$)/g,
    (_match, prefix: string, content: string) => {
      return `${prefix}<em>${content}</em>`;
    },
  );

  return escaped;
}

export function escapeHtml(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    switch (ch) {
      case '&':
        out += '&amp;';
        break;
      case '<':
        out += '&lt;';
        break;
      case '>':
        out += '&gt;';
        break;
      case '"':
        out += '&quot;';
        break;
      case "'":
        out += '&#39;';
        break;
      default:
        out += ch;
    }
  }
  return out;
}

function renderCodeBlock(body: string, language: string): string {
  const cleaned = body.replace(/\s+$/, '');
  const langAttr = language && /^[a-zA-Z0-9-]+$/.test(language) ? ` class="language-${language}"` : '';
  return `<pre><code${langAttr}>${escapeHtml(cleaned)}</code></pre>`;
}

function isListItem(line: string): boolean {
  return /^\s*-\s+/.test(line);
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*-\s+/, '').trim();
}

function isContinuation(line: string): boolean {
  return /^\s+\S/.test(line) && !isListItem(line);
}
