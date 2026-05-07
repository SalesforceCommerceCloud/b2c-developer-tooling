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
  stepCount: number;
  estimatedMinutes: number;
  recommended?: boolean;
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
    // Average step ≈ 3.5 min. The "ai-augmented" persona gets a `recommended`
    // flag so the gate highlights it as the new path.
    const personas: PersonaView[] = listPersonas().map((p) => ({
      id: p.id,
      label: p.label,
      tagline: p.tagline,
      description: p.description,
      stepCount: p.stepIds.length,
      estimatedMinutes: Math.max(15, Math.round((p.stepIds.length * 3.5) / 5) * 5),
      recommended: p.id === 'ai-augmented',
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
    const activePersonaView = personas.find((p) => p.id === personaDef.id) ?? {
      id: personaDef.id,
      label: personaDef.label,
      tagline: personaDef.tagline,
      description: personaDef.description,
      stepCount: personaDef.stepIds.length,
      estimatedMinutes: Math.max(15, Math.round((personaDef.stepIds.length * 3.5) / 5) * 5),
    };
    return {
      persona: activePersonaView,
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
  <header class="brand-bar" role="banner">
    <div class="brand">
      <span class="brand-mark" aria-label="B2C DX">
        <span class="brand-mark__b2c">B2C</span><span class="brand-mark__dx">DX</span>
      </span>
      <span class="brand-divider" aria-hidden="true"></span>
      <span class="brand-tag">Get Started</span>
    </div>
    <div class="brand-actions">
      <button class="ghost icon-only" id="btn-theme-toggle" title="Toggle light / dark theme" aria-label="Toggle light or dark theme">
        <span class="theme-glyph" aria-hidden="true">◐</span>
      </button>
      <button class="ghost" id="btn-mark-all-done" title="Mark every step as complete">Mark all done</button>
      <button class="ghost" id="btn-change-persona">Change role</button>
      <button class="ghost" id="btn-reset">Reset</button>
    </div>
  </header>

  <div id="persona-gate" hidden>
    <div class="gate-corner" aria-hidden="true">
      <span class="phase-chip"><span class="phase-dot"></span>PHASE 0 / 5</span>
      <svg class="gate-rings" viewBox="0 0 160 160" aria-hidden="true">
        <g fill="none">
          <circle cx="80" cy="80" r="78" class="gate-ring solid"/>
          <circle cx="80" cy="80" r="60" class="gate-ring dashed"/>
          <circle cx="80" cy="80" r="42" class="gate-ring solid"/>
        </g>
      </svg>
    </div>

    <section class="gate-hero">
      <span class="eyebrow">Welcome · Tailor your path</span>
      <h1>Pick your starting role.</h1>
      <p class="lede">Different roles need different things first. Choose one for a tailored deep-dive, or follow the universal five-phase flow shown on the left.</p>
    </section>

    <section class="stat-strip" aria-label="Onboarding statistics">
      <div class="stat">
        <span class="stat-value">4</span>
        <span class="stat-label">Roles</span>
      </div>
      <span class="stat-divider" aria-hidden="true"></span>
      <div class="stat">
        <span class="stat-value">5</span>
        <span class="stat-label">Phases</span>
      </div>
      <span class="stat-divider" aria-hidden="true"></span>
      <div class="stat">
        <span class="stat-value">~30<small>min</small></span>
        <span class="stat-label">Avg time</span>
      </div>
      <span class="stat-divider" aria-hidden="true"></span>
      <div class="stat">
        <span class="stat-value stat-check">✓</span>
        <span class="stat-label">Doc-backed</span>
      </div>
    </section>

    <div id="persona-cards" class="persona-grid" role="list"></div>

    <section class="gate-cta" aria-label="Call to action">
      <div class="gate-cta__copy">
        <strong>Ready to begin?</strong>
        <span>Pick a role above to launch the deep-dive panel.</span>
      </div>
      <button class="ghost cta-pill" id="btn-cta-mark-all-done">Already set up? Mark all done →</button>
    </section>
  </div>

  <div id="dashboard" hidden>
    <section class="dashboard-hero">
      <div>
        <span class="eyebrow" id="persona-label"></span>
        <h1 id="persona-tagline"></h1>
      </div>
      <div class="progress-block" aria-live="polite">
        <div class="progress-meta">
          <span id="progress-counter"></span>
          <span class="muted" id="progress-percent"></span>
        </div>
        <div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progress-fill"></div></div>
      </div>
    </section>

    <div class="layout">
      <aside class="sidebar" aria-label="Steps">
        <div class="sidebar-title">Walkthrough</div>
        <ol id="step-list" class="step-list"></ol>
      </aside>
      <main class="content">
        <article class="step-card">
          <div class="step-card__rail" aria-hidden="true"></div>
          <header class="step-card__header">
            <div class="step-number" id="step-number" aria-hidden="true"></div>
            <div class="step-card__title-block">
              <span class="step-position muted" id="step-position"></span>
              <h2 id="step-title"></h2>
              <p id="step-summary"></p>
            </div>
          </header>
          <section class="step-card__actions" id="step-actions-wrap" hidden>
            <span class="step-card__section-label">Quick actions</span>
            <div id="step-actions" class="step-actions"></div>
          </section>
          <section class="step-card__body">
            <div id="step-body" class="markdown-body"></div>
          </section>
        </article>

        <nav class="step-nav" aria-label="Step navigation">
          <button class="nav-btn" id="btn-prev" aria-label="Previous step">
            <span class="nav-chevron">‹</span>
            <span class="nav-text"><small>Previous</small><span id="prev-title"></span></span>
          </button>
          <div class="nav-spacer">
            <button class="link-btn" id="btn-skip">Skip this step</button>
            <span class="kbd-hint muted">Tip: <kbd>Alt</kbd>+<kbd>→</kbd> / <kbd>Alt</kbd>+<kbd>←</kbd></span>
          </div>
          <button class="nav-btn next primary" id="btn-next" aria-label="Next step">
            <span class="nav-text right"><small>Next</small><span id="next-title"></span></span>
            <span class="nav-chevron">›</span>
          </button>
        </nav>
        <button class="link-btn" id="btn-prev-top" hidden></button>
        <button class="link-btn" id="btn-next-top" hidden></button>
      </main>
    </div>
  </div>

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
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --sidebar-width: 264px;
  --content-max: 920px;
  --brand-blue: #0176D3;
  --brand-blue-deep: #014486;
  --brand-blue-soft: rgba(1, 118, 211, 0.10);
  --brand-blue-hairline: rgba(1, 118, 211, 0.28);
  --brand-green: #1A8754;
  --brand-green-bright: #2FA86A;
  --brand-green-soft: rgba(26, 135, 84, 0.12);
  --brand-green-hairline: rgba(26, 135, 84, 0.40);
  --surface-card: var(--vscode-editorWidget-background, var(--vscode-editor-background));
  --surface-elevated: var(--vscode-sideBar-background, var(--vscode-editor-background));
  --hairline: var(--vscode-panel-border, var(--vscode-editorGroup-border, rgba(128,128,128,0.25)));
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--vscode-font-family);
  color: var(--vscode-foreground);
  /* Layered page gradient: a soft brand-blue radial wash at the top-left,
     plus a faint diagonal gradient that fades into the editor background.
     Reads as a polished hero surface in light mode and stays subtle in dark
     mode because the brand-blue tints sit at low alpha against any base. */
  background:
    radial-gradient(ellipse 1200px 600px at 8% -10%, var(--brand-blue-soft), transparent 60%),
    radial-gradient(ellipse 900px 500px at 110% 0%, rgba(26, 135, 84, 0.06), transparent 55%),
    linear-gradient(180deg, var(--vscode-editor-background) 0%, var(--vscode-editor-background) 100%);
  background-attachment: fixed;
  padding: 0;
  min-height: 100vh;
}
h1, h2, h3 { letter-spacing: -0.01em; }
.muted { color: var(--vscode-descriptionForeground); margin: 0; }
.eyebrow {
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--brand-blue);
  margin-bottom: 8px;
}

/* ─── Brand bar ─────────────────────────────────────── */
.brand-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 32px;
  /* Translucent so the body's soft page gradient shows through. */
  background: color-mix(in srgb, var(--vscode-editor-background) 80%, transparent);
  border-bottom: 1px solid var(--hairline);
  backdrop-filter: saturate(180%) blur(8px);
}
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.brand-mark {
  font-family: 'Inter', 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-weight: 800;
  font-size: 1.55rem;
  letter-spacing: -0.02em;
  line-height: 1;
  white-space: nowrap;
}
.brand-mark__b2c {
  color: var(--brand-blue);
  background: linear-gradient(135deg, #1B96FF 0%, var(--brand-blue) 50%, var(--brand-blue-deep) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  padding-right: 6px;
}
.brand-mark__dx {
  color: var(--brand-blue);
  font-style: italic;
  font-weight: 700;
  position: relative;
}
.brand-mark__dx::before {
  content: "·";
  color: var(--brand-blue);
  margin-right: 6px;
  font-style: normal;
  font-weight: 700;
}
.brand-divider {
  width: 1px;
  height: 22px;
  background: var(--hairline);
  margin: 0 4px;
}
.brand-tag {
  font-size: 0.78rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--vscode-descriptionForeground);
}
.brand-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
button.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
}
button.icon-only .theme-glyph {
  font-size: 1.05rem;
  line-height: 1;
  display: inline-block;
  transition: transform 200ms ease;
}
button.icon-only:hover .theme-glyph { transform: rotate(20deg); }
button {
  background: var(--brand-blue);
  color: #fff;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 7px 14px;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, transform 80ms ease, box-shadow 120ms ease;
}
button:hover { background: var(--brand-blue-deep); }
button:active { transform: translateY(1px); }
button:focus-visible {
  outline: 2px solid var(--brand-blue);
  outline-offset: 2px;
}
button.ghost {
  background: transparent;
  color: var(--vscode-foreground);
  border-color: var(--hairline);
}
button.ghost:hover {
  background: var(--brand-blue-soft);
  border-color: var(--brand-blue-hairline);
  color: var(--brand-blue);
}
button.secondary {
  background: var(--vscode-button-secondaryBackground, transparent);
  color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
  border-color: var(--hairline);
}
button.secondary:hover {
  background: var(--vscode-button-secondaryHoverBackground, var(--brand-blue-soft));
}

