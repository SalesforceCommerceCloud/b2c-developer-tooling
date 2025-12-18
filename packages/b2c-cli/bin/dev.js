#!/usr/bin/env -S node --conditions development --import tsx
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {execute} from '@oclif/core';

await execute({development: true, dir: import.meta.url});
