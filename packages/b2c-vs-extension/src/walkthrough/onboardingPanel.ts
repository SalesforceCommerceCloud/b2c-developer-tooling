/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

import {OnboardingStateStore, StepStatus} from './state.js';
import {PERSONAS, PersonaId, StepAction, StepDefinition, getPersona, listPersonas, resolveSteps} from './personas.js';
import {renderMarkdown} from './markdown.js';

type InboundMessage =
  | {type: 'selectPersona'; personaId: PersonaId}
  | {type: 'changePersona'}
  | {type: 'openStep'; stepId: string}
  | {type: 'completeStep'; stepId: string}
  | {type: 'skipStep'; stepId: string}
  | {type: 'goNext'}
  | {type: 'goPrev'}
  | {type: 'runAction'; command: string; args?: unknown[]; stepId?: string}
  | {type: 'openLink'; url: string}
  | {type: 'reset'}
  | {type: 'ready'};

interface PersonaView {
  id: PersonaId;
  label: string;
  tagline: string;
  description: string;
}

interface StepView {
  id: string;
  title: string;
  summary: string;
  status: StepStatus;
  actions: StepAction[];
  html: string;
}

interface ViewState {
  persona: PersonaView | null;
  personas: PersonaView[];
  steps: StepView[];
  activeStepId: string | null;
}

export class OnboardingPanel {
  private static current: OnboardingPanel | undefined;