/* ─── Persona gate ─────────────────────────────────── */
#persona-gate {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  padding: 64px 40px 56px;
}

/* Top-right corner: phase chip + concentric rings */
.gate-corner {
  position: absolute;
  top: 56px;
  right: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 18px;
  pointer-events: none;
  z-index: 1;
}
.phase-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--surface-card);
  border: 1px solid var(--brand-blue-hairline);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--vscode-foreground);
}
.phase-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-green);
  box-shadow: 0 0 0 3px var(--brand-green-soft);
}
.gate-rings {
  width: 160px;
  height: 160px;
  opacity: 0.55;
}
.gate-ring { stroke: var(--brand-blue-hairline); stroke-width: 1; }
.gate-ring.dashed { stroke-dasharray: 2 6; }

.gate-hero {
  position: relative;
  z-index: 2;
  text-align: center;
  margin: 24px auto 32px;
  max-width: 760px;
}
.gate-hero .eyebrow {
  margin-bottom: 14px;
}
.gate-hero h1 {
  font-family: 'Inter','SF Pro Display','Segoe UI Variable Display','Segoe UI',system-ui,-apple-system,sans-serif;
  font-size: 3.25rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
  margin: 0 0 16px;
}
.gate-hero .lede {
  max-width: 640px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--vscode-descriptionForeground);
}

