/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ConfigInspection, InspectRow} from './config-inspect.js';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

const refreshSvg = `<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M13.65 2.35a8 8 0 1 0 1.96 8.4l-1.83-.69A6 6 0 1 1 12.24 3.76L10 6h6V0l-2.35 2.35z"/></svg>`;

const headerActions = `<div class="hdr-actions">
      <button class="btn-primary" onclick="vscode.postMessage({type:'refresh'})" title="Resolve the configuration again">${refreshSvg} Refresh</button>
      <button class="btn-ghost" onclick="vscode.postMessage({type:'selectInstance'})" title="Choose the instance and env file for this workspace">Select Instance...</button>
    </div>`;

/** Selection context, warnings and the values that were supplied but not used. */
function renderContext(model: ConfigInspection): string {
  if (!model.context.length && !model.warnings.length && !model.ignored.length) return '';
  const ignoredRows = model.ignored
    .map(
      (item) =>
        `<tr><td class="field"><span class="field-name">${escapeHtml(item.field)}</span></td><td>${escapeHtml(item.source)}</td><td class="muted">${escapeHtml(item.reason)}</td></tr>`,
    )
    .join('');
  return `<section class="card">
    <header class="card-hdr"><h2>Selection</h2></header>
    <ul class="context-list">${model.context.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    ${model.warnings.length ? `<ul class="context-list warnings">${model.warnings.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}
    ${
      ignoredRows
        ? `<details class="ignored"><summary>Not used (${model.ignored.length})</summary>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Field</th><th>Supplied by</th><th>Reason</th></tr></thead><tbody>${ignoredRows}</tbody></table></div>
    </details>`
        : ''
    }
  </section>`;
}

function renderEmptyState(styles: string, error?: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>
    <header class="hdr">
      <div class="hdr-text">
        <span class="eyebrow">B2C DX · Resolved Config</span>
        <h1>No B2C instance configured</h1>
        <p class="muted">${escapeHtml(error ?? 'Add a dw.json or env file to this project, or select an instance.')}</p>
      </div>
      ${headerActions}
    </header>
    <script>const vscode = acquireVsCodeApi();</script>
  </body></html>`;
}

