/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Date-range presets ("Last Week", "Last Month", "Last 6 Months", "Custom").
// Reused by report dashboards that declare both a `from` and `to` date param.
import * as React from 'react';
import {useEffect, useState} from 'react';
import {resolvePreset, type DateRangePreset} from '../shared/dateRange.js';

export type DateRangeValue = {from: string; to: string} | null;
export type Preset = DateRangePreset;

interface Props {
  onChange: (value: DateRangeValue) => void;
  /** Surfaces validation messages back to the parent (e.g., custom range with empty inputs). */
  onError?: (message: string | null) => void;
}

export function DateRangePicker({onChange, onError}: Props) {
  const [preset, setPreset] = useState<Preset | null>(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Pushes the current resolved value up to the parent whenever any input shifts.
  useEffect(() => {
    if (preset === null) {
      onChange(null);
      return;
    }
    if (preset === 'custom') {
      if (!customFrom || !customTo) {
        onError?.(null); // Defer error reporting to submit time.
        onChange(null);
        return;
      }
      onError?.(null);
      onChange({from: customFrom, to: customTo});
      return;
    }
    const resolved = resolvePreset(preset);
    onChange(resolved);
  }, [preset, customFrom, customTo]);

  const presets: Array<{key: Preset; label: string}> = [
    {key: 'last-week', label: 'Last Week'},
    {key: 'last-month', label: 'Last Month'},
    {key: 'last-6-months', label: 'Last 6 Months'},
    {key: 'custom', label: 'Custom'},
  ];

  return (
    <div className="field full date-range-field">
      <label className="label">
        Date Range <span className="required">*</span>
      </label>
      <div className="date-range-presets">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`btn btn-secondary date-preset-btn${preset === p.key ? ' active' : ''}`}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className={`date-range-custom${preset === 'custom' ? '' : ' date-range-custom--hidden'}`}>
        <div className="date-range-custom__fields">
          <div className="field">
            <label className="label" htmlFor="from">
              From <span className="required">*</span>
            </label>
            <input
              type="date"
              id="from"
              name="from"
              className="input"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.currentTarget.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="to">
              To <span className="required">*</span>
            </label>
            <input
              type="date"
              id="to"
              name="to"
              className="input"
              value={customTo}
              onChange={(e) => setCustomTo(e.currentTarget.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
