/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Status pill + tenant + host info bar shared by every CIP Analytics webview header.
 */
import * as React from 'react';
import type {ConnectionState} from '../types.js';

interface Props {
  connection: ConnectionState;
}

export function ConnectionBar({connection}: Props) {
  const status = connection.status || 'disconnected';
  const label = status === 'connected' ? 'Connected' : status === 'testing' ? 'Connecting' : 'Disconnected';
  return (
    <div className={`conn-bar is-${status}`} role="status" aria-label="CIP connection">
      <div className="conn-bar__status">
        <span className={`conn-pill ${status}`}>{label}</span>
      </div>
      {connection.tenantId ? (
        <div className="conn-bar__item">
          <span className="conn-bar__label">Tenant</span>
          <span className="conn-bar__value">{connection.tenantId}</span>
        </div>
      ) : null}
      {connection.host ? (
        <div className="conn-bar__item">
          <span className="conn-bar__label">Host</span>
          <span className="conn-bar__value">{connection.host}</span>
        </div>
      ) : null}
    </div>
  );
}
