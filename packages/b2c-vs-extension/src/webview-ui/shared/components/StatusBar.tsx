/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Status footer driven by `kind` so theme-scoped colors apply automatically.
// The Query Builder hides this bar when `kind` is null (mirroring the original
// `style="display: none"` behavior). When `kind === 'loading'` we render a real
// <Spinner /> so it's a separate flex child and picks up the footer's gap.
import * as React from 'react';
import {Spinner} from './Spinner.js';

export type StatusKind = 'loading' | 'success' | 'error' | null;

interface Props {
  kind: StatusKind;
  text?: string;
}

export function StatusBar({kind, text}: Props) {
  if (!kind) return <div id="statusBar" style={{display: 'none'}} />;
  const cls = `footer ${kind}`;
  return (
    <div id="statusBar" className={cls}>
      {kind === 'loading' ? <Spinner /> : null}
      {text ? <span>{text}</span> : null}
    </div>
  );
}
