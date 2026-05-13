/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Renders the dynamic parameter form for a curated CIP report. Field types
 * mirror the original report-dashboard.html generator (string/site/date/
 * boolean/number).
 */
import * as React from 'react';
import {DateRangePicker, type DateRangeValue} from './DateRangePicker.js';
import type {ReportParamDefinition} from './types.js';

interface Props {
  parameters: ReportParamDefinition[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  /** Site IDs come from the host once the connection is up. */
  siteOptions: string[] | null;
  hasDateRange: boolean;
  onDateRangeChange: (value: DateRangeValue) => void;
}

function humanizeName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bId\b/g, 'ID');
}

export function ReportForm({parameters, values, onChange, siteOptions, hasDateRange, onDateRangeChange}: Props) {
  return (
    <div className="config-grid">
      {parameters
        .filter((p) => !(hasDateRange && (p.name === 'from' || p.name === 'to')))
        .map((param) => {
          const labelText = humanizeName(param.name);
          const required = !!param.required;
          const value = values[param.name] ?? '';
          let fieldClass = 'field';
          let input: React.ReactNode = null;

          if (param.type === 'string' && param.name === 'siteId') {
            fieldClass += ' full';
            const placeholder = siteOptions === null ? '— Configure connection to load sites —' : '— Select a site —';
            input = (
              <select
                id={param.name}
                name={param.name}
                required={required}
                className="select site-id-select"
                value={value}
                onChange={(e) => onChange(param.name, e.currentTarget.value)}
              >
                <option value="" disabled>
                  {placeholder}
                </option>
                {(siteOptions ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            );
          } else if (param.type === 'string') {
            fieldClass += ' full';
            input = (
              <input
                type="text"
                id={param.name}
                name={param.name}
                required={required}
                className="input"
                placeholder={param.description}
                value={value}
                onChange={(e) => onChange(param.name, e.currentTarget.value)}
              />
            );
          } else if (param.type === 'date') {
            fieldClass += ' field--date';
            input = (
              <input
                type="date"
                id={param.name}
                name={param.name}
                required={required}
                className="input"
                value={value}
                onChange={(e) => onChange(param.name, e.currentTarget.value)}
              />
            );
          } else if (param.type === 'boolean') {
            input = (
              <select
                id={param.name}
                name={param.name}
                required={required}
                className="select"
                value={value}
                onChange={(e) => onChange(param.name, e.currentTarget.value)}
              >
                <option value="">— Select —</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            );
          } else if (param.type === 'number') {
            input = (
              <input
                type="number"
                id={param.name}
                name={param.name}
                min={param.min}
                max={param.max}
                required={required}
                className="input"
                placeholder={param.description}
                value={value}
                onChange={(e) => onChange(param.name, e.currentTarget.value)}
              />
            );
          } else {
            input = (
              <input
                type="text"
                id={param.name}
                name={param.name}
                required={required}
                className="input"
                placeholder={param.description}
                value={value}
                onChange={(e) => onChange(param.name, e.currentTarget.value)}
              />
            );
          }

          return (
            <div className={fieldClass} key={param.name}>
              <label className="label" htmlFor={param.name}>
                {labelText}
                {required ? ' ' : ''}
                {required ? <span className="required">*</span> : null}
              </label>
              <span className="hint">{param.description}</span>
              {input}
            </div>
          );
        })}
      {hasDateRange ? <DateRangePicker onChange={onDateRangeChange} /> : null}
    </div>
  );
}
