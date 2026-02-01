/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useMemo} from 'react';
import {Box, Text} from 'ink';
import type {PropfindEntry} from '@salesforce/b2c-tooling-sdk/clients';

interface FileBrowserProps {
  entries: PropfindEntry[];
  error: null | string;
  loading: boolean;
  maxVisibleRows: number;
  path: string;
  selectedIndex: number;
}

// Fixed column widths
const SIZE_WIDTH = 10;
const DATE_WIDTH = 16;
const MIN_NAME_WIDTH = 20;
const MAX_NAME_WIDTH = 60;

/**
 * Formats bytes into human-readable sizes.
 */
function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / k ** i;

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Formats a date for display.
 */
function formatDate(date: Date | undefined): string {
  if (!date) return '-';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Truncates a string to fit within maxLength, adding ellipsis if needed.
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str.padEnd(maxLength);
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Extracts the display name from a PropfindEntry.
 */
function getDisplayName(entry: PropfindEntry): string {
  if (entry.displayName) {
    return entry.displayName;
  }
  // Extract filename from href
  const parts = entry.href.split('/').filter(Boolean);
  return parts.at(-1) ?? entry.href;
}

function FileRow({entry, isSelected, nameWidth}: {entry: PropfindEntry; isSelected: boolean; nameWidth: number}): React.ReactElement {
  const name = getDisplayName(entry);
  const icon = entry.isCollection ? '📁' : '📄';
  const size = entry.isCollection ? '' : formatBytes(entry.contentLength);
  const date = formatDate(entry.lastModified);

  return (
    <Box>
      <Text backgroundColor={isSelected ? 'blue' : undefined} color={isSelected ? 'white' : undefined}>
        <Text>{isSelected ? '> ' : '  '}</Text>
        <Text>{icon} </Text>
        <Text>{truncate(name, nameWidth)}</Text>
        <Text dimColor={!isSelected}>{size.padStart(SIZE_WIDTH)}</Text>
        <Text dimColor={!isSelected}> {date.padStart(DATE_WIDTH)}</Text>
      </Text>
    </Box>
  );
}

/**
 * Sorts entries: folders first, then by lastModified (newest first).
 */
export function sortEntries(entries: PropfindEntry[]): PropfindEntry[] {
  return [...entries].sort((a, b) => {
    // Folders always come first
    if (a.isCollection && !b.isCollection) return -1;
    if (!a.isCollection && b.isCollection) return 1;

    // Within same type, sort by lastModified (newest first)
    const aTime = a.lastModified?.getTime() ?? 0;
    const bTime = b.lastModified?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function FileBrowser({
  entries,
  error,
  loading,
  maxVisibleRows,
  path,
  selectedIndex,
}: FileBrowserProps): React.ReactElement {
  // Sort entries: folders first, then by lastModified
  const sortedEntries = useMemo(() => sortEntries(entries), [entries]);

  // Calculate name column width based on longest filename
  const nameWidth = useMemo(() => {
    if (entries.length === 0) return MIN_NAME_WIDTH;
    const maxLength = Math.max(...entries.map((e) => getDisplayName(e).length));
    return Math.min(MAX_NAME_WIDTH, Math.max(MIN_NAME_WIDTH, maxLength));
  }, [entries]);

  // Calculate viewport - rows available for data (excluding path header, column header, and scroll indicator)
  const dataRows = Math.max(1, maxVisibleRows - 3);

  // Calculate scroll offset to keep selection visible
  const {hasMore, hasMoreAbove, startIndex, visibleEntries} = useMemo(() => {
    if (sortedEntries.length <= dataRows) {
      return {
        hasMore: false,
        hasMoreAbove: false,
        startIndex: 0,
        visibleEntries: sortedEntries,
      };
    }

    // Keep selection centered when possible
    const padding = Math.floor(dataRows / 3);
    let start = Math.max(0, selectedIndex - padding);
    const maxStart = Math.max(0, sortedEntries.length - dataRows);
    start = Math.min(start, maxStart);

    // Ensure selection is always visible
    if (selectedIndex < start) {
      start = selectedIndex;
    } else if (selectedIndex >= start + dataRows) {
      start = selectedIndex - dataRows + 1;
    }

    return {
      hasMore: start + dataRows < sortedEntries.length,
      hasMoreAbove: start > 0,
      startIndex: start,
      visibleEntries: sortedEntries.slice(start, start + dataRows),
    };
  }, [sortedEntries, selectedIndex, dataRows]);

  if (loading) {
    return (
      <Box padding={1}>
        <Text color="yellow">Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={1}>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1}>
          <Text dimColor>Path: </Text>
          <Text>{path}</Text>
        </Box>
        <Text dimColor>Directory is empty</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Path header */}
      <Box>
        <Text dimColor>Path: </Text>
        <Text>{path}</Text>
        {hasMoreAbove && <Text color="cyan"> ↑</Text>}
      </Box>

      {/* Column headers */}
      <Box>
        <Text dimColor>{'    '}</Text>
        <Text dimColor>{'Name'.padEnd(nameWidth)}</Text>
        <Text dimColor>{'Size'.padStart(SIZE_WIDTH)}</Text>
        <Text dimColor>{' '}{'Modified'.padStart(DATE_WIDTH)}</Text>
      </Box>

      {/* File entries */}
      {visibleEntries.map((entry, index) => (
        <FileRow entry={entry} isSelected={startIndex + index === selectedIndex} key={entry.href} nameWidth={nameWidth} />
      ))}

      {/* Scroll indicator */}
      {hasMore && (
        <Box justifyContent="flex-end">
          <Text color="cyan">↓ more ({sortedEntries.length - startIndex - dataRows} below)</Text>
        </Box>
      )}
    </Box>
  );
}
