/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import {Icon} from './Icon.js';
import {Spinner} from './Spinner.js';

interface Props {
  icon?: string;
  loading?: boolean;
  title?: string;
  hint?: string;
  className?: string;
}

export function EmptyState({icon = 'inbox', loading, title, hint, className}: Props) {
  return (
    <div className={`empty${className ? ' ' + className : ''}`}>
      <div className="empty-icon">
        {loading ? <Spinner size="lg" style={{width: 18, height: 18}} /> : <Icon name={icon} />}
      </div>
      {title ? <div className="empty-title">{title}</div> : null}
      {hint ? <div className="empty-hint">{hint}</div> : null}
    </div>
  );
}
