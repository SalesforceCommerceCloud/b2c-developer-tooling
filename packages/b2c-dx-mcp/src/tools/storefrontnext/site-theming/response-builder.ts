/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Builds the theming tool response from guidance and conversation context.
 *
 * @module tools/storefrontnext/site-theming/response-builder
 */

import type {ThemingGuidance} from './theming-store.js';
import type {CollectedAnswers, ColorEntry, ConversationContext, FontEntry} from './types.js';
import {buildColorCombinations, appendValidationSection} from './color-mapping.js';

function isComponentScopeQuestion(question: ThemingGuidance['questions'][0]): boolean {
  const questionLower = question.question.toLowerCase();
  return (
    questionLower.includes('which components') ||
    questionLower.includes('component scope') ||
    questionLower.includes('component group')
  );
}

/**
 * Returns questions relevant to the current conversation state, filtered and sorted.
 */
export function getRelevantQuestions(
  guidance: ThemingGuidance,
  context?: ConversationContext,
): ThemingGuidance['questions'] {
  if (!context || !context.questionsAsked || context.questionsAsked.length === 0) {
    return guidance.questions
      .filter((q) => !isComponentScopeQuestion(q))
      .sort((a, b) => {
        if (a.required !== b.required) {
          return a.required ? -1 : 1;
        }
        const categoryOrder = {colors: 0, typography: 1, general: 2};
        return (
          (categoryOrder[a.category as keyof typeof categoryOrder] || 2) -
          (categoryOrder[b.category as keyof typeof categoryOrder] || 2)
        );
      });
  }

  const askedIds = new Set(context.questionsAsked);
  const remaining = guidance.questions.filter((q) => !askedIds.has(q.id) && !isComponentScopeQuestion(q));

  if (context.collectedAnswers) {
    const followUps: ThemingGuidance['questions'] = [];
    for (const q of remaining) {
      if (q.followUpQuestions && context.collectedAnswers?.[q.id]) {
        for (const [index, followUp] of q.followUpQuestions.entries()) {
          followUps.push({
            id: `${q.id}-followup-${index}`,
            question: followUp,
            category: q.category,
            required: false,
          });
        }
      }
    }
    return [...remaining, ...followUps];
  }

  return remaining;
}

export function hasProvidedThemingInfo(context?: ConversationContext): boolean {
  if (!context?.collectedAnswers) {
    return false;
  }
  const collectedAnswers = context.collectedAnswers;
  const hasColors = Boolean(collectedAnswers.colors && Array.isArray(collectedAnswers.colors));
  const hasFonts = Boolean(collectedAnswers.fonts && Array.isArray(collectedAnswers.fonts));
  return hasColors || hasFonts;
}

function buildExtractionResponse(extractionInstructions: string): string {
  const internal =
    '# ⚠️ MANDATORY: Extract User-Provided Theming Information\n\n## 🚨 CRITICAL: Information Extraction Required\n\n' +
    extractionInstructions;
  const user =
    "I need to extract the theming information from your input first.\n\nLet me review what you've shared and structure it properly, then I'll proceed with clarifying questions.\n\n";
  return `${internal}\n\n---\n\n# USER-FACING RESPONSE (What to say to the user):\n\n${user}`;
}

function appendValidationInstructions(out: string, validation: NonNullable<ThemingGuidance['validation']>): string {
  let s =
    out +
    '## ⚠️ MANDATORY: Input Validation\n\n**BEFORE implementing, you MUST validate ALL user-provided inputs:**\n\n';
  if (validation.colorValidation)
    s +=
      '**A. Color Combination Validation (MANDATORY if colors provided):**\n\n' + validation.colorValidation + '\n\n';
  if (validation.fontValidation)
    s += '**B. Font Validation (MANDATORY if fonts provided):**\n\n' + validation.fontValidation + '\n\n';
  if (validation.generalValidation) s += '**C. General Input Validation:**\n\n' + validation.generalValidation + '\n\n';
  if (validation.requirements) s += '**IMPORTANT:**\n\n' + validation.requirements + '\n\n';
  return s;
}

function appendCriticalAndRules(out: string, guidance: ThemingGuidance): string {
  let s = out;
  const critical = guidance.guidelines.filter((g) => g.critical);
  if (critical.length > 0) {
    s += '## ⚠️ Critical Guidelines (INTERNAL - Follow these rules)\n\n';
    for (const g of critical) s += `### ${g.title}\n\n${g.content}\n\n`;
  }
  if (guidance.rules.length > 0) {
    s += '## Rules to Follow (INTERNAL)\n\n';
    const doRules = guidance.rules.filter((r) => r.type === 'do');
    const dontRules = guidance.rules.filter((r) => r.type === 'dont');
    if (doRules.length > 0) {
      s += '### ✅ What TO Do:\n\n';
      for (const r of doRules) s += `- ${r.description}\n`;
      s += '\n';
    }
    if (dontRules.length > 0) {
      s += '### ❌ What NOT to Do:\n\n';
      for (const r of dontRules) s += `- ${r.description}\n`;
      s += '\n';
    }
  }
  return s;
}

