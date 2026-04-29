/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';

/**
 * Walkthrough telemetry and performance tracking.
 * Note: This is a basic implementation. For production, consider using
 * a proper telemetry service like Application Insights or VS Code's telemetry API.
 */

interface WalkthroughMetrics {
  commandExecutions: Map<string, number>;
  commandDurations: Map<string, number[]>;
  stepCompletions: Map<string, Date>;
  errors: Array<{command: string; error: string; timestamp: Date}>;
}

class WalkthroughTelemetry {
  private metrics: WalkthroughMetrics = {
    commandExecutions: new Map(),
    commandDurations: new Map(),
    stepCompletions: new Map(),
    errors: [],
  };

  private log: vscode.OutputChannel;

  constructor(log: vscode.OutputChannel) {
    this.log = log;
  }

  /**
   * Track command execution start time
   */
  startCommand(commandId: string): () => void {
    const startTime = Date.now();

    // Increment execution count
    const count = this.metrics.commandExecutions.get(commandId) || 0;
    this.metrics.commandExecutions.set(commandId, count + 1);

    // Return a function to call when command completes
    return () => {
      const duration = Date.now() - startTime;

      // Store duration
      const durations = this.metrics.commandDurations.get(commandId) || [];
      durations.push(duration);
      this.metrics.commandDurations.set(commandId, durations);

      this.log.appendLine(`[Telemetry] Command '${commandId}' completed in ${duration}ms`);
    };
  }

  /**
   * Track step completion
   */
  trackStepCompletion(stepId: string): void {
    this.metrics.stepCompletions.set(stepId, new Date());
    this.log.appendLine(`[Telemetry] Step '${stepId}' completed`);
  }

  /**
   * Track error
   */
  trackError(commandId: string, error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.metrics.errors.push({
      command: commandId,
      error: errorMessage,
      timestamp: new Date(),
    });
    this.log.appendLine(`[Telemetry] Error in '${commandId}': ${errorMessage}`);
  }

  /**
   * Get average duration for a command
   */
  getAverageDuration(commandId: string): number | null {
    const durations = this.metrics.commandDurations.get(commandId);
    if (!durations || durations.length === 0) {
      return null;
    }

    const sum = durations.reduce((a, b) => a + b, 0);
    return sum / durations.length;
  }

  /**
   * Get metrics summary
   */
  getSummary(): string {
    const lines: string[] = ['=== Walkthrough Telemetry Summary ===', '', 'Command Executions:'];

    for (const [command, count] of this.metrics.commandExecutions) {
      const avgDuration = this.getAverageDuration(command);
      const avgStr = avgDuration ? `avg: ${avgDuration.toFixed(2)}ms` : 'no timing data';
      lines.push(`  ${command}: ${count} executions (${avgStr})`);
    }

    lines.push('', 'Step Completions:');
    for (const [step, date] of this.metrics.stepCompletions) {
      lines.push(`  ${step}: ${date.toISOString()}`);
    }

    if (this.metrics.errors.length > 0) {
      lines.push('', 'Errors:');
      for (const error of this.metrics.errors) {
        lines.push(`  [${error.timestamp.toISOString()}] ${error.command}: ${error.error}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Log summary to output channel
   */
  logSummary(): void {
    this.log.appendLine(this.getSummary());
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      commandExecutions: new Map(),
      commandDurations: new Map(),
      stepCompletions: new Map(),
      errors: [],
    };
    this.log.appendLine('[Telemetry] Metrics reset');
  }
}

let telemetryInstance: WalkthroughTelemetry | null = null;

/**
 * Initialize telemetry
 */
export function initializeTelemetry(log: vscode.OutputChannel): WalkthroughTelemetry {
  telemetryInstance = new WalkthroughTelemetry(log);
  return telemetryInstance;
}

/**
 * Get telemetry instance
 */
export function getTelemetry(): WalkthroughTelemetry | null {
  return telemetryInstance;
}

/**
 * Decorator for tracking command execution time
 */
export function trackCommand(commandId: string): MethodDecorator {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const telemetry = getTelemetry();
      if (!telemetry) {
        return originalMethod.apply(this, args);
      }

      const endTracking = telemetry.startCommand(commandId);

      try {
        const result = await originalMethod.apply(this, args);
        endTracking();
        return result;
      } catch (error) {
        telemetry.trackError(commandId, error as Error);
        endTracking();
        throw error;
      }
    };

    return descriptor;
  };
}
