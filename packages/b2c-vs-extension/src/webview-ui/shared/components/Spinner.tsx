/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function Spinner({size, style}: SpinnerProps) {
  const cls = size ? `spinner spinner--${size}` : 'spinner';
  return <span className={cls} style={style} />;
}
