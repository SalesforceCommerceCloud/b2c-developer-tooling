/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared page-header card for CIP Analytics webviews. Hosts the eyebrow,
 * title, subtitle on the left and meta slot (connection bar + Configure
 * button) on the right.
 */
import * as React from 'react';

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  className?: string;
  flat?: boolean;
}

export function PageHeader({eyebrow, title, subtitle, meta, className, flat}: Props) {
  const cls = ['hero-header', 'page-header', 'qb-hero', flat ? 'qb-hero--flat' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <header className={cls}>
      <div className="page-header__body">
        <div className="page-header__eyebrow">{eyebrow}</div>
        <div className="page-header__title qb-hero__title">{title}</div>
        {subtitle ? <div className="page-header__subtitle">{subtitle}</div> : null}
      </div>
      {meta ? <div className="page-header__meta">{meta}</div> : null}
    </header>
  );
}
