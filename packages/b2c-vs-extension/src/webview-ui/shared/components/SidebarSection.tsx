/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Sidebar pane that hosts a heading, count badge, search input, and a list.
// Reused by both the Query Builder (Entities + Columns) and the Tables Browser.
import * as React from 'react';
import {Icon} from './Icon.js';

interface Props {
  className?: string;
  iconName: string;
  title: string;
  count: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchDisabled?: boolean;
  children: React.ReactNode;
}

export function SidebarSection({
  className,
  iconName,
  title,
  count,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchDisabled,
  children,
}: Props) {
  return (
    <div className={`sidebar-section${className ? ' ' + className : ''}`}>
      <div className="section-head">
        <div className="section-title">
          <span className="section-title-icon">
            <Icon name={iconName} />
          </span>
          <span>{title}</span>
        </div>
        <span className="count-badge">{count}</span>
      </div>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder={searchPlaceholder}
          value={searchValue}
          disabled={searchDisabled}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
        />
      </div>
      <div className="list">{children}</div>
    </div>
  );
}
