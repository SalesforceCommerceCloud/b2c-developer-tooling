/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Base detection patterns for common B2C configuration files.
 *
 * @module discovery/patterns/base
 */
import * as path from 'node:path';
import type {DetectionPattern} from '../types.js';
import {exists} from '../utils.js';

/**
 * Detection pattern for projects with dw.json configuration.
 *
 * This is a low-priority fallback pattern that detects any project
 * with a dw.json file. It indicates the project connects to a B2C
 * Commerce instance but doesn't match any specific framework.
 *
 * The "headless" project type is assigned to indicate a generic
 * headless commerce setup (custom frontend, integration scripts,
 * mobile app backends, etc.).
 */
export const dwJsonPattern: DetectionPattern = {
  name: 'dw-json',
  projectType: 'headless',
  detect: async (workspacePath) => {
    return await exists(path.join(workspacePath, 'dw.json'));
  },
};