  static show(context: vscode.ExtensionContext, store: OnboardingStateStore, log: vscode.OutputChannel): void {
    if (OnboardingPanel.current) {
      OnboardingPanel.current.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel('b2c-dx.onboarding', 'B2C DX: Get Started', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(context.extensionPath)],
    });
    OnboardingPanel.current = new OnboardingPanel(context, store, log, panel);
  }

  private readonly disposables: vscode.Disposable[] = [];
  private activeStepId: string | null = null;

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly store: OnboardingStateStore,
    private readonly log: vscode.OutputChannel,
    private readonly panel: vscode.WebviewPanel,
  ) {
    this.panel.webview.html = this.renderShell();
    this.disposables.push(
      this.panel.onDidDispose(() => this.dispose()),
      this.panel.webview.onDidReceiveMessage((msg) => this.handleMessage(msg as InboundMessage)),
      this.store.onDidChange(() => void this.refresh()),
    );
  }

  private async handleMessage(msg: InboundMessage): Promise<void> {
    try {
      switch (msg.type) {
        case 'ready':
          await this.refresh();
          return;
        case 'selectPersona':
          await this.store.setPersona(msg.personaId);
          this.activeStepId = PERSONAS[msg.personaId]?.stepIds[0] ?? null;
          await this.refresh();
          return;
        case 'changePersona':
          await this.store.setPersona(null);
          this.activeStepId = null;
          await this.refresh();
          return;
        case 'openStep': {
          const persona = this.store.getPersona();
          if (!persona) return;
          // Ignore clicks on locked steps: the user must complete predecessors.
          const view = await this.buildViewState();
          const target = view.steps.find((s) => s.id === msg.stepId);
          if (!target || target.status === 'locked') return;
          this.activeStepId = msg.stepId;
          await this.store.markStarted(persona, msg.stepId);
          await this.refresh();
          return;
        }
        case 'completeStep': {
          const persona = this.store.getPersona();
          if (!persona) return;
          await this.store.markCompleted(persona, msg.stepId);
          return;
        }
        case 'skipStep': {
          const persona = this.store.getPersona();
          if (!persona) return;
          await this.store.markSkipped(persona, msg.stepId);
          return;
        }
        case 'runAction': {
          const persona = this.store.getPersona();
          if (persona && msg.stepId) {
            await this.store.markStarted(persona, msg.stepId);
          }
          await vscode.commands.executeCommand(msg.command, ...(msg.args ?? []));
          return;
        }
        case 'openLink': {
          // All markdown link clicks route through here. Safely dispatch
          // command: URIs and open http(s) externally; ignore anything else.
          const url = msg.url;
          if (url.startsWith('command:')) {
            const rest = url.slice('command:'.length);
            const qIdx = rest.indexOf('?');
            const commandId = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
            let args: unknown[] = [];
            if (qIdx >= 0) {
              try {
                const parsed = JSON.parse(decodeURIComponent(rest.slice(qIdx + 1)));
                args = Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                args = [];
              }
            }
            await vscode.commands.executeCommand(commandId, ...args);
          } else if (/^https?:/i.test(url) || url.startsWith('mailto:')) {
            await vscode.env.openExternal(vscode.Uri.parse(url));
          }
          return;
        }
        case 'goNext': {
          const persona = this.store.getPersona();
          if (!persona) return;
          const steps = resolveSteps(persona as PersonaId);
          const currentIdx = steps.findIndex((s) => s.id === this.activeStepId);
          if (currentIdx >= 0) {
            await this.store.markCompleted(persona, steps[currentIdx].id);
          }
          const next = steps[currentIdx + 1];
          if (next) {
            this.activeStepId = next.id;
            await this.store.markStarted(persona, next.id);
          }
          await this.refresh();
          return;
        }
        case 'goPrev': {
          const persona = this.store.getPersona();
          if (!persona) return;
          const steps = resolveSteps(persona as PersonaId);
          const currentIdx = steps.findIndex((s) => s.id === this.activeStepId);
          const prev = currentIdx > 0 ? steps[currentIdx - 1] : null;
          if (prev) {
            this.activeStepId = prev.id;
            await this.refresh();
          }
          return;
        }
        case 'reset':
          await this.store.reset();
          this.activeStepId = null;
          await this.refresh();
          return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[onboarding] handleMessage(${msg.type}) failed: ${message}`);
      vscode.window.showErrorMessage(`Onboarding: ${message}`);
    }
  }

  private async refresh(): Promise<void> {
    const view = await this.buildViewState();
    if (view.persona) {
      const active = view.steps.find((s) => s.id === this.activeStepId);
      // If no active step, or the active one is now locked (shouldn't happen
      // but defend against it), pick the first step the user can work on.
      if (!active || active.status === 'locked') {
        const pick =
          view.steps.find((s) => s.status === 'in-progress') ??
          view.steps.find((s) => s.status === 'available') ??
          view.steps[0];
        this.activeStepId = pick?.id ?? null;
      }
    }
    this.panel.webview.postMessage({type: 'state', state: {...view, activeStepId: this.activeStepId}});
  }

  private async buildViewState(): Promise<ViewState> {
    const personas: PersonaView[] = listPersonas().map((p) => ({
      id: p.id,
      label: p.label,
      tagline: p.tagline,
      description: p.description,
    }));
    const personaId = this.store.getPersona();
    const personaDef = getPersona(personaId);
    if (!personaDef) {
      return {persona: null, personas, steps: [], activeStepId: null};
    }
    const defs = resolveSteps(personaDef.id);
    const rawSteps = await Promise.all(defs.map((def) => this.buildStepView(personaDef.id, def)));
    // Sequential gating: a step is locked until every step before it is done
    // or skipped. The first step is always available.
    const steps = rawSteps.map((step, idx) => {
      if (idx === 0) return step;
      const allPriorResolved = rawSteps
        .slice(0, idx)
        .every((prior) => prior.status === 'done' || prior.status === 'skipped');
      if (!allPriorResolved && step.status !== 'done') {
        return {...step, status: 'locked' as const};
      }
      return step;
    });
    return {
      persona: {
        id: personaDef.id,
        label: personaDef.label,
        tagline: personaDef.tagline,
        description: personaDef.description,
      },
      personas,
      steps,
      activeStepId: this.activeStepId,
    };
  }

  private async buildStepView(personaId: PersonaId, def: StepDefinition): Promise<StepView> {
    const record = this.store.getStep(personaId, def.id);
    const markdown = await this.readMarkdown(def.markdown);
    return {
      id: def.id,
      title: def.title,
      summary: def.summary,
      status: record?.status ?? 'available',
      actions: def.actions ?? [],
      html: renderMarkdown(markdown),
    };
  }

  private async readMarkdown(relativePath: string): Promise<string> {
    try {
      const abs = path.join(this.context.extensionPath, relativePath);
      return await fs.readFile(abs, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[onboarding] failed to read ${relativePath}: ${message}`);
      return `# Content unavailable\n\n\`${relativePath}\` could not be loaded.`;
    }
  }

  private renderShell(): string {
    const webview = this.panel.webview;
    const nonce = makeNonce();
    const cspSource = webview.cspSource;
    const mediaRoot = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media')));
    const csp = [
      `default-src 'none'`,
      `img-src ${cspSource} https: data:`,
      `style-src ${cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `font-src ${cspSource}`,
    ].join('; ');

    return /* html */ `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>B2C DX: Get Started</title>
  <style>${PANEL_CSS}</style>
</head>
<body>
  <div id="persona-gate" hidden>
    <header class="gate-header">
      <h1>Welcome to B2C DX</h1>
      <p class="muted">Pick the role that best describes how you'll use the extension. We'll tailor the walkthrough to what you actually need — you can change this anytime.</p>
    </header>
    <div id="persona-cards" class="persona-grid"></div>
  </div>

  <div id="dashboard" hidden>
    <header class="dashboard-header">
      <div>
        <div class="eyebrow" id="persona-label"></div>
        <h1 id="persona-tagline"></h1>
      </div>
      <div class="header-actions">
        <button class="secondary" id="btn-change-persona">Change role</button>
        <button class="secondary" id="btn-reset">Reset walkthrough</button>
      </div>
    </header>

    <div class="progress-row">
      <div class="progress-meta">
        <span id="progress-counter"></span>
        <span class="muted" id="progress-percent"></span>
      </div>
      <div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progress-fill"></div></div>
    </div>

    <div class="layout">
      <aside class="sidebar" aria-label="Steps">
        <ol id="step-list" class="step-list"></ol>
      </aside>
      <main class="content">
        <nav class="step-topnav" aria-label="Step navigation">
          <button class="nav-btn" id="btn-prev-top" aria-label="Previous step">
            <span class="nav-chevron">‹</span>
            <span class="nav-text"><small>Previous</small><span id="prev-title"></span></span>
          </button>
          <button class="nav-btn next" id="btn-next-top" aria-label="Next step">
            <span class="nav-text right"><small>Next</small><span id="next-title"></span></span>
            <span class="nav-chevron">›</span>
          </button>
        </nav>
        <section class="step-header">
          <h2 id="step-title"></h2>
          <p id="step-summary" class="muted"></p>
          <div id="step-actions" class="step-actions"></div>
        </section>
        <article id="step-body" class="markdown-body"></article>
        <footer class="content-footer">
          <button class="secondary" id="btn-prev">← Previous</button>
          <div class="footer-center">
            <button class="link-btn" id="btn-skip">Skip this step</button>
          </div>
          <button id="btn-next">Next →</button>
        </footer>
        <p class="kbd-hint muted">Tip: use <kbd>Alt</kbd>+<kbd>→</kbd> / <kbd>Alt</kbd>+<kbd>←</kbd> to navigate.</p>
      </main>
    </div>
  </div>

  <img class="corner-logo" src="${mediaRoot}/b2c-icon.svg" alt="" />

  <script nonce="${nonce}">${PANEL_JS}</script>
</body>
</html>`;
  }

  dispose(): void {
    OnboardingPanel.current = undefined;
    this.disposables.forEach((d) => d.dispose());
    this.panel.dispose();
  }
}

function makeNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

const PANEL_CSS = `
:root {
  color-scheme: light dark;
  --gap: 16px;
  --radius: 6px;
  --sidebar-width: 280px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--vscode-font-family);
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
  padding: 24px 32px;
}
h1 { font-size: 1.6rem; margin: 0 0 4px; }
h2 { font-size: 1.2rem; margin: 0 0 4px; }
.muted { color: var(--vscode-descriptionForeground); margin: 0; }
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 6px;
}
button {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: var(--radius);
  padding: 6px 14px;
  font: inherit;
  cursor: pointer;
}
button:hover { background: var(--vscode-button-hoverBackground); }
button.secondary {
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
}
button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
#persona-gate {
  max-width: 920px;
  margin: 0 auto;
  padding: 56px 16px 32px;
}
.gate-header {
  text-align: center;
  margin-bottom: 40px;
}
.gate-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}
.gate-header p {
  max-width: 620px;
  margin: 0 auto;
  font-size: 0.95rem;
  line-height: 1.55;
}
.persona-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (max-width: 720px) { .persona-grid { grid-template-columns: 1fr; } }
.persona-card {
  color: var(--vscode-foreground);
  background: var(--vscode-editorWidget-background);
  border: 1px solid var(--vscode-panel-border, var(--vscode-editorGroup-border));
  border-radius: 8px;
  padding: 22px 22px 24px;
  display: grid;
  grid-template-columns: 48px 1fr;
  column-gap: 16px;
  row-gap: 6px;
  align-items: start;
  cursor: pointer;
  user-select: none;
  transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
}
.persona-card:hover {
  /* Subtle lift + stronger border. Do NOT change background — that was
     washing out the text color on light themes. */
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.persona-card:focus-visible {
  outline: 2px solid var(--vscode-focusBorder);
  outline-offset: 2px;
}
.persona-card:active {
  transform: translateY(0);
  box-shadow: none;
}
.persona-avatar {
  grid-row: 1 / span 3;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--vscode-textLink-foreground, #0078d4);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}
.persona-card h3 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--vscode-foreground);
  line-height: 1.3;
}
.persona-card .tagline {
  color: var(--vscode-descriptionForeground);
  font-size: 0.88rem;
  margin: 0;
  line-height: 1.4;
}
.persona-card .desc {
  color: var(--vscode-foreground);
  opacity: 0.85;
  font-size: 0.87rem;
  line-height: 1.5;
  margin: 8px 0 0;
  grid-column: 2;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--gap);
  margin-bottom: 16px;
}
.header-actions { display: flex; gap: 8px; }

