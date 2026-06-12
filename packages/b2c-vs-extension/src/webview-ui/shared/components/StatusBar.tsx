/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Status banner driven by `kind` so theme-scoped colors apply automatically.
// When `kind` is null the bar is hidden.
//
// Two presentation modes:
//   - Single-line: pass `text`. Used for transient success / loading messages.
//   - Two-line:    pass `headline` (+ optional `details`). Used for errors
//     so the cause is scannable at a glance and the verbose server message
//     can be expanded behind a "Show details" toggle.
//
// `onClose` adds a × dismiss button. The Query Builder uses this for errors
// so they only disappear on user action, not on a timer.
import * as React from 'react';
import {useState} from 'react';
import {Spinner} from './Spinner.js';

export type StatusKind = 'loading' | 'success' | 'error' | null;

interface Props {
  kind: StatusKind;
  /** Single-line message. Ignored when `headline` is supplied. */
  text?: string;
  /** Short, scannable summary (renders bold). */
  headline?: string;
  /** Verbose detail line. Long values are collapsed behind a toggle. */
  details?: string;
  /** When provided, renders a × button that calls this on click. */
  onClose?: () => void;
}

/** Threshold above which `details` collapse behind a "Show details" toggle. */
const DETAILS_COLLAPSE_THRESHOLD = 140;

export function StatusBar({kind, text, headline, details, onClose}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!kind) return <div id="statusBar" style={{display: 'none'}} />;

  const cls = `footer ${kind}${headline ? ' footer--rich' : ''}`;
  const collapsible = details !== undefined && details.length > DETAILS_COLLAPSE_THRESHOLD;
  const detailsVisible = !collapsible || expanded;

  return (
    <div id="statusBar" className={cls} role={kind === 'error' ? 'alert' : 'status'}>
      {kind === 'loading' ? <Spinner /> : null}
      <div className="footer__body">
        {headline ? <div className="footer__headline">{headline}</div> : null}
        {headline && details && detailsVisible ? <div className="footer__details">{details}</div> : null}
        {!headline && text ? <span>{text}</span> : null}
        {collapsible ? (
          <button
            type="button"
            className="footer__toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        ) : null}
      </div>
      {onClose ? (
        <button type="button" className="footer__close" onClick={onClose} aria-label="Dismiss" title="Dismiss">
          ✕
        </button>
      ) : null}
    </div>
  );
}
