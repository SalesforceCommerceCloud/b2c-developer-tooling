/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Accessibility validation for walkthrough content.
 * Ensures markdown content follows accessibility best practices.
 */

interface AccessibilityIssue {
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
}

/**
 * Check walkthrough markdown files for accessibility issues
 */
export async function validateWalkthroughAccessibility(walkthroughDir: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];

  try {
    const files = await fs.readdir(walkthroughDir);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = path.join(walkthroughDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const fileIssues = checkMarkdownAccessibility(file, content);
      issues.push(...fileIssues);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues.push({
      file: walkthroughDir,
      severity: 'error',
      rule: 'validation-error',
      message: `Failed to validate directory: ${message}`,
    });
  }

  return issues;
}

/**
 * Check individual markdown file for accessibility issues
 */
function checkMarkdownAccessibility(filename: string, content: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const lines = content.split('\n');

  // Check 1: Images should have alt text
  lines.forEach((line, index) => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;

    while ((match = imageRegex.exec(line)) !== null) {
      const altText = match[1];
      if (!altText || altText.trim().length === 0) {
        issues.push({
          file: filename,
          line: index + 1,
          severity: 'error',
          rule: 'image-alt-text',
          message: 'Image must have descriptive alt text',
        });
      } else if (altText.length < 10) {
        issues.push({
          file: filename,
          line: index + 1,
          severity: 'warning',
          rule: 'image-alt-text-short',
          message: 'Alt text should be more descriptive (at least 10 characters)',
        });
      }
    }
  });

  // Check 2: Links should have descriptive text
  lines.forEach((line, index) => {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      const linkText = match[1];
      const nonDescriptive = ['click here', 'here', 'link', 'read more'];

      if (nonDescriptive.some((phrase) => linkText.toLowerCase().includes(phrase))) {
        issues.push({
          file: filename,
          line: index + 1,
          severity: 'warning',
          rule: 'link-descriptive-text',
          message: `Link text "${linkText}" is not descriptive. Use text that describes the destination.`,
        });
      }

      if (linkText.trim().length === 0) {
        issues.push({
          file: filename,
          line: index + 1,
          severity: 'error',
          rule: 'link-empty-text',
          message: 'Link must have text content',
        });
      }
    }
  });

  // Check 3: Headings should follow hierarchy
  const headingLevels: number[] = [];
  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      headingLevels.push(level);

      // Check if heading skips levels
      if (headingLevels.length > 1) {
        const prevLevel = headingLevels[headingLevels.length - 2];
        if (level > prevLevel + 1) {
          issues.push({
            file: filename,
            line: index + 1,
            severity: 'warning',
            rule: 'heading-hierarchy',
            message: `Heading level ${level} skips level ${prevLevel + 1}. Maintain heading hierarchy.`,
          });
        }
      }
    }
  });

  // Check 4: Code blocks should have language specified
  lines.forEach((line, index) => {
    if (line.trim().startsWith('```') && line.trim() === '```') {
      issues.push({
        file: filename,
        line: index + 1,
        severity: 'info',
        rule: 'code-block-language',
        message: 'Code block should specify language for syntax highlighting',
      });
    }
  });

  // Check 5: Color-only information
  const colorKeywords = ['red', 'green', 'blue', 'yellow', 'color'];
  lines.forEach((line, index) => {
    colorKeywords.forEach((keyword) => {
      if (
        line.toLowerCase().includes(keyword) &&
        !line.includes('$(') && // Exclude icon references
        !line.includes('```')
      ) {
        // Exclude code blocks
        issues.push({
          file: filename,
          line: index + 1,
          severity: 'info',
          rule: 'color-only-information',
          message: `Line mentions "${keyword}". Ensure information is not conveyed by color alone.`,
        });
      }
    });
  });

  // Check 6: Emoji usage
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  lines.forEach((line, index) => {
    if (emojiRegex.test(line)) {
      // Emojis are generally okay in headings and list items for visual interest
      // but should not be the only way to convey information
      const emojiCount = (line.match(new RegExp(emojiRegex, 'gu')) || []).length;
      if (emojiCount > 3) {
        issues.push({
          file: filename,
          line: index + 1,
          severity: 'info',
          rule: 'excessive-emoji',
          message: 'Line contains many emoji. Consider if they add value or just clutter.',
        });
      }
    }
  });

  // Check 7: Table accessibility
  lines.forEach((line, index) => {
    if (line.includes('|') && line.trim().startsWith('|')) {
      // This is likely a table row
      const nextLine = lines[index + 1];
      if (nextLine && nextLine.includes('---')) {
        // This is a table header row, which is good
      } else if (!lines.slice(Math.max(0, index - 2), index).some((l) => l.includes('---'))) {
        issues.push({
          file: filename,
          line: index + 1,
          severity: 'info',
          rule: 'table-headers',
          message: 'Tables should have header rows for accessibility',
        });
      }
    }
  });

  return issues;
}

/**
 * Format accessibility issues for display
 */
export function formatAccessibilityReport(issues: AccessibilityIssue[]): string {
  if (issues.length === 0) {
    return '✅ No accessibility issues found!';
  }

  const lines: string[] = ['=== Walkthrough Accessibility Report ===', `Found ${issues.length} issue(s)`, ''];

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  lines.push(`Errors: ${errorCount}`);
  lines.push(`Warnings: ${warningCount}`);
  lines.push(`Info: ${infoCount}`);
  lines.push('');

  // Group by file
  const byFile = new Map<string, AccessibilityIssue[]>();
  for (const issue of issues) {
    const fileIssues = byFile.get(issue.file) || [];
    fileIssues.push(issue);
    byFile.set(issue.file, fileIssues);
  }

  for (const [file, fileIssues] of byFile) {
    lines.push(`File: ${file}`);
    for (const issue of fileIssues) {
      const severityIcon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      const location = issue.line ? `  Line ${issue.line}` : '';
      lines.push(`  ${severityIcon} [${issue.rule}]${location}: ${issue.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * VS Code command to check walkthrough accessibility
 */
export async function checkWalkthroughAccessibilityCommand(
  extensionPath: string,
  log: vscode.OutputChannel,
): Promise<void> {
  const walkthroughDir = path.join(extensionPath, 'media', 'walkthrough');

  log.appendLine('Running accessibility validation...');

  const issues = await validateWalkthroughAccessibility(walkthroughDir);
  const report = formatAccessibilityReport(issues);

  log.appendLine(report);
  log.show();

  if (issues.length === 0) {
    vscode.window.showInformationMessage('✅ No accessibility issues found in walkthrough!');
  } else {
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    if (errorCount > 0) {
      vscode.window.showErrorMessage(`Found ${errorCount} accessibility error(s). Check Output > B2C DX for details.`);
    } else {
      vscode.window.showWarningMessage(
        `Found ${issues.length} accessibility issue(s). Check Output > B2C DX for details.`,
      );
    }
  }
}
