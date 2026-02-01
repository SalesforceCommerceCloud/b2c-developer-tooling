/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useCallback, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {LOG_LEVELS, LOG_PREFIXES, type LogTailConfig} from '../types.js';

interface LogConfigOverlayProps {
  /** Current configuration */
  currentConfig: LogTailConfig;
  /** Callback when user applies changes */
  onApply: (config: LogTailConfig) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

type Section = 'levels' | 'prefixes';

export function LogConfigOverlay({currentConfig, onApply, onCancel}: LogConfigOverlayProps): React.ReactElement {
  // Track which items are selected
  const [selectedPrefixes, setSelectedPrefixes] = useState<Set<string>>(new Set(currentConfig.prefixes));
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set(currentConfig.levels ?? []));

  // Track cursor position
  const [activeSection, setActiveSection] = useState<Section>('prefixes');
  const [prefixIndex, setPrefixIndex] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);

  const handleApply = useCallback(() => {
    const newConfig: LogTailConfig = {
      ...currentConfig,
      prefixes: [...selectedPrefixes],
      levels: selectedLevels.size > 0 ? [...selectedLevels] : undefined,
    };
    onApply(newConfig);
  }, [currentConfig, selectedPrefixes, selectedLevels, onApply]);

  const toggleCurrentItem = useCallback(() => {
    if (activeSection === 'prefixes') {
      const prefix = LOG_PREFIXES[prefixIndex];
      if (prefix) {
        setSelectedPrefixes((prev) => {
          const next = new Set(prev);
          if (next.has(prefix.key)) {
            next.delete(prefix.key);
          } else {
            next.add(prefix.key);
          }
          return next;
        });
      }
    } else {
      const level = LOG_LEVELS[levelIndex];
      if (level) {
        setSelectedLevels((prev) => {
          const next = new Set(prev);
          if (next.has(level)) {
            next.delete(level);
          } else {
            next.add(level);
          }
          return next;
        });
      }
    }
  }, [activeSection, prefixIndex, levelIndex]);

  useInput((input, key) => {
    // Cancel
    if (key.escape) {
      onCancel();
      return;
    }

    // Apply
    if (key.return) {
      handleApply();
      return;
    }

    // Toggle selection
    if (input === ' ') {
      toggleCurrentItem();
      return;
    }

    // Navigate up
    if (key.upArrow || input === 'k') {
      if (activeSection === 'prefixes') {
        setPrefixIndex((prev) => Math.max(0, prev - 1));
      } else {
        setLevelIndex((prev) => Math.max(0, prev - 1));
      }
      return;
    }

    // Navigate down
    if (key.downArrow || input === 'j') {
      if (activeSection === 'prefixes') {
        setPrefixIndex((prev) => Math.min(LOG_PREFIXES.length - 1, prev + 1));
      } else {
        setLevelIndex((prev) => Math.min(LOG_LEVELS.length - 1, prev + 1));
      }
      return;
    }

    // Switch sections with Tab or left/right
    if (key.tab || key.leftArrow || key.rightArrow || input === 'h' || input === 'l') {
      setActiveSection((prev) => (prev === 'prefixes' ? 'levels' : 'prefixes'));
    }
  });

  return (
    <Box borderColor="blue" borderStyle="double" flexDirection="column" marginX={2} marginY={1} padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          Log Configuration
        </Text>
      </Box>

      <Box flexDirection="row" gap={4}>
        {/* Prefixes column */}
        <Box flexDirection="column" width={30}>
          <Box marginBottom={1}>
            <Text bold color={activeSection === 'prefixes' ? 'cyan' : undefined}>
              Log Types (Tab to switch)
            </Text>
          </Box>
          {LOG_PREFIXES.map((prefix, index) => {
            const isSelected = selectedPrefixes.has(prefix.key);
            const isCursor = activeSection === 'prefixes' && index === prefixIndex;
            return (
              <Box key={prefix.key}>
                <Text backgroundColor={isCursor ? 'blue' : undefined} color={isCursor ? 'white' : undefined}>
                  <Text color={isSelected ? 'green' : 'gray'}>{isSelected ? '[x]' : '[ ]'}</Text>
                  <Text> {prefix.label.padEnd(14)}</Text>
                </Text>
              </Box>
            );
          })}
        </Box>

        {/* Levels column */}
        <Box flexDirection="column" width={20}>
          <Box marginBottom={1}>
            <Text bold color={activeSection === 'levels' ? 'cyan' : undefined}>
              Level Filter
            </Text>
          </Box>
          {LOG_LEVELS.map((level, index) => {
            const isSelected = selectedLevels.has(level);
            const isCursor = activeSection === 'levels' && index === levelIndex;
            const levelColor =
              level === 'ERROR' || level === 'FATAL'
                ? 'red'
                : level === 'WARN'
                  ? 'yellow'
                  : level === 'INFO'
                    ? 'cyan'
                    : 'gray';
            return (
              <Box key={level}>
                <Text backgroundColor={isCursor ? 'blue' : undefined} color={isCursor ? 'white' : undefined}>
                  <Text color={isSelected ? 'green' : 'gray'}>{isSelected ? '[x]' : '[ ]'}</Text>
                  <Text color={levelColor}> {level}</Text>
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1}>
            <Text dimColor>(empty = all levels)</Text>
          </Box>
        </Box>
      </Box>

      {/* Help text */}
      <Box marginTop={1}>
        <Text dimColor>↑↓/j/k navigate • Tab switch • Space toggle • Enter apply • Esc cancel</Text>
      </Box>
    </Box>
  );
}