function extractColorsFromArray(colors: unknown): string[] {
  if (!colors || !Array.isArray(colors)) return [];
  const out: string[] = [];
  for (const color of colors as ColorEntry[]) {
    if (color.hex && color.type) out.push(`${color.hex} (${color.type})`);
    else if (color.hex) out.push(color.hex);
  }
  return out;
}

function extractFontsFromArray(fonts: unknown): string[] {
  if (!fonts || !Array.isArray(fonts)) return [];
  const out: string[] = [];
  for (const font of fonts as FontEntry[]) {
    if (font.name) out.push(font.type ? `${font.name} (${font.type})` : font.name);
  }
  return out;
}

function extractColorFromValue(value: unknown): null | string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'hex' in value) {
    const v = value as ColorEntry;
    if (v.hex === undefined) return null;
    return v.type ? `${v.hex} (${v.type})` : v.hex;
  }
  return null;
}

function extractFontFromValue(value: unknown): null | string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'name' in value) {
    const v = value as FontEntry;
    if (v.name === undefined) return null;
    return v.type ? `${v.name} (${v.type})` : v.name;
  }
  return null;
}

function shouldSkipKeyForOtherInfo(key: string, lowerKey: string): boolean {
  if (key === 'colors' || key === 'fonts') return true;
  if (lowerKey.includes('question') || lowerKey.includes('step')) return true;
  if (lowerKey.includes('color') || lowerKey.includes('font')) return true;
  return false;
}

function extractOtherInfoFromEntries(collectedAnswers: Record<string, unknown>): string[] {
  const otherInfo: string[] = [];
  for (const key of Object.keys(collectedAnswers)) {
    const lowerKey = key.toLowerCase();
    if (shouldSkipKeyForOtherInfo(key, lowerKey)) continue;
    const value = collectedAnswers[key];
    if (value === null || value === undefined) continue;
    otherInfo.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  }
  return otherInfo;
}

function collectUserInfo(collectedAnswers: CollectedAnswers): {
  colorsInfo: string[];
  fontsInfo: string[];
  otherInfo: string[];
} {
  const colorsInfo = [...extractColorsFromArray(collectedAnswers.colors)];
  const fontsInfo = [...extractFontsFromArray(collectedAnswers.fonts)];

  for (const key of Object.keys(collectedAnswers)) {
    const lowerKey = key.toLowerCase();
    const value = collectedAnswers[key];
    if (key === 'colors' || key === 'fonts' || lowerKey.includes('question') || lowerKey.includes('step')) continue;
    if (lowerKey.includes('color') && !key.includes('colors')) {
      const c = extractColorFromValue(value);
      if (c) colorsInfo.push(c);
      continue;
    }
    if (lowerKey.includes('font') && !key.includes('fonts')) {
      const f = extractFontFromValue(value);
      if (f) fontsInfo.push(f);
      continue;
    }
  }

  const otherInfo = extractOtherInfoFromEntries(collectedAnswers);
  return {colorsInfo, fontsInfo, otherInfo};
}

function buildUserInfoSection(info: {colorsInfo: string[]; fontsInfo: string[]; otherInfo: string[]}): string {
  const {colorsInfo, fontsInfo, otherInfo} = info;
  if (colorsInfo.length === 0 && fontsInfo.length === 0 && otherInfo.length === 0) {
    return 'Following the theming workflow. I need a few clarifications before implementing.\n\n';
  }
  let s = "## Information You've Provided\n\n";
  if (colorsInfo.length > 0) {
    s += '### Colors:\n';
    for (const c of colorsInfo) s += `- ${c}\n`;
    s += '\n';
  }
  if (fontsInfo.length > 0) {
    s += '### Fonts:\n';
    for (const f of fontsInfo) s += `- ${f}\n`;
    s += '\n';
  }
  if (otherInfo.length > 0) {
    s += '### Other Information:\n';
    for (const o of otherInfo) s += `- ${o}\n`;
    s += '\n';
  }
  return (
    s +
    "I've noted the information above. Before implementing, I need a few clarifications to ensure everything is set up correctly.\n\n"
  );
}

function buildInternalInstructionsBase(guidance: ThemingGuidance, context?: ConversationContext): string {
  let s = '# ⚠️ MANDATORY: Site Theming Guidelines and Questions\n\n## 🚨 CRITICAL: Read This First\n\n';
  if (guidance.workflow?.steps && guidance.workflow.steps.length > 0) {
    s += '**YOU MUST FOLLOW THIS WORKFLOW - NO EXCEPTIONS:**\n\n';
    for (const [i, step] of guidance.workflow.steps.entries()) s += `${i + 1}. ${step}\n`;
    s += '\n**VIOLATION OF THIS WORKFLOW IS A CRITICAL ERROR.**\n\n';
  }
  if (guidance.validation) s = appendValidationInstructions(s, guidance.validation);
  const colorMapping = context?.collectedAnswers?.colorMapping;
  if (colorMapping && Object.keys(colorMapping).length > 0) {
    s +=
      '## 🎨 AUTOMATED COLOR VALIDATION RESULTS\n\n**The following validation has been automatically performed using built-in contrast calculation:**\n\n';
    s = appendValidationSection(s, buildColorCombinations(colorMapping));
  }
  return appendCriticalAndRules(s, guidance);
}

