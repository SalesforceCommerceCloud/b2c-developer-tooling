/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';

interface IconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  ariaHidden?: boolean;
}

export function Icon({name, className, style, ariaHidden = true}: IconProps) {
  const cls = `ic ic-${name}${className ? ' ' + className : ''}`;
  return <span className={cls} style={style} aria-hidden={ariaHidden} />;
}
