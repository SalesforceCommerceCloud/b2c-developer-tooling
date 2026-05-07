/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {OdsComponents} from '@salesforce/b2c-tooling-sdk';

type WeekdaySchedule = OdsComponents['schemas']['WeekdaySchedule'];

/**
 * Parse scheduler flag from CLI input.
 * @param value - JSON string for scheduler
 * @param clear - Boolean flag to clear scheduler
 * @returns null if clear is true, undefined if value is undefined, or parsed WeekdaySchedule
 */
export function parseSchedulerFlag(
  value: string | undefined,
  clear: boolean | undefined,
): null | undefined | WeekdaySchedule {
  if (clear) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(value) as WeekdaySchedule;
}
