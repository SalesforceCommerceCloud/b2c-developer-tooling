/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

const JOB_LOG_SCHEME = 'b2c-job-log';
const jobLogContents = new Map<string, string>();

const jobLogProvider: vscode.TextDocumentContentProvider = {
  provideTextDocumentContent(uri: vscode.Uri) {
    return jobLogContents.get(uri.toString()) ?? '';
  },
};

/** Register the job log content provider. Call once during extension activation. */
export function registerJobLogViewer(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(JOB_LOG_SCHEME, jobLogProvider));
}

/** Open a job log as a read-only virtual document (no save prompt on close). */
export async function openJobLog(executionId: string, content: string): Promise<void> {
  const uri = vscode.Uri.parse(`${JOB_LOG_SCHEME}:${executionId}.log`);
  jobLogContents.set(uri.toString(), content);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
}
