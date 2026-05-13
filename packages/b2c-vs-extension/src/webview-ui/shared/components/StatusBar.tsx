/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Status footer driven by `kind` so theme-scoped colors apply automatically.
 * The Query Builder hides this bar when `kind` is null (mirroring the original
 * `style="display: none"` behavior).
 */
import * as React from 'react';

export type StatusKind = 'loading' | 'success' | 'error' | null;

interface Props {
  kind: StatusKind;
  /** Renders raw HTML when set (e.g., spinner glyph). Falls back to `text`. */
  html?: string;
  text?: string;
}

export function StatusBar({kind, html, text}: Props) {
  if (!kind) return <div id="statusBar" style={{display: 'none'}} />;
  const cls = `footer ${kind}`;
  if (html) return <div id="statusBar" className={cls} dangerouslySetInnerHTML={{__html: html}} />;
  return (
    <div id="statusBar" className={cls}>
      {text}
    </div>
  );
}