.progress-row { margin-bottom: 24px; }
.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.85rem;
  margin-bottom: 6px;
}
.progress-track {
  height: 6px;
  border-radius: 999px;
  background: var(--vscode-progressBar-background, rgba(127,127,127,0.25));
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: var(--vscode-textLink-foreground, #0078d4);
  transition: width 200ms ease;
}

.step-topnav {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--vscode-editorWidget-background);
  color: var(--vscode-foreground);
  border: 1px solid var(--vscode-panel-border, var(--vscode-editorGroup-border));
  border-radius: var(--radius);
  cursor: pointer;
  max-width: 45%;
  text-align: left;
  min-height: 44px;
}
.nav-btn:hover:not([disabled]) {
  border-color: var(--vscode-focusBorder);
  background: var(--vscode-list-hoverBackground);
}
.nav-btn[disabled] { opacity: 0.4; cursor: not-allowed; }
.nav-btn.next { margin-left: auto; }
.nav-btn .nav-text { display: flex; flex-direction: column; min-width: 0; }
.nav-btn .nav-text.right { text-align: right; }
.nav-btn .nav-text small {
  color: var(--vscode-descriptionForeground);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.nav-btn .nav-text span:not(small) {
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-btn .nav-chevron {
  font-size: 1.4rem;
  line-height: 1;
  color: var(--vscode-descriptionForeground);
}

.layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  gap: 32px;
  align-items: start;
}
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

.sidebar { position: sticky; top: 24px; }
.step-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  border: 1px solid transparent;
  color: var(--vscode-foreground);
}
.step-item:hover { background: var(--vscode-list-hoverBackground); }
.step-item.active {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
  border-color: var(--vscode-focusBorder);
}
.step-item .status {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  margin-top: 2px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
}
.step-item[data-status="done"] .status { background: var(--vscode-testing-iconPassed, #3fb950); color: #fff; }
.step-item[data-status="in-progress"] .status { background: var(--vscode-progressBar-background, #0078d4); color: #fff; }
.step-item[data-status="skipped"] .status { background: var(--vscode-descriptionForeground); color: var(--vscode-editor-background); }
.step-item[data-status="locked"] .status { background: transparent; }
.step-item.locked {
  cursor: not-allowed;
  opacity: 0.5;
}
.step-item.locked:hover { background: transparent; }
.step-item.locked .label { color: var(--vscode-descriptionForeground); }
.step-item .label { font-size: 0.92rem; line-height: 1.35; }
.step-item .label small { display: block; color: var(--vscode-descriptionForeground); font-size: 0.78rem; margin-top: 2px; }

.content { min-width: 0; }
.step-header { margin-bottom: 12px; }
.step-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.content-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--vscode-panel-border, var(--vscode-editorGroup-border));
}
.content-footer button { min-height: 36px; padding: 8px 18px; }
.content-footer .footer-center { flex: 1; text-align: center; }
.content-footer #btn-next { font-weight: 600; }
.link-btn {
  background: transparent;
  color: var(--vscode-textLink-foreground);
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  text-decoration: underline;
}
.link-btn:hover { background: transparent; color: var(--vscode-textLink-activeForeground); }
.kbd-hint { text-align: center; margin-top: 12px; font-size: 0.8rem; }
.kbd-hint kbd {
  background: var(--vscode-keybindingLabel-background, rgba(127,127,127,0.2));
  border: 1px solid var(--vscode-keybindingLabel-border, rgba(127,127,127,0.35));
  border-radius: 3px;
  padding: 1px 5px;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.78rem;
}

.markdown-body { line-height: 1.6; font-size: 0.95rem; }
.markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 1.4em; }
.markdown-body h1 { font-size: 1.25rem; }
.markdown-body h2 { font-size: 1.1rem; }
.markdown-body h3 { font-size: 1rem; }
.markdown-body code {
  background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.12));
  padding: 1px 6px;
  border-radius: 3px;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.9em;
}
.markdown-body pre {
  background: var(--vscode-textCodeBlock-background, rgba(127,127,127,0.12));
  padding: 12px 14px;
  border-radius: var(--radius);
  overflow-x: auto;
}
.markdown-body pre code { background: transparent; padding: 0; }
.markdown-body a { color: var(--vscode-textLink-foreground); }
.markdown-body a:hover { color: var(--vscode-textLink-activeForeground); }
.markdown-body hr { border: none; border-top: 1px solid var(--vscode-panel-border, var(--vscode-editorGroup-border)); margin: 24px 0; }
.markdown-body ul, .markdown-body ol { padding-left: 1.4em; }

