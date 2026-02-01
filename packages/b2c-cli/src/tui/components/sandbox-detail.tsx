/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import {Box, Text} from 'ink';
import {WEBDAV_ROOTS} from '../types.js';

interface SandboxDetailProps {
  maxVisibleRows: number;
  onSelectRoot: (rootKey: string) => void;
  selectedIndex: number;
}

export function SandboxDetail({
  maxVisibleRows: _maxVisibleRows,
  onSelectRoot: _onSelectRoot,
  selectedIndex,
}: SandboxDetailProps): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1}>
      {/* WebDAV roots header */}
      <Box marginBottom={1}>
        <Text bold dimColor>
          WebDAV Directories
        </Text>
      </Box>

      {/* WebDAV root list */}
      {WEBDAV_ROOTS.map((root, index) => (
        <Box key={root.key}>
          <Text
            backgroundColor={index === selectedIndex ? 'blue' : undefined}
            color={index === selectedIndex ? 'white' : undefined}
          >
            <Text>{index === selectedIndex ? '> ' : '  '}</Text>
            <Text bold>{root.name.padEnd(16)}</Text>
            <Text dimColor={index !== selectedIndex}>{root.description}</Text>
          </Text>
        </Box>
      ))}
    </Box>
  );
}
