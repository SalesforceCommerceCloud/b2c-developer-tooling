/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import {Icon} from './Icon.js';

interface Props {
  label: string;
  primary?: boolean;
  iconName?: string;
  onRemove?: () => void;
}

export function Chip({label, primary, iconName, onRemove}: Props) {
  return (
    <div className={`chip${primary ? ' primary' : ''}`}>
      {iconName ? <Icon name={iconName} /> : null}
      <span>{label}</span>
      {onRemove ? (
        <span className="remove" onClick={onRemove} role="button" aria-label={`Remove ${label}`}>
          ✕
        </span>
      ) : null}
    </div>
  );
}
