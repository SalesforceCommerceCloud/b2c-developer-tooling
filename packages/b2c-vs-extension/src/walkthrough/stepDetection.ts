/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Lightweight per-step config detection. Reads dw.json directly from the
 * workspace root so the panel can show "1 similar configuration detected"
 * style hints without depending on the b2c CLI being installed.
 */

export interface StepDetection {
  /** Number of matching configurations detected (e.g., instances with OAuth). */
  matchCount: number;
  /** Total instance entries scanned. */
  totalInstances: number;
  /** Short label to display in the chip (e.g., "1 similar configuration detected"). */
  label?: string;
  /** Names of matched instances, when applicable. */
  matchedNames?: string[];
}

interface DwJsonInstance {
  name?: string;
  hostname?: string;
  'code-version'?: string;
  codeVersion?: string;
  username?: string;
  password?: string;
  'client-id'?: string;
  clientId?: string;
  'client-secret'?: string;
  clientSecret?: string;
  'short-code'?: string;
  shortCode?: string;
  'tenant-id'?: string;
  tenantId?: string;
  cartridge?: unknown;
  cartridgesPath?: string;
  active?: boolean;
}

interface DwJsonShape extends DwJsonInstance {
  configs?: DwJsonInstance[];
}

async function readDwJson(workspaceRoot: string): Promise<DwJsonShape | null> {
  try {
    const raw = await fs.readFile(path.join(workspaceRoot, 'dw.json'), 'utf-8');
    return JSON.parse(raw) as DwJsonShape;
  } catch {
    return null;
  }
}

/** Flatten a dw.json into a list of instance config blocks. */
function flattenInstances(dw: DwJsonShape | null): DwJsonInstance[] {
  if (!dw) return [];
  if (Array.isArray(dw.configs) && dw.configs.length > 0) {
    return dw.configs;
  }
  // Top-level shape: dw.json itself describes one instance.
  return [dw];
}

const has = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;

function pluralize(n: number, sing: string, plural: string): string {
  return n === 1 ? sing : plural;
}

/** Check what's configured on each instance and tally per category. */
export interface DetectionSummary {
  connection: StepDetection;
  oauth: StepDetection;
  webdav: StepDetection;
  scapi: StepDetection;
  cartridges: StepDetection;
}

export async function detectStepConfigurations(workspaceRoot: string | undefined): Promise<DetectionSummary> {
  const empty: StepDetection = {matchCount: 0, totalInstances: 0};
  if (!workspaceRoot) {
    return {
      connection: {...empty},
      oauth: {...empty},
      webdav: {...empty},
      scapi: {...empty},
      cartridges: {...empty},
    };
  }

  const dw = await readDwJson(workspaceRoot);
  const instances = flattenInstances(dw);
  const total = instances.length;

  const namesWith = (predicate: (i: DwJsonInstance) => boolean): string[] =>
    instances
      .filter(predicate)
      .map((i) => i.name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0);

  const connectionNames = namesWith((i) => has(i.hostname));
  const oauthNames = namesWith((i) => has(i['client-id'] ?? i.clientId));
  const webdavNames = namesWith((i) => has(i.username) && has(i.password));
  const scapiNames = namesWith((i) => has(i['short-code'] ?? i.shortCode) && has(i['tenant-id'] ?? i.tenantId));
  const cartridgeNames = namesWith((i) => has(i.cartridgesPath) || Array.isArray(i.cartridge));

  const make = (names: string[]): StepDetection => {
    if (names.length === 0) return {matchCount: 0, totalInstances: total};
    return {
      matchCount: names.length,
      totalInstances: total,
      matchedNames: names,
      label: `${names.length} ${pluralize(names.length, 'configuration', 'configurations')} detected`,
    };
  };

  return {
    connection: make(connectionNames),
    oauth: make(oauthNames),
    webdav: make(webdavNames),
    scapi: make(scapiNames),
    cartridges: make(cartridgeNames),
  };
}

/** Pulled from dw.json for the deploy-code step's "what will be deployed" preview. */
export interface DeployContext {
  hostname?: string;
  codeVersion?: string;
  instanceName?: string;
}

/** Read the active instance's deploy-relevant fields from dw.json. */
export async function readDeployContext(workspaceRoot: string | undefined): Promise<DeployContext> {
  if (!workspaceRoot) return {};
  const dw = await readDwJson(workspaceRoot);
  if (!dw) return {};
  const instances = flattenInstances(dw);
  // Prefer the active instance; fall back to the first one.
  const active = instances.find((i) => i.active === true) ?? instances[0];
  if (!active) return {};
  return {
    hostname: active.hostname,
    codeVersion: active['code-version'] ?? active.codeVersion,
    instanceName: active.name,
  };
}

/** Map a step id to the relevant detection bucket. */
export function getDetectionForStep(stepId: string, summary: DetectionSummary): StepDetection | null {
  switch (stepId) {
    case 'configure-dw-json':
      return summary.connection;
    case 'setup-oauth':
      return summary.oauth;
    case 'explore-webdav':
      return summary.webdav;
    case 'setup-cartridges':
      // Cartridges step also covers SCAPI; report whichever has more matches,
      // preferring cartridges when tied.
      return summary.cartridges.matchCount >= summary.scapi.matchCount ? summary.cartridges : summary.scapi;
    default:
      return null;
  }
}
