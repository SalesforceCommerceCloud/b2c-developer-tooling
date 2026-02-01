/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import {Box, Text} from 'ink';
import type {ViewType} from '../types.js';

interface HelpOverlayProps {
  onClose: () => void;
  viewType?: ViewType;
}

const generalShortcuts = [
  {description: 'Move selection down', key: 'j / ↓'},
  {description: 'Move selection up', key: 'k / ↑'},
  {description: 'Open/select item', key: 'Enter'},
  {description: 'Go back / clear filter', key: 'Esc'},
  {description: 'Go back', key: 'Backspace'},
  {description: 'Toggle help (this screen)', key: '?'},
  {description: 'Quit', key: 'q'},
];

const sandboxListShortcuts = [
  {description: 'Filter sandboxes', key: '/'},
  {description: 'Open sort menu', key: 'o'},
  {description: 'Refresh sandbox list', key: 'R'},
  {description: 'Open command palette', key: ':'},
  {description: 'Open log tailing', key: 'L'},
];

const sandboxDetailShortcuts = [
  {description: 'Open command palette', key: ':'},
  {description: 'Open log tailing', key: 'L'},
];

const logTailShortcuts = [
  {description: 'Scroll down', key: 'j / ↓'},
  {description: 'Scroll up', key: 'k / ↑'},
  {description: 'Pause/resume auto-scroll', key: 'Space'},
  {description: 'Jump to top', key: 'g'},
  {description: 'Jump to bottom', key: 'G'},
  {description: 'Open search filter', key: '/'},
  {description: 'Open config (prefixes/levels)', key: 'c'},
  {description: 'Clear log buffer', key: 'C'},
  {description: 'Exit log view', key: 'Esc'},
  {description: 'Toggle help (this screen)', key: '?'},
  {description: 'Quit', key: 'q'},
];

export function HelpOverlay({onClose: _onClose, viewType}: HelpOverlayProps): React.ReactElement {
  // Show log-specific shortcuts when in log-tail view
  const isLogTail = viewType === 'log-tail';
  const shortcuts = isLogTail
    ? logTailShortcuts
    : [
        ...generalShortcuts,
        ...(viewType === 'sandbox-list' ? sandboxListShortcuts : []),
        ...(viewType === 'sandbox-detail' ? sandboxDetailShortcuts : []),
      ];

  const title = isLogTail ? 'Log Tail Shortcuts' : 'Keyboard Shortcuts';

  return (
    <Box borderColor="blue" borderStyle="double" flexDirection="column" marginX={2} marginY={1} padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          {title}
        </Text>
      </Box>
      {shortcuts.map((shortcut) => (
        <Box key={shortcut.key}>
          <Text color="cyan">{shortcut.key.padEnd(12)}</Text>
          <Text>{shortcut.description}</Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>Press ? or Esc to close</Text>
      </Box>
    </Box>
  );
}
