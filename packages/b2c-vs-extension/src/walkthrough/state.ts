/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';

export type StepStatus = 'locked' | 'available' | 'in-progress' | 'done' | 'skipped';

export interface StepRecord {
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  skippedAt?: string;
}

export interface OnboardingSnapshot {
  persona: string | null;
  steps: Record<string, StepRecord>;
  schemaVersion: number;
}

const STATE_KEY = 'b2c-dx.onboarding.state';
const CURRENT_SCHEMA_VERSION = 1;

function emptySnapshot(): OnboardingSnapshot {
  return {persona: null, steps: {}, schemaVersion: CURRENT_SCHEMA_VERSION};
}

function stepKey(persona: string, stepId: string): string {
  return `${persona}:${stepId}`;
}

export class OnboardingStateStore {
  private readonly memento: vscode.Memento;
  private readonly emitter = new vscode.EventEmitter<OnboardingSnapshot>();

  readonly onDidChange = this.emitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.memento = context.globalState;
    // Sync progress across machines signed into the same VS Code account.
    context.globalState.setKeysForSync([STATE_KEY]);
  }

  get(): OnboardingSnapshot {
    const raw = this.memento.get<OnboardingSnapshot>(STATE_KEY);
    if (!raw || typeof raw !== 'object') return emptySnapshot();
    if (raw.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return {...emptySnapshot(), persona: raw.persona ?? null};
    }
    return raw;
  }

  getPersona(): string | null {
    return this.get().persona;
  }

  async setPersona(persona: string | null): Promise<void> {
    const current = this.get();
    await this.write({...current, persona});
  }

  getStep(persona: string, stepId: string): StepRecord | undefined {
    return this.get().steps[stepKey(persona, stepId)];
  }

  async updateStep(persona: string, stepId: string, patch: Partial<StepRecord>): Promise<StepRecord> {
    const current = this.get();
    const key = stepKey(persona, stepId);
    const existing: StepRecord = current.steps[key] ?? {status: 'available'};
    const next: StepRecord = {...existing, ...patch};
    await this.write({...current, steps: {...current.steps, [key]: next}});
    return next;
  }

  async markStarted(persona: string, stepId: string): Promise<void> {
    const existing = this.getStep(persona, stepId);
    if (existing?.status === 'done') return;
    await this.updateStep(persona, stepId, {
      status: 'in-progress',
      startedAt: existing?.startedAt ?? new Date().toISOString(),
    });
  }

  async markCompleted(persona: string, stepId: string): Promise<void> {
    await this.updateStep(persona, stepId, {
      status: 'done',
      completedAt: new Date().toISOString(),
    });
  }

  async markSkipped(persona: string, stepId: string): Promise<void> {
    await this.updateStep(persona, stepId, {
      status: 'skipped',
      skippedAt: new Date().toISOString(),
    });
  }

  async reset(): Promise<void> {
    await this.write(emptySnapshot());
  }

  private async write(next: OnboardingSnapshot): Promise<void> {
    await this.memento.update(STATE_KEY, next);
    this.emitter.fire(next);
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
