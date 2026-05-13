/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// SQL preview block with a copy button. Visibility is controlled by the parent
// (`open`) so the run-bar toggle stays beside the Run Query button — same as
// the original layout.
import * as React from 'react';
import {useMemo} from 'react';
import {useClipboardCopy} from '../hooks/useClipboardCopy.js';
import {Icon} from './Icon.js';

interface Props {
  sql: string;
  open: boolean;
}

const KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'ORDER BY',
  'LIMIT',
  'AND',
  'OR',
  'NOT',
  'IS NULL',
  'IS NOT NULL',
  'LIKE',
  'IN',
  'ASC',
  'DESC',
];

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightSql(sql: string): string {
  let out = escapeHtml(sql);
  // Case-insensitive: the SQL editor accepts free-form input, so `select` /
  // `Select` / `SELECT` should all light up the same way.
  for (const kw of KEYWORDS) {
    const regex = new RegExp('\\b(' + kw + ')\\b', 'gi');
    out = out.replace(regex, '<span class="sql-keyword">$1</span>');
  }
  out = out.replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>');
  out = out.replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');
  out = out.replace(/(--[^\n]*)/g, '<span class="sql-comment">$1</span>');
  return out;
}

export function SqlPreview({sql, open}: Props) {
  const isMeaningful = !!sql && !sql.startsWith('--');
  const {copied, copy} = useClipboardCopy();
  const html = useMemo(() => highlightSql(sql || ''), [sql]);

  return (
    <div className="preview-panel is-collapsed" id="previewPanel" hidden={!open}>
      <div className="preview-head">
        <span className="preview-label">Generated SQL</span>
        <button
          type="button"
          className="btn-ghost btn-ghost--inline"
          title="Copy to clipboard"
          onClick={() => isMeaningful && copy(sql)}
          disabled={!isMeaningful}
        >
          {copied ? (
            <>
              <Icon name="check" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Icon name="code" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre id="queryPreviewText" dangerouslySetInnerHTML={{__html: html}} />
    </div>
  );
}
