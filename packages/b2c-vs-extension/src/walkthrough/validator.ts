/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Validation utilities for walkthrough configuration.
 * Ensures package.json walkthrough configuration is correct.
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

interface WalkthroughConfig {
  id?: string;
  title?: string;
  description?: string;
  steps?: StepConfig[];
  [key: string]: unknown;
}

interface StepConfig {
  id?: string;
  title?: string;
  description?: string;
  media?: {
    markdown?: string;
    image?: string;
    altText?: string;
    [key: string]: unknown;
  };
  completionEvents?: string[];
  [key: string]: unknown;
}

interface PackageJsonConfig {
  contributes?: {
    walkthroughs?: WalkthroughConfig[];
    commands?: Array<{id?: string; title?: string; [key: string]: unknown}>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Validate walkthrough configuration in package.json
 */
export async function validateWalkthroughConfiguration(extensionPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  try {
    // Read package.json
    const packageJsonPath = path.join(extensionPath, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // Check if walkthroughs exist
    if (!packageJson.contributes?.walkthroughs) {
      result.valid = false;
      result.errors.push('No walkthroughs defined in package.json');
      return result;
    }

    const walkthroughs = packageJson.contributes.walkthroughs;

    // Validate each walkthrough
    for (const walkthrough of walkthroughs) {
      await validateWalkthrough(walkthrough, extensionPath, result);
    }

    // Validate commands exist
    await validateCommands(packageJson, result);
  } catch (error) {
    result.valid = false;
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to validate: ${message}`);
  }

  return result;
}

/**
 * Validate individual walkthrough
 */
async function validateWalkthrough(
  walkthrough: WalkthroughConfig,
  extensionPath: string,
  result: ValidationResult,
): Promise<void> {
  const walkthroughId = walkthrough.id || 'unknown';

  // Check required fields
  if (!walkthrough.id) {
    result.errors.push('Walkthrough missing required field: id');
    result.valid = false;
  }

  if (!walkthrough.title) {
    result.errors.push(`Walkthrough "${walkthroughId}" missing required field: title`);
    result.valid = false;
  }

  if (!walkthrough.description) {
    result.warnings.push(`Walkthrough "${walkthroughId}" missing description`);
  }

  // Check steps
  if (!walkthrough.steps || walkthrough.steps.length === 0) {
    result.errors.push(`Walkthrough "${walkthroughId}" has no steps`);
    result.valid = false;
    return;
  }

  result.info.push(`Walkthrough "${walkthroughId}" has ${walkthrough.steps.length} steps`);

  // Validate each step
  for (let i = 0; i < walkthrough.steps.length; i++) {
    const step = walkthrough.steps[i];
    await validateStep(step, i + 1, walkthroughId, extensionPath, result);
  }
}

/**
 * Validate individual step
 */
async function validateStep(
  step: StepConfig,
  stepNumber: number,
  walkthroughId: string,
  extensionPath: string,
  result: ValidationResult,
): Promise<void> {
  const stepId = step.id || `step-${stepNumber}`;

  // Check required fields
  if (!step.id) {
    result.errors.push(`Step ${stepNumber} in "${walkthroughId}" missing id`);
    result.valid = false;
  }

  if (!step.title) {
    result.errors.push(`Step "${stepId}" missing title`);
    result.valid = false;
  }

  if (!step.description) {
    result.warnings.push(`Step "${stepId}" missing description`);
  }

  // Check media
  if (!step.media) {
    result.warnings.push(`Step "${stepId}" has no media (markdown or image)`);
  } else {
    // Validate media files exist
    if (step.media.markdown) {
      const mediaPath = path.join(extensionPath, step.media.markdown);
      try {
        await fs.access(mediaPath);
        result.info.push(`✓ Step "${stepId}": markdown file exists`);
      } catch {
        result.errors.push(`Step "${stepId}": markdown file not found: ${step.media.markdown}`);
        result.valid = false;
      }
    }

    if (step.media.image) {
      const imagePath = path.join(extensionPath, step.media.image);
      try {
        await fs.access(imagePath);
        result.info.push(`✓ Step "${stepId}": image file exists`);

        // Check if alt text is provided
        if (!step.media.altText) {
          result.warnings.push(`Step "${stepId}": image has no altText (accessibility issue)`);
        }
      } catch {
        result.warnings.push(`Step "${stepId}": image file not found: ${step.media.image}`);
      }
    }
  }

  // Validate completion events
  if (step.completionEvents && step.completionEvents.length > 0) {
    result.info.push(`Step "${stepId}" has ${step.completionEvents.length} completion event(s)`);

    for (const event of step.completionEvents) {
      validateCompletionEvent(event, stepId, result);
    }
  } else {
    result.info.push(`Step "${stepId}" has no completion events (manual completion)`);
  }

  // Check description for command links
  if (step.description) {
    const commandLinks = step.description.match(/command:[\w.-]+/g) || [];
    if (commandLinks.length > 0) {
      result.info.push(`Step "${stepId}" has ${commandLinks.length} command link(s)`);
    }
  }
}

/**
 * Validate completion event syntax
 */
function validateCompletionEvent(event: string, stepId: string, result: ValidationResult): void {
  const validPrefixes = ['onCommand:', 'onView:', 'onContext:', 'onLink:'];
  const hasValidPrefix = validPrefixes.some((prefix) => event.startsWith(prefix));

  if (!hasValidPrefix) {
    result.warnings.push(
      `Step "${stepId}": completion event "${event}" doesn't use recognized prefix (${validPrefixes.join(', ')})`,
    );
  }

  // Check specific event types
  if (event.startsWith('onCommand:')) {
    const commandId = event.substring('onCommand:'.length);
    result.info.push(`Step "${stepId}" completes on command: ${commandId}`);
  } else if (event.startsWith('onView:')) {
    const viewId = event.substring('onView:'.length);
    result.info.push(`Step "${stepId}" completes on view open: ${viewId}`);
  } else if (event.startsWith('onContext:')) {
    const contextKey = event.substring('onContext:'.length);
    result.info.push(`Step "${stepId}" completes on context: ${contextKey}`);
  }
}

/**
 * Validate walkthrough commands are registered
 */
async function validateCommands(packageJson: PackageJsonConfig, result: ValidationResult): Promise<void> {
  const commands = packageJson.contributes?.commands || [];
  const commandIds = commands.map((cmd) => cmd.id);

  const expectedCommands = ['b2c-dx.walkthrough.open', 'b2c-dx.walkthrough.createDwJson'];

  for (const expectedCommand of expectedCommands) {
    if (commandIds.includes(expectedCommand)) {
      result.info.push(`✓ Command registered: ${expectedCommand}`);
    } else {
      result.errors.push(`Command not registered: ${expectedCommand}`);
      result.valid = false;
    }
  }
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = ['=== Walkthrough Configuration Validation ===', ''];

  if (result.valid) {
    lines.push('✅ Configuration is valid!');
  } else {
    lines.push('❌ Configuration has errors');
  }

  lines.push('');

  if (result.errors.length > 0) {
    lines.push('Errors:');
    result.errors.forEach((error) => lines.push(`  ❌ ${error}`));
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    result.warnings.forEach((warning) => lines.push(`  ⚠️  ${warning}`));
    lines.push('');
  }

  if (result.info.length > 0) {
    lines.push('Info:');
    result.info.forEach((info) => lines.push(`  ℹ️  ${info}`));
  }

  return lines.join('\n');
}

/**
 * VS Code command to validate walkthrough configuration
 */
export async function validateWalkthroughCommand(extensionPath: string, log: vscode.OutputChannel): Promise<void> {
  log.appendLine('Validating walkthrough configuration...');

  const result = await validateWalkthroughConfiguration(extensionPath);
  const report = formatValidationResult(result);

  log.appendLine(report);
  log.show();

  if (result.valid) {
    vscode.window.showInformationMessage('✅ Walkthrough configuration is valid!');
  } else {
    vscode.window.showErrorMessage(
      `Walkthrough configuration has ${result.errors.length} error(s). Check Output > B2C DX for details.`,
    );
  }
}