function appendQuestionsToResponse(
  internal: string,
  user: string,
  nextQuestions: ThemingGuidance['questions'],
  relevantQuestions: ThemingGuidance['questions'],
): {internal: string; user: string} {
  let userOut = user + '## Questions\n\n';
  const categories = [
    {category: 'colors', title: 'Color Questions'},
    {category: 'typography', title: 'Font Questions'},
    {category: 'general', title: 'General Questions'},
  ] as const;
  for (const {category, title} of categories) {
    const qs = nextQuestions.filter((q) => q.category === category);
    if (qs.length > 0) {
      userOut += `### ${title}\n\n`;
      for (const [i, q] of qs.entries()) userOut += `**Question ${i + 1}**: ${q.question}\n\n`;
    }
  }
  const remaining = relevantQuestions.length - nextQuestions.length;
  if (remaining > 0)
    userOut += `\n_Note: I have ${remaining} more question${remaining > 1 ? 's' : ''} to ask after you answer these._\n\n`;
  userOut += 'Please answer these questions so I can proceed with the implementation.\n\n';

  let internalOut =
    internal +
    "## Questions to Ask the User\n\n**IMPORTANT**: Ask these questions ONE AT A TIME and WAIT for the user's response before proceeding.\n\n**CRITICAL RULE**: NEVER implement changes after asking questions without waiting for the user's response.\n\n";
  internalOut += `**You have ${relevantQuestions.length} total questions to ask. Show ${nextQuestions.length} now, then continue with the rest after user responds.**\n\n`;
  for (const [i, q] of nextQuestions.entries()) {
    internalOut += `### Question ${i + 1} (${q.category}): ${q.id}\n\n${q.question}\n\n`;
    if (q.required) internalOut += '**Required**: Yes\n\n';
  }
  return {internal: internalOut, user: userOut};
}

function appendReadyOrWarningToResponse(
  internal: string,
  user: string,
  guidance: ThemingGuidance,
  context: NonNullable<ConversationContext>,
): {internal: string; user: string} {
  const required = guidance.questions.filter((q) => q.required);
  const answered = required.filter((q) => context.collectedAnswers?.[q.id] !== undefined);
  if (answered.length < required.length) {
    return {
      internal:
        internal +
        '## ⚠️ WARNING: Not all required questions have been answered!\n\n**DO NOT implement yet. Continue asking questions.**\n\n',
      user: user + 'I still need answers to some required questions before I can proceed.\n\n',
    };
  }
  let internalOut = internal;
  if (guidance.workflow?.preImplementationChecklist) {
    internalOut +=
      '## ⚠️ MANDATORY PRE-IMPLEMENTATION CHECKLIST\n\n' + guidance.workflow.preImplementationChecklist + '\n\n';
  }
  const userOut =
    user +
    '## Ready to Implement\n\nI have collected all necessary information. Before implementing, I will validate all provided inputs (colors, fonts, etc.) for accessibility, availability, and best practices.\n\n';
  return {internal: internalOut, user: userOut};
}

/**
 * Generates the full theming tool response from guidance and conversation context.
 */
export function generateResponse(guidance: ThemingGuidance, context?: ConversationContext): string {
  const isFirstCall = !context || !context.questionsAsked || context.questionsAsked.length === 0;
  if (isFirstCall && !hasProvidedThemingInfo(context) && guidance.workflow?.extractionInstructions) {
    return buildExtractionResponse(guidance.workflow.extractionInstructions);
  }

  const relevantQuestions = getRelevantQuestions(guidance, context);
  const questionLimit = !context || context.questionsAsked?.length === 0 ? 5 : 3;
  const nextQuestions = relevantQuestions.slice(0, questionLimit);

  let internalInstructions = buildInternalInstructionsBase(guidance, context);
  const info = context?.collectedAnswers
    ? collectUserInfo(context.collectedAnswers)
    : {colorsInfo: [], fontsInfo: [], otherInfo: []};
  let userResponse = buildUserInfoSection(info);

  if (nextQuestions.length > 0) {
    const appended = appendQuestionsToResponse(internalInstructions, userResponse, nextQuestions, relevantQuestions);
    internalInstructions = appended.internal;
    userResponse = appended.user;
  } else if (context?.collectedAnswers && Object.keys(context.collectedAnswers).length > 0) {
    const appended = appendReadyOrWarningToResponse(internalInstructions, userResponse, guidance, context);
    internalInstructions = appended.internal;
    userResponse = appended.user;
  }

  return `${internalInstructions}\n\n---\n\n# USER-FACING RESPONSE (What to say to the user):\n\n${userResponse}`;
}
