/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';
import {Chip} from '../../shared/components/Chip.js';

interface Props {
  currentTable: string | null;
}

export function FromClause({currentTable}: Props) {
  return (
    <ClauseCard
      step={2}
      keyword="FROM"
      heading="Source Entity"
      description="The CIP data warehouse entity to query."
      dataClause="from"
    >
      {currentTable ? (
        <Chip label={currentTable} primary iconName="table" />
      ) : (
        <span className="placeholder">Pick an entity from the sidebar to begin.</span>
      )}
    </ClauseCard>
  );
}
