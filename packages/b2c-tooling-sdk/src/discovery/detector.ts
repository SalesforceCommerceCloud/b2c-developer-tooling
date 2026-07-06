/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Workspace detection implementation.
 *
 * @module discovery/detector
 */
import {getLogger} from '../logging/logger.js';
import type {DetectionResult, DetectionPattern, DetectOptions, ProjectType} from './types.js';
import {DEFAULT_PATTERNS} from './patterns/index.js';

/**
 * Detects the type of B2C Commerce project in a workspace.
 *
 * WorkspaceTypeDetector analyzes a directory to determine what kind of
 * Commerce project it contains. Returns ALL matched project types to enable
 * union toolset selection for hybrid projects.
 *
 * @example
 * ```typescript
 * import { WorkspaceTypeDetector } from '@salesforce/b2c-tooling-sdk/discovery';
 *
 * const detector = new WorkspaceTypeDetector('/path/to/project');
 * const result = await detector.detect();
 *
 * console.log(`Project types: ${result.projectTypes.join(', ')}`);
 * console.log(`Matched patterns: ${result.matchedPatterns.join(', ')}`);
 * ```
 *
 * @example Custom patterns
 * ```typescript
 * const detector = new WorkspaceTypeDetector('/path/to/project', {
 *   additionalPatterns: [myCustomPattern],
 *   excludePatterns: ['sfra-cartridge'],
 * });
 * ```
 */
export class WorkspaceTypeDetector {
  private workspacePath: string;
  private patterns: DetectionPattern[];

  /**
   * Creates a new WorkspaceTypeDetector.
   *
   * @param workspacePath - Path to the workspace directory to analyze
   * @param options - Detection options for customizing behavior
   */
  constructor(workspacePath: string, options: DetectOptions = {}) {
    this.workspacePath = workspacePath;
    this.patterns = this.resolvePatterns(options);
  }

  /**
   * Performs workspace detection.
   *
   * Runs all configured patterns against the workspace and returns
   * a consolidated result with all detected project types.
   *
   * @returns Detection result with all project types and matched patterns
   */
  async detect(): Promise<DetectionResult> {
    // SDK-internal detail is logged at trace: the application layers (CLI/MCP)
    // surface the resolved storefront at debug/info, so this stays out of the
    // way on a normal debug run and is available when tracing library internals.
    const logger = getLogger().child({component: 'discovery'});
    const matchedPatterns: string[] = [];
    const projectTypes: ProjectType[] = [];

    logger.trace(
      {workspacePath: this.workspacePath, patternCount: this.patterns.length},
      'Detecting workspace/storefront type',
    );

    for (const pattern of this.patterns) {
      try {
        const matched = await pattern.detect(this.workspacePath);
        logger.trace({pattern: pattern.name, projectType: pattern.projectType, matched}, 'Detection pattern evaluated');
        if (matched) {
          matchedPatterns.push(pattern.name);
          // Add project type if not already present
          if (!projectTypes.includes(pattern.projectType)) {
            projectTypes.push(pattern.projectType);
          }
        }
      } catch (err) {
        // A pattern that throws is treated as "not matched" so one bad pattern
        // cannot break detection; surface it (previously silently swallowed).
        logger.trace({pattern: pattern.name, err}, 'Detection pattern threw; treating as no match');
      }
    }

    logger.trace(
      {workspacePath: this.workspacePath, projectTypes, matchedPatterns},
      `Workspace detection complete: ${projectTypes.length > 0 ? projectTypes.join(', ') : 'no project type detected'}`,
    );

    return {
      projectTypes,
      matchedPatterns,
      autoDiscovered: true,
    };
  }

  /**
   * Resolves patterns based on options.
   */
  private resolvePatterns(options: DetectOptions): DetectionPattern[] {
    let patterns = options.patterns ?? DEFAULT_PATTERNS;

    if (options.additionalPatterns) {
      patterns = [...patterns, ...options.additionalPatterns];
    }

    if (options.excludePatterns) {
      patterns = patterns.filter((p) => !options.excludePatterns!.includes(p.name));
    }

    return patterns;
  }
}

/**
 * Creates a WorkspaceTypeDetector and performs detection in one call.
 *
 * This is a convenience function for simple detection use cases.
 *
 * @param workspacePath - Path to the workspace directory
 * @param [options] - Detection options for customizing behavior
 * @returns Detection result with all matched project types
 *
 * @example
 * ```typescript
 * import { detectWorkspaceType } from '@salesforce/b2c-tooling-sdk/discovery';
 *
 * const result = await detectWorkspaceType(process.cwd());
 * console.log(`Detected types: ${result.projectTypes.join(', ')}`);
 * console.log(`Patterns: ${result.matchedPatterns.join(', ')}`);
 * ```
 */
export async function detectWorkspaceType(workspacePath: string, options?: DetectOptions): Promise<DetectionResult> {
  const detector = new WorkspaceTypeDetector(workspacePath, options);
  return detector.detect();
}
