/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {AuthConfig} from '@salesforce/b2c-tooling-sdk';
import type {LogEntry} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {useLogTail} from '../hooks/use-log-tail.js';
import type {LogTailConfig, SandboxModel} from '../types.js';
import type {ScrollViewRef} from './scroll-view.js';
import {ScrollView} from './scroll-view.js';

interface LogTailViewProps {
  /** Sandbox to tail logs from */
  sandbox: SandboxModel;
  /** Log tail configuration */
  config: LogTailConfig;
  /** Authentication configuration */
  authConfig: AuthConfig;
  /** Maximum visible rows */
  maxVisibleRows: number;
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
 * Format matches CLI `logs tail`:
 *   LEVEL [timestamp] [file]
 *   message
 *   <blank line>
 */
function LogEntryLine({entry}: {entry: LogEntry}): React.ReactElement {
  const levelColor = LEVEL_COLORS[entry.level ?? 'INFO'] ?? 'white';
  const level = entry.level ?? 'INFO';
  const timestamp = entry.timestamp ? ` [${entry.timestamp}]` : '';
  // Replace tabs with spaces to avoid unpredictable width expansion
  const message = entry.message.replaceAll('\t', '    ');

  // Header line: LEVEL [timestamp] [file]
  // Message
  // Blank line separator
  return (
    <Text wrap="wrap">
      <Text bold color={levelColor}>
        {level}
      </Text>
      <Text dimColor>
        {timestamp} [{entry.file}]
      </Text>
      {'\n'}
      {message}
      {'\n'}
    </Text>
  );
}

export function LogTailView({
  sandbox,
  config,
  authConfig,
  maxVisibleRows,
  onOpenConfig,
  onOpenSearch,
  onGoBack,
  isActive,
}: LogTailViewProps): React.ReactElement {
  const scrollViewRef = useRef<ScrollViewRef>(null);

  const {entries, loading, error, paused, pause, resume, clear} = useLogTail({
    sandbox,
    config,
    authConfig,
  });

  // Track if we should auto-scroll to bottom
  const [autoScroll, setAutoScroll] = useState(true);

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

  // Handle scroll events to detect when user scrolls away from bottom
  const handleScroll = useCallback(() => {
    if (scrollViewRef.current) {
      const atBottom = scrollViewRef.current.isAtBottom();
      if (!atBottom && autoScroll) {
        setAutoScroll(false);
      }
    }
  }, [autoScroll]);

  // Handle keyboard input
  const moveUp = useCallback(() => {
    scrollViewRef.current?.scrollBy(-1);
    setAutoScroll(false);
  }, []);

  const moveDown = useCallback(() => {
    scrollViewRef.current?.scrollBy(1);
    // Check if we're at bottom after scrolling
    setTimeout(() => {
      if (scrollViewRef.current?.isAtBottom()) {
        setAutoScroll(true);
      }
    }, 0);
  }, []);

  const pageUp = useCallback(() => {
    const viewportHeight = scrollViewRef.current?.getViewportHeight() ?? 10;
    scrollViewRef.current?.scrollBy(-Math.max(1, viewportHeight - 2));
    setAutoScroll(false);
  }, []);

  const pageDown = useCallback(() => {
    const viewportHeight = scrollViewRef.current?.getViewportHeight() ?? 10;
    scrollViewRef.current?.scrollBy(Math.max(1, viewportHeight - 2));
    // Check if we're at bottom after scrolling
    setTimeout(() => {
      if (scrollViewRef.current?.isAtBottom()) {
        setAutoScroll(true);
      }
    }, 0);
  }, []);

  const jumpToTop = useCallback(() => {
    scrollViewRef.current?.scrollToTop();
    setAutoScroll(false);
  }, []);

  const jumpToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToBottom();
    setAutoScroll(true);
  }, []);

  const togglePause = useCallback(() => {
    if (paused) {
      resume();
      setAutoScroll(true);
    } else {
      pause();
      setAutoScroll(false);
    }
  }, [paused, pause, resume]);

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      scrollViewRef.current?.remeasure();
    };
    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

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

      // Page navigation
      if (key.pageUp || input === 'b') {
        pageUp();
      }
      if (key.pageDown || input === 'f') {
        pageDown();
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

  // Reserve 1 line for status bar
  const scrollAreaHeight = Math.max(3, maxVisibleRows - 1);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {/* Scrollable log entries */}
      <Box flexGrow={1} height={scrollAreaHeight}>
        {filteredEntries.length === 0 ? (
          <Text dimColor>Waiting for log entries...</Text>
        ) : (
          <ScrollView
            autoScrollToBottom={autoScroll && !paused}
            flexGrow={1}
            onScroll={handleScroll}
            ref={scrollViewRef}
          >
            {filteredEntries.map((entry, index) => (
              <LogEntryLine entry={entry} key={`${entry.file}-${index}`} />
            ))}
          </ScrollView>
        )}
      </Box>

      {/* Bottom status bar */}
      <Box>
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
        {!autoScroll && <Text color="cyan"> | Press G to resume tailing</Text>}
      </Box>
    </Box>
  );
}
