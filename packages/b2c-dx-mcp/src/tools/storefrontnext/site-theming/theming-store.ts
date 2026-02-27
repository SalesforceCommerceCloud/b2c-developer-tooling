/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readFileSync, existsSync} from 'node:fs';
import {join, dirname, basename} from 'node:path';
import {createRequire} from 'node:module';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

// Resolve the site-theming content directory from the package root
const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve('@salesforce/b2c-dx-mcp/package.json'));
const SITE_THEMING_CONTENT_DIR = join(packageRoot, 'content', 'site-theming');

const logger = getLogger();

export interface ThemingGuidance {
  questions: Array<{
    id: string;
    question: string;
    category: string;
    required: boolean;
    followUpQuestions?: string[];
  }>;
  guidelines: Array<{
    category: string;
    title: string;
    content: string;
    critical: boolean;
  }>;
  rules: Array<{
    type: 'do' | 'dont';
    description: string;
    examples?: string[];
  }>;
  workflow?: {
    steps: string[];
    extractionInstructions?: string;
    preImplementationChecklist?: string;
  };
  validation?: {
    colorValidation?: string;
    fontValidation?: string;
    generalValidation?: string;
    requirements?: string;
  };
  metadata: {
    filePath: string;
    fileName: string;
    loadedAt: Date;
  };
}

type ParsedQuestion = {id: string; question: string; category: string; required: boolean};

