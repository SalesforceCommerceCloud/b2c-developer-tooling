/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {input, confirm, select, checkbox, search} from '@inquirer/prompts';
import type {Logger} from '@salesforce/b2c-tooling-sdk';
import {
  createScaffoldRegistry,
  generateFromScaffold,
  evaluateCondition,
  type Scaffold,
  type ScaffoldParameter,
  type ScaffoldGenerateResult,
  type ScaffoldChoice,
} from '@salesforce/b2c-tooling-sdk/scaffold';
import {
  resolveLocalSource,
  resolveRemoteSource,
  isRemoteSource,
  validateAgainstSource,
  type SourceResult,
} from './source-resolver.js';

/**
 * Response type for scaffold generation.
 */
export interface GenerateResponse {
  scaffold: string;
  outputDir: string;
  dryRun: boolean;
  files: Array<{
    path: string;
    action: string;
    skipReason?: string;
  }>;
  postInstructions?: string;
}

/**
 * Options for scaffold generation.
 */
export interface GenerateOptions {
  /** Scaffold ID to generate */
  scaffoldId: string;
  /** Primary name parameter (shorthand) */
  name?: string;
  /** Output directory override */
  output?: string;
  /** Key=value option pairs */
  options?: string[];
  /** Preview without writing */
  dryRun?: boolean;
  /** Skip prompts, use defaults */
  force?: boolean;
}

/**
 * Command context for logging and output.
 */
export interface CommandContext {
  logger: Logger;
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => never;
}

/**
 * Execute scaffold generation with the given options.
 */
export async function executeScaffoldGenerate(
  options: GenerateOptions,
  ctx: CommandContext,
): Promise<GenerateResponse> {
  const {scaffoldId, dryRun = false, force = false} = options;
  const registry = createScaffoldRegistry();

  // Find the scaffold
  const scaffold = await registry.getScaffold(scaffoldId, {
    projectRoot: process.cwd(),
  });

  if (!scaffold) {
    ctx.error(`Scaffold not found: ${scaffoldId}`);
  }

  // Parse option flags into variables
  const variables = parseOptions(options.options || []);

  // Handle --name shorthand for the first string parameter
  if (options.name) {
    const firstStringParam = scaffold.manifest.parameters.find((p) => p.type === 'string');
    if (firstStringParam) {
      variables[firstStringParam.name] = options.name;
    }
  }

  // Collect missing parameters interactively (unless --force)
  const resolvedVariables = await collectParameters(scaffold, variables, force, ctx);

  // Determine output directory: explicit flag > scaffold default > cwd
  let outputDir: string;
  ctx.logger.trace(
    {flagOutput: options.output, defaultOutputDir: scaffold.manifest.defaultOutputDir},
    'Resolving output directory',
  );
  if (options.output) {
    outputDir = path.resolve(options.output);
    ctx.logger.debug({outputDir, source: 'flag'}, 'Using output directory from --output flag');
  } else if (scaffold.manifest.defaultOutputDir) {
    outputDir = path.resolve(scaffold.manifest.defaultOutputDir);
    ctx.logger.debug({outputDir, source: 'scaffold'}, 'Using output directory from scaffold defaultOutputDir');
  } else {
    outputDir = process.cwd();
    ctx.logger.debug({outputDir, source: 'cwd'}, 'Using current directory as output');
  }

  if (dryRun) {
    ctx.log('Dry run - no files will be written');
  }

  ctx.log(`Generating ${scaffold.manifest.displayName} scaffold...`);

  // Generate the scaffold
  let result: ScaffoldGenerateResult;
  try {
    result = await generateFromScaffold(scaffold, {
      outputDir,
      variables: resolvedVariables,
      dryRun,
      force,
    });
  } catch (error) {
    ctx.error(`Failed to generate scaffold: ${(error as Error).message}`);
  }

  const response: GenerateResponse = {
    scaffold: scaffoldId,
    outputDir,
    dryRun,
    files: result.files.map((f) => ({
      path: f.path,
      action: f.action,
      skipReason: f.skipReason,
    })),
    postInstructions: result.postInstructions,
  };

  // Display results
  const created = result.files.filter((f) => f.action === 'created' || f.action === 'overwritten');
  const skipped = result.files.filter((f) => f.action === 'skipped');

  if (created.length > 0) {
    ctx.log('');
    ctx.log(`Successfully generated ${created.length} file(s):`);
    for (const file of created) {
      // file.path is already relative to cwd from the executor
      ctx.log(`  ${file.action === 'overwritten' ? '(overwritten)' : '+'} ${file.path}`);
    }
  }

  if (skipped.length > 0) {
    ctx.log('');
    ctx.log(`Skipped ${skipped.length} file(s):`);
    for (const file of skipped) {
      ctx.log(`  - ${file.path}${file.skipReason ? ` (${file.skipReason})` : ''}`);
    }
  }

  // Show post-instructions
  if (result.postInstructions) {
    ctx.log('');
    ctx.log(result.postInstructions);
  }

  return response;
}

