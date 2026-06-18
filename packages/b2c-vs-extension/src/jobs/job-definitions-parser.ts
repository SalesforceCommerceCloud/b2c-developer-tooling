/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Pure parsers for local B2C job artifacts (`jobs.xml`, `steptypes.json`).
 *
 * Business Manager's "Job Definitions" tab is backed by an internal API that is
 * not exposed through OCAPI/SCAPI, so the extension cannot fetch defined jobs
 * from an instance. Instead it surfaces the definitions a developer maintains in
 * their workspace: the `jobs.xml` documents describing jobs and the
 * `steptypes.json` registrations describing the custom step types those jobs
 * reference. These functions are pure (string in, data out) so they can be unit
 * tested without VS Code.
 */

/** A single step inside a parsed job definition. */
export interface ParsedJobStep {
  stepId: string;
  type: string;
}

/** A job parsed from a `jobs.xml` document. */
export interface ParsedJobDefinition {
  jobId: string;
  description?: string;
  steps: ParsedJobStep[];
}

/** A custom step type parsed from a `steptypes.json` document. */
export interface ParsedStepType {
  typeId: string;
  module?: string;
  /** `task` for script-module-step, `chunk` for chunk-script-module-step. */
  kind: 'task' | 'chunk' | 'unknown';
  description?: string;
}

/** Namespace that identifies a B2C impex jobs document regardless of filename. */
const JOBS_NAMESPACE = 'demandware.com/xml/impex/jobs';

const JOB_BLOCK_REGEX = /<job\b[^>]*\bjob-id="([^"]+)"[^>]*>([\s\S]*?)<\/job>/gi;
const SELF_CLOSING_JOB_REGEX = /<job\b[^>]*\bjob-id="([^"]+)"[^>]*\/>/gi;
const STEP_REGEX = /<step\b[^>]*\bstep-id="([^"]+)"[^>]*\btype="([^"]+)"[^>]*\/?>/gi;
const STEP_REGEX_TYPE_FIRST = /<step\b[^>]*\btype="([^"]+)"[^>]*\bstep-id="([^"]+)"[^>]*\/?>/gi;
const DESCRIPTION_REGEX = /<description>([\s\S]*?)<\/description>/i;

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .trim();
}

/**
 * Parses job definitions out of a `jobs.xml` document.
 *
 * Uses lightweight regex extraction (consistent with the existing
 * `extractJobIdFromXml` helper) rather than a full XML parser — the impex jobs
 * schema is shallow and the goal is a navigable tree, not validation.
 */
export function parseJobsXml(xml: string): ParsedJobDefinition[] {
  const jobs: ParsedJobDefinition[] = [];

  JOB_BLOCK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = JOB_BLOCK_REGEX.exec(xml)) !== null) {
    const jobId = decodeXmlEntities(match[1]);
    const body = match[2];
    const descriptionMatch = body.match(DESCRIPTION_REGEX);
    jobs.push({
      jobId,
      description: descriptionMatch ? decodeXmlEntities(descriptionMatch[1]) : undefined,
      steps: parseSteps(body),
    });
  }

  // Self-closing <job .../> entries carry no steps but should still be listed.
  SELF_CLOSING_JOB_REGEX.lastIndex = 0;
  while ((match = SELF_CLOSING_JOB_REGEX.exec(xml)) !== null) {
    const jobId = decodeXmlEntities(match[1]);
    if (!jobs.some((job) => job.jobId === jobId)) {
      jobs.push({jobId, steps: []});
    }
  }

  return jobs;
}

/**
 * Returns true when the given XML content looks like a B2C impex jobs document.
 *
 * Job definitions are recognized by the importer via content (the jobs
 * namespace + `<job job-id=…>`), not by filename — a developer may name the
 * file anything. This guard lets discovery accept user-supplied globs while
 * filtering out unrelated XML (catalogs, inventory, etc.).
 */
export function isJobsDefinitionXml(xml: string): boolean {
  if (xml.includes(JOBS_NAMESPACE)) return true;
  JOB_BLOCK_REGEX.lastIndex = 0;
  SELF_CLOSING_JOB_REGEX.lastIndex = 0;
  return JOB_BLOCK_REGEX.test(xml) || SELF_CLOSING_JOB_REGEX.test(xml);
}

function parseSteps(jobBody: string): ParsedJobStep[] {
  const steps = new Map<string, ParsedJobStep>();

  STEP_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = STEP_REGEX.exec(jobBody)) !== null) {
    const stepId = decodeXmlEntities(match[1]);
    steps.set(stepId, {stepId, type: decodeXmlEntities(match[2])});
  }

  // Attribute order is not fixed in XML; catch type-before-step-id as well.
  STEP_REGEX_TYPE_FIRST.lastIndex = 0;
  while ((match = STEP_REGEX_TYPE_FIRST.exec(jobBody)) !== null) {
    const stepId = decodeXmlEntities(match[2]);
    if (!steps.has(stepId)) {
      steps.set(stepId, {stepId, type: decodeXmlEntities(match[1])});
    }
  }

  return [...steps.values()];
}

/**
 * Parses custom step types out of a `steptypes.json` document.
 *
 * Tolerates malformed JSON by returning an empty list rather than throwing, so
 * a single bad file in the workspace doesn't break the whole Definitions view.
 */
export function parseStepTypesJson(json: string): ParsedStepType[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }

  const stepTypesNode = (parsed as {['step-types']?: unknown})?.['step-types'];
  if (!stepTypesNode || typeof stepTypesNode !== 'object') return [];

  const groups: Array<{key: string; kind: ParsedStepType['kind']}> = [
    {key: 'script-module-step', kind: 'task'},
    {key: 'chunk-script-module-step', kind: 'chunk'},
  ];

  const result: ParsedStepType[] = [];
  for (const {key, kind} of groups) {
    const entries = (stepTypesNode as Record<string, unknown>)[key];
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const typeId = record['@type-id'];
      if (typeof typeId !== 'string' || !typeId.trim()) continue;

      result.push({
        typeId: typeId.trim(),
        module: typeof record.module === 'string' ? record.module : undefined,
        kind,
        description: typeof record.description === 'string' ? record.description : undefined,
      });
    }
  }

  return result;
}

/**
 * Extracts the distinct step types referenced by a `jobs.xml` document.
 * Used by the deploy pre-flight check to detect custom (`custom.*`) steps.
 */
export function referencedStepTypes(xml: string): string[] {
  const types = new Set<string>();
  for (const job of parseJobsXml(xml)) {
    for (const step of job.steps) types.add(step.type);
  }
  return [...types];
}
