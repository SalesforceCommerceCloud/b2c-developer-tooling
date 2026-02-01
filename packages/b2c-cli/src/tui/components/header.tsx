/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import {Box, Text} from 'ink';
import {SORT_OPTIONS, type LogTailConfig, type SandboxModel, type SortState} from '../types.js';

interface HeaderProps {
  error: null | string;
  filterText?: string;
  isFiltering?: boolean;
  isLogSearching?: boolean;
  lastUpdated: Date | null;
  loading: boolean;
  logConfig?: LogTailConfig;
  logSearchText?: string;
  realm?: string;
  sandbox?: SandboxModel;
  sort?: SortState;
}

function getStateColor(state: string | undefined): string | undefined {
  switch (state) {
    case 'failed': {
      return 'red';
    }
    case 'started': {
      return 'green';
    }
    case 'starting':
    case 'stopping': {
      return 'yellow';
    }
    case 'stopped': {
      return 'gray';
    }
    default: {
      return undefined;
    }
  }
}

export function Header({
  error,
  filterText,
  isFiltering,
  isLogSearching,
  lastUpdated,
  loading,
  logConfig,
  logSearchText,
  realm,
  sandbox,
  sort,
}: HeaderProps): React.ReactElement {
  // When viewing a sandbox, show detailed info
  if (sandbox) {
    const stateColor = getStateColor(sandbox.state);
    return (
      <Box borderStyle="single" flexDirection="column" paddingX={1}>
        {/* Row 1: Sandbox ID, state, profile, version */}
        <Box justifyContent="space-between">
          <Box>
            <Text bold color="cyan">
              {sandbox.realm}-{sandbox.instance}
            </Text>
            <Text color={stateColor}> ({sandbox.state})</Text>
            <Text dimColor> | </Text>
            <Text>{sandbox.resourceProfile ?? 'unknown'}</Text>
            {sandbox.versions?.app && (
              <>
                <Text dimColor> | v</Text>
                <Text>{sandbox.versions.app}</Text>
              </>
            )}
            {sandbox.autoScheduled && <Text color="yellow"> [auto]</Text>}
          </Box>
          <Box>
            {error ? (
              <Text color="red">{error.length > 30 ? error.slice(0, 30) + '...' : error}</Text>
            ) : loading ? (
              <Text color="yellow">Loading...</Text>
            ) : null}
          </Box>
        </Box>
        {/* Row 2: Hostname */}
        <Box>
          <Text dimColor>Host: </Text>
          <Text>{sandbox.hostName ?? 'N/A'}</Text>
        </Box>
        {/* Row 3: Created, EOL, Created by (or log config if tailing) */}
        {logConfig ? (
          <Box justifyContent="space-between">
            <Box>
              <Text dimColor>Logs: </Text>
              <Text>{logConfig.prefixes.join(', ')}</Text>
              {logConfig.levels && logConfig.levels.length > 0 && (
                <>
                  <Text dimColor> | Level: </Text>
                  <Text color="cyan">{logConfig.levels.join(', ')}</Text>
                </>
              )}
              {isLogSearching && (
                <>
                  <Text dimColor> | </Text>
                  <Text color="yellow">/</Text>
                  <Text>{logSearchText}</Text>
                  <Text color="cyan">█</Text>
                </>
              )}
              {!isLogSearching && logSearchText && (
                <>
                  <Text dimColor> | Search: </Text>
                  <Text color="yellow">{logSearchText}</Text>
                </>
              )}
            </Box>
          </Box>
        ) : (
          <Box>
            <Text dimColor>Created: </Text>
            <Text>{sandbox.createdAt ? new Date(sandbox.createdAt).toLocaleDateString() : 'N/A'}</Text>
            {sandbox.eol && (
              <>
                <Text dimColor> | EOL: </Text>
                <Text>{new Date(sandbox.eol).toLocaleDateString()}</Text>
              </>
            )}
            {sandbox.createdBy && (
              <>
                <Text dimColor> | By: </Text>
                <Text>{sandbox.createdBy}</Text>
              </>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // Get sort label
  const getSortLabel = () => {
    if (!sort) return null;
    const option = SORT_OPTIONS.find((o) => o.id === sort.field);
    if (!option) return null;
    const arrow = sort.direction === 'asc' ? '↑' : '↓';
    return `${option.label} ${arrow}`;
  };

  const sortLabel = getSortLabel();

  // Default: Sandbox list view
  return (
    <Box borderStyle="single" justifyContent="space-between" paddingX={1}>
      <Box>
        <Text bold color="blue">
          B2C Sandboxes
        </Text>
        {realm && (
          <Text>
            {' '}
            <Text dimColor>[realm:</Text>
            <Text color="cyan">{realm}</Text>
            <Text dimColor>]</Text>
          </Text>
        )}
        {sortLabel && (
          <Text>
            {' '}
            <Text dimColor>Sort:</Text>
            <Text color="magenta"> {sortLabel}</Text>
          </Text>
        )}
        {isFiltering && (
          <Text>
            {' '}
            <Text color="yellow">/</Text>
            <Text>{filterText}</Text>
            <Text color="cyan">█</Text>
          </Text>
        )}
        {!isFiltering && filterText && (
          <Text>
            {' '}
            <Text dimColor>Filter:</Text>
            <Text color="yellow"> {filterText}</Text>
          </Text>
        )}
      </Box>
      <Box>
        {error ? (
          <Text color="red">{error.length > 40 ? error.slice(0, 40) + '...' : error}</Text>
        ) : loading ? (
          <Text color="yellow">Loading...</Text>
        ) : lastUpdated ? (
          <Text dimColor>Updated: {lastUpdated.toLocaleTimeString()}</Text>
        ) : null}
      </Box>
    </Box>
  );
}
