/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import {Box, Text} from 'ink';
import type {ViewType} from '../types.js';

interface FooterProps {
  canGoBack: boolean;
  sandboxCount?: number;
  viewType: ViewType;
}

export function Footer({canGoBack, sandboxCount, viewType}: FooterProps): React.ReactElement {
  const getHints = () => {
    const hints: Array<{key: string; label: string}> = [];

    // Navigation is always available
    hints.push({key: '↑↓/j/k', label: 'navigate'});

    // Enter to open (except in file viewer)
    if (viewType !== 'file-viewer') {
      hints.push({key: '⏎', label: 'open'});
    }

    // Back navigation when we have history
    if (canGoBack) {
      hints.push({key: 'esc', label: 'back'});
    }

    // Sandbox list specific actions
    if (viewType === 'sandbox-list') {
      hints.push({key: '/', label: 'filter'}, {key: 'o', label: 'sort'}, {key: 'R', label: 'refresh'});
    }

    // Logs available for sandbox views
    if (viewType === 'sandbox-list' || viewType === 'sandbox-detail') {
      hints.push({key: 'L', label: 'logs'});
    }

    // Log tail specific actions
    if (viewType === 'log-tail') {
      hints.push(
        {key: 'Space', label: 'pause'},
        {key: 'g/G', label: 'top/bottom'},
        {key: '/', label: 'search'},
        {key: 'c', label: 'config'},
      );
    }

    // Command palette available when viewing sandboxes
    if (viewType === 'sandbox-list' || viewType === 'sandbox-detail') {
      hints.push({key: ':', label: 'commands'});
    }

    // Help and quit always available
    hints.push({key: '?', label: 'help'}, {key: 'q', label: 'quit'});

    return hints;
  };

  const hints = getHints();

  const getCountLabel = () => {
    if (viewType === 'sandbox-list' && sandboxCount !== undefined) {
      return `${sandboxCount} sandbox(es)`;
    }
    return null;
  };

  const countLabel = getCountLabel();

  return (
    <Box borderStyle="single" justifyContent="space-between" paddingX={1}>
      <Text>
        {hints.map((hint, index) => (
          <Text key={hint.key}>
            {index > 0 && ' '}
            <Text dimColor>{hint.key}</Text> {hint.label}
          </Text>
        ))}
      </Text>
      {countLabel && <Text dimColor>{countLabel}</Text>}
    </Box>
  );
}