/* Stat strip — enterprise trust signal */
.stat-strip {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 0;
  margin: 0 auto 36px;
  max-width: 720px;
  padding: 22px 12px;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-value {
  font-family: 'Inter','SF Pro Display','Segoe UI Variable Display','Segoe UI',system-ui,-apple-system,sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--vscode-foreground);
}
.stat-value small {
  font-size: 0.55em;
  font-weight: 700;
  margin-left: 2px;
  color: var(--vscode-descriptionForeground);
}
.stat-value.stat-check { color: var(--brand-green); }
.stat-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground);
}
.stat-divider {
  width: 1px;
  height: 36px;
  background: var(--hairline);
}
@media (max-width: 720px) {
  .stat-strip { grid-template-columns: 1fr 1fr; gap: 18px 0; }
  .stat-divider { display: none; }
}

/* Role cards */
.persona-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
@media (max-width: 720px) { .persona-grid { grid-template-columns: 1fr; } }
.persona-card {
  position: relative;
  color: var(--vscode-foreground);
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: 16px;
  padding: 24px 28px 64px;
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: 20px;
  row-gap: 6px;
  align-items: start;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.persona-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--brand-blue-soft) 0%, transparent 55%);
  opacity: 0;
  transition: opacity 160ms ease;
  pointer-events: none;
}
.persona-card:hover {
  border-color: var(--brand-blue-hairline);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.persona-card:hover::before { opacity: 1; }
.persona-card:hover .persona-arrow { transform: translateX(3px); }
.persona-card:focus-visible {
  outline: 2px solid var(--brand-blue);
  outline-offset: 3px;
}
.persona-card.is-recommended {
  border-color: var(--brand-green-hairline);
}
.persona-card.is-recommended::before {
  background: linear-gradient(135deg, var(--brand-green-soft) 0%, transparent 55%);
}
.persona-card.is-recommended:hover { border-color: var(--brand-green-hairline); }

.persona-avatar {
  grid-row: 1 / span 3;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1B96FF, var(--brand-blue) 60%, var(--brand-blue-deep));
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px rgba(1, 118, 211, 0.25);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.persona-avatar svg {
  width: 28px;
  height: 28px;
  color: #fff;
}
.persona-card.is-recommended .persona-avatar {
  background: linear-gradient(135deg, var(--brand-green-bright), var(--brand-green));
  box-shadow: 0 4px 12px rgba(26, 135, 84, 0.30);
}
.persona-card h3 {
  margin: 0;
  font-size: 1.10rem;
  font-weight: 700;
  line-height: 1.3;
  position: relative;
  z-index: 1;
}
.persona-card .tagline {
  color: var(--brand-blue);
  font-size: 0.86rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}
.persona-card.is-recommended .tagline { color: var(--brand-green); }
.persona-card .desc {
  color: var(--vscode-foreground);
  opacity: 0.78;
  font-size: 0.88rem;
  line-height: 1.55;
  margin: 10px 0 0;
  grid-column: 2;
  position: relative;
  z-index: 1;
}
.persona-meta {
  position: absolute;
  left: 28px;
  bottom: 26px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brand-green);
  z-index: 1;
}
.persona-arrow {
  position: absolute;
  right: 22px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--brand-blue);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 10px rgba(1, 118, 211, 0.30);
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  z-index: 1;
}
.persona-arrow svg { color: #fff; }
.persona-card:hover .persona-arrow {
  transform: translateX(3px);
  box-shadow: 0 6px 14px rgba(1, 118, 211, 0.40);
}
.persona-card.is-recommended .persona-arrow {
  background: var(--brand-green);
  box-shadow: 0 4px 10px rgba(26, 135, 84, 0.30);
}
.persona-card.is-recommended:hover .persona-arrow {
  box-shadow: 0 6px 14px rgba(26, 135, 84, 0.40);
}
.persona-new-pill {
  position: absolute;
  top: 22px;
  right: 22px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  background: var(--brand-green-soft);
  color: var(--brand-green);
  border: 1px solid var(--brand-green-hairline);
  z-index: 1;
}

/* Bottom CTA strip */
.gate-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 28px;
  border-radius: 16px;
  background: linear-gradient(90deg, var(--brand-blue), var(--brand-blue-deep));
  color: #fff;
  flex-wrap: wrap;
  box-shadow: 0 6px 20px rgba(1, 118, 211, 0.20);
}
.gate-cta__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gate-cta__copy strong {
  font-size: 1.05rem;
  font-weight: 700;
}
.gate-cta__copy span {
  font-size: 0.85rem;
  opacity: 0.85;
}
/* Scoped under .gate-cta to win against the generic button.ghost:hover
   rule above, which would otherwise force the label back to brand-blue
   on a brand-blue background. */
