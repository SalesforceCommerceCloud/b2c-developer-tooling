/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Build-time constants injected by esbuild's `define` (see scripts/esbuild-bundle.mjs).
 * These are replaced as string literals at bundle time so the runtime doesn't have to
 * read package.json from disk. Empty string means "not set" — callers should treat that
 * as "no telemetry configured".
 */
declare const __EXT_VERSION__: string;
declare const __TELEMETRY_CONNECTION_STRING__: string;
