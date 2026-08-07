/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useEffect, useState } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { CodeEditor, InlineField, InlineFieldRow, Select, Button, Collapse } from '@grafana/ui';

import { CIPDataSource } from './datasource';
import { CIPColumn, CIPDataSourceOptions, CIPFormat, CIPQuery, CIPTable } from './types';

type Props = QueryEditorProps<CIPDataSource, CIPQuery, CIPDataSourceOptions>;

const FORMAT_OPTIONS: Array<SelectableValue<CIPFormat>> = [
  { label: 'Time series', value: CIPFormat.TimeSeries },
  { label: 'Table', value: CIPFormat.Table },
];

export function QueryEditor(props: Props) {
  const { datasource, query, onChange, onRunQuery } = props;

  const [tables, setTables] = useState<CIPTable[]>([]);
  const [openSchema, setOpenSchema] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string>('');
  const [columns, setColumns] = useState<Record<string, CIPColumn[]>>({});

  useEffect(() => {
    if (openSchema && tables.length === 0) {
      datasource
        .getTables('warehouse')
        .then(setTables)
        .catch((e) => console.error('CIP tables load failed', e));
    }
  }, [openSchema, tables.length, datasource]);

  const onSqlChange = (rawSql: string) => onChange({ ...query, rawSql });
  const onFormatChange = (v: SelectableValue<CIPFormat>) => {
    onChange({ ...query, format: v.value ?? CIPFormat.TimeSeries });
    onRunQuery();
  };

  const toggleTable = (t: CIPTable) => {
    const key = `${t.schema}.${t.name}`;
    if (expandedTable === key) {
      setExpandedTable('');
      return;
    }
    setExpandedTable(key);
    if (!columns[key]) {
      datasource
        .getColumns(t.schema, t.name)
        .then((cols) => setColumns((c) => ({ ...c, [key]: cols })))
        .catch((e) => console.error('CIP columns load failed', e));
    }
  };

  return (
    <div className="gf-form-group">
      <InlineFieldRow>
        <InlineField label="Format" labelWidth={12} tooltip="Time series attempts long→wide framing; Table returns columns as-is">
          <Select width={20} options={FORMAT_OPTIONS} value={query.format ?? CIPFormat.TimeSeries} onChange={onFormatChange} />
        </InlineField>
        <InlineField label="" grow>
          <Button variant="secondary" size="sm" onClick={onRunQuery} icon="play">
            Run query
          </Button>
        </InlineField>
      </InlineFieldRow>

      <CodeEditor
        language="sql"
        value={query.rawSql || ''}
        height={200}
        showMiniMap={false}
        showLineNumbers
        onBlur={onSqlChange}
        onSave={(v) => {
          onSqlChange(v);
          onRunQuery();
        }}
      />

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Macros: <code>$__timeFilter(col)</code>, <code>$__timeGroup(col, &apos;1d&apos;)</code>,{' '}
        <code>$__timeGroupAlias(col, &apos;1d&apos;)</code>, <code>$__timeFrom()</code>, <code>$__timeTo()</code>. SQL is
        Calcite dialect over the CIP warehouse.
      </div>

      <Collapse label="Schema browser" isOpen={openSchema} onToggle={() => setOpenSchema(!openSchema)} collapsible>
        <div style={{ maxHeight: 260, overflowY: 'auto', fontSize: 12 }}>
          {tables.length === 0 && <div style={{ opacity: 0.7 }}>Loading tables…</div>}
          {tables.map((t) => {
            const key = `${t.schema}.${t.name}`;
            const isOpen = expandedTable === key;
            return (
              <div key={key} style={{ marginBottom: 2 }}>
                <div style={{ cursor: 'pointer' }} onClick={() => toggleTable(t)}>
                  {isOpen ? '▾' : '▸'} <code>{t.name}</code> <span style={{ opacity: 0.5 }}>({t.schema})</span>
                </div>
                {isOpen && (
                  <div style={{ paddingLeft: 18 }}>
                    {(columns[key] || []).map((c) => (
                      <div key={c.name}>
                        <code>{c.name}</code> <span style={{ opacity: 0.5 }}>{c.dataType}</span>
                      </div>
                    ))}
                    {!columns[key] && <div style={{ opacity: 0.6 }}>loading…</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Collapse>
    </div>
  );
}