.gate-cta .cta-pill,
.gate-cta button.ghost.cta-pill {
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  padding: 9px 18px;
  font-weight: 600;
  font-size: 0.86rem;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}
.gate-cta .cta-pill:hover,
.gate-cta button.ghost.cta-pill:hover,
.gate-cta button.ghost.cta-pill:focus-visible {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.85);
  color: #FFFFFF;
}

/* ─── Dashboard ─────────────────────────────────────── */
#dashboard {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 32px 48px;
}
.dashboard-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 32px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.dashboard-hero h1 {
  font-size: 1.7rem;
  font-weight: 600;
  margin: 0;
  max-width: 560px;
}
.progress-block {
  flex: 1;
  min-width: 240px;
  max-width: 340px;
}
.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.82rem;
  font-weight: 500;
  margin-bottom: 8px;
}
.progress-track {
  height: 8px;
  border-radius: 999px;
  background: var(--brand-blue-soft);
  overflow: hidden;
  border: 1px solid var(--brand-blue-hairline);
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #1B96FF, var(--brand-blue) 60%, var(--brand-blue-deep));
  transition: width 240ms cubic-bezier(0.4, 0, 0.2, 1);
}

.layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  gap: 32px;
  align-items: start;
}
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

/* ─── Sidebar ───────────────────────────────────────── */
.sidebar {
  position: sticky;
  top: 80px;
  background: var(--surface-elevated);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: 16px;
}
.sidebar-title {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--vscode-descriptionForeground);
  padding: 0 6px 10px;
}
.step-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.step-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  color: var(--vscode-foreground);
  transition: background 120ms ease, color 120ms ease;
}
.step-item:hover { background: var(--brand-blue-soft); }
.step-item.active {
  background: var(--brand-blue-soft);
  border-color: var(--brand-blue-hairline);
}
.step-item.active::before {
  content: "";
  position: absolute;
  left: -16px;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background: var(--brand-blue);
  border-radius: 0 3px 3px 0;
}
.step-item .status {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
  margin-top: 1px;
  background: var(--vscode-badge-background, var(--brand-blue-soft));
  color: var(--vscode-badge-foreground, var(--brand-blue));
  border: 1px solid var(--hairline);
}
.step-item[data-status="done"] .status {
  background: var(--brand-blue);
  color: #fff;
  border-color: var(--brand-blue);
}
.step-item[data-status="in-progress"] .status {
  background: #fff;
  color: var(--brand-blue);
  border-color: var(--brand-blue);
}
.step-item[data-status="skipped"] .status {
  background: transparent;
  color: var(--vscode-descriptionForeground);
}
.step-item[data-status="locked"] .status {
  background: transparent;
  color: var(--vscode-descriptionForeground);
  border-style: dashed;
}
.step-item.locked { cursor: not-allowed; opacity: 0.55; }
.step-item.locked:hover { background: transparent; }
.step-item.locked .label { color: var(--vscode-descriptionForeground); }
.step-item .label { font-size: 0.92rem; line-height: 1.35; min-width: 0; }
.step-item .label .title { font-weight: 500; }
.step-item .label small {
  display: block;
  color: var(--vscode-descriptionForeground);
  font-size: 0.74rem;
  margin-top: 2px;
  font-weight: 400;
}

