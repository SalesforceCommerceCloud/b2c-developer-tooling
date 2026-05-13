/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Used for both the AND/OR logic toggle and the Builder/SQL view switch.
 */
import * as React from 'react';

interface Props<T extends string> {
  value: T;
  options: ReadonlyArray<{value: T; label: string}>;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({value, options, onChange, className, ariaLabel}: Props<T>) {
  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
          data-logic={opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
