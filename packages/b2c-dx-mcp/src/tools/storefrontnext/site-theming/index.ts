/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Site Theming tool for Storefront Next.
 *
 * Provides theming guidelines, guided questions, and automatic WCAG color contrast
 * validation. Call this tool first when users request brand colors or theme changes.
 *
 * @module tools/storefrontnext/site-theming
 */

import {z} from 'zod';
import type {McpTool} from '../../../utils/index.js';
import type {Services} from '../../../services.js';
import {createToolAdapter, textResult, errorResult, type ToolExecutionContext} from '../../adapter.js';
import {siteThemingStore, type ThemingGuidance} from './theming-store.js';
import {validateColorCombinations, formatValidationResult, isValidHex} from './color-contrast.js';

/** Mapping of semantic color roles (e.g. lightText, buttonBackground) to hex values */
type ColorMapping = Record<string, string>;

/** User-provided color with optional type label */
interface ColorEntry {
  hex?: string;
  type?: string;
}

/** User-provided font with optional type label */
interface FontEntry {
  name?: string;
  type?: string;
}

/** Collected answers from the theming conversation */
interface CollectedAnswers {
  colors?: ColorEntry[];
  fonts?: FontEntry[];
  colorMapping?: ColorMapping;
  [questionId: string]: unknown;
}

interface SiteThemingInput {
  fileKey?: string;
  fileKeys?: string[];
  conversationContext?: {
    currentStep?: string;
    collectedAnswers?: CollectedAnswers;
    questionsAsked?: string[];
  };
}

function isComponentScopeQuestion(question: ThemingGuidance['questions'][0]): boolean {
  const questionLower = question.question.toLowerCase();
  return (
    questionLower.includes('which components') ||
    questionLower.includes('component scope') ||
    questionLower.includes('component group')
  );
}