/* ─── Step card ─────────────────────────────────────── */
.content { min-width: 0; }
.step-card {
  position: relative;
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.step-card__rail {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #1B96FF, var(--brand-blue) 50%, var(--brand-blue-deep));
}
.step-card__header {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 18px;
  align-items: start;
  margin-bottom: 6px;
}
.step-number {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1B96FF, var(--brand-blue) 60%, var(--brand-blue-deep));
  color: #fff;
  display: grid;
  place-items: center;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  box-shadow: var(--shadow-sm);
}
.step-card__title-block { min-width: 0; }
.step-position {
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--brand-blue);
  margin: 0 0 4px;
  display: block;
}
.step-card__title-block h2 {
  margin: 0 0 6px;
  font-size: 1.45rem;
  font-weight: 600;
  line-height: 1.25;
}
.step-card__title-block p {
  margin: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 0.95rem;
  line-height: 1.55;
}
.step-card__actions {
  margin-top: 22px;
  padding: 14px 16px;
  background: var(--brand-blue-soft);
  border: 1px solid var(--brand-blue-hairline);
  border-radius: var(--radius-md);
}
.step-card__section-label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--brand-blue-deep);
  margin-bottom: 10px;
}
.step-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.step-actions button { min-height: 34px; }
.step-card__body {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid var(--hairline);
}

