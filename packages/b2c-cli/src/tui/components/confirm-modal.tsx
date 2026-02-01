/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import {Box, Text, useInput} from 'ink';

interface ConfirmModalProps {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmModal({
  message,
  onCancel,
  onConfirm,
  title = 'Confirm',
  variant = 'default',
}: ConfirmModalProps): React.ReactElement {
  const borderColor = variant === 'danger' ? 'red' : 'yellow';
  const titleColor = variant === 'danger' ? 'red' : 'yellow';

  useInput((input, key) => {
    if (key.escape || input === 'n' || input === 'N') {
      onCancel();
      return;
    }

    if (key.return || input === 'y' || input === 'Y') {
      onConfirm();
    }
  });

  return (
    <Box borderColor={borderColor} borderStyle="round" flexDirection="column" marginX={4} paddingX={2} paddingY={1}>
      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color={titleColor}>
          {title}
        </Text>
      </Box>

      {/* Message */}
      <Box marginBottom={1}>
        <Text>{message}</Text>
      </Box>

      {/* Actions */}
      <Box gap={2}>
        <Text>
          <Text color="green">[Y]</Text>
          <Text> Yes</Text>
        </Text>
        <Text>
          <Text color="red">[N]</Text>
          <Text> No</Text>
        </Text>
        <Text dimColor>(Esc to cancel)</Text>
      </Box>
    </Box>
  );
}
