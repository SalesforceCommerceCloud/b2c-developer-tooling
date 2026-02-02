/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {forwardRef, useImperativeHandle, useMemo, useState} from 'react';
import {Box, Text} from 'ink';

export interface FileViewerRef {
  scrollBy: (delta: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  remeasure: () => void;
}

interface FileViewerProps {
  content: null | string;
  error: null | string;
  loading: boolean;
  maxVisibleRows: number;
  path: string;
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

/**
 * Virtualized file viewer - only renders visible lines for performance.
 * Assumes each line is 1 row height (no wrapping).
 */
export const FileViewer = forwardRef<FileViewerRef, FileViewerProps>(
  ({content, error, loading, maxVisibleRows, path}, ref): React.ReactElement => {
    const [scrollOffset, setScrollOffset] = useState(0);

    // Split content into lines
    const {lines, totalLines} = useMemo(() => {
      if (!content) {
        return {lines: [], totalLines: 0};
      }
      // Replace tabs with spaces for consistent width
      const allLines = content.replaceAll('\t', '    ').split('\n');
      return {
        lines: allLines,
        totalLines: allLines.length,
      };
    }, [content]);

    // Reserve 2 lines for header and scroll hint
    const viewportHeight = Math.max(10, maxVisibleRows - 2);
    const maxScrollOffset = Math.max(0, totalLines - viewportHeight);

    // Expose scroll methods to parent
    useImperativeHandle(
      ref,
      () => ({
        scrollBy(delta: number) {
          setScrollOffset((prev) => Math.max(0, Math.min(maxScrollOffset, prev + delta)));
        },
        scrollToTop() {
          setScrollOffset(0);
        },
        scrollToBottom() {
          setScrollOffset(maxScrollOffset);
        },
        remeasure() {
          // No-op for virtualized view
        },
      }),
      [maxScrollOffset],
    );

    // Determine if this is a log file
    const isLog = isLogFile(path);

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
          <Box>
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

    // Only render visible lines (virtualization)
    const visibleLines = lines.slice(scrollOffset, scrollOffset + viewportHeight);

    return (
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {/* File header */}
        <Box>
          <Text dimColor>File: </Text>
          <Text bold>{filename}</Text>
          <Text dimColor>
            {' '}
            ({totalLines} lines) {scrollOffset > 0 && '↑'}
          </Text>
        </Box>

        {/* File content - virtualized, only visible lines */}
        <Box flexDirection="column" flexGrow={1} height={viewportHeight}>
          {visibleLines.map((line, index) => (
            <LineComponent key={scrollOffset + index} line={line || ' '} />
          ))}
        </Box>

        {/* Scroll hint */}
        <Box>
          <Text dimColor>j/k scroll, g/G top/bottom {scrollOffset + viewportHeight < totalLines && '↓'}</Text>
        </Box>
      </Box>
    );
  },
);