/* ─── Markdown body ─────────────────────────────────── */
.markdown-body {
  line-height: 1.65;
  font-size: 0.95rem;
  max-width: 720px;
}
.markdown-body > *:first-child { margin-top: 0; }
.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  margin-top: 1.6em;
  margin-bottom: 0.5em;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.markdown-body h1 { font-size: 1.25rem; }
.markdown-body h2 {
  font-size: 1.1rem;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--hairline);
}
.markdown-body h3 { font-size: 1rem; color: var(--brand-blue-deep); }
.markdown-body p { margin: 0 0 0.9em; }
.markdown-body code {
  background: var(--brand-blue-soft);
  color: var(--brand-blue-deep);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.86em;
  border: 1px solid var(--brand-blue-hairline);
}
.markdown-body pre {
  background: var(--vscode-textCodeBlock-background, rgba(127,127,127,0.10));
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  border: 1px solid var(--hairline);
  margin: 0 0 1em;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  border: none;
  color: var(--vscode-foreground);
  font-size: 0.86em;
}
.markdown-body a { color: var(--brand-blue); text-decoration: none; border-bottom: 1px solid var(--brand-blue-hairline); }
.markdown-body a:hover { color: var(--brand-blue-deep); border-bottom-color: var(--brand-blue); }
.markdown-body hr { border: none; border-top: 1px solid var(--hairline); margin: 24px 0; }
.markdown-body ul, .markdown-body ol { padding-left: 1.4em; }
.markdown-body li { margin: 0.25em 0; }
.markdown-body blockquote {
  margin: 0 0 1em;
  padding: 10px 16px;
  border-left: 3px solid var(--brand-blue);
  background: var(--brand-blue-soft);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--vscode-foreground);
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 1em;
  font-size: 0.9em;
}
.markdown-body th, .markdown-body td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--hairline);
}
.markdown-body th {
  background: var(--brand-blue-soft);
  color: var(--brand-blue-deep);
  font-weight: 600;
}
.markdown-body strong { font-weight: 600; }

