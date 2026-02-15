/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags} from '@oclif/core';

interface SiteIdFlagOptions {
  required?: boolean;
}

interface LimitFlagOptions {
  max?: number;
  min?: number;
}

export function createSiteIdFlag(options: SiteIdFlagOptions = {}) {
  return Flags.string({
    description: 'Site ID parameter for CIP report filters',
    helpGroup: 'QUERY',
    required: options.required ?? false,
  });
}

export function createLimitFlag(options: LimitFlagOptions = {}) {
  return Flags.integer({
    description: 'Maximum number of rows',
    helpGroup: 'QUERY',
    max: options.max ?? 500,
    min: options.min ?? 1,
    required: false,
  });
}
