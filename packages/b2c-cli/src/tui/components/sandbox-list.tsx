/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useMemo} from 'react';
import {Box, Text} from 'ink';
import type {OdsComponents} from '@salesforce/b2c-tooling-sdk';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];

interface SandboxListProps {
  maxVisibleRows: number;
  sandboxes: SandboxModel[];
  selectedIndex: number;
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

function SandboxRow({isSelected, sandbox}: {isSelected: boolean; sandbox: SandboxModel}): React.ReactElement {
  const stateColor = getStateColor(sandbox.state);

  return (
    <Box>
      <Text backgroundColor={isSelected ? 'blue' : undefined} color={isSelected ? 'white' : undefined}>
        <Text>{isSelected ? '> ' : '  '}</Text>
        <Text>{(sandbox.realm ?? '-').padEnd(6)}</Text>
        <Text>{(sandbox.instance ?? '-').padEnd(6)}</Text>
        <Text color={isSelected ? undefined : stateColor}>{(sandbox.state ?? '-').padEnd(12)}</Text>
        <Text>{(sandbox.resourceProfile ?? '-').padEnd(10)}</Text>
        <Text>{sandbox.hostName ?? '-'}</Text>
      </Text>
    </Box>
  );
}

export function SandboxList({maxVisibleRows, sandboxes, selectedIndex}: SandboxListProps): React.ReactElement {
  // Calculate viewport - rows available for data (excluding header row)
  const dataRows = Math.max(1, maxVisibleRows - 1);

  // Calculate scroll offset to keep selection visible
  const {hasMore, hasMoreAbove, startIndex, visibleSandboxes} = useMemo(() => {
    if (sandboxes.length <= dataRows) {
      return {
        hasMore: false,
        hasMoreAbove: false,
        startIndex: 0,
        visibleSandboxes: sandboxes,
      };
    }

    // Keep selection centered when possible, with some padding
    const padding = Math.floor(dataRows / 3);
    let start = Math.max(0, selectedIndex - padding);
    const maxStart = Math.max(0, sandboxes.length - dataRows);
    start = Math.min(start, maxStart);

    // Ensure selection is always visible
    if (selectedIndex < start) {
      start = selectedIndex;
    } else if (selectedIndex >= start + dataRows) {
      start = selectedIndex - dataRows + 1;
    }

    return {
      hasMore: start + dataRows < sandboxes.length,
      hasMoreAbove: start > 0,
      startIndex: start,
      visibleSandboxes: sandboxes.slice(start, start + dataRows),
    };
  }, [sandboxes, selectedIndex, dataRows]);

  if (sandboxes.length === 0) {
    return (
      <Box padding={1}>
        <Text dimColor>No sandboxes found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header row */}
      <Box>
        <Text bold dimColor>
          {'  '}
          {'Realm'.padEnd(6)}
          {'Num'.padEnd(6)}
          {'State'.padEnd(12)}
          {'Profile'.padEnd(10)}
          Hostname
        </Text>
        {hasMoreAbove && <Text color="cyan"> ↑ more</Text>}
      </Box>
      {/* Sandbox rows */}
      {visibleSandboxes.map((sandbox, index) => (
        <SandboxRow
          isSelected={startIndex + index === selectedIndex}
          key={sandbox.id ?? startIndex + index}
          sandbox={sandbox}
        />
      ))}
      {/* Scroll indicator */}
      {hasMore && (
        <Box justifyContent="flex-end">
          <Text color="cyan">↓ more ({sandboxes.length - startIndex - dataRows} below)</Text>
        </Box>
      )}
    </Box>
  );
}
