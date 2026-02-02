/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {AuthConfig} from '@salesforce/b2c-tooling-sdk';
import type {LogEntry} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {useLogTail} from '../hooks/use-log-tail.js';
import type {LogTailConfig, SandboxModel} from '../types.js';

interface LogTailViewProps {
  /** Sandbox to tail logs from */
  sandbox: SandboxModel;
  /** Log tail configuration */
  config: LogTailConfig;
  /** Authentication configuration */
  authConfig: AuthConfig;
  /** Maximum visible rows */
  maxVisibleRows: number;
  /** Terminal width for text wrapping */
  terminalWidth: number;
  /** Callback to open config overlay */
  onOpenConfig: () => void;
  /** Callback to open search filter */
  onOpenSearch: () => void;
  /** Callback to go back */
  onGoBack: () => void;
  /** Whether input should be handled by this component */
  isActive: boolean;
}

// Log level colors
const LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'gray',
  ERROR: 'red',
  FATAL: 'magenta',
  INFO: 'cyan',
  TRACE: 'gray',
  WARN: 'yellow',
};

/**
 * Formats a single log entry for display.
 */
function LogEntryLine({entry, width}: {entry: LogEntry; width: number}): React.ReactElement {
  const levelColor = LEVEL_COLORS[entry.level ?? 'INFO'] ?? 'white';
  const level = (entry.level ?? 'INFO').padEnd(5);

  // Manually wrap the message to fit within available width
  const messageWidth = Math.max(20, width - 6); // 6 = level(5) + space(1)
  const wrappedLines: string[] = [];
  for (const line of entry.message.split('\n')) {
    if (line.length <= messageWidth) {
      wrappedLines.push(line);
    } else {
      // Wrap long lines
      let remaining = line;
      while (remaining.length > 0) {
        wrappedLines.push(remaining.slice(0, messageWidth));
        remaining = remaining.slice(messageWidth);
      }
    }
  }

  return (
    <Box flexDirection="column">
      {wrappedLines.map((line, i) => (
        <Box key={i}>
          {i === 0 ? (
            <Text bold color={levelColor}>
              {level}{' '}
            </Text>
          ) : (
            <Text>{'      '}</Text>
          )}
          <Text>{line}</Text>
        </Box>
      ))}
    </Box>
  );
}

export function LogTailView({
  sandbox,
  config,
  authConfig,
  maxVisibleRows,
  terminalWidth,
  onOpenConfig,
  onOpenSearch,
  onGoBack,
  isActive,
}: LogTailViewProps): React.ReactElement {
  // Account for box borders (2) and padding (2)
  const contentWidth = Math.max(40, terminalWidth - 4);

  const {entries, loading, error, paused, pause, resume, clear} = useLogTail({
    sandbox,
    config,
    authConfig,
  });

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  // Calculate visible entries (reserve space for status bar)
  const availableRows = Math.max(1, maxVisibleRows - 2);

  // Filter entries by search (filtering on render so search works on existing entries)
  const filteredEntries = useMemo(() => {
    if (!config.search) return entries;
    const searchLower = config.search.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.message.toLowerCase().includes(searchLower) ||
        entry.file.toLowerCase().includes(searchLower) ||
        (entry.level?.toLowerCase().includes(searchLower) ?? false),
    );
  }, [entries, config.search]);

  // Auto-scroll to bottom when new entries arrive and not paused
  useEffect(() => {
    if (autoScroll && !paused && filteredEntries.length > 0) {
      const maxOffset = Math.max(0, filteredEntries.length - availableRows);
      setScrollOffset(maxOffset);
    }
  }, [filteredEntries.length, autoScroll, paused, availableRows]);

  // Handle keyboard input
  const moveUp = useCallback(() => {
    setScrollOffset((prev) => Math.max(0, prev - 1));
    setAutoScroll(false);
  }, []);

  const moveDown = useCallback(() => {
    const maxOffset = Math.max(0, filteredEntries.length - availableRows);
    setScrollOffset((prev) => {
      const next = Math.min(maxOffset, prev + 1);
      // Re-enable auto-scroll if we're at the bottom
      if (next >= maxOffset) {
        setAutoScroll(true);
      }
      return next;
    });
  }, [filteredEntries.length, availableRows]);

  const jumpToTop = useCallback(() => {
    setScrollOffset(0);
    setAutoScroll(false);
  }, []);

  const jumpToBottom = useCallback(() => {
    const maxOffset = Math.max(0, filteredEntries.length - availableRows);
    setScrollOffset(maxOffset);
    setAutoScroll(true);
  }, [filteredEntries.length, availableRows]);

  const togglePause = useCallback(() => {
    if (paused) {
      resume();
      setAutoScroll(true);
    } else {
      pause();
      setAutoScroll(false);
    }
  }, [paused, pause, resume]);

  useInput(
    (input, key) => {
      // Go back
      if (key.escape || key.backspace || key.delete) {
        onGoBack();
        return;
      }

      // Navigation
      if (key.upArrow || input === 'k') {
        moveUp();
      }
      if (key.downArrow || input === 'j') {
        moveDown();
      }

      // Jump to top/bottom
      if (input === 'g') {
        jumpToTop();
      }
      if (input === 'G') {
        jumpToBottom();
      }

      // Pause/resume
      if (input === ' ') {
        togglePause();
      }

      // Config overlay
      if (input === 'c') {
        onOpenConfig();
      }

      // Search filter
      if (input === '/') {
        onOpenSearch();
      }

      // Clear buffer
      if (input === 'C') {
        clear();
      }
    },
    {isActive},
  );

  // Memoize visible entries calculation
  const {visibleEntries, hasMoreAbove, hasMoreBelow} = useMemo(() => {
    const visible = filteredEntries.slice(scrollOffset, scrollOffset + availableRows);
    return {
      hasMoreAbove: scrollOffset > 0,
      hasMoreBelow: scrollOffset + availableRows < filteredEntries.length,
      visibleEntries: visible,
    };
  }, [filteredEntries, scrollOffset, availableRows]);

  if (loading) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="yellow">Connecting to logs...</Text>
        <Text dimColor>Prefixes: {config.prefixes.join(', ')}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Scroll indicator */}
      {hasMoreAbove && (
        <Box>
          <Text color="cyan">↑ more above</Text>
        </Box>
      )}

      {/* Log entries */}
      {visibleEntries.length === 0 ? (
        <Box>
          <Text dimColor>Waiting for log entries...</Text>
        </Box>
      ) : (
        visibleEntries.map((entry, index) => (
          <LogEntryLine entry={entry} key={`${entry.file}-${scrollOffset + index}`} width={contentWidth} />
        ))
      )}

      {/* Bottom status bar */}
      <Box marginTop={1}>
        {paused ? (
          <Text color="yellow">Paused</Text>
        ) : autoScroll ? (
          <Text color="green">Tailing</Text>
        ) : (
          <Text dimColor>Scrolling</Text>
        )}
        <Text dimColor>
          {' '}
          | {config.search ? `${filteredEntries.length}/${entries.length}` : entries.length} entries
        </Text>
        {hasMoreBelow && <Text color="cyan"> | ↓ more</Text>}
      </Box>
    </Box>
  );
}
