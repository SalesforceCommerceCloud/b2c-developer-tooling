/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {input, confirm, select, checkbox, search} from '@inquirer/prompts';
import type {Logger} from '@salesforce/b2c-tooling-sdk';
import {
  createScaffoldRegistry,
  generateFromScaffold,
  evaluateCondition,
  resolveScaffoldParameters,
  parseParameterOptions,
  resolveOutputDirectory,
  type ScaffoldParameter,
  type ScaffoldGenerateResult,
  type ScaffoldChoice,
} from '@salesforce/b2c-tooling-sdk/scaffold';
import {resolveLocalSource, resolveRemoteSource, isRemoteSource, type SourceResult} from './source-resolver.js';

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
  /** Project root directory (defaults to process.cwd()) */
  projectRoot?: string;
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
  const {scaffoldId, dryRun = false, force = false, projectRoot = process.cwd()} = options;
  const registry = createScaffoldRegistry();

  // Find the scaffold
  const scaffold = await registry.getScaffold(scaffoldId, {
    projectRoot,
  });

  if (!scaffold) {
    ctx.error(`Scaffold not found: ${scaffoldId}`);
  }

  // Parse option flags into variables
  const providedVariables = parseParameterOptions(options.options || [], scaffold);

  // Handle --name shorthand for the first string parameter
  if (options.name) {
    const firstStringParam = scaffold.manifest.parameters.find((p) => p.type === 'string');
    if (firstStringParam) {
      providedVariables[firstStringParam.name] = options.name;
    }
  }

  // Resolve parameters using SDK, then prompt for any missing
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  const interactive = !force && isTTY;

  const resolved = await resolveScaffoldParameters(scaffold, {
    providedVariables,
    projectRoot,
    useDefaults: !interactive,
  });

  // Report any validation errors
  for (const error of resolved.errors) {
    ctx.error(error.message);
  }

  // Check for missing required parameters in non-interactive mode
  if (!interactive) {
    const missingRequired = resolved.missingParameters.filter((p) => p.required);
    if (missingRequired.length > 0) {
      ctx.error(`Missing required parameter: ${missingRequired[0].name}`);
    }
  }

  // Prompt for any missing parameters in interactive mode
  const resolvedVariables = {...resolved.variables};
  if (interactive && resolved.missingParameters.length > 0) {
    for (const param of resolved.missingParameters) {
      // Re-check condition since earlier params may have been filled in
      if (param.when && !evaluateCondition(param.when, resolvedVariables)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const value = await promptForParameter(param, projectRoot, ctx);
      if (value !== undefined) {
        resolvedVariables[param.name] = value;

        // Set companion path variable for cartridges source
        if (param.source === 'cartridges' && typeof value === 'string') {
          const result = resolveLocalSource('cartridges', projectRoot);
          const cartridgePath = result.pathMap?.get(value);
          if (cartridgePath) {
            resolvedVariables[`${param.name}Path`] = cartridgePath;
          }
        }
      }
    }
  }

  // Resolve output directory using SDK function
  ctx.logger.trace(
    {flagOutput: options.output, defaultOutputDir: scaffold.manifest.defaultOutputDir},
    'Resolving output directory',
  );
  const outputDir = resolveOutputDirectory({
    outputDir: options.output,
    scaffold,
    projectRoot,
  });
  ctx.logger.debug({outputDir}, 'Resolved output directory');

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
 * Prompt for a single parameter value.
 */
async function promptForParameter(
  param: ScaffoldParameter,
  projectRoot: string,
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
      const {choices, warning} = await resolveSourceChoices(param, projectRoot);
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
      const {choices, warning} = await resolveSourceChoices(param, projectRoot);
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
        const {choices, warning} = await resolveSourceChoices(param, projectRoot);
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

    default: {
      return undefined;
    }
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
async function resolveSourceChoices(
  param: ScaffoldParameter,
  projectRoot: string,
): Promise<{
  choices: ScaffoldChoice[];
  pathMap?: Map<string, string>;
  warning?: string;
}> {
  if (!param.source) {
    return {choices: param.choices || []};
  }

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