/* ─── Bottom nav ───────────────────────────────────── */
.step-nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface-card);
  color: var(--vscode-foreground);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  min-height: 56px;
  width: 100%;
  font-weight: 500;
}
.nav-btn:hover:not([disabled]) {
  border-color: var(--brand-blue-hairline);
  background: var(--brand-blue-soft);
  color: var(--vscode-foreground);
}
.nav-btn[disabled] { opacity: 0.4; cursor: not-allowed; }
.nav-btn.next { justify-content: flex-end; }
.nav-btn.next.primary {
  background: var(--brand-blue);
  color: #fff;
  border-color: var(--brand-blue);
}
.nav-btn.next.primary:hover:not([disabled]) {
  background: var(--brand-blue-deep);
  color: #fff;
}
.nav-btn .nav-text { display: flex; flex-direction: column; min-width: 0; }
.nav-btn .nav-text.right { text-align: right; }
.nav-btn .nav-text small {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  opacity: 0.85;
}
.nav-btn .nav-text span:not(small) {
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-btn .nav-chevron {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}
.nav-spacer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.link-btn {
  background: transparent;
  color: var(--brand-blue);
  border: none;
  padding: 4px 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  border-radius: 4px;
}
.link-btn:hover { background: var(--brand-blue-soft); color: var(--brand-blue-deep); }
.kbd-hint { font-size: 0.75rem; }
.kbd-hint kbd {
  background: var(--vscode-keybindingLabel-background, rgba(127,127,127,0.18));
  border: 1px solid var(--vscode-keybindingLabel-border, rgba(127,127,127,0.3));
  border-radius: 3px;
  padding: 1px 5px;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.72rem;
}
@media (max-width: 720px) {
  .step-nav { grid-template-columns: 1fr; }
  .nav-btn { width: 100%; }
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
  const stepNumber = document.getElementById('step-number');
  const stepPosition = document.getElementById('step-position');
  const stepTitle = document.getElementById('step-title');
  const stepSummary = document.getElementById('step-summary');
  const stepActions = document.getElementById('step-actions');
  const stepActionsWrap = document.getElementById('step-actions-wrap');
  const stepBody = document.getElementById('step-body');
  const stepCard = document.querySelector('.step-card');
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
  const btnMarkAllDone = document.getElementById('btn-mark-all-done');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnCtaMarkAllDone = document.getElementById('btn-cta-mark-all-done');

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
    prevTitleEl.textContent = prev ? prev.title : 'Start of walkthrough';
    nextTitleEl.textContent = next ? next.title : 'Finish walkthrough';
    btnPrev.disabled = !prev;
    if (btnPrevTop) btnPrevTop.disabled = !prev;
  }

  // Per-persona icon SVGs. Stroke uses currentColor so the avatar tile's
  // foreground (white inside the gradient square) drives them.
  const PERSONA_ICONS = {
    'storefront':
      '<svg viewBox="0 0 28 24" width="28" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="0" y="0" width="28" height="22" rx="2.5"/><line x1="0" y1="6" x2="28" y2="6"/><circle cx="3.5" cy="3" r="0.9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="3" r="0.9" fill="currentColor" stroke="none"/></svg>',
    'api-integration':
      '<svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 0 C 7 0 6 2 6 6 V 11 C 6 14 4 14 0 14 C 4 14 6 14 6 17 V 22 C 6 26 7 28 11 28"/><path d="M17 0 C 21 0 22 2 22 6 V 11 C 22 14 24 14 28 14 C 24 14 22 14 22 17 V 22 C 22 26 21 28 17 28"/></svg>',
    'devops-release':
      '<svg viewBox="0 0 28 30" width="26" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 0 C 18 4 22 12 22 18 L 22 26 L 14 30 L 6 26 L 6 18 C 6 12 10 4 14 0 Z"/><circle cx="14" cy="14" r="3"/><path d="M6 22 L 2 26 L 6 30"/><path d="M22 22 L 26 26 L 22 30"/></svg>',
    'ai-augmented':
      '<svg viewBox="0 0 26 26" width="26" height="26"><path d="M13 0 L16.5 10 L26 13 L16.5 16 L13 26 L9.5 16 L0 13 L9.5 10 Z" fill="currentColor"/><circle cx="22" cy="3" r="1.6" fill="currentColor"/><circle cx="3" cy="22" r="1.4" fill="currentColor" opacity="0.85"/></svg>',
  };

  function renderPersonaGate(personas) {
    personaCards.innerHTML = '';
    personas.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'persona-card' + (p.recommended ? ' is-recommended' : '');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', p.label);
      const newPill = p.recommended ? '<span class="persona-new-pill">NEW</span>' : '';
      // Generic fallback icon (a small square cluster) for any persona that
      // doesn't have a dedicated SVG yet — still icon-based, never letters.
      const fallbackIcon =
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>';
      const iconHtml = PERSONA_ICONS[p.id] || fallbackIcon;
      card.innerHTML = [
        '<span class="persona-avatar" aria-hidden="true">' + iconHtml + '</span>',
        '<h3></h3>',
        '<p class="tagline"></p>',
        '<p class="desc"></p>',
        '<span class="persona-meta"></span>',
        '<span class="persona-arrow" aria-hidden="true"><span>Start</span><svg width="14" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="0" y1="7" x2="18" y2="7"/><polyline points="13 2 18 7 13 12"/></svg></span>',
        newPill,
      ].join('');
      card.querySelector('h3').textContent = p.label;
      card.querySelector('.tagline').textContent = p.tagline;
      card.querySelector('.desc').textContent = p.description;
      card.querySelector('.persona-meta').textContent =
        p.stepCount + ' phases · ~' + p.estimatedMinutes + ' min';
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
      stepNumber.textContent = '';
      stepPosition.textContent = '';
      stepTitle.textContent = '';
      stepSummary.textContent = '';
      stepActions.innerHTML = '';
      stepActionsWrap.hidden = true;
      stepBody.innerHTML = '';
      return;
    }
    stepNumber.textContent = String(idx + 1);
    stepPosition.textContent = 'Step ' + (idx + 1) + ' of ' + total;
    stepTitle.textContent = step.title;
    stepSummary.textContent = step.summary;
    stepBody.innerHTML = step.html;
    stepActions.innerHTML = '';
    if (step.actions && step.actions.length > 0) {
      stepActionsWrap.hidden = false;
      step.actions.forEach((action) => {
        const btn = document.createElement('button');
        if (!action.primary) btn.className = 'ghost';
        btn.textContent = action.label;
        btn.addEventListener('click', () =>
          post({type: 'runAction', command: action.command, args: action.args, stepId: step.id}),
        );
        stepActions.appendChild(btn);
      });
    } else {
      stepActionsWrap.hidden = true;
    }
    // Scroll the card (not the body) so step-header stays visible after navigation.
    if (stepCard && typeof stepCard.scrollIntoView === 'function') {
      stepCard.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
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
  if (btnPrevTop) btnPrevTop.addEventListener('click', () => post({type: 'goPrev'}));
  if (btnNextTop) btnNextTop.addEventListener('click', () => post({type: 'goNext'}));
  btnChangePersona.addEventListener('click', () => post({type: 'changePersona'}));
  btnReset.addEventListener('click', () => post({type: 'reset'}));
  if (btnMarkAllDone) {
    btnMarkAllDone.addEventListener('click', () =>
      post({type: 'runAction', command: 'b2c-dx.walkthrough.markAllDone'}),
    );
  }
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => post({type: 'runAction', command: 'b2c-dx.theme.toggle'}));
  }
  if (btnCtaMarkAllDone) {
    btnCtaMarkAllDone.addEventListener('click', () =>
      post({type: 'runAction', command: 'b2c-dx.walkthrough.markAllDone'}),
    );
  }

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
