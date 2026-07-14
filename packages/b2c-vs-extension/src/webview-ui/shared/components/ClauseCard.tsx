/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Builder clause card. Renders the numbered header, keyword pill, heading,
// description, and per-clause action buttons.
import * as React from 'react';

interface Props {
  step: number;
  keyword: string;
  heading: string;
  description: string;
  actions?: React.ReactNode;
  dataClause: string;
  children: React.ReactNode;
}

export function ClauseCard({step, keyword, heading, description, actions, dataClause, children}: Props) {
  return (
    <div className="clause" data-clause={dataClause}>
      <div className="clause-head">
        <span className="clause-step" aria-hidden="true">
          {step}
        </span>
        <div className="clause-title-group">
          <div className="clause-title">
            <span className="kw">{keyword}</span> <span className="clause-heading">{heading}</span>
          </div>
          <div className="clause-desc">{description}</div>
        </div>
        {actions ? <div className="clause-actions">{actions}</div> : null}
      </div>
      <div className="clause-body">{children}</div>
    </div>
  );
}
