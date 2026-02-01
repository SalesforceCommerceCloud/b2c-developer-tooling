/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {SORT_OPTIONS, type SortDirection, type SortState} from '../types.js';

interface SortMenuProps {
  currentSort: SortState;
  onClose: () => void;
  onSelect: (sort: SortState) => void;
}

export function SortMenu({currentSort, onClose, onSelect}: SortMenuProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const index = SORT_OPTIONS.findIndex((opt) => opt.id === currentSort.field);
    return index === -1 ? 0 : index;
  });

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => Math.min(SORT_OPTIONS.length - 1, prev + 1));
      return;
    }

    if (key.return) {
      const option = SORT_OPTIONS[selectedIndex];
      if (option) {
        // If selecting current field, toggle direction; otherwise use ascending
        const newDirection: SortDirection =
          option.id === currentSort.field ? (currentSort.direction === 'asc' ? 'desc' : 'asc') : 'asc';
        onSelect({direction: newDirection, field: option.id});
      }
      return;
    }

    // Toggle direction with 'r' for reverse
    if (input === 'r') {
      const option = SORT_OPTIONS[selectedIndex];
      if (option) {
        onSelect({
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
          field: option.id,
        });
      }
    }
  });

  return (
    <Box borderColor="magenta" borderStyle="round" flexDirection="column" marginX={2} paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="magenta">
          Sort By
        </Text>
      </Box>

      {SORT_OPTIONS.map((option, index) => {
        const isSelected = index === selectedIndex;
        const isCurrent = option.id === currentSort.field;
        const arrow = isCurrent ? (currentSort.direction === 'asc' ? ' ↑' : ' ↓') : '';

        return (
          <Box key={option.id}>
            <Text backgroundColor={isSelected ? 'blue' : undefined} color={isSelected ? 'white' : undefined}>
              <Text>{isSelected ? '> ' : '  '}</Text>
              <Text bold={isCurrent}>{option.label.padEnd(16)}</Text>
              <Text dimColor={!isSelected}>{option.description}</Text>
              {isCurrent && <Text color={isSelected ? 'white' : 'cyan'}>{arrow}</Text>}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate • Enter select • r reverse • Esc close</Text>
      </Box>
    </Box>
  );
}
