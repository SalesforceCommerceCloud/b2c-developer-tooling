/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useMemo} from 'react';
import {Box, Text} from 'ink';

interface FileViewerProps {
  content: null | string;
  error: null | string;
  loading: boolean;
  maxVisibleRows: number;
  path: string;
  scrollOffset: number;
}

// Log level colors
const LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'gray',
  ERROR: 'red',
  FATAL: 'red',
  INFO: 'green',
  TRACE: 'gray',
  WARN: 'yellow',
};

// Regex patterns for log parsing
const TIMESTAMP_PATTERN = /^(\[[\d\s\-:.]+(?:\s*[A-Z]{2,4})?\])/;
const LOG_LEVEL_PATTERN = /\b(ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\b/;

/**
 * Determines if a file is likely a log file based on path.
 */
function isLogFile(path: string): boolean {
  const lowerPath = path.toLowerCase();
  return (
    lowerPath.includes('/logs/') ||
    lowerPath.includes('log') ||
    lowerPath.endsWith('.log') ||
    lowerPath.includes('error') ||
    lowerPath.includes('debug')
  );
}

/**
 * Renders a log line with syntax highlighting.
 */
function LogLine({line}: {line: string}): React.ReactElement {
  // Try to parse timestamp at the start
  const timestampMatch = line.match(TIMESTAMP_PATTERN);
  const timestamp = timestampMatch?.[1];
  const afterTimestamp = timestamp ? line.slice(timestamp.length) : line;

  // Try to find log level
  const levelMatch = afterTimestamp.match(LOG_LEVEL_PATTERN);
  const level = levelMatch?.[1];
  const levelColor = level ? LOG_LEVEL_COLORS[level] : undefined;

  if (timestamp || level) {
    // Parse and highlight the line
    const parts: React.ReactElement[] = [];
    let remaining = line;
    let keyIndex = 0;

    // Handle timestamp
    if (timestamp) {
      parts.push(
        <Text color="cyan" key={keyIndex++}>
          {timestamp}
        </Text>,
      );
      remaining = remaining.slice(timestamp.length);
    }

    // Handle log level
    if (level) {
      const levelIndex = remaining.indexOf(level);
      if (levelIndex > 0) {
        parts.push(<Text key={keyIndex++}>{remaining.slice(0, levelIndex)}</Text>);
      }
      parts.push(
        <Text bold color={levelColor} key={keyIndex++}>
          {level}
        </Text>,
      );
      remaining = remaining.slice(levelIndex + level.length);
    }

    // Rest of the line
    if (remaining) {
      parts.push(<Text key={keyIndex++}>{remaining}</Text>);
    }

    return <Text>{parts}</Text>;
  }

  // No highlighting needed
  return <Text>{line}</Text>;
}

/**
 * Renders a plain text line.
 */
function PlainLine({line}: {line: string}): React.ReactElement {
  return <Text>{line}</Text>;
}

export function FileViewer({
  content,
  error,
  loading,
  maxVisibleRows,
  path,
  scrollOffset,
}: FileViewerProps): React.ReactElement {
  // Determine if this is a log file
  const isLog = isLogFile(path);

  // Split content into lines and handle scrolling
  const {hasMore, hasMoreAbove, totalLines, visibleLines} = useMemo(() => {
    if (!content) {
      return {hasMore: false, hasMoreAbove: false, totalLines: 0, visibleLines: []};
    }

    const allLines = content.split('\n');
    const availableRows = Math.max(1, maxVisibleRows - 2); // Account for header and scroll indicator

    const start = Math.min(scrollOffset, Math.max(0, allLines.length - availableRows));
    const visible = allLines.slice(start, start + availableRows);

    return {
      hasMore: start + availableRows < allLines.length,
      hasMoreAbove: start > 0,
      totalLines: allLines.length,
      visibleLines: visible,
    };
  }, [content, maxVisibleRows, scrollOffset]);

  // Extract filename from path
  const filename = path.split('/').pop() ?? path;

  if (loading) {
    return (
      <Box padding={1}>
        <Text color="yellow">Loading {filename}...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1}>
          <Text dimColor>File: </Text>
          <Text>{filename}</Text>
        </Box>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (!content) {
    return (
      <Box padding={1}>
        <Text dimColor>No content</Text>
      </Box>
    );
  }

  const LineComponent = isLog ? LogLine : PlainLine;

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* File header */}
      <Box marginBottom={1}>
        <Text dimColor>File: </Text>
        <Text bold>{filename}</Text>
        <Text dimColor> ({totalLines} lines)</Text>
        {hasMoreAbove && <Text color="cyan"> ↑</Text>}
      </Box>

      {/* File content - minWidth={5} required as geometry anchor for Yoga layout with wrapping text */}
      {visibleLines.map((line, index) => (
        <Box key={scrollOffset + index}>
          <Box minWidth={5} />
          <LineComponent line={line} />
        </Box>
      ))}

      {/* Scroll indicator */}
      {hasMore && (
        <Box justifyContent="flex-end">
          <Text color="cyan">↓ more (j/k to scroll)</Text>
        </Box>
      )}
    </Box>
  );
}
