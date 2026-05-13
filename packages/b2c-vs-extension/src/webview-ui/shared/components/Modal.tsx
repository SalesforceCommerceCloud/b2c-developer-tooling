/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reusable modal shell for save/edit dialogs. Mirrors the markup the existing
 * .qb-modal styles target so visual fidelity is preserved.
 */
import * as React from 'react';
import {useEffect} from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({open, title, onClose, footer, children}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="qb-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="qb-modal__backdrop" onClick={onClose} />
      <div className="qb-modal__panel">
        <div className="qb-modal__head">
          <h2 className="qb-modal__title" id="modal-title">
            {title}
          </h2>
          <button type="button" className="qb-modal__close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="qb-modal__body">{children}</div>
        <div className="qb-modal__foot">{footer}</div>
      </div>
    </div>
  );
}