.corner-logo {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  opacity: 0.35;
  pointer-events: none;
}
`;

const PANEL_JS = `
(function () {
  const vscode = acquireVsCodeApi();
  const gate = document.getElementById('persona-gate');
  const dashboard = document.getElementById('dashboard');
  const personaCards = document.getElementById('persona-cards');
  const personaLabel = document.getElementById('persona-label');
  const personaTagline = document.getElementById('persona-tagline');
  const stepList = document.getElementById('step-list');
  const stepTitle = document.getElementById('step-title');
  const stepSummary = document.getElementById('step-summary');
  const stepActions = document.getElementById('step-actions');
  const stepBody = document.getElementById('step-body');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnPrevTop = document.getElementById('btn-prev-top');
  const btnNextTop = document.getElementById('btn-next-top');
  const prevTitleEl = document.getElementById('prev-title');
  const nextTitleEl = document.getElementById('next-title');
  const progressCounter = document.getElementById('progress-counter');
  const progressPercent = document.getElementById('progress-percent');
  const progressFill = document.getElementById('progress-fill');
  const btnSkip = document.getElementById('btn-skip');
  const btnChangePersona = document.getElementById('btn-change-persona');
  const btnReset = document.getElementById('btn-reset');

  let currentState = null;

  function post(msg) { vscode.postMessage(msg); }

  function render(state) {
    currentState = state;
    if (!state.persona) {
      gate.hidden = false;
      dashboard.hidden = true;
      renderPersonaGate(state.personas);
      return;
    }
    gate.hidden = true;
    dashboard.hidden = false;
    personaLabel.textContent = state.persona.label;
    personaTagline.textContent = state.persona.tagline;
    renderStepList(state.steps, state.activeStepId);

    const activeIdx = state.steps.findIndex((s) => s.id === state.activeStepId);
    const idx = activeIdx >= 0 ? activeIdx : 0;
    const active = state.steps[idx];
    const prevStep = idx > 0 ? state.steps[idx - 1] : null;
    const nextStep = idx < state.steps.length - 1 ? state.steps[idx + 1] : null;
    renderActiveStep(active, idx, state.steps.length);
    renderNav(prevStep, nextStep);
    renderProgress(state.steps, idx);
  }

  function renderProgress(steps, idx) {
    const total = steps.length;
    const doneCount = steps.filter((s) => s.status === 'done').length;
    const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
    progressCounter.textContent = 'Step ' + (idx + 1) + ' of ' + total;
    progressPercent.textContent = pct + '% complete';
    progressFill.style.width = pct + '%';
  }

  function renderNav(prev, next) {
    const prevLabel = prev ? prev.title : 'Start of walkthrough';
    const nextLabel = next ? next.title : 'Finish';
    prevTitleEl.textContent = prevLabel;
    nextTitleEl.textContent = nextLabel;
    btnPrev.disabled = !prev;
    btnPrevTop.disabled = !prev;
    btnNext.textContent = next ? 'Next: ' + next.title + ' →' : 'Finish ✓';
  }

  function renderPersonaGate(personas) {
    personaCards.innerHTML = '';
    personas.forEach((p) => {
      // Use a div + role="button" rather than a <button> so we don't inherit
      // VS Code's global button color/hover/focus rules (which were making the
      // card background flip to --vscode-button-background and hide the text).
      const card = document.createElement('div');
      card.className = 'persona-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', p.label);
      card.innerHTML = [
        '<span class="persona-avatar" aria-hidden="true"></span>',
        '<h3></h3>',
        '<p class="tagline"></p>',
        '<p class="desc"></p>',
      ].join('');
      card.querySelector('.persona-avatar').textContent = personaInitials(p.label);
      card.querySelector('h3').textContent = p.label;
      card.querySelector('.tagline').textContent = p.tagline;
      card.querySelector('.desc').textContent = p.description;
      const select = () => post({type: 'selectPersona', personaId: p.id});
      card.addEventListener('click', select);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });
      personaCards.appendChild(card);
    });
  }

  function personaInitials(label) {
    // "Frontend / SFRA developer" -> "FS"; "DevOps / sandbox admin" -> "DS"; etc.
    const tokens = label.split(/[\s/]+/).filter(Boolean);
    const letters = tokens
      .filter((t) => /^[A-Za-z]/.test(t))
      .slice(0, 2)
      .map((t) => t.charAt(0).toUpperCase());
    return letters.join('') || '?';
  }

  function renderStepList(steps, activeId) {
    stepList.innerHTML = '';
    steps.forEach((step, idx) => {
      const locked = step.status === 'locked';
      const li = document.createElement('li');
      li.className = 'step-item' + (step.id === activeId ? ' active' : '') + (locked ? ' locked' : '');
      li.dataset.status = step.status;
      li.innerHTML = [
        '<span class="status" aria-hidden="true"></span>',
        '<span class="label"><span class="title"></span><small></small></span>',
      ].join('');
      li.querySelector('.status').textContent = statusGlyph(step.status, idx + 1);
      li.querySelector('.title').textContent = step.title;
      li.querySelector('small').textContent = labelForStatus(step.status);
      if (locked) {
        li.setAttribute('aria-disabled', 'true');
        li.setAttribute('title', 'Complete the previous step to unlock this one.');
      } else {
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0');
        li.addEventListener('click', () => post({type: 'openStep', stepId: step.id}));
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            post({type: 'openStep', stepId: step.id});
          }
        });
      }
      stepList.appendChild(li);
    });
  }

  function statusGlyph(status, ordinal) {
    switch (status) {
      case 'done': return '✓';
      case 'in-progress': return '●';
      case 'skipped': return '–';
      case 'locked': return '🔒';
      default: return String(ordinal);
    }
  }

  function labelForStatus(status) {
    switch (status) {
      case 'done': return 'Completed';
      case 'in-progress': return 'In progress';
      case 'skipped': return 'Skipped';
      case 'locked': return 'Locked — complete the previous step';
      default: return '';
    }
  }

  function renderActiveStep(step, idx, total) {
    if (!step) {
      stepTitle.textContent = '';
      stepSummary.textContent = '';
      stepActions.innerHTML = '';
      stepBody.innerHTML = '';
      return;
    }
    stepTitle.textContent = step.title;
    stepSummary.textContent = step.summary;
    stepBody.innerHTML = step.html;
    stepActions.innerHTML = '';
    step.actions.forEach((action) => {
      const btn = document.createElement('button');
      if (!action.primary) btn.className = 'secondary';
      btn.textContent = action.label;
      btn.addEventListener('click', () =>
        post({type: 'runAction', command: action.command, args: action.args, stepId: step.id}),
      );
      stepActions.appendChild(btn);
    });
    // Scroll content back to top when switching steps.
    stepBody.scrollIntoView({behavior: 'instant', block: 'start'});
  }

  // Intercept clicks on any link inside the content area. We NEVER let the
  // webview follow command: or http links directly — all routing goes through
  // the extension host via postMessage.
  document.addEventListener('click', (e) => {
    const anchor = e.target && e.target.closest && e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    post({type: 'openLink', url: href});
  });

  btnSkip.addEventListener('click', () => {
    if (!currentState || !currentState.activeStepId) return;
    post({type: 'skipStep', stepId: currentState.activeStepId});
  });
  btnPrev.addEventListener('click', () => post({type: 'goPrev'}));
  btnNext.addEventListener('click', () => post({type: 'goNext'}));
  btnPrevTop.addEventListener('click', () => post({type: 'goPrev'}));
  btnNextTop.addEventListener('click', () => post({type: 'goNext'}));
  btnChangePersona.addEventListener('click', () => post({type: 'changePersona'}));
  btnReset.addEventListener('click', () => post({type: 'reset'}));

  // Keyboard navigation: Alt+← / Alt+→ (and the usual PageUp/Down pattern).
  document.addEventListener('keydown', (e) => {
    if (!currentState || !currentState.persona) return;
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); post({type: 'goNext'}); }
    else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); post({type: 'goPrev'}); }
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg && msg.type === 'state') render(msg.state);
  });

  post({type: 'ready'});
}());
`;
