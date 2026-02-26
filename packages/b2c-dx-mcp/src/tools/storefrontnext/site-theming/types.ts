/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared types for the site theming tool.
 *
 * @module tools/storefrontnext/site-theming/types
 */

/** Mapping of semantic color roles (e.g. lightText, buttonBackground) to hex values */
export type ColorMapping = Record<string, string>;

/** User-provided color with optional type label */
export interface ColorEntry {
  hex?: string;
  type?: string;
}

/** User-provided font with optional type label */
export interface FontEntry {
  name?: string;
  type?: string;
}

/** Collected answers from the theming conversation */
export interface CollectedAnswers {
  colors?: ColorEntry[];
  fonts?: FontEntry[];
  colorMapping?: ColorMapping;
  [questionId: string]: unknown;
}

/** Conversation context passed to the theming tool */
export interface ConversationContext {
  currentStep?: string;
  collectedAnswers?: CollectedAnswers;
  questionsAsked?: string[];
}

/** Input schema for the site theming tool */
export interface SiteThemingInput {
  fileKey?: string;
  fileKeys?: string[];
  conversationContext?: ConversationContext;
}
