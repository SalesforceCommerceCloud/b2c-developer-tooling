/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Save / Edit modal. `mode` toggles between creating a new entry and renaming
 * an existing one — same form, different submit handler.
 */
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Modal} from '../shared/components/Modal.js';
import type {SavedQuery} from '../shared/types.js';

export type SaveModalMode = 'save' | 'rename' | null;

export interface SaveModalState {
  mode: SaveModalMode;
  query?: SavedQuery;
  sql?: string;
}

interface Props {
  state: SaveModalState;
  defaultName: string;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {mode: 'save' | 'rename'; id?: string; name: string; description: string; sql: string}) => void;
}

export function SaveQueryModal({state, defaultName, error, onClose, onSubmit}: Props) {
  const open = state.mode !== null;
  const isRename = state.mode === 'rename';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sql, setSql] = useState('');

  useEffect(() => {
    if (!open) return;
    if (isRename && state.query) {
      setName(state.query.name);
      setDescription(state.query.description ?? '');
      setSql(state.query.sql);
    } else {
      setName(defaultName);
      setDescription('');
      setSql(state.sql || '');
    }
  }, [open, isRename, state.query, state.sql, defaultName]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      title={isRename ? 'Edit Saved Query' : 'Save Query'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="saveQueryForm" className="btn btn-primary">
            {isRename ? 'Update' : 'Save'}
          </button>
        </>
      }
    >
      <form
        id="saveQueryForm"
        className="qb-modal__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (!sql.trim()) return;
          onSubmit({
            mode: isRename ? 'rename' : 'save',
            id: isRename ? state.query?.id : undefined,
            name: name.trim(),
            description: description.trim(),
            sql: sql.trim(),
          });
        }}
      >
        <div className="field">
          <label className="label" htmlFor="saveQueryName">
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="saveQueryName"
            className="input"
            placeholder="e.g. Top SKUs last 7 days"
            maxLength={120}
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="saveQueryDesc">
            Description
          </label>
          <input
            type="text"
            id="saveQueryDesc"
            className="input"
            placeholder="Optional — short note about this query"
            maxLength={240}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
        </div>
        <div className="field qb-modal__sql-preview">
          <label className="label" htmlFor="saveQuerySql">
            SQL <span className="required">*</span>
          </label>
          <textarea
            id="saveQuerySql"
            className="qb-modal__sql-input"
            spellCheck={false}
            required
            value={sql}
            onChange={(e) => setSql(e.currentTarget.value)}
          />
        </div>
        {error ? <div className="qb-modal__error">{error}</div> : null}
      </form>
    </Modal>
  );
}
