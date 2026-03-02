/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Import all rule renderers
import {renderModeSelection, type ModeSelectionContext} from './rules/1-mode-selection.js';
import {renderInteractiveOverview} from './rules/2b-0-interactive-overview.js';
import {renderAnalyzeStep, type AnalyzeStepContext} from './rules/2b-1-interactive-analyze.js';
import {renderSelectPropsConfirmation, type SelectPropsContext} from './rules/2b-2-interactive-select-props.js';
import {renderConfigureAttrs, type ConfigureAttrsContext} from './rules/2b-3-interactive-configure-attrs.js';
import {renderConfigureRegions, type ConfigureRegionsContext} from './rules/2b-4-interactive-configure-regions.js';
import {renderConfirmGeneration, type ConfirmGenerationContext} from './rules/2b-5-interactive-confirm-generation.js';
import {renderAutoMode, type AutoModeContext} from './rules/2a-auto-mode.js';

/**
 * Page Designer decorator rules - type-safe, zero dependencies
 */
export const pageDesignerDecoratorRules = {
  /**
   * Renders the mode selection prompt
   */
  getModeSelectionInstructions(context: ModeSelectionContext): string {
    return renderModeSelection(context);
  },

  /**
   * Renders the interactive mode workflow overview
   */
  getInteractiveOverview(): string {
    return renderInteractiveOverview();
  },

  /**
   * Renders Interactive Analyze step instructions
   */
  getAnalyzeInstructions(context: AnalyzeStepContext): string {
    const workflow = this.getInteractiveOverview();
    const stepContent = renderAnalyzeStep(context);
    return `${workflow}\n\n${stepContent}`;
  },

  /**
   * Renders Interactive Select Props step confirmation
   */
  getSelectPropsConfirmation(context: SelectPropsContext): string {
    return renderSelectPropsConfirmation(context);
  },

  /**
   * Renders Interactive Configure Attributes step instructions
   */
  getConfigureAttrsInstructions(context: ConfigureAttrsContext): string {
    return renderConfigureAttrs(context);
  },

  /**
   * Renders Interactive Configure Regions step instructions
   */
  getConfigureRegionsInstructions(context: ConfigureRegionsContext): string {
    return renderConfigureRegions(context);
  },

  /**
   * Renders Interactive Confirm Generation step (final code presentation)
   */
  getConfirmGenerationInstructions(context: ConfirmGenerationContext): string {
    return renderConfirmGeneration(context);
  },

  /**
   * Renders Auto Mode instructions
   */
  getAutoModeInstructions(context: AutoModeContext): string {
    return renderAutoMode(context);
  },
};

// Re-export types for convenience
export type {ModeSelectionContext} from './rules/1-mode-selection.js';
export type {AutoModeContext} from './rules/2a-auto-mode.js';
export type {AnalyzeStepContext} from './rules/2b-1-interactive-analyze.js';
export type {SelectPropsContext} from './rules/2b-2-interactive-select-props.js';
export type {ConfigureAttrsContext} from './rules/2b-3-interactive-configure-attrs.js';
export type {ConfigureRegionsContext} from './rules/2b-4-interactive-configure-regions.js';
export type {ConfirmGenerationContext} from './rules/2b-5-interactive-confirm-generation.js';
