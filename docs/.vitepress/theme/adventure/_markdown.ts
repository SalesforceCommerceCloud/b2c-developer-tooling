// Tiny markdown-to-HTML renderer for adventure body / warning content.
// Supports the limited subset adventures actually need:
//
//   `inline code`           ->  <code>inline code</code>
//   ```fenced code```       ->  <pre><code>fenced code</code></pre>
//   **bold**                ->  <strong>bold</strong>
//   *italic* / _italic_     ->  <em>italic</em>
//   [text](url)             ->  <a href="resolved-url">text</a>
//   - list item             ->  <ul><li>item</li>...</ul>
//   newline                 ->  <br>  (between paragraphs only)
//
// Internal absolute paths (those starting with `/`) are passed through the
// `resolveHref` callback so callers can apply VitePress's `withBase` for
// dev/stable build paths. External URLs (http/https) and anchor-only links
// (#foo) are passed through verbatim.

export type ResolveHref = (path: string) => string;

const ESCAPE_HTML: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESCAPE_HTML[c] ?? c);
}

function resolveUrl(url: string, resolveHref: ResolveHref): string {
  if (/^[a-z]+:/i.test(url) || url.startsWith('//') || url.startsWith('#') || url.startsWith('mailto:')) return url;
  if (url.startsWith('/')) return resolveHref(url);
  return url;
}

// Sentinel that's vanishingly unlikely to appear in adventure prose. Used
// to stash already-rendered HTML through the inline pipeline so its
// contents aren't re-escaped by subsequent regex passes.
const STASH_OPEN = '__B2CMD_PLACEHOLDER_';
const STASH_CLOSE = '__';

// Render inline markdown (no block-level handling). Used by the warning
// renderer for non-code content and inline contexts.
export function renderInline(text: string, resolveHref: ResolveHref): string {
  const placeholders: string[] = [];
  const stash = (html: string) => {
    const idx = placeholders.length;
    placeholders.push(html);
    return `${STASH_OPEN}${idx}${STASH_CLOSE}`;
  };

  // 1. Inline code spans (stash first so their contents aren't touched by
  // later replacements).
  let s = text.replace(/`([^`]+)`/g, (_m, body) => stash(`<code>${escapeHtml(body)}</code>`));

  // 2. Escape what remains so `<` / `>` in prose can't smuggle markup.
  s = escapeHtml(s);

  // 3. Links — `[text](url)`.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
    const resolvedUrl = resolveUrl(url, resolveHref);
    return `<a href="${resolvedUrl}">${label}</a>`;
  });

  // 4. Bold + italic (** and * — keep simple, non-overlapping).
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*[^*\s]|[^*\s])\*(?!\*)/g, '$1<em>$2</em>');

  // 5. Restore stashed placeholders.
  const stashRe = new RegExp(`${STASH_OPEN}(\\d+)${STASH_CLOSE}`, 'g');
  s = s.replace(stashRe, (_m, i) => placeholders[Number(i)]);

  return s;
}

// Render a block of markdown to HTML — handles fenced code, inline markdown,
// list items, and paragraph breaks.
export function renderBlock(text: string, resolveHref: ResolveHref): string {
  const blocks: string[] = [];
  const fence = /```(\w+)?\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    if (m.index > last) blocks.push(renderProse(text.slice(last, m.index), resolveHref));
    const lang = m[1] ?? '';
    const body = escapeHtml(m[2]);
    blocks.push(`<pre class="b2c-output__inline-code"><code class="language-${lang}">${body}</code></pre>`);
    last = m.index + m[0].length;
  }
  if (last < text.length) blocks.push(renderProse(text.slice(last), resolveHref));
  return blocks.join('');
}

// Render a non-code-fenced chunk: handles list items + paragraphs +
// inline markdown.
function renderProse(chunk: string, resolveHref: ResolveHref): string {
  const lines = chunk.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }
    // List
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*[-*]\s+/, ''), resolveHref)}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    // Paragraph (one or more consecutive non-blank, non-list lines)
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*[-*]\s+/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(renderInline(para.join('\n').replace(/\n/g, '<br>'), resolveHref));
  }
  return out.join('');
}