/**
 * Parse --option flags into a variables object.
 */
function parseOptions(options: string[]): Record<string, boolean | string | string[]> {
  const variables: Record<string, boolean | string | string[]> = {};

  for (const opt of options) {
    const eqIndex = opt.indexOf('=');
    if (eqIndex === -1) {
      variables[opt] = true;
    } else {
      const key = opt.slice(0, Math.max(0, eqIndex));
      const value = opt.slice(Math.max(0, eqIndex + 1));
      if (value === 'true') {
        variables[key] = true;
      } else if (value === 'false') {
        variables[key] = false;
      } else {
        variables[key] = value;
      }
    }
  }

  return variables;
}

/**
 * Collect missing parameters interactively.
 */
async function collectParameters(
  scaffold: Scaffold,
  existingVariables: Record<string, boolean | string | string[]>,
  force: boolean,
  ctx: CommandContext,
): Promise<Record<string, boolean | string | string[]>> {
  const variables = {...existingVariables};
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  const interactive = !force && isTTY;
  const projectRoot = process.cwd();

  // Cache for cartridge paths (only resolved once if needed)
  let cartridgePathMap: Map<string, string> | undefined;

  for (const param of scaffold.manifest.parameters) {
    // Check if conditional parameter should be evaluated
    if (param.when && !evaluateCondition(param.when, variables)) {
      continue;
    }

    // If value was already provided via --option, validate it against source
    if (variables[param.name] !== undefined && param.source) {
      const providedValue = String(variables[param.name]);
      const validation = validateAgainstSource(param.source, providedValue, projectRoot);
      if (!validation.valid) {
        const availableList = validation.availableChoices?.join(', ') || 'none';
        ctx.error(`Invalid value "${providedValue}" for ${param.name}. Available ${param.source}: ${availableList}`);
      }
      // Set companion path variable for cartridges source
      if (param.source === 'cartridges') {
        if (!cartridgePathMap) {
          const result = resolveLocalSource('cartridges', projectRoot);
          cartridgePathMap = result.pathMap;
        }
        const cartridgePath = cartridgePathMap?.get(providedValue);
        if (cartridgePath) {
          variables[`${param.name}Path`] = cartridgePath;
        }
      }
      continue;
    }

    // Skip if already provided
    if (variables[param.name] !== undefined) {
      continue;
    }

    // Use default if not interactive
    if (!interactive) {
      if (param.default !== undefined) {
        variables[param.name] = param.default;
      } else if (param.required) {
        ctx.error(`Missing required parameter: ${param.name}`);
      }
      continue;
    }

    // Prompt for value
    // eslint-disable-next-line no-await-in-loop
    const value = await promptForParameter(param, ctx);
    if (value !== undefined) {
      variables[param.name] = value;

      // Set companion path variable for cartridges source
      if (param.source === 'cartridges' && typeof value === 'string') {
        if (!cartridgePathMap) {
          const result = resolveLocalSource('cartridges', projectRoot);
          cartridgePathMap = result.pathMap;
        }
        const cartridgePath = cartridgePathMap?.get(value);
        if (cartridgePath) {
          variables[`${param.name}Path`] = cartridgePath;
        }
      }
    }
  }

  return variables;
}

