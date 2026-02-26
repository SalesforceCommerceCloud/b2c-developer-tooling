/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Merges multiple ThemingGuidance objects from different theming files.
 *
 * @module tools/storefrontnext/site-theming/guidance-merger
 */

import type {ThemingGuidance} from './theming-store.js';

function mergeWorkflows(guidanceArray: ThemingGuidance[]): ThemingGuidance['workflow'] {
  const workflows = guidanceArray.filter((g) => g.workflow);
  if (workflows.length === 0) return undefined;
  const merged: NonNullable<ThemingGuidance['workflow']> = {
    steps: [],
    extractionInstructions: workflows[0].workflow?.extractionInstructions,
    preImplementationChecklist: workflows[0].workflow?.preImplementationChecklist,
  };
  for (const g of workflows) {
    if (g.workflow?.steps) merged.steps.push(...g.workflow.steps);
    if (!merged.extractionInstructions && g.workflow?.extractionInstructions) {
      merged.extractionInstructions = g.workflow.extractionInstructions;
    }
    if (!merged.preImplementationChecklist && g.workflow?.preImplementationChecklist) {
      merged.preImplementationChecklist = g.workflow.preImplementationChecklist;
    }
  }
  return merged;
}

function mergeValidations(guidanceArray: ThemingGuidance[]): ThemingGuidance['validation'] {
  const validations = guidanceArray.filter((g) => g.validation);
  if (validations.length === 0) return undefined;
  const joinField = (field: keyof NonNullable<ThemingGuidance['validation']>) =>
    validations
      .map((g) => g.validation?.[field])
      .filter((x): x is string => typeof x === 'string')
      .join('\n\n');
  return {
    colorValidation: joinField('colorValidation'),
    fontValidation: joinField('fontValidation'),
    generalValidation: joinField('generalValidation'),
    requirements: joinField('requirements'),
  };
}

function buildQuestionMap(guidanceArray: ThemingGuidance[]): Map<string, ThemingGuidance['questions'][0]> {
  const questionMap = new Map<string, ThemingGuidance['questions'][0]>();
  for (const guidance of guidanceArray) {
    for (const q of guidance.questions) {
      if (!questionMap.has(q.id)) questionMap.set(q.id, q);
    }
  }
  return questionMap;
}

function buildMergedMetadata(guidanceArray: ThemingGuidance[]): ThemingGuidance['metadata'] {
  return {
    filePath: guidanceArray.map((g) => g.metadata.filePath).join(', '),
    fileName: guidanceArray.map((g) => g.metadata.fileName).join(', '),
    loadedAt: new Date(),
  };
}

/**
 * Merges multiple ThemingGuidance objects into one.
 * Questions are deduplicated by ID; guidelines, rules, workflows, and validations are combined.
 */
export function mergeGuidance(guidanceArray: ThemingGuidance[]): ThemingGuidance {
  if (guidanceArray.length === 0) throw new Error('Cannot merge empty guidance array');
  if (guidanceArray.length === 1) return guidanceArray[0];

  const questionMap = buildQuestionMap(guidanceArray);
  return {
    questions: [...questionMap.values()],
    guidelines: guidanceArray.flatMap((g) => g.guidelines),
    rules: guidanceArray.flatMap((g) => g.rules),
    metadata: buildMergedMetadata(guidanceArray),
    workflow: mergeWorkflows(guidanceArray),
    validation: mergeValidations(guidanceArray),
  };
}