function getRelevantQuestions(
  guidance: ThemingGuidance,
  context?: SiteThemingInput['conversationContext'],
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

function hasProvidedThemingInfo(context?: SiteThemingInput['conversationContext']): boolean {
  if (!context?.collectedAnswers) {
    return false;
  }
  const collectedAnswers = context.collectedAnswers;
  const hasColors = Boolean(collectedAnswers.colors && Array.isArray(collectedAnswers.colors));
  const hasFonts = Boolean(collectedAnswers.fonts && Array.isArray(collectedAnswers.fonts));
  return hasColors || hasFonts;
}

type ColorCombination = {
  foreground: string;
  background: string;
  label: string;
  isLargeText?: boolean;
};

type ComboContext = {colorMapping: Record<string, string>; lightBg: string; darkBg: string; buttonBg: string};

function tryTextCombo(key: string, color: string, keyLower: string, ctx: ComboContext): ColorCombination | null {
  if (keyLower.includes('text') && keyLower.includes('light') && isValidHex(ctx.lightBg)) {
    return {foreground: color, background: ctx.lightBg, label: `${key}: ${color} on light background (${ctx.lightBg})`};
  }
  if (keyLower.includes('text') && keyLower.includes('dark') && isValidHex(ctx.darkBg)) {
    return {foreground: color, background: ctx.darkBg, label: `${key}: ${color} on dark background (${ctx.darkBg})`};
  }
  const isButtonText = keyLower === 'buttontext' || (keyLower.includes('button') && keyLower.includes('text'));
  if (isButtonText && isValidHex(ctx.buttonBg)) {
    return {
      foreground: color,
      background: ctx.buttonBg,
      label: `${key}: ${color} on button background (${ctx.buttonBg})`,
    };
  }
  if (keyLower.includes('link') && isValidHex(ctx.lightBg)) {
    return {foreground: color, background: ctx.lightBg, label: `${key}: ${color} on light background (${ctx.lightBg})`};
  }
  return null;
}

function tryBackgroundCombo(key: string, color: string, ctx: ComboContext): ColorCombination | null {
  const foregroundKey = key.replace(/Background|Bg/i, 'Text') || key.replace(/Background|Bg/i, 'Foreground');
  const foreground = ctx.colorMapping[foregroundKey] || ctx.colorMapping[`${key.replace(/Background|Bg/i, '')}Text`];
  if (foreground?.startsWith('#') && isValidHex(foreground)) {
    return {foreground, background: color, label: `${foregroundKey || 'text'} (${foreground}) on ${key} (${color})`};
  }
  return null;
}

function tryTextForegroundCombo(
  key: string,
  color: string,
  keyLower: string,
  ctx: ComboContext,
): ColorCombination | null {
  const backgroundKey = key.replace(/Text|Foreground/i, 'Background') || key.replace(/Text|Foreground/i, 'Bg');
  let background = ctx.colorMapping[backgroundKey];
  let backgroundLabel = backgroundKey;
  if (!background) {
    background = keyLower.includes('button') ? ctx.buttonBg : keyLower.includes('dark') ? ctx.darkBg : ctx.lightBg;
    backgroundLabel = keyLower.includes('button')
      ? 'button background'
      : keyLower.includes('dark')
        ? 'dark background'
        : 'light background';
  }
  if (background?.startsWith('#') && isValidHex(background)) {
    return {foreground: color, background, label: `${key} (${color}) on ${backgroundLabel} (${background})`};
  }
  return null;
}

function tryComboForEntry(key: string, color: string, ctx: ComboContext): ColorCombination | null {
  const keyLower = key.toLowerCase();
  const textCombo = tryTextCombo(key, color, keyLower, ctx);
  if (textCombo) return textCombo;
  if (keyLower.includes('background') || keyLower.includes('bg')) return tryBackgroundCombo(key, color, ctx);
  if (keyLower.includes('text') || keyLower.includes('foreground'))
    return tryTextForegroundCombo(key, color, keyLower, ctx);
  return null;
}

function buildColorCombinations(colorMapping: Record<string, string>): ColorCombination[] {
  const ctx: ComboContext = {
    colorMapping,
    lightBg: colorMapping.lightBackground || colorMapping.background || '#FFFFFF',
    darkBg: colorMapping.darkBackground || '#18181B',
    buttonBg: colorMapping.buttonBackground || colorMapping.primary || '#0A2540',
  };
  const combinations: ColorCombination[] = [];

  for (const [key, color] of Object.entries(colorMapping)) {
    if (!color || !color.startsWith('#') || !isValidHex(color)) continue;
    const combo = tryComboForEntry(key, color, ctx);
    if (combo) combinations.push(combo);
  }

  if (combinations.length === 0) {
    const whiteBg = '#FFFFFF';
    const darkBgFallback = '#18181B';
    for (const [key, color] of Object.entries(colorMapping)) {
      if (!color || !color.startsWith('#') || !isValidHex(color)) continue;
      if (key.toLowerCase().includes('background') || key.toLowerCase().includes('bg')) continue;
      combinations.push(
        {foreground: color, background: whiteBg, label: `${key} (${color}) on white background`},
        {foreground: color, background: darkBgFallback, label: `${key} (${color}) on dark background`},
      );
    }
  }
  return combinations;
}

function appendValidationSection(internalInstructions: string, combinations: ColorCombination[]): string {
  if (combinations.length === 0) {
    return internalInstructions;
  }
  const results = validateColorCombinations(combinations);
  let output = internalInstructions;

  for (const result of results) {
    output += formatValidationResult(result);
    output += '\n';
  }

  const hasIssues = results.some(
    (r) => !r.passesAA || r.visualAssessment === 'poor' || r.visualAssessment === 'acceptable',
  );
  if (hasIssues) {
    output += '### ⚠️ VALIDATION SUMMARY\n\n';
    output += '**Issues found that should be addressed:**\n\n';
    for (const result of results.filter(
      (r) => !r.passesAA || r.visualAssessment === 'poor' || r.visualAssessment === 'acceptable',
    )) {
      output += `- ${result.label || 'Color combination'}: ${result.recommendation || 'Needs improvement'}\n`;
    }
    output += '\n';
    output +=
      '**You MUST present these findings to the user BEFORE implementing and wait for their confirmation.**\n\n';
  } else {
    output += '### ✅ VALIDATION SUMMARY\n\n';
    output += 'All color combinations meet WCAG AA standards and have good visual assessment.\n\n';
  }
  return output;
}

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

function mergeGuidance(guidanceArray: ThemingGuidance[]): ThemingGuidance {
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

function buildInternalInstructionsBase(
  guidance: ThemingGuidance,
  context?: SiteThemingInput['conversationContext'],
): string {
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
  context: NonNullable<SiteThemingInput['conversationContext']>,
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

function generateResponse(guidance: ThemingGuidance, context?: SiteThemingInput['conversationContext']): string {
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
    const appended = appendReadyOrWarningToResponse(internalInstructions, userResponse, guidance, context!);
    internalInstructions = appended.internal;
    userResponse = appended.user;
  }

  return `${internalInstructions}\n\n---\n\n# USER-FACING RESPONSE (What to say to the user):\n\n${userResponse}`;
}

/**
 * Creates the site theming MCP tool for Storefront Next.
 *
 * The tool guides theming changes (colors, fonts, visual styling) and validates color
 * combinations for WCAG accessibility. It must be called before implementing any
 * theming changes.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns The configured MCP tool
 */
export function createSiteThemingTool(loadServices: () => Services): McpTool {
  return createToolAdapter<SiteThemingInput, {text: string; isError?: boolean}>(
    {
      name: 'storefront_next_site_theming',
      description:
        '⚠️ MANDATORY: Call this tool FIRST before implementing any theming changes. ' +
        'Provides theming guidelines, questions, and automatic validation. ' +
        'CRITICAL RULES: Call immediately when user requests theming (even if colors/fonts provided). ' +
        'NEVER implement without calling this tool first. NEVER skip question-answer workflow. ' +
        'MUST ask questions and WAIT for responses. ' +
        'VALIDATION GATE: After collecting answers, call tool again with colorMapping to trigger validation. ' +
        'DEFAULT FILES: theming-questions, theming-validation, theming-accessibility. ' +
        'Use fileKey or fileKeys to add custom files. ' +
        'WORKFLOW: Call tool → Ask questions → Call with colorMapping (validation) → Present findings → Wait confirmation → Implement',
      toolsets: ['STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: {
        fileKey: z
          .string()
          .optional()
          .describe(
            'Key identifier for a single theming file. If not provided, defaults to "site-theming". Available keys can be listed by calling the tool without parameters.',
          ),
        fileKeys: z
          .array(z.string())
          .optional()
          .describe(
            'Array of file keys to combine. If provided, guidance from all specified files will be merged. Takes precedence over fileKey if both are provided.',
          ),
        conversationContext: z
          .object({
            currentStep: z
              .string()
              .optional()
              .describe('Current step in the theming conversation (e.g., "collecting-colors", "collecting-fonts")'),
            collectedAnswers: z
              .record(z.string(), z.any())
              .optional()
              .describe('Previously collected answers from the user'),
            questionsAsked: z.array(z.string()).optional().describe('List of questions that have already been asked'),
          })
          .optional()
          .describe('Context from previous conversation rounds'),
      },
      async execute(args: SiteThemingInput, context: ToolExecutionContext) {
        siteThemingStore.initialize(context.services.getWorkingDirectory());

        const defaultFileKeys = ['theming-questions', 'theming-validation', 'theming-accessibility'];
        let fileKeys: string[];

        if (args.fileKeys && args.fileKeys.length > 0) {
          const allKeys = [...defaultFileKeys, ...args.fileKeys];
          fileKeys = [...new Set(allKeys)];
        } else if (args.fileKey) {
          const allKeys = [...defaultFileKeys, args.fileKey];
          fileKeys = [...new Set(allKeys)];
        } else {
          fileKeys = defaultFileKeys;
        }

        const hasContext =
          args.conversationContext &&
          (args.conversationContext.collectedAnswers ||
            args.conversationContext.questionsAsked ||
            args.conversationContext.currentStep);

        if (!args.fileKey && !args.fileKeys && !hasContext) {
          const availableKeys = siteThemingStore.getKeys();
          if (availableKeys.length === 0) {
            return {
              text: 'No theming files have been loaded. Please ensure theming files are configured at server startup.',
              isError: false,
            };
          }

          return {
            text: `Available theming files:\n\n${availableKeys.map((key) => `- ${key}`).join('\n')}\n\nDefault files (always used): theming-questions, theming-validation, theming-accessibility\n\nUse the \`fileKey\` or \`fileKeys\` parameter to add additional files. User-provided files are merged with the defaults.`,
            isError: false,
          };
        }

        const guidanceArray: ThemingGuidance[] = [];
        const missingKeys: string[] = [];

        for (const key of fileKeys) {
          const guidance = siteThemingStore.get(key);
          if (guidance) {
            guidanceArray.push(guidance);
          } else {
            missingKeys.push(key);
          }
        }

        if (guidanceArray.length === 0 || missingKeys.length > 0) {
          const availableKeys = siteThemingStore.getKeys();
          const keysList = fileKeys.length === 1 ? `key "${fileKeys[0]}"` : `keys: ${fileKeys.join(', ')}`;
          const missingList = missingKeys.length === 1 ? `"${missingKeys[0]}"` : missingKeys.join(', ');
          return {
            text: `Theming file(s) with ${keysList} not found.\n\nMissing: ${missingList}\nAvailable keys: ${availableKeys.join(', ')}\n\nFiles are loaded at server startup. To add more files, configure them via the THEMING_FILES environment variable or update the server initialization.`,
            isError: true,
          };
        }

        const guidance = fileKeys.length > 1 ? mergeGuidance(guidanceArray) : guidanceArray[0];
        const response = generateResponse(guidance, args.conversationContext);

        return {
          text: response,
          isError: false,
        };
      },
      formatOutput: (output: {text: string; isError?: boolean}) =>
        output.isError ? errorResult(output.text) : textResult(output.text),
    },
    loadServices,
  );
}
