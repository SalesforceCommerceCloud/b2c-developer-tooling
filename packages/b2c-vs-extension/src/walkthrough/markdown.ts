/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Minimal, trust-the-source markdown renderer for our own walkthrough content.
 * Handles the subset used by media/walkthrough/*.md: headings, paragraphs, lists
 * (ordered + unordered, including nested), fenced code, inline code, emphasis,
 * bold, links, and horizontal rules. Escapes all raw HTML — we never embed
 * user-authored content here, but defense in depth.
 *
 * We avoid adding `marked` / `markdown-it` to the extension bundle for a
 * ~30KB saving; the rule set below covers every construct present in the
 * existing nine walkthrough pages.
 */

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  // Inline code: `foo`
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  // Links: [label](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safeUrl = /^(https?:|mailto:|command:|#)/i.test(url) ? url : '#';
    return `<a href="${safeUrl}">${label}</a>`;
  });
  // Bold: **foo** or __foo__
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Emphasis: *foo* or _foo_
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  return out;
}

interface ListState {
  ordered: boolean;
  indent: number;
  items: string[];
}

export function renderMarkdown(input: string): string {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  const listStack: ListState[] = [];
  let paragraph: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const closeListsTo = (indent: number) => {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent >= indent) {
      const list = listStack.pop()!;
      const tag = list.ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${tag}>`);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');

    // Fenced code blocks
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      if (inCodeBlock) {
        out.push(
          `<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ''}>${escapeHtml(
            codeBuffer.join('\n'),
          )}</code></pre>`,
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        flushParagraph();
        closeListsTo(0);
        inCodeBlock = true;
        codeLang = fence[1] ?? '';
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Blank line ends paragraph and any open lists at deeper indents than 0
    if (/^\s*$/.test(line)) {
      flushParagraph();
      closeListsTo(0);
      continue;
    }

    // Horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushParagraph();
      closeListsTo(0);
      out.push('<hr />');
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeListsTo(0);
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      continue;
    }

    // List item (unordered or ordered)
    const listItem = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (listItem) {
      flushParagraph();
      const indent = listItem[1].length;
      const ordered = /^\d+\./.test(listItem[2]);
      const content = renderInline(listItem[3]);

      // Close lists deeper than current indent
      while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
        const list = listStack.pop()!;
        const tag = list.ordered ? 'ol' : 'ul';
        const html = `<${tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${tag}>`;
        const parent = listStack[listStack.length - 1];
        if (parent) {
          parent.items[parent.items.length - 1] += html;
        } else {
          out.push(html);
        }
      }

      const top = listStack[listStack.length - 1];
      if (top && top.indent === indent && top.ordered === ordered) {
        top.items.push(content);
      } else {
        if (top && top.indent === indent && top.ordered !== ordered) {
          // Same indent, different type — close the old one.
          const list = listStack.pop()!;
          const tag = list.ordered ? 'ol' : 'ul';
          const html = `<${tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${tag}>`;
          const parent = listStack[listStack.length - 1];
          if (parent) parent.items[parent.items.length - 1] += html;
          else out.push(html);
        }
        listStack.push({ordered, indent, items: [content]});
      }
      continue;
    }

    // Paragraph line
    closeListsTo(0);
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeListsTo(0);
  if (inCodeBlock) {
    out.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  }
  return out.join('\n');
}