/** Render the resolved-config panel, or an empty state with the resolution error. */
export function renderConfigInspectPanel(model: ConfigInspection | undefined, error?: string): string {
  const styles = inspectStyles();
  if (!model) return renderEmptyState(styles, error);
  const {rows} = model;
  // Group rows by source for the second view; keeps the per-source breakdown
  // clean even when one field is supplied by multiple lower-priority sources.
  const bySource = new Map<string, InspectRow[]>();
  for (const r of rows) {
    const key = r.source ?? 'unknown';
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(r);
  }

  const sourceColor = (source: string | undefined): string => {
    if (!source) return 'var(--src-fallback)';
    const s = source.toLowerCase();
    if (s.includes('env')) return 'var(--src-env)';
    if (s.includes('keychain')) return 'var(--src-keychain)';
    if (s.includes('pass')) return 'var(--src-pass)';
    if (s.includes('dw.json')) return 'var(--src-file)';
    if (s.includes('plugin')) return 'var(--src-plugin)';
    return 'var(--src-fallback)';
  };

  const lockSvg = `<svg class="lock-icon" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M8 1a3 3 0 0 0-3 3v3H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm-2 6V4a2 2 0 1 1 4 0v3H6z"/></svg>`;
  const copySvg = `<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M5 1h7a1 1 0 0 1 1 1v9h-1V2H5V1zm-2 3h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 1v9h7V5H3z"/></svg>`;

  const renderRow = (r: InspectRow, idx: number): string => {
    const display = r.sensitive
      ? `<span class="masked">${lockSvg}<span class="masked-dots">••••••••</span></span>`
      : r.value
        ? escapeHtml(r.value)
        : '<span class="muted">—</span>';
    const srcLabel = escapeHtml(r.source);
    const srcLower = r.source.toLowerCase();
    const searchHaystack = `${r.field} ${r.value} ${r.source}`.toLowerCase();
    return `<tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}${r.sensitive ? ' row-secret' : ''}" data-search="${escapeHtml(searchHaystack)}" data-source="${escapeHtml(srcLower)}">
      <td class="field">
        <span class="field-name">${escapeHtml(r.field)}</span>
        <button class="copy-btn" data-copy="${escapeHtml(r.field)}" title="Copy field name">${copySvg}</button>
      </td>
      <td class="value">
        ${display}
        ${!r.sensitive && r.value ? `<button class="copy-btn" data-copy="${escapeHtml(r.value)}" title="Copy value">${copySvg}</button>` : ''}
      </td>
      <td class="source"><span class="src-pill"${r.location ? ` title="${escapeHtml(r.location)}"` : ''} style="--src-color:${sourceColor(r.source)}"><span class="dot"></span>${srcLabel}</span></td>
    </tr>`;
  };

  const renderSourceBlock = (source: string, items: InspectRow[]): string => `
    <section class="src-block" style="--src-color:${sourceColor(source)}">
      <header class="src-hdr">
        <span class="src-name">${escapeHtml(source)}</span>
        <span class="src-count">${items.length}</span>
      </header>
      <ul class="src-fields">
        ${items
          .map(
            (r) =>
              `<li><span class="field">${escapeHtml(r.field)}</span>${
                r.sensitive ? ` <span class="lock-inline" title="masked secret">${lockSvg}</span>` : ''
              }</li>`,
          )
          .join('')}
      </ul>
    </section>`;

  const secretCount = rows.filter((r) => r.sensitive).length;
  const sourceCount = bySource.size;

  // Source legend — show distinct sources with their colors so users can decode the pills.
  const legendItems = [...bySource.keys()]
    .map(
      (s) =>
        `<span class="legend-item" style="--src-color:${sourceColor(s)}"><span class="dot"></span>${escapeHtml(s)}</span>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>
  <header class="hdr">
    <div class="hdr-text">
      <span class="eyebrow">B2C DX · Resolved Config</span>
      <h1>${escapeHtml(model.label)}</h1>
      <p class="muted">What the extension uses for this workspace, and where each value comes from. Secrets are hidden.</p>
      <div class="meta-chips">
        <span class="meta-chip"><strong>${rows.length}</strong>&nbsp;field${rows.length === 1 ? '' : 's'}</span>
        <span class="meta-chip"><strong>${sourceCount}</strong>&nbsp;source${sourceCount === 1 ? '' : 's'}</span>
        ${secretCount ? `<span class="meta-chip secret-chip">${lockSvg}<strong>${secretCount}</strong>&nbsp;hidden</span>` : ''}
      </div>
    </div>
    ${headerActions}
  </header>

  ${renderContext(model)}

  ${
    rows.length
      ? `
  <div class="toolbar">
    <div class="search-wrap">
      <svg class="search-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04z"/></svg>
      <input type="text" id="search" placeholder="Filter fields, values, or sources… (press /)" autocomplete="off" spellcheck="false" />
      <button class="search-clear" id="search-clear" title="Clear (Esc)" hidden>×</button>
    </div>
    <div class="filter-pills" id="filter-pills">
      <button class="filter-pill active" data-filter="all">All <span class="pill-count">${rows.length}</span></button>
      ${[...bySource.entries()]
        .map(
          ([s, items]) =>
            `<button class="filter-pill" data-filter="${escapeHtml(s.toLowerCase())}" style="--src-color:${sourceColor(s)}"><span class="dot"></span>${escapeHtml(s)} <span class="pill-count">${items.length}</span></button>`,
        )
        .join('')}
    </div>
  </div>

  <section class="card">
    <header class="card-hdr">
      <h2>All fields</h2>
      <span class="badge" id="visible-count">${rows.length}</span>
      <span class="card-hdr-spacer"></span>
      <span class="muted hint" id="empty-hint" hidden>No matches</span>
    </header>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Field</th><th>Value</th><th class="th-source">Source</th></tr></thead>
        <tbody id="tbl-body">${rows.map((r, i) => renderRow(r, i)).join('')}</tbody>
      </table>
    </div>
  </section>

  <section class="card">
    <header class="card-hdr">
      <h2>Grouped by source</h2>
      <span class="badge">${sourceCount}</span>
    </header>
    ${legendItems ? `<div class="legend" aria-label="Source colour key">${legendItems}</div>` : ''}
    <div class="src-grid">
      ${[...bySource.entries()].map(([s, items]) => renderSourceBlock(s, items)).join('')}
    </div>
  </section>

  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
  `
      : '<section class="card"><p class="muted">No values resolved.</p></section>'
  }

  <script>
    const vscode = acquireVsCodeApi();
    (function() {
      const search = document.getElementById('search');
      const searchClear = document.getElementById('search-clear');
      const tblBody = document.getElementById('tbl-body');
      const visibleCount = document.getElementById('visible-count');
      const emptyHint = document.getElementById('empty-hint');
      const filterPills = document.getElementById('filter-pills');
      const toast = document.getElementById('toast');
      let activeFilter = 'all';
      let toastTimer;

      function applyFilters() {
        if (!tblBody) return;
        const q = (search && search.value || '').trim().toLowerCase();
        let visible = 0;
        for (const tr of tblBody.querySelectorAll('tr')) {
          const haystack = tr.dataset.search || '';
          const src = tr.dataset.source || '';
          const matchSearch = !q || haystack.includes(q);
          const matchFilter = activeFilter === 'all' || src === activeFilter;
          const show = matchSearch && matchFilter;
          tr.style.display = show ? '' : 'none';
          if (show) visible++;
        }
        if (visibleCount) visibleCount.textContent = String(visible);
        if (emptyHint) emptyHint.hidden = visible !== 0;
        if (searchClear) searchClear.hidden = !(search && search.value);
      }

      function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.hidden = false;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function() {
          toast.classList.remove('show');
          setTimeout(function() { toast.hidden = true; }, 250);
        }, 1800);
      }

      if (search) search.addEventListener('input', applyFilters);
      if (searchClear) {
        searchClear.addEventListener('click', function() {
          if (search) { search.value = ''; search.focus(); }
          applyFilters();
        });
      }
      if (filterPills) {
        filterPills.addEventListener('click', function(e) {
          const btn = e.target.closest('.filter-pill');
          if (!btn) return;
          activeFilter = btn.dataset.filter || 'all';
          filterPills.querySelectorAll('.filter-pill').forEach(function(p) { p.classList.toggle('active', p === btn); });
          applyFilters();
        });
      }

      document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-copy]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const text = btn.dataset.copy || '';
        navigator.clipboard.writeText(text).then(function() {
          showToast('Copied to clipboard');
        }).catch(function() { showToast('Could not copy'); });
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === '/' && document.activeElement !== search) {
          e.preventDefault();
          if (search) search.focus();
        } else if (e.key === 'Escape' && search && document.activeElement === search) {
          search.value = '';
          applyFilters();
        }
      });
    })();
  </script>
  </body></html>`;
}

function inspectStyles(): string {
  return `
    .context-list { margin: 0; padding: 4px 16px 8px 32px; line-height: 1.7; }
    .context-list.warnings li { color: var(--vscode-editorWarning-foreground); }
    .ignored { padding: 4px 16px 12px; }
    .ignored summary { cursor: pointer; color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
    :root {
      color-scheme: light dark;
      --hairline: var(--vscode-panel-border, var(--vscode-editorGroup-border, rgba(128,128,128,0.22)));
      --surface: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      --row-zebra: color-mix(in srgb, var(--vscode-foreground) 4%, transparent);
      --row-hover: color-mix(in srgb, var(--vscode-foreground) 8%, transparent);
      --brand-blue: #0176D3;
      --brand-blue-deep: #014486;
      --brand-blue-soft: rgba(1, 118, 211, 0.10);
      --brand-green: #1A8754;
      --secret-amber: #C77700;
      --secret-amber-soft: rgba(199, 119, 0, 0.10);
      --src-env: #1A8754;
      --src-keychain: #0176D3;
      --src-pass: #6F42C1;
      --src-file: #C77700;
      --src-plugin: #1B96FF;
      --src-fallback: rgba(127,127,127,0.55);
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0; padding: 32px 40px;
      min-height: 100vh;
      font-family: 'Salesforce Sans','IBM Plex Sans','Source Sans 3',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    .muted { color: var(--vscode-descriptionForeground); }
    code { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); background: var(--brand-blue-soft); padding: 1px 6px; border-radius: 4px; color: var(--brand-blue-deep); font-size: 0.86em; }
    .eyebrow { display: inline-block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em; color: var(--brand-blue); text-transform: uppercase; margin-bottom: 6px; }
    h1 { margin: 0 0 6px; font-size: 1.7rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
    h2 { margin: 0; font-size: 0.95rem; font-weight: 600; letter-spacing: -0.005em; }
    .hdr {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .hdr-text { flex: 1 1 360px; min-width: 0; }
    .hdr-text > p { margin: 0 0 12px; max-width: 720px; }
    .hdr-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .stats {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 7px 12px; border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--hairline);
      font-size: 0.82rem;
    }
    .stat { display: inline-flex; align-items: center; gap: 5px; color: var(--vscode-descriptionForeground); }
    .stat strong { color: var(--vscode-foreground); font-weight: 700; }
    .stat-sep { color: var(--vscode-descriptionForeground); opacity: 0.5; }
    .secret-stat { color: var(--secret-amber); }
    .secret-stat strong { color: var(--secret-amber); }
    .secret-stat .lock-icon { color: var(--secret-amber); }
    button {
      display: inline-flex; align-items: center; gap: 6px;
      font: inherit; cursor: pointer; padding: 8px 14px;
      border-radius: 999px; font-weight: 600; font-size: 0.84rem;
      transition: all 0.15s ease;
    }
    button svg { display: block; }
    .btn-primary { background: var(--brand-blue); color: #fff; border: 1px solid var(--brand-blue); }
    .btn-primary:hover { background: var(--brand-blue-deep); border-color: var(--brand-blue-deep); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(1,118,211,0.30); }
    .btn-ghost { background: transparent; color: var(--brand-blue); border: 1px solid var(--brand-blue); }
    .btn-ghost:hover { background: var(--brand-blue-soft); }
    .card {
      background: var(--surface); border: 1px solid var(--hairline);
      border-radius: 14px; padding: 22px 24px; margin-bottom: 18px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.04);
    }
    .card-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px; padding: 0 8px;
      border-radius: 999px;
      background: var(--brand-blue-soft);
      color: var(--brand-blue-deep);
      font-size: 0.74rem; font-weight: 700;
      letter-spacing: 0.02em;
    }
    .card.empty { text-align: center; padding: 36px 22px; }
    table.tbl { width: 100%; border-collapse: separate; border-spacing: 0; }
    .tbl th { text-align: left; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: var(--vscode-descriptionForeground); padding: 6px 14px 12px; border-bottom: 1px solid var(--hairline); }
    .tbl th.th-source { text-align: left; }
    .tbl td { padding: 11px 14px; font-size: 0.9rem; vertical-align: middle; border-bottom: 1px solid color-mix(in srgb, var(--hairline) 60%, transparent); }
    .tbl tbody tr.row-odd td { background: var(--row-zebra); }
    .tbl tbody tr:hover td { background: var(--row-hover); }
    .tbl tbody tr:first-child td:first-child { border-top-left-radius: 8px; }
    .tbl tbody tr:first-child td:last-child { border-top-right-radius: 8px; }
    .tbl tbody tr:last-child td { border-bottom: none; }
    .tbl tbody tr:last-child td:first-child { border-bottom-left-radius: 8px; }
    .tbl tbody tr:last-child td:last-child { border-bottom-right-radius: 8px; }
    .tbl .field { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); font-size: 0.86rem; color: var(--vscode-foreground); white-space: nowrap; }
    .tbl .value { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); font-size: 0.86rem; word-break: break-all; }
    .tbl .source { white-space: nowrap; width: 1%; }
    .masked {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 999px;
      background: var(--secret-amber-soft);
      border: 1px solid color-mix(in srgb, var(--secret-amber) 35%, transparent);
      color: var(--secret-amber);
      font-size: 0.78rem; font-weight: 600;
    }
    .masked-dots { letter-spacing: 0.18em; line-height: 1; }
    .lock-icon { color: var(--secret-amber); flex-shrink: 0; }
    .lock-inline { display: inline-flex; vertical-align: middle; opacity: 0.85; }
    .src-pill {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 3px 10px 3px 9px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--src-color) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--src-color) 30%, transparent);
      color: var(--vscode-foreground);
      font-size: 0.78rem; font-weight: 500;
    }
    .src-pill .dot { background: var(--src-color); width: 7px; height: 7px; margin: 0; border-radius: 50%; box-shadow: 0 0 0 2px color-mix(in srgb, var(--src-color) 18%, transparent); }
    .src-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .src-block {
      background: var(--vscode-editor-background);
      border: 1px solid var(--hairline);
      border-left: 3px solid var(--src-color);
      border-radius: 10px; padding: 14px 16px;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .src-block:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--src-color) 50%, var(--hairline)); }
    .src-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 0.88rem; font-weight: 600; }
    .src-hdr .src-name { color: var(--vscode-foreground); }
    .src-hdr .src-count {
      margin-left: auto;
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 20px; padding: 0 7px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--src-color) 14%, transparent);
      color: var(--src-color);
      font-size: 0.72rem; font-weight: 700;
    }
    .src-fields { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
    .src-fields li { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); font-size: 0.82rem; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 6px; }
    .src-fields li .field { color: var(--vscode-foreground); }
    pre.raw { background: rgba(127,127,127,0.10); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--hairline); overflow-x: auto; font-size: 0.82rem; line-height: 1.45; white-space: pre; }

    /* Meta chips in header */
    .meta-chips { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; }
    .meta-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--hairline);
      font-size: 0.78rem;
      color: var(--vscode-descriptionForeground);
    }
    .meta-chip strong { color: var(--vscode-foreground); font-weight: 700; }
    .meta-chip svg { color: var(--brand-blue); }
    .meta-chip.secret-chip { color: var(--secret-amber); border-color: color-mix(in srgb, var(--secret-amber) 30%, transparent); background: var(--secret-amber-soft); }
    .meta-chip.secret-chip strong { color: var(--secret-amber); }
    .meta-chip.secret-chip .lock-icon { color: var(--secret-amber); }

    /* Toolbar (search + filter pills) */
    .toolbar {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      margin-bottom: 16px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--hairline);
      border-radius: 12px;
    }
    .search-wrap {
      position: relative;
      flex: 1 1 280px;
      min-width: 240px;
      display: flex; align-items: center;
    }
    .search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: var(--vscode-descriptionForeground); pointer-events: none;
    }
    #search {
      width: 100%;
      padding: 8px 36px 8px 36px;
      border-radius: 8px;
      border: 1px solid var(--hairline);
      background: var(--vscode-input-background, var(--vscode-editor-background));
      color: var(--vscode-input-foreground, var(--vscode-foreground));
      font: inherit; font-size: 0.88rem;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    #search:focus { border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(1,118,211,0.18); }
    #search::placeholder { color: var(--vscode-input-placeholderForeground, var(--vscode-descriptionForeground)); opacity: 0.85; }
    .search-clear {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px;
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0; border-radius: 50%; border: 0;
      background: transparent;
      color: var(--vscode-descriptionForeground);
      font-size: 1.1rem; line-height: 1;
      cursor: pointer;
    }
    .search-clear:hover { background: var(--row-hover); color: var(--vscode-foreground); }

    .filter-pills { display: inline-flex; flex-wrap: wrap; gap: 6px; }
    .filter-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 11px; border-radius: 999px;
      background: transparent;
      border: 1px solid var(--hairline);
      color: var(--vscode-descriptionForeground);
      font-size: 0.78rem; font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .filter-pill:hover { background: var(--row-hover); color: var(--vscode-foreground); }
    .filter-pill.active {
      background: var(--brand-blue);
      color: #fff; border-color: var(--brand-blue);
    }
    .filter-pill.active .pill-count { background: rgba(255,255,255,0.22); color: #fff; }
    .filter-pill .dot {
      display: inline-block; width: 7px; height: 7px; border-radius: 50%;
      background: var(--src-color, var(--src-fallback));
    }
    .filter-pill.active .dot { background: rgba(255,255,255,0.85); }
    .pill-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 16px; padding: 0 5px;
      border-radius: 999px;
      background: var(--brand-blue-soft);
      color: var(--brand-blue-deep);
      font-size: 0.68rem; font-weight: 700;
    }

    /* Card header spacer + hint */
    .card-hdr-spacer { flex: 1 1 auto; }
    .card-hdr .hint { font-size: 0.82rem; }

    /* Sticky table header */
    .tbl-wrap { position: relative; }
    .tbl thead th {
      position: sticky; top: 0;
      background: var(--surface);
      z-index: 2;
    }

    /* Copy-to-clipboard buttons */
    .copy-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px;
      margin-left: 6px;
      padding: 0; border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
      vertical-align: middle;
    }
    .tbl tr:hover .copy-btn { opacity: 0.7; }
    .copy-btn:hover { opacity: 1 !important; background: var(--row-hover); color: var(--brand-blue); }
    .copy-btn:focus-visible { opacity: 1; outline: 2px solid var(--brand-blue); outline-offset: 1px; }
    .field-name { display: inline-block; }

    /* Source legend */
    .legend {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 8px 12px;
      margin-bottom: 14px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--hairline);
      border-radius: 8px;
    }
    .legend-item {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 9px; border-radius: 999px;
      background: color-mix(in srgb, var(--src-color) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--src-color) 22%, transparent);
      color: var(--vscode-foreground);
      font-size: 0.76rem; font-weight: 500;
    }
    .legend-item .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--src-color);
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px; left: 50%; transform: translateX(-50%) translateY(8px);
      padding: 10px 18px;
      background: var(--vscode-foreground);
      color: var(--vscode-editor-background);
      border-radius: 999px;
      font-size: 0.84rem; font-weight: 600;
      box-shadow: 0 6px 24px rgba(0,0,0,0.18);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      z-index: 100;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
}
