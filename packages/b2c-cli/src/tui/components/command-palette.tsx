/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {SANDBOX_COMMANDS, type SandboxCommand, type SandboxModel} from '../types.js';

interface CommandPaletteProps {
  onClose: () => void;
  onExecute: (commandId: string) => void;
  sandbox: SandboxModel;
}

export function CommandPalette({onClose, onExecute, sandbox}: CommandPaletteProps): React.ReactElement {
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get available commands based on sandbox state
  const availableCommands = useMemo(() => {
    return SANDBOX_COMMANDS.filter((cmd) => cmd.isAvailable(sandbox.state));
  }, [sandbox.state]);

  // Filter commands by search input
  const filteredCommands = useMemo(() => {
    if (!filter) return availableCommands;
    const lowerFilter = filter.toLowerCase();
    return availableCommands.filter(
      (cmd) => cmd.label.toLowerCase().includes(lowerFilter) || cmd.id.toLowerCase().includes(lowerFilter),
    );
  }, [availableCommands, filter]);

  // Keep selection within bounds
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  const executeSelected = useCallback(() => {
    const cmd = filteredCommands[selectedIndex];
    if (cmd) {
      onExecute(cmd.id);
    }
  }, [filteredCommands, selectedIndex, onExecute]);

  useInput((input, key) => {
    // Close palette
    if (key.escape) {
      onClose();
      return;
    }

    // Execute selected command
    if (key.return) {
      executeSelected();
      return;
    }

    // Navigate up
    if (key.upArrow || (key.ctrl && input === 'p')) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    // Navigate down
    if (key.downArrow || (key.ctrl && input === 'n')) {
      setSelectedIndex((prev) => Math.min(filteredCommands.length - 1, prev + 1));
      return;
    }

    // Backspace for filter
    if (key.backspace || key.delete) {
      setFilter((prev) => prev.slice(0, -1));
      return;
    }

    // Check for shortcut keys (only when filter is empty)
    if (!filter && input.length === 1) {
      const shortcutCmd = availableCommands.find((cmd) => cmd.shortcut === input);
      if (shortcutCmd) {
        onExecute(shortcutCmd.id);
        return;
      }
    }

    // Type to filter
    if (input.length === 1 && /[\da-z]/i.test(input)) {
      setFilter((prev) => prev + input);
    }
  });

  return (
    <Box borderColor="cyan" borderStyle="round" flexDirection="column" marginX={2} paddingX={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Commands
        </Text>
        <Text dimColor> - </Text>
        <Text dimColor>
          {sandbox.realm}-{sandbox.instance}
        </Text>
      </Box>

      {/* Filter input */}
      <Box marginBottom={1}>
        <Text dimColor>{'> '}</Text>
        <Text>{filter}</Text>
        <Text color="cyan">█</Text>
      </Box>

      {/* Command list */}
      {filteredCommands.length === 0 ? (
        <Text dimColor>No matching commands</Text>
      ) : (
        filteredCommands.map((cmd, index) => (
          <CommandRow command={cmd} isSelected={index === selectedIndex} key={cmd.id} />
        ))
      )}

      {/* Footer hint */}
      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate • Enter select • Esc close</Text>
      </Box>
    </Box>
  );
}

function CommandRow({command, isSelected}: {command: SandboxCommand; isSelected: boolean}): React.ReactElement {
  return (
    <Box>
      <Text backgroundColor={isSelected ? 'blue' : undefined} color={isSelected ? 'white' : undefined}>
        <Text>{isSelected ? '> ' : '  '}</Text>
        <Text bold color={isSelected ? 'white' : command.color}>
          {command.label.padEnd(12)}
        </Text>
        <Text dimColor={!isSelected}>{command.description}</Text>
        {command.shortcut && <Text dimColor={!isSelected}> [{command.shortcut}]</Text>}
      </Text>
    </Box>
  );
}