function parseWorkflowSection(content: string): ThemingGuidance['workflow'] {
  const workflowMatch = content.match(/##\s*🔄\s*WORKFLOW[^#]*(?=##|$)/is);
  if (!workflowMatch) return undefined;

  const workflowContent = workflowMatch[0].replace(/##\s*🔄\s*WORKFLOW[^\n]*\n?/i, '').trim();
  const stepMatches = workflowContent.match(/^\d+\.\s+(.+)$/gm);
  const steps = stepMatches ? stepMatches.map((step) => step.replace(/^\d+\.\s+/, '').trim()) : [];

  const extractionMatch = workflowContent.match(/###\s*📝\s*EXTRACTION[^#]*(?=###|$)/is);
  const extractionInstructions = extractionMatch
    ? extractionMatch[0].replace(/###\s*📝\s*EXTRACTION[^\n]*\n?/i, '').trim()
    : undefined;

  const checklistMatch = workflowContent.match(/###\s*✅\s*PRE-IMPLEMENTATION[^#]*(?=###|$)/is);
  const preImplementationChecklist = checklistMatch
    ? checklistMatch[0].replace(/###\s*✅\s*PRE-IMPLEMENTATION[^\n]*\n?/i, '').trim()
    : undefined;

  if (steps.length > 0 || extractionInstructions || preImplementationChecklist) {
    return {steps, extractionInstructions, preImplementationChecklist};
  }
  return undefined;
}

function parseValidationSection(content: string): ThemingGuidance['validation'] {
  const validationMatch = content.match(/##\s*✅\s*VALIDATION[^#]*(?=##|$)/is);
  if (!validationMatch) return undefined;

  const validationContent = validationMatch[0].replace(/##\s*✅\s*VALIDATION[^\n]*\n?/i, '').trim();

  const colorValidationMatch = validationContent.match(/###\s*A\.\s*Color[^#]*(?=###|$)/is);
  const colorValidation = colorValidationMatch
    ? colorValidationMatch[0].replace(/###\s*A\.\s*Color[^\n]*\n?/i, '').trim()
    : undefined;

  const fontValidationMatch = validationContent.match(/###\s*B\.\s*Font[^#]*(?=###|$)/is);
  const fontValidation = fontValidationMatch
    ? fontValidationMatch[0].replace(/###\s*B\.\s*Font[^\n]*\n?/i, '').trim()
    : undefined;

  const generalValidationMatch = validationContent.match(/###\s*C\.\s*General[^#]*(?=###|$)/is);
  const generalValidation = generalValidationMatch
    ? generalValidationMatch[0].replace(/###\s*C\.\s*General[^\n]*\n?/i, '').trim()
    : undefined;

  const requirementsMatch = validationContent.match(/###\s*IMPORTANT[^#]*(?=###|$)/is);
  const requirements = requirementsMatch
    ? requirementsMatch[0].replace(/###\s*IMPORTANT[^\n]*\n?/i, '').trim()
    : undefined;

  if (colorValidation || fontValidation || generalValidation || requirements) {
    return {colorValidation, fontValidation, generalValidation, requirements};
  }
  return undefined;
}

function extractRuleItems(content: string, pattern: RegExp, type: 'do' | 'dont'): ThemingGuidance['rules'] {
  const rules: ThemingGuidance['rules'] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const items = match[1]
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim());
    for (const item of items) {
      rules.push({type, description: item});
    }
  }
  return rules;
}

function generateColorQuestions(
  guidance: ThemingGuidance,
  content: string,
  generateId: (cat: string) => string,
): ParsedQuestion[] {
  const allGuidelines = guidance.guidelines;
  const allRules = guidance.rules;
  const colorGuidelines = allGuidelines.filter(
    (g) =>
      g.content.toLowerCase().includes('color') ||
      g.content.toLowerCase().includes('hex') ||
      g.title.toLowerCase().includes('color'),
  );
  const colorRules = allRules.filter(
    (r) =>
      r.description.toLowerCase().includes('color') ||
      r.description.toLowerCase().includes('background-color') ||
      r.description.toLowerCase().includes('border-color'),
  );
  if (colorGuidelines.length === 0 && colorRules.length === 0) return [];

  const questions: ParsedQuestion[] = [];
  if (
    allGuidelines.some(
      (g) => g.content.toLowerCase().includes('exact hex') || g.content.toLowerCase().includes('hex code'),
    )
  ) {
    questions.push({
      id: generateId('color'),
      question: 'What are the exact hex color values you want to use? (Please provide hex codes, e.g., #635BFF)',
      category: 'colors',
      required: true,
    });
  }
  if (
    allGuidelines.some(
      (g) =>
        g.content.toLowerCase().includes('color type mapping') ||
        g.content.toLowerCase().includes('color mapping') ||
        g.content.toLowerCase().includes('primary vs secondary') ||
        g.content.toLowerCase().includes('brand vs accent'),
    )
  ) {
    questions.push({
      id: generateId('color'),
      question:
        'How should these colors be mapped? (e.g., which color should be primary vs secondary, brand vs accent)',
      category: 'colors',
      required: true,
    });
  }
  if (
    allGuidelines.some(
      (g) =>
        g.content.toLowerCase().includes('color combinations') || g.content.toLowerCase().includes('propose color'),
    )
  ) {
    questions.push(
      {
        id: generateId('color'),
        question: 'Which color should be used for primary actions vs secondary actions?',
        category: 'colors',
        required: false,
      },
      {
        id: generateId('color'),
        question: 'What should be the hover state colors?',
        category: 'colors',
        required: false,
      },
    );
  }
  if (content.toLowerCase().includes('dark') && content.toLowerCase().includes('light')) {
    questions.push({
      id: generateId('color'),
      question: 'Do you want to support both light and dark themes? If yes, what colors should be used for each?',
      category: 'colors',
      required: false,
    });
  }
  return questions;
}

function generateFontQuestions(guidance: ThemingGuidance, generateId: (cat: string) => string): ParsedQuestion[] {
  const allGuidelines = guidance.guidelines;
  const fontGuidelines = allGuidelines.filter(
    (g) =>
      g.content.toLowerCase().includes('font') ||
      g.content.toLowerCase().includes('typography') ||
      g.title.toLowerCase().includes('font'),
  );
  const fontRules = guidance.rules.filter(
    (r) =>
      r.description.toLowerCase().includes('font') ||
      r.description.toLowerCase().includes('font-weight') ||
      r.description.toLowerCase().includes('font-size'),
  );
  if (fontGuidelines.length === 0 && fontRules.length === 0) return [];

  const questions: ParsedQuestion[] = [];
  if (
    allGuidelines.some(
      (g) => g.content.toLowerCase().includes('exact font') || g.content.toLowerCase().includes('font name'),
    )
  ) {
    questions.push({
      id: generateId('font'),
      question: 'What is the exact font family name you want to use? (e.g., "sohne-var")',
      category: 'typography',
      required: true,
    });
  }
  if (
    allGuidelines.some(
      (g) =>
        g.content.toLowerCase().includes('font availability') ||
        g.content.toLowerCase().includes('custom font') ||
        g.content.toLowerCase().includes('google fonts'),
    )
  ) {
    questions.push({
      id: generateId('font'),
      question: 'Is this a custom font that needs to be loaded, or should I use a Google Fonts equivalent?',
      category: 'typography',
      required: true,
    });
  }
  if (
    allGuidelines.some(
      (g) =>
        g.content.toLowerCase().includes('headings and body') ||
        g.content.toLowerCase().includes('font apply') ||
        g.content.toLowerCase().includes('font usage'),
    )
  ) {
    questions.push({
      id: generateId('font'),
      question: 'Should this font apply to both headings and body text, or just one?',
      category: 'typography',
      required: false,
    });
  }
  return questions;
}

function generateLayoutQuestions(
  guidance: ThemingGuidance,
  content: string,
  generateId: (cat: string) => string,
): ParsedQuestion[] {
  const layoutGuidelines = guidance.guidelines.filter(
    (g) =>
      g.content.toLowerCase().includes('layout') ||
      g.content.toLowerCase().includes('positioning') ||
      g.title.toLowerCase().includes('layout'),
  );
  if (layoutGuidelines.length === 0) return [];
  const allowsLayout =
    content.toLowerCase().includes('layout changes') && content.toLowerCase().includes('explicitly requested');
  if (!allowsLayout) return [];

  return [
    {
      id: generateId('general'),
      question: 'Do you need any layout changes, or only visual styling (colors, fonts, etc.)?',
      category: 'general',
      required: false,
    },
  ];
}

function generateQuestionsFromGuidelines(guidance: ThemingGuidance, content: string): ParsedQuestion[] {
  let counter = 0;
  const generateId = (cat: string) => `${cat}-${++counter}`;
  return [
    ...generateColorQuestions(guidance, content, generateId),
    ...generateFontQuestions(guidance, generateId),
    ...generateLayoutQuestions(guidance, content, generateId),
  ];
}

function extractQuestionLines(content: string): string[] {
  const lines = content.split('\n').filter((line) => {
    const t = line.trim();
    return t.endsWith('?') && t.length > 10;
  });
  return lines
    .map((line) =>
      line
        .replace(/^[-*•]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim(),
    )
    .filter((c) => c.length > 10 && c.endsWith('?'));
}

function mergeQuestionsIntoGuidance(
  guidance: ThemingGuidance,
  content: string,
  generated: ParsedQuestion[],
  extracted: string[],
): void {
  const colorQs = extracted.filter(
    (q) =>
      q.toLowerCase().includes('color') ||
      q.toLowerCase().includes('primary') ||
      q.toLowerCase().includes('accent') ||
      q.toLowerCase().includes('brand') ||
      q.toLowerCase().includes('theme'),
  );
  const fontQs = extracted.filter((q) => q.toLowerCase().includes('font') || q.toLowerCase().includes('typography'));
  const generalQs = extracted.filter(
    (q) =>
      !q.toLowerCase().includes('color') &&
      !q.toLowerCase().includes('primary') &&
      !q.toLowerCase().includes('accent') &&
      !q.toLowerCase().includes('brand') &&
      !q.toLowerCase().includes('theme') &&
      !q.toLowerCase().includes('font') &&
      !q.toLowerCase().includes('typography'),
  );

  let counter = generated.length;
  const genId = (cat: string) => `${cat}-${++counter}`;

  guidance.questions.push(...generated);
  for (const [i, q] of colorQs.entries()) {
    guidance.questions.push({
      id: genId('color'),
      question: q,
      category: 'colors',
      required: i === 0 && generated.filter((x) => x.category === 'colors').length === 0,
    });
  }
  for (const [i, q] of fontQs.entries()) {
    guidance.questions.push({
      id: genId('font'),
      question: q,
      category: 'typography',
      required: i === 0 && generated.filter((x) => x.category === 'typography').length === 0,
    });
  }
  for (const q of generalQs) {
    guidance.questions.push({id: genId('general'), question: q, category: 'general', required: false});
  }

  if (guidance.questions.length === 0) {
    const lower = content.toLowerCase();
    if (lower.includes('color')) {
      guidance.questions.push({
        id: 'color-primary',
        question: 'What colors should be used for theming? (Please provide hex codes)',
        category: 'colors',
        required: true,
      });
    }
    if (lower.includes('font') || lower.includes('typography')) {
      guidance.questions.push({
        id: 'font-family',
        question: 'What font family should be used? (Please provide exact font name)',
        category: 'typography',
        required: true,
      });
    }
  }
}

/**
 * Parses an .md/.mdc file and extracts theming questions and guidelines
 */
function parseThemingMDC(content: string, filePath: string): ThemingGuidance {
  const guidance: ThemingGuidance = {
    questions: [],
    guidelines: [],
    rules: [],
    metadata: {
      filePath,
      fileName: basename(filePath),
      loadedAt: new Date(),
    },
  };

  const workflow = parseWorkflowSection(content);
  if (workflow) guidance.workflow = workflow;

  const validation = parseValidationSection(content);
  if (validation) guidance.validation = validation;

  const criticalSections = content.match(/##\s*⚠️\s*CRITICAL[^#]*/gi) || [];
  const specificationSections = content.match(/##\s*📋[^#]*/gi) || [];

  for (const section of criticalSections) {
    const titleMatch = section.match(/##\s*⚠️\s*CRITICAL:\s*(.+?)\n/);
    const title = titleMatch ? titleMatch[1].trim() : 'Critical Rule';
    guidance.guidelines.push({
      category: 'critical',
      title,
      content: section.replace(/##\s*⚠️\s*CRITICAL[^\n]*\n/, '').trim(),
      critical: true,
    });
  }

  for (const section of specificationSections) {
    const titleMatch = section.match(/##\s*📋\s*(.+?)\n/);
    const title = titleMatch ? titleMatch[1].trim() : 'Specification Rule';
    guidance.guidelines.push({
      category: 'specification',
      title,
      content: section.replace(/##\s*📋[^\n]*\n/, '').trim(),
      critical: false,
    });
  }

  const doRules = extractRuleItems(content, /###\s*What\s+TO\s+Change:([^#]*)/gi, 'do');
  const dontRules = extractRuleItems(content, /###\s*What\s+NOT\s+to\s+Change:([^#]*)/gi, 'dont');
  guidance.rules.push(...doRules, ...dontRules);

  const generatedQuestions = generateQuestionsFromGuidelines(guidance, content);
  const extractedQuestions = extractQuestionLines(content);
  mergeQuestionsIntoGuidance(guidance, content, generatedQuestions, extractedQuestions);

  return guidance;
}

/**
 * Theming Data Store
 * Loads and caches theming guidance from .md/.mdc files
 */
export interface InitializeOptions {
  /** Override content directory for default files (used in tests). */
  contentDirOverride?: string;
}

class ThemingStore {
  private initializedForRoot: null | string = null;
  private store: Map<string, ThemingGuidance> = new Map();

  get(fileKey: string): ThemingGuidance | undefined {
    return this.store.get(fileKey);
  }

  getKeys(): string[] {
    return [...this.store.keys()];
  }

  has(fileKey: string): boolean {
    return this.store.has(fileKey);
  }

  /**
   * Initialize store with default files from content/site-theming.
   * Uses workspaceRoot for THEMING_FILES env paths (relative to project).
   * Skips re-loading when already initialized for the same root.
   */
  initialize(workspaceRoot?: string, options?: InitializeOptions): void {
    const root = workspaceRoot ?? process.cwd();
    if (this.initializedForRoot === root) {
      return;
    }
    if (this.initializedForRoot !== null) {
      this.store.clear();
    }
    this.initializedForRoot = root;

    const contentDir = options?.contentDirOverride ?? SITE_THEMING_CONTENT_DIR;
    const defaultFileKeys = ['theming-questions', 'theming-validation', 'theming-accessibility'];
    const extensions = ['.md', '.mdc'];

    for (const key of defaultFileKeys) {
      let filePath: null | string = null;
      for (const ext of extensions) {
        const candidate = join(contentDir, `${key}${ext}`);
        if (existsSync(candidate)) {
          filePath = candidate;
          break;
        }
      }
      if (filePath) {
        try {
          this.loadFile(key, filePath);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Could not load theming file ${filePath}: ${errorMessage}`);
        }
      }
    }

    const themingFilesEnv = process.env.THEMING_FILES;
    if (themingFilesEnv) {
      try {
        this.loadThemingFilesFromEnv(themingFilesEnv, root);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Could not parse THEMING_FILES environment variable: ${errorMessage}`);
      }
    }
  }

  loadFile(fileKey: string, filePath: string): void {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      const content = readFileSync(filePath, 'utf8');
      const guidance = parseThemingMDC(content, filePath);
      this.store.set(fileKey, guidance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load theming file ${filePath}: ${errorMessage}`);
    }
  }

  private loadThemingFilesFromEnv(envValue: string, root: string): void {
    const files = JSON.parse(envValue) as Array<{key: string; path: string}>;
    for (const {key, path: filePath} of files) {
      const fullPath = filePath.startsWith('/') ? filePath : join(root, filePath);
      this.tryLoadEnvFile(key, fullPath);
    }
  }

  private tryLoadEnvFile(key: string, fullPath: string): void {
    if (!existsSync(fullPath)) {
      logger.warn(`Theming file not found: ${fullPath} (key: ${key})`);
      return;
    }
    try {
      this.loadFile(key, fullPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Could not load theming file ${fullPath} (key: ${key}): ${errorMessage}`);
    }
  }
}

export const siteThemingStore = new ThemingStore();