/**
 * Prompt for a single parameter value.
 */
async function promptForParameter(
  param: ScaffoldParameter,
  ctx: CommandContext,
): Promise<boolean | string | string[] | undefined> {
  switch (param.type) {
    case 'boolean': {
      return confirm({
        message: param.prompt,
        default: param.default as boolean | undefined,
      });
    }

    case 'choice': {
      const {choices, warning} = await resolveSourceChoices(param);
      if (warning) ctx.warn(warning);

      if (choices.length === 0) {
        if (param.source) ctx.warn(`No ${param.source} found. Please enter a value manually.`);
        return promptTextInput(param);
      }

      if (choices.length > 10) {
        return search({
          message: param.prompt,
          source: createSearchSource(choices),
        });
      }

      return select({
        message: param.prompt,
        choices: choices.map((c) => ({name: c.label, value: c.value})),
        default: param.default as string | undefined,
      });
    }

    case 'multi-choice': {
      const {choices, warning} = await resolveSourceChoices(param);
      if (warning) ctx.warn(warning);
      if (choices.length === 0) return [];

      // Pre-select default values if specified
      const defaults = Array.isArray(param.default) ? param.default : [];
      return checkbox({
        message: param.prompt,
        choices: choices.map((c) => ({
          name: c.label,
          value: c.value,
          checked: defaults.includes(c.value),
        })),
      });
    }

    case 'string': {
      if (param.source) {
        const {choices, warning} = await resolveSourceChoices(param);
        if (warning) ctx.warn(warning);

        if (choices.length > 0) {
          if (choices.length > 10) {
            return search({
              message: param.prompt,
              source: createSearchSource(choices),
            });
          }
          return select({
            message: param.prompt,
            choices: choices.map((c) => ({name: c.label, value: c.value})),
            default: param.default as string | undefined,
          });
        }

        ctx.warn(`No ${param.source} found. Please enter a value manually.`);
      }

      return promptTextInput(param);
    }

    default:
      return undefined;
  }
}

/**
 * Prompt for text input with validation.
 */
async function promptTextInput(param: ScaffoldParameter): Promise<string | undefined> {
  const value = await input({
    message: param.prompt,
    default: param.default as string | undefined,
    required: param.required,
    validate(val) {
      if (param.required && !val) return 'This field is required';
      if (param.pattern && val) {
        const regex = new RegExp(param.pattern);
        if (!regex.test(val)) {
          return param.validationMessage || `Value does not match pattern: ${param.pattern}`;
        }
      }
      return true;
    },
  });
  return value || undefined;
}

/**
 * Create a search source function for inquirer search prompt.
 */
function createSearchSource(choices: ScaffoldChoice[]) {
  return async (term: string | undefined) => {
    if (!term) {
      return choices.map((c) => ({name: c.label, value: c.value}));
    }
    const lowerTerm = term.toLowerCase();
    return choices
      .filter((c) => c.label.toLowerCase().includes(lowerTerm) || c.value.toLowerCase().includes(lowerTerm))
      .map((c) => ({name: c.label, value: c.value}));
  };
}

/**
 * Resolve choices for a parameter with dynamic source.
 */
async function resolveSourceChoices(param: ScaffoldParameter): Promise<{
  choices: ScaffoldChoice[];
  pathMap?: Map<string, string>;
  warning?: string;
}> {
  if (!param.source) {
    return {choices: param.choices || []};
  }

  const projectRoot = process.cwd();

  if (isRemoteSource(param.source)) {
    try {
      const choices = await resolveRemoteSource(param.source);
      return {choices};
    } catch (error) {
      return {
        choices: [],
        warning: `Could not fetch ${param.source}: ${(error as Error).message}`,
      };
    }
  }

  const result: SourceResult = resolveLocalSource(param.source, projectRoot);
  return {
    choices: result.choices,
    pathMap: result.pathMap,
  };
}
