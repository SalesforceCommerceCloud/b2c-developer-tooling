/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Toolbar dropdown listing the user's saved queries. Active-tenant entries
 * appear first; other tenants drop below a divider so they're still reachable
 * but visually de-emphasized.
 */
import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {Icon} from '../shared/components/Icon.js';
import type {SavedQuery} from '../shared/types.js';

interface Props {
  queries: SavedQuery[];
  activeTenantId: string;
  onLoad: (q: SavedQuery) => void;
  onRename: (q: SavedQuery) => void;
  onDelete: (q: SavedQuery) => void;
}

export function SavedQueriesMenu({queries, activeTenantId, onLoad, onRename, onDelete}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [open]);

  const sameTenant = queries.filter((q) => q.tenantId === activeTenantId);
  const otherTenant = queries.filter((q) => q.tenantId !== activeTenantId);
  const total = queries.length;

  return (
    <div className="saved-queries" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="bookmark" />
        <span>Saved Queries</span>
        {total > 0 ? <span className="count-badge saved-queries__count">{total}</span> : null}
        <span className="saved-queries__caret">▾</span>
      </button>
      <div className="saved-queries__menu" role="menu" hidden={!open}>
        <div className="saved-queries__list">
          {total === 0 ? (
            <div className="saved-queries__empty">No saved queries yet — use Save to bookmark this query.</div>
          ) : (
            <>
              {sameTenant.map((q) => (
                <SavedQueryRow
                  key={q.id}
                  q={q}
                  dimmed={false}
                  onLoad={onLoad}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
              {otherTenant.length > 0 && sameTenant.length > 0 ? (
                <div className="saved-queries__sep">Other tenants</div>
              ) : null}
              {otherTenant.map((q) => (
                <SavedQueryRow key={q.id} q={q} dimmed={true} onLoad={onLoad} onRename={onRename} onDelete={onDelete} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SavedQueryRow({
  q,
  dimmed,
  onLoad,
  onRename,
  onDelete,
}: {
  q: SavedQuery;
  dimmed: boolean;
  onLoad: (q: SavedQuery) => void;
  onRename: (q: SavedQuery) => void;
  onDelete: (q: SavedQuery) => void;
}) {
  const meta = [dimmed ? q.tenantId : null, q.description].filter(Boolean).join(' · ');
  return (
    <div className={`saved-queries__row${dimmed ? ' is-other' : ''}`} data-id={q.id}>
      <button
        type="button"
        className="saved-queries__label"
        title={q.description ? `${q.name} — ${q.description}` : q.name}
        onClick={() => onLoad(q)}
      >
        <span className="saved-queries__name">{q.name}</span>
        {meta ? <span className="saved-queries__meta">{meta}</span> : null}
      </button>
      <button
        type="button"
        className="saved-queries__action"
        title="Rename / edit"
        onClick={(e) => {
          e.stopPropagation();
          onRename(q);
        }}
      >
        ✎
      </button>
      <button
        type="button"
        className="saved-queries__action saved-queries__action--danger"
        title="Delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(q);
        }}
      >
        ✕
      </button>
    </div>
  );
}
