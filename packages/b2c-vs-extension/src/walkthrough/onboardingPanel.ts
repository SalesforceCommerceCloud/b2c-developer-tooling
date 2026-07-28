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
import {detectTools, generateInstallCliHtml, ToolDetectionResult} from './toolDetection.js';
import {detectAllTargets, generateAiSkillsHtml} from './aiSkillsContent.js';
import {
  detectStepConfigurations,
  getDetectionForStep,
  readDeployContext,
  DetectionSummary,
  StepDetection,
} from './stepDetection.js';
import {findCartridges, listCodeVersions, type CodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CExtensionConfig} from '../config-provider.js';

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
  | {type: 'ready'}
  | {type: 'aiSkills.installSkills'; ide: string}
  | {type: 'aiSkills.runCommand'; cmd: string; label: string}
  | {type: 'aiSkills.recheck'};

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
  /** Optional per-step detection chip ("1 configuration detected"). */
  detection?: {label: string; matchedNames: string[]} | null;
}

interface ViewState {
  persona: PersonaView | null;
  personas: PersonaView[];
  steps: StepView[];
  activeStepId: string | null;
  setupInstance: string | null;
}

type DeployedCartridgesResult =
  | {kind: 'ok'; names: string[]; source: 'ocapi' | 'webdav'}
  | {kind: 'no-provider'}
  | {kind: 'no-instance'; reason?: string}
  | {kind: 'no-code-version'}
  | {kind: 'error'; reason: string};

export class OnboardingPanel {
  private static current: OnboardingPanel | undefined;

  static show(
    context: vscode.ExtensionContext,
    store: OnboardingStateStore,
    log: vscode.OutputChannel,
    getConfigProvider?: () => B2CExtensionConfig | null,
  ): void {
    if (OnboardingPanel.current) {
      OnboardingPanel.current.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel('b2c-dx.onboarding', 'B2C DX: Get Started', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(context.extensionPath)],
    });
    OnboardingPanel.current = new OnboardingPanel(context, store, log, panel, getConfigProvider);
  }

  private readonly disposables: vscode.Disposable[] = [];
  private activeStepId: string | null = null;

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly store: OnboardingStateStore,
    private readonly log: vscode.OutputChannel,
    private readonly panel: vscode.WebviewPanel,
    private readonly getConfigProvider?: () => B2CExtensionConfig | null,
  ) {
    this.panel.webview.html = this.renderShell();
    this.disposables.push(
      this.panel.onDidDispose(() => this.dispose()),
      this.panel.webview.onDidReceiveMessage((msg) => this.handleMessage(msg as InboundMessage)),
      this.store.onDidChange(() => void this.refresh()),
      // Re-check whenever the user returns to the panel — covers the case where
      // they ran an install in the terminal and switched back.
      this.panel.onDidChangeViewState((e) => {
        if (e.webviewPanel.active) {
          if (this.activeStepId === 'ai-skills') {
            this.aiSkillsCache = null;
          }
          void this.refresh();
        }
      }),
    );
  }

  /** Cached AI-skills detection result, invalidated on install actions. */
  private aiSkillsCache: import('./aiSkillsContent.js').DetectedTarget[] | null = null;
  /** Tracks the in-flight watcher so multiple installs don't stack. */
  private aiSkillsWatcher: NodeJS.Timeout | null = null;
  /** Disposables for terminal-shell-execution and close listeners on the in-flight install. */
  private aiSkillsTermDisposables: vscode.Disposable[] = [];

  /**
   * Subscribes to terminal events for the install terminal so we can
   * deterministically refresh as soon as the install command exits — much
   * more responsive than polling.
   */
  private watchTerminalForAiSkills(terminal: vscode.Terminal): void {
    // Clear any previous subscriptions; only one in-flight install at a time.
    this.aiSkillsTermDisposables.forEach((d) => d.dispose());
    this.aiSkillsTermDisposables = [];

    // Stronger signal: shell-execution end (proposed but stable in 1.93+).
    // Falls back silently on older runtimes via try/catch.
    try {
      const api = vscode.window as unknown as {
        onDidEndTerminalShellExecution?: (listener: (e: {terminal: vscode.Terminal}) => void) => vscode.Disposable;
      };
      if (typeof api.onDidEndTerminalShellExecution === 'function') {
        const sub = api.onDidEndTerminalShellExecution((e) => {
          if (e.terminal === terminal) {
            this.aiSkillsCache = null;
            void this.refresh();
          }
        });
        this.aiSkillsTermDisposables.push(sub);
      }
    } catch {
      // ignore
    }

    // Fallback: when the user closes the terminal, refresh.
    const closeSub = vscode.window.onDidCloseTerminal((closed) => {
      if (closed === terminal) {
        this.aiSkillsCache = null;
        void this.refresh();
        this.aiSkillsTermDisposables.forEach((d) => d.dispose());
        this.aiSkillsTermDisposables = [];
      }
    });
    this.aiSkillsTermDisposables.push(closeSub);
  }

  /**
   * After kicking off an install in the terminal we don't get a deterministic
   * completion signal, so we poll the filesystem every 2s for up to ~60s.
   * As soon as detection produces a different snapshot we refresh and stop.
   */
  private startAiSkillsWatcher(): void {
    if (this.aiSkillsWatcher) clearInterval(this.aiSkillsWatcher);
    const before = JSON.stringify(this.aiSkillsCache?.map((t) => ({id: t.id, status: t.status})) ?? []);
    let elapsed = 0;
    const TICK_MS = 2000;
    const MAX_MS = 60000;
    this.aiSkillsWatcher = setInterval(async () => {
      elapsed += TICK_MS;
      try {
        const {detectAllTargets} = await import('./aiSkillsContent.js');
        const fresh = await detectAllTargets();
        const snapshot = JSON.stringify(fresh.map((t) => ({id: t.id, status: t.status})));
        if (snapshot !== before) {
          this.aiSkillsCache = fresh;
          if (this.aiSkillsWatcher) {
            clearInterval(this.aiSkillsWatcher);
            this.aiSkillsWatcher = null;
          }
          await this.refresh();
          return;
        }
      } catch {
        // best-effort — keep polling
      }
      if (elapsed >= MAX_MS && this.aiSkillsWatcher) {
        clearInterval(this.aiSkillsWatcher);
        this.aiSkillsWatcher = null;
      }
    }, TICK_MS);
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
          // Setup commands mutate workspaceState; ensure the chip + Start Over
          // button re-render once the action returns.
          if (typeof msg.command === 'string' && msg.command.startsWith('b2c-dx.setup.')) {
            await this.refresh();
          }
          // CLI actions (install, recheck) should re-detect tools and refresh.
          if (typeof msg.command === 'string' && msg.command.startsWith('b2c-dx.cli.')) {
            this.invalidateToolDetection();
            await this.refresh();
          }
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
        case 'aiSkills.installSkills': {
          // Open a terminal preloaded with `b2c setup skills b2c --ide <ide>`.
          // We don't auto-run — the user reviews it and presses Enter.
          const ide = msg.ide.replace(/[^a-z0-9-]/gi, '');
          if (!ide) return;
          const term = vscode.window.createTerminal({name: `B2C DX — Skills (${ide})`});
          term.show();
          term.sendText(`b2c setup skills b2c --ide ${ide}`, false);
          this.watchTerminalForAiSkills(term);
          this.startAiSkillsWatcher();
          return;
        }
        case 'aiSkills.runCommand': {
          const safeLabel = msg.label.replace(/[^\w\s—()-]/g, '').slice(0, 40) || 'Install';
          const term = vscode.window.createTerminal({name: `B2C DX — ${safeLabel}`});
          term.show();
          term.sendText(msg.cmd, false);
          this.watchTerminalForAiSkills(term);
          this.startAiSkillsWatcher();
          return;
        }
        case 'aiSkills.recheck': {
          this.aiSkillsCache = null;
          await this.refresh();
          return;
        }
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
    // Per-persona time estimates (minutes). Tuned from real walkthrough runs;
    // these override the previous step-count × 3.5 formula which over-counted
    // assistive UI steps (welcome, next-steps) that take seconds, not minutes.
    const PERSONA_MINUTES: Record<string, number> = {
      storefront: 8,
      'api-integration': 10,
      'devops-release': 6,
      'ai-augmented': 12,
    };
    const estimateMinutes = (id: string, stepCount: number): number =>
      PERSONA_MINUTES[id] ?? Math.max(5, Math.round((stepCount * 1.25) / 1) * 1);

    // The "ai-augmented" persona gets a `recommended` flag so the gate
    // highlights it as the new path.
    const personas: PersonaView[] = listPersonas().map((p) => ({
      id: p.id,
      label: p.label,
      tagline: p.tagline,
      description: p.description,
      stepCount: p.stepIds.length,
      estimatedMinutes: estimateMinutes(p.id, p.stepIds.length),
      recommended: p.id === 'ai-augmented',
    }));
    const personaId = this.store.getPersona();
    const personaDef = getPersona(personaId);
    const setupInstance = this.context.workspaceState.get<string>('b2c-dx.setup.activeInstance') ?? null;
    if (!personaDef) {
      return {persona: null, personas, steps: [], activeStepId: null, setupInstance};
    }
    const defs = resolveSteps(personaDef.id);
    const workspaceRoot =
      this.getConfigProvider?.()?.getWorkingDirectory() || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const detectionSummary = await detectStepConfigurations(workspaceRoot);
    const rawSteps = await Promise.all(defs.map((def) => this.buildStepView(personaDef.id, def, detectionSummary)));
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
      estimatedMinutes: estimateMinutes(personaDef.id, personaDef.stepIds.length),
    };
    return {
      persona: activePersonaView,
      personas,
      steps,
      activeStepId: this.activeStepId,
      setupInstance,
    };
  }

  private toolDetectionCache: ToolDetectionResult | null = null;

  private async buildStepView(
    personaId: PersonaId,
    def: StepDefinition,
    detectionSummary?: DetectionSummary,
  ): Promise<StepView> {
    const record = this.store.getStep(personaId, def.id);
    let html: string;
    let actions = def.actions ?? [];

    if (def.id === 'install-cli') {
      const result = await this.getToolDetection();
      html = generateInstallCliHtml(result);
      actions = this.buildInstallCliActions(result);
    } else if (def.id === 'ai-skills') {
      if (!this.aiSkillsCache) {
        this.aiSkillsCache = await detectAllTargets();
      }
      html = generateAiSkillsHtml(this.aiSkillsCache);
    } else {
      const markdown = await this.readMarkdown(def.markdown);
      html = renderMarkdown(markdown);
      // For the deploy step, prepend a banner showing exactly what will be
      // deployed when the user clicks "Deploy Recommended Cartridge", and
      // gray out the primary action if the recommended cartridge is already
      // present in the active code version.
      if (def.id === 'deploy-code') {
        const result = await this.buildDeployBanner();
        if (result) {
          html = result.html + html;
          if (result.alreadyDeployed && actions.length > 0) {
            actions = actions.map((a) =>
              a.command === 'b2c-dx.codeSync.deployOne'
                ? {
                    ...a,
                    label: `Already Deployed${result.cartridgeName ? ` · ${result.cartridgeName}` : ''}`,
                    disabled: true,
                    tooltip: 'This cartridge is already in the active code version.',
                  }
                : a,
            );
          }
        }
      }
    }

    let detection: StepView['detection'] = null;
    if (detectionSummary) {
      const found: StepDetection | null = getDetectionForStep(def.id, detectionSummary);
      if (found && found.matchCount > 0 && found.label) {
        detection = {label: found.label, matchedNames: found.matchedNames ?? []};
      }
    }

    return {
      id: def.id,
      title: def.title,
      summary: def.summary,
      status: record?.status ?? 'available',
      actions,
      html,
      detection,
    };
  }

  /** Cached list of deployed cartridges per code-version, keyed by `host|version`. */
  private deployedCartridgesCache = new Map<string, {result: DeployedCartridgesResult; fetchedAt: number}>();

  /**
   * Fetch the cartridges currently deployed to the active code version.
   * Tries OCAPI `/code_versions` first (richer data) and falls back to a
   * WebDAV PROPFIND on `Cartridges/<codeVersion>/` (which is what the deploy
   * command itself uses, so credentials are usually already set up).
   *
   * Returns a tagged result so the banner can show a specific reason instead
   * of a generic "OAuth not configured" message.
   *
   * Cached for 30 seconds to avoid hammering the network on every refresh.
   */
  private async fetchDeployedCartridges(codeVersion: string | undefined): Promise<DeployedCartridgesResult> {
    const provider = this.getConfigProvider?.();
    if (!provider) return {kind: 'no-provider'};
    const instance = provider.getInstance();
    if (!instance) {
      const err = provider.getConfigError?.();
      return {kind: 'no-instance', reason: err ?? undefined};
    }
    if (!codeVersion) return {kind: 'no-code-version'};

    const host = provider.getConfig()?.values.hostname ?? 'unknown';
    const cacheKey = `${host}|${codeVersion}`;
    const cached = this.deployedCartridgesCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < 30_000) return cached.result;

    let ocapiError: string | undefined;

    // 1) Try OCAPI — gives back the canonical list directly.
    try {
      const versions: CodeVersion[] = await listCodeVersions(instance);
      const target = versions.find((v) => v.id === codeVersion);
      if (target) {
        const names = target.cartridges ?? [];
        const result: DeployedCartridgesResult = {kind: 'ok', names, source: 'ocapi'};
        this.deployedCartridgesCache.set(cacheKey, {result, fetchedAt: Date.now()});
        return result;
      }
      ocapiError = `code version "${codeVersion}" not found on instance`;
    } catch (err) {
      ocapiError = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[onboarding] OCAPI listCodeVersions failed: ${ocapiError}`);
    }

    // 2) Fallback to WebDAV — same auth path as the deploy command itself.
    try {
      const entries = await instance.webdav.propfind(`Cartridges/${codeVersion}`, '1');
      const names = entries
        .filter((e) => e.isCollection && e.displayName && e.displayName !== codeVersion)
        .map((e) => e.displayName as string);
      const result: DeployedCartridgesResult = {kind: 'ok', names, source: 'webdav'};
      this.deployedCartridgesCache.set(cacheKey, {result, fetchedAt: Date.now()});
      return result;
    } catch (err) {
      const webdavError = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[onboarding] WebDAV propfind failed: ${webdavError}`);
      return {kind: 'error', reason: ocapiError ?? webdavError};
    }
  }

  /**
   * Builds a "what will be deployed" + "already deployed" banner for the
   * deploy-code step. Returns the HTML plus a flag indicating whether the
   * recommended cartridge is already in the active code version (so the
   * caller can disable the primary action).
   */
  private async buildDeployBanner(): Promise<{html: string; alreadyDeployed: boolean; cartridgeName?: string} | null> {
    const workspaceRoot =
      this.getConfigProvider?.()?.getWorkingDirectory() || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const ctx = await readDeployContext(workspaceRoot);
    const lastScaffolded = this.context.workspaceState.get<string>('b2c-dx.scaffold.lastCartridgeName');

    // Mirror the resolution logic in createDeployOneCommand:
    //   1. If the last-scaffolded cartridge still exists in the workspace, use it.
    //   2. Otherwise, if there's only one cartridge, that's what gets deployed.
    //   3. Otherwise the user is shown a picker (we can't predict the choice).
    let resolvedCartridge: string | undefined;
    let cartridgeSource: 'scaffolded' | 'only' | 'picker' | 'none' = 'none';
    if (workspaceRoot) {
      try {
        const cartridges = findCartridges(workspaceRoot);
        if (lastScaffolded && cartridges.some((c) => c.name === lastScaffolded)) {
          resolvedCartridge = lastScaffolded;
          cartridgeSource = 'scaffolded';
        } else if (cartridges.length === 1) {
          resolvedCartridge = cartridges[0].name;
          cartridgeSource = 'only';
        } else if (cartridges.length > 1) {
          cartridgeSource = 'picker';
        }
      } catch {
        // best-effort — leave as 'none'
      }
    }

    // Nothing to show if every field is empty.
    if (!resolvedCartridge && cartridgeSource === 'none' && !ctx.hostname && !ctx.codeVersion) return null;

    const escape = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
      );
    const fmt = (v?: string) =>
      v ? `<code>${escape(v)}</code>` : `<span class="deploy-banner__missing">not set</span>`;

    const sourceHint =
      cartridgeSource === 'scaffolded'
        ? '<span class="deploy-banner__hint">recently scaffolded</span>'
        : cartridgeSource === 'only'
          ? '<span class="deploy-banner__hint">only cartridge in workspace</span>'
          : '';
    const cartridgeLabel = resolvedCartridge
      ? `<code>${escape(resolvedCartridge)}</code> ${sourceHint}`
      : cartridgeSource === 'picker'
        ? `<span class="deploy-banner__missing">multiple found — you'll be asked to pick one</span>`
        : `<span class="deploy-banner__missing">no cartridges found in workspace</span>`;

    const cartridgeReady = !!resolvedCartridge;
    const allReady = cartridgeReady && !!ctx.codeVersion && !!ctx.hostname;

    // Fetch deployed cartridges (best-effort — falls back gracefully).
    const deployedResult = await this.fetchDeployedCartridges(ctx.codeVersion);
    const deployedNames = deployedResult.kind === 'ok' ? deployedResult.names : [];
    const alreadyDeployed = !!(resolvedCartridge && deployedNames.includes(resolvedCartridge));

    const deployedSection = (() => {
      const folderIcon = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="6" y1="9" x2="10" y2="9"/></svg>`;
      const warnIcon = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="9"/><circle cx="8" cy="11" r="0.8" fill="currentColor"/></svg>`;

      if (deployedResult.kind === 'no-provider') {
        return `<div class="deploy-banner__row deploy-banner__row--full">
          ${warnIcon}
          <span class="deploy-banner__label">Deployed</span>
          <span class="deploy-banner__value deploy-banner__deployed">
            <span class="deploy-banner__missing">resolving connection…</span>
          </span>
        </div>`;
      }
      if (deployedResult.kind === 'no-instance') {
        const detail = deployedResult.reason ? ` — ${escape(deployedResult.reason)}` : '';
        return `<div class="deploy-banner__row deploy-banner__row--full">
          ${warnIcon}
          <span class="deploy-banner__label">Deployed</span>
          <span class="deploy-banner__value deploy-banner__deployed">
            <span class="deploy-banner__missing">no active B2C instance${detail}</span>
          </span>
        </div>`;
      }
      if (deployedResult.kind === 'no-code-version') {
        return `<div class="deploy-banner__row deploy-banner__row--full">
          ${warnIcon}
          <span class="deploy-banner__label">Deployed</span>
          <span class="deploy-banner__value deploy-banner__deployed">
            <span class="deploy-banner__missing">code-version not set in dw.json</span>
          </span>
        </div>`;
      }
      if (deployedResult.kind === 'error') {
        return `<div class="deploy-banner__row deploy-banner__row--full">
          ${warnIcon}
          <span class="deploy-banner__label">Deployed</span>
          <span class="deploy-banner__value deploy-banner__deployed">
            <span class="deploy-banner__missing">unable to query — ${escape(deployedResult.reason)}</span>
          </span>
        </div>`;
      }
      const names = deployedResult.names;
      if (names.length === 0) {
        return `<div class="deploy-banner__row deploy-banner__row--full">
          ${folderIcon}
          <span class="deploy-banner__label">Deployed</span>
          <span class="deploy-banner__value deploy-banner__deployed">
            <span class="deploy-banner__missing">no cartridges deployed yet</span>
          </span>
        </div>`;
      }
      const chips = names
        .map(
          (n) =>
            `<code class="${resolvedCartridge && n === resolvedCartridge ? 'deploy-banner__chip--match' : ''}">${escape(n)}</code>`,
        )
        .join('');
      return `<div class="deploy-banner__row deploy-banner__row--full">
        ${folderIcon}
        <span class="deploy-banner__label">Deployed <span class="deploy-banner__count">${names.length}</span></span>
        <span class="deploy-banner__value deploy-banner__deployed">${chips}</span>
      </div>`;
    })();

    const html = `<style>
      .deploy-banner {
        margin: 18px 0;
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--vscode-foreground) 18%, transparent);
        background: var(--surface-card, var(--vscode-editorWidget-background, var(--vscode-editor-background)));
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04);
      }
      .deploy-banner__header {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 12px 18px;
        background: color-mix(in srgb, #1A8754 8%, transparent);
        border-bottom: 1px solid color-mix(in srgb, #1A8754 18%, transparent);
        flex-wrap: wrap;
      }
      .deploy-banner__eyebrow {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em;
        font-weight: 700;
        color: var(--brand-green, #1A8754);
      }
      .deploy-banner__eyebrow svg { color: inherit; }
      .deploy-banner__status {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 2px 9px; border-radius: 999px;
        font-size: 0.7rem; font-weight: 700;
        white-space: nowrap;
      }
      .deploy-banner__status--ok {
        color: var(--brand-green, #1A8754);
        background: color-mix(in srgb, #1A8754 14%, transparent);
      }
      .deploy-banner__status--warn {
        color: #C77700;
        background: color-mix(in srgb, #C77700 14%, transparent);
      }
      .deploy-banner__status__dot {
        width: 6px; height: 6px; border-radius: 50%; background: currentColor;
      }
      .deploy-banner__rows {
        display: flex; flex-direction: column;
      }
      .deploy-banner__row {
        display: grid;
        grid-template-columns: 28px 110px 1fr;
        align-items: center;
        gap: 12px;
        padding: 12px 18px;
        border-top: 1px solid color-mix(in srgb, var(--vscode-foreground) 8%, transparent);
      }
      .deploy-banner__row:first-child { border-top: 0; }
      .deploy-banner__row svg {
        color: var(--vscode-descriptionForeground);
        opacity: 0.85;
      }
      .deploy-banner__label {
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--vscode-descriptionForeground);
      }
      .deploy-banner__value { font-size: 0.9rem; min-width: 0; }
      .deploy-banner__value code {
        font-family: var(--vscode-editor-font-family, ui-monospace, monospace);
        font-size: 0.86rem;
        background: color-mix(in srgb, var(--vscode-foreground) 10%, transparent);
        padding: 3px 10px;
        border-radius: 4px;
        border: 0;
        color: var(--vscode-foreground);
        font-weight: 500;
        word-break: break-all;
      }
      .deploy-banner__missing {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 0.84rem;
        font-style: italic;
        color: #C77700;
      }
      .deploy-banner__missing::before {
        content: '!';
        display: inline-flex; align-items: center; justify-content: center;
        width: 14px; height: 14px;
        border-radius: 50%;
        background: color-mix(in srgb, #C77700 18%, transparent);
        font-style: normal; font-weight: 700; font-size: 0.7rem;
      }
      .deploy-banner__hint {
        display: inline-block;
        margin-left: 10px;
        padding: 2px 9px;
        border-radius: 999px;
        background: color-mix(in srgb, #4A8BC2 14%, transparent);
        border: 1px solid color-mix(in srgb, #4A8BC2 28%, transparent);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: #2A6FAE;
      }
      .deploy-banner__row--full {
        align-items: flex-start;
      }
      .deploy-banner__deployed {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .deploy-banner__deployed code {
        font-size: 0.78rem;
      }
      .deploy-banner__chip--match {
        background: color-mix(in srgb, #1A8754 18%, transparent) !important;
        color: var(--brand-green, #1A8754) !important;
        font-weight: 600 !important;
      }
      .deploy-banner__count {
        display: inline-block;
        margin-left: 6px;
        padding: 1px 7px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--vscode-foreground) 12%, transparent);
        color: var(--vscode-foreground);
        font-size: 0.68rem;
        font-weight: 700;
      }
    </style>
    <section class="deploy-banner" aria-label="Deploy preview">
      <header class="deploy-banner__header">
        <span class="deploy-banner__eyebrow">
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z"/></svg>
          On click of "Deploy Recommended Cartridge"
        </span>
        <span class="deploy-banner__status deploy-banner__status--${alreadyDeployed ? 'ok' : allReady ? 'ok' : 'warn'}">
          <span class="deploy-banner__status__dot"></span>
          ${alreadyDeployed ? 'Already deployed' : allReady ? 'Ready to deploy' : 'Missing details'}
        </span>
      </header>
      <div class="deploy-banner__rows">
        <div class="deploy-banner__row">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><line x1="2" y1="6" x2="14" y2="6"/></svg>
          <span class="deploy-banner__label">Cartridge</span>
          <span class="deploy-banner__value">${cartridgeLabel}</span>
        </div>
        <div class="deploy-banner__row">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 4 1 8 5 12"/><polyline points="11 4 15 8 11 12"/><line x1="9" y1="2" x2="7" y2="14"/></svg>
          <span class="deploy-banner__label">Code version</span>
          <span class="deploy-banner__value">${fmt(ctx.codeVersion)}</span>
        </div>
        <div class="deploy-banner__row">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><line x1="2" y1="8" x2="14" y2="8"/><path d="M8 2 C 5 5, 5 11, 8 14 M8 2 C 11 5, 11 11, 8 14"/></svg>
          <span class="deploy-banner__label">Target host</span>
          <span class="deploy-banner__value">${fmt(ctx.hostname)}</span>
        </div>
        ${deployedSection}
      </div>
    </section>`;

    return {html, alreadyDeployed, cartridgeName: resolvedCartridge};
  }

  private async getToolDetection(): Promise<ToolDetectionResult> {
    if (!this.toolDetectionCache) {
      const cached = this.context.globalState.get<{version: string; fetchedAt: number}>(
        'b2c-dx.cli.latestVersionCache',
      );
      const latestVersion = cached?.version;
      this.toolDetectionCache = await detectTools(latestVersion);
    }
    return this.toolDetectionCache;
  }

  /** Invalidates cached detection so the next refresh re-detects. */
  invalidateToolDetection(): void {
    this.toolDetectionCache = null;
  }

  private buildInstallCliActions(result: ToolDetectionResult): StepAction[] {
    const actions: StepAction[] = [];

    if (!result.b2cCli.installed) {
      if (result.npm.installed) {
        actions.push({label: 'Install via npm', command: 'b2c-dx.cli.installNpm', primary: true});
      } else if (result.homebrew.installed) {
        actions.push({label: 'Install via Homebrew', command: 'b2c-dx.cli.installBrew', primary: true});
      }
      actions.push({label: 'Verify CLI', command: 'b2c-dx.cli.verify'});
      actions.push({label: 'Re-check', command: 'b2c-dx.cli.recheck'});
    } else if (result.b2cCliOutdated) {
      actions.push({label: 'Update CLI', command: 'b2c-dx.cli.update', primary: true});
      actions.push({label: 'Verify CLI', command: 'b2c-dx.cli.verify'});
      actions.push({label: 'Re-check', command: 'b2c-dx.cli.recheck'});
    } else {
      actions.push({label: 'Verify CLI', command: 'b2c-dx.cli.verify', primary: true});
      actions.push({label: 'Update CLI', command: 'b2c-dx.cli.update'});
      actions.push({label: 'Re-check', command: 'b2c-dx.cli.recheck'});
    }

    return actions;
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
      <span class="setup-chip" id="setup-chip" hidden title="dw.json instance currently in use for this session">
        <span class="setup-chip__dot" aria-hidden="true"></span>
        <span class="setup-chip__text">dw.json · <span id="setup-chip-name"></span></span>
      </span>
    </div>
    <div class="brand-actions">
      <button class="ghost icon-only" id="btn-theme-toggle" title="Toggle light / dark theme" aria-label="Toggle light or dark theme">
        <span class="theme-glyph" aria-hidden="true">◐</span>
      </button>
      <button class="ghost" id="btn-start-over" hidden title="Clear the active session and start the setup flow over">Start over</button>
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
      <h1>Pick your starting role</h1>
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
        <span class="stat-value">~10<small>min</small></span>
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
            <div class="step-card__actions-header">
              <span class="step-card__section-label">Quick actions</span>
              <span class="detection-chip" id="step-detection-chip" hidden>
                <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>
                <span id="step-detection-label"></span>
              </span>
            </div>
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
    if (this.aiSkillsWatcher) {
      clearInterval(this.aiSkillsWatcher);
      this.aiSkillsWatcher = null;
    }
    this.aiSkillsTermDisposables.forEach((d) => d.dispose());
    this.aiSkillsTermDisposables = [];
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
  --sidebar-width: 308px;
  --content-max: 920px;
  --brand-blue: #0176D3;
  --brand-blue-deep: #014486;
  --brand-blue-soft: rgba(1, 118, 211, 0.10);
  --brand-blue-hairline: rgba(1, 118, 211, 0.28);
  --brand-green: #1A8754;
  --brand-green-bright: #2FA86A;
  --brand-green-soft: rgba(26, 135, 84, 0.12);
  --brand-green-hairline: rgba(26, 135, 84, 0.40);
  /* Status palette for the sidebar checklist:
     done = green, in-progress = amber/yellow, idle/locked/skipped = neutral grey. */
  --status-amber: #C77700;
  --status-amber-bright: #E58A0F;
  --status-amber-soft: rgba(199, 119, 0, 0.14);
  --status-grey: rgba(127, 127, 127, 0.45);
  --status-grey-soft: rgba(127, 127, 127, 0.18);
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
/* Active-session chip — shown when a dw.json setup session has named an
   instance for this workspace. Clicking it isn't required; users reach the
   reset action via the adjacent "Start over" button. */
.setup-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--brand-green-soft);
  border: 1px solid var(--brand-green-hairline);
  color: var(--brand-green);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.setup-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-green);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-green) 22%, transparent);
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
/* Scoped under .persona-card so we beat the generic button.ghost rules
   (same fix that the gate-cta pill needed). The pill renders large and
   bright so it reads as "the action" at a glance. */
.persona-card .persona-arrow,
.persona-card span.persona-arrow {
  position: absolute;
  right: 20px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 999px;
  background: var(--brand-blue);
  color: #FFFFFF;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: 0 6px 14px rgba(1, 118, 211, 0.32), 0 1px 2px rgba(1, 118, 211, 0.30);
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  z-index: 2;
  pointer-events: none; /* card receives the click */
}
.persona-card .persona-arrow > span { color: #FFFFFF; }
.persona-card .persona-arrow svg { color: #FFFFFF; stroke: #FFFFFF; }
.persona-card:hover .persona-arrow {
  transform: translateX(4px);
  box-shadow: 0 8px 18px rgba(1, 118, 211, 0.42), 0 1px 2px rgba(1, 118, 211, 0.30);
}
.persona-card.is-recommended .persona-arrow {
  background: var(--brand-green);
  box-shadow: 0 6px 14px rgba(26, 135, 84, 0.32), 0 1px 2px rgba(26, 135, 84, 0.30);
}
.persona-card.is-recommended:hover .persona-arrow {
  box-shadow: 0 8px 18px rgba(26, 135, 84, 0.42), 0 1px 2px rgba(26, 135, 84, 0.30);
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
  /* Vertically centre the progress block against the eyebrow + headline pair. */
  align-items: center;
  gap: 32px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.dashboard-hero h1 {
  /* Refined enterprise serif-grotesk pairing: prefer Salesforce Sans →
     IBM Plex Sans → Source Sans 3 (humanist sans, used by Stripe / Shopify)
     before the system-ui fallbacks, so SCAPI / OCAPI sit cleanly without
     the chunky display weight from the previous Inter/SF-Pro stack. */
  font-family:
    'Salesforce Sans', 'IBM Plex Sans', 'Source Sans 3', 'Source Sans Pro',
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  font-style: normal;
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin: 0;
  max-width: 620px;
  color: var(--vscode-foreground);
}
.progress-block {
  flex: 0 0 auto;
  align-self: center;
  width: 320px;
  max-width: 100%;
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
  /* Default = "available" / not-yet-touched: greyed disabled-looking dot. */
  background: var(--status-grey-soft);
  color: var(--vscode-descriptionForeground);
  border: 1px solid var(--status-grey);
}
.step-item[data-status="done"] .status {
  background: var(--brand-green);
  color: #fff;
  border-color: var(--brand-green);
  box-shadow: 0 0 0 2px var(--brand-green-soft);
}
.step-item[data-status="in-progress"] .status {
  background: var(--status-amber);
  color: #fff;
  border-color: var(--status-amber);
  box-shadow: 0 0 0 2px var(--status-amber-soft);
}
.step-item[data-status="skipped"] .status {
  background: var(--status-grey-soft);
  color: var(--vscode-descriptionForeground);
  border-color: var(--status-grey);
  border-style: dashed;
}
.step-item[data-status="locked"] .status {
  background: transparent;
  color: var(--vscode-descriptionForeground);
  border-color: var(--status-grey);
  border-style: dashed;
}
.step-item.locked { cursor: not-allowed; opacity: 0.55; }
.step-item.locked:hover { background: transparent; }
.step-item.locked .label { color: var(--vscode-descriptionForeground); }
/* Lighter type weight: the previous 500 read as bold at small sizes. */
.step-item .label {
  font-size: 0.9rem;
  line-height: 1.4;
  min-width: 0;
  font-weight: 400;
  letter-spacing: 0.005em;
}
.step-item .label .title { font-weight: 450; color: var(--vscode-foreground); }
.step-item.active .label .title { font-weight: 600; }
.step-item[data-status="done"] .label .title { color: var(--vscode-descriptionForeground); }
.step-item .label small {
  display: block;
  color: var(--vscode-descriptionForeground);
  font-size: 0.72rem;
  margin-top: 2px;
  font-weight: 400;
  letter-spacing: 0.02em;
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
}
.step-card__actions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.detection-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--brand-green-soft, rgba(26, 135, 84, 0.12));
  color: var(--brand-green, #1A8754);
  border: 1px solid var(--brand-green-hairline, rgba(26, 135, 84, 0.40));
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  cursor: default;
}
.detection-chip svg { color: inherit; }
.step-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.step-actions button { min-height: 36px; padding: 7px 16px; font-weight: 600; }
/* Scoped under .step-actions so we beat the generic button.ghost rule:
   inside the Quick-actions panel a "secondary" button needs to read on
   the brand-blue-soft tint, not vanish into it. */
.step-actions button.ghost,
.step-actions button.ghost:hover,
.step-actions button.ghost:focus-visible {
  background: var(--surface-card);
  color: var(--brand-blue);
  border: 1px solid var(--brand-blue-hairline);
}
.step-actions button.ghost:hover {
  background: var(--brand-blue-soft);
  border-color: var(--brand-blue);
  color: var(--brand-blue-deep);
}
.step-actions button:disabled,
.step-actions button.ghost:disabled,
.step-actions button:disabled:hover {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--surface-card);
  color: var(--vscode-descriptionForeground);
  border: 1px solid var(--hairline);
  transform: none;
  box-shadow: none;
}
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
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  border: 1px solid var(--hairline);
  margin: 0 0 12px;
  /* Tight single-line-height box. Body inherits 1.65; without these resets,
     single-line commands render with empty rows of air. */
  line-height: 1.55;
  font-family: var(--vscode-editor-font-family, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.86em;
  min-height: 0;
  white-space: pre;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  border: none;
  margin: 0;
  color: var(--vscode-foreground);
  font: inherit;
  line-height: inherit;
  /* Inline so the block doesn't add its own line-box height. */
  display: inline;
  white-space: inherit;
}
/* Tight stanza for adjacent code blocks. The adjacent-sibling combinator
   (+) breaks when the renderer joins blocks with newlines (whitespace
   text nodes between siblings); use general-sibling (~) instead. */
.markdown-body pre ~ pre { margin-top: 0; }
.markdown-body p + pre { margin-top: 0; }
.markdown-body pre + p { margin-top: 8px; }
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
/* Sticky to the bottom of the viewport so Previous/Skip/Next stay reachable
   without scrolling — matches the pattern Stripe and Datadog use for
   long-form onboarding. Translucent background + backdrop-blur lets the
   page wash bleed through. */
.step-nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  position: sticky;
  bottom: 0;
  z-index: 5;
  padding: 14px 16px 16px;
  /* Solid editor background so scrolling body text doesn't bleed through.
     The hairline + lifted shadow signal the sticky boundary cleanly. */
  background: var(--vscode-editor-background);
  border-top: 1px solid var(--hairline);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  box-shadow: 0 -10px 24px -16px rgba(0, 0, 0, 0.18);
}
/* Bottom padding on .content so the last paragraph isn't trapped behind the
   sticky bar (~96px = nav height + breathing room). */
.content { padding-bottom: 96px; }
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
  /* Use the same humanist sans as the dashboard headline so the nav reads
     as part of the chrome, not the markdown body. */
  font-family:
    'Salesforce Sans', 'IBM Plex Sans', 'Source Sans 3', 'Source Sans Pro',
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
  letter-spacing: 0;
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
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 700;
  color: var(--vscode-descriptionForeground);
  opacity: 0.85;
}
.nav-btn.next.primary .nav-text small { color: rgba(255, 255, 255, 0.85); opacity: 1; }
.nav-btn .nav-text span:not(small) {
  font-size: 0.92rem;
  font-weight: 600;
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
  const btnStartOver = document.getElementById('btn-start-over');
  const setupChip = document.getElementById('setup-chip');
  const setupChipName = document.getElementById('setup-chip-name');

  let currentState = null;

  function post(msg) { vscode.postMessage(msg); }

  function renderSetupChip(state) {
    if (!setupChip || !btnStartOver || !setupChipName) return;
    if (state.setupInstance) {
      setupChipName.textContent = state.setupInstance;
      setupChip.hidden = false;
      btnStartOver.hidden = false;
    } else {
      setupChip.hidden = true;
      btnStartOver.hidden = true;
    }
  }

  function render(state) {
    currentState = state;
    renderSetupChip(state);
    if (!state.persona) {
      gate.hidden = false;
      dashboard.hidden = true;
      renderPersonaGate(state.personas);
      return;
    }
    gate.hidden = true;
    dashboard.hidden = false;
    personaLabel.textContent = state.persona.label;
    // Headers don't carry trailing punctuation — strip a single period if
    // the persona definition's tagline ends with one.
    personaTagline.textContent = state.persona.tagline.replace(/\.$/, '');
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
      card.querySelector('.tagline').textContent = p.tagline.replace(/\.$/, '');
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
    const detectionChip = document.getElementById('step-detection-chip');
    const detectionLabel = document.getElementById('step-detection-label');
    if (!step) {
      stepNumber.textContent = '';
      stepPosition.textContent = '';
      stepTitle.textContent = '';
      stepSummary.textContent = '';
      stepActions.innerHTML = '';
      stepActionsWrap.hidden = true;
      stepBody.innerHTML = '';
      if (detectionChip) detectionChip.hidden = true;
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
        if (action.tooltip) btn.title = action.tooltip;
        if (action.disabled) {
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
        } else {
          btn.addEventListener('click', () =>
            post({type: 'runAction', command: action.command, args: action.args, stepId: step.id}),
          );
        }
        stepActions.appendChild(btn);
      });
    } else {
      stepActionsWrap.hidden = true;
    }
    // Per-step config detection chip (e.g., "1 configuration detected")
    if (detectionChip && detectionLabel) {
      if (step.detection && step.detection.label) {
        detectionLabel.textContent = step.detection.label;
        const names = step.detection.matchedNames || [];
        detectionChip.title = names.length
          ? 'Detected in dw.json: ' + names.join(', ')
          : 'Detected in dw.json';
        detectionChip.hidden = false;
        // Ensure the actions wrapper is visible even if there are no actions,
        // so the chip alone can communicate "this step is already configured".
        if (step.actions && step.actions.length === 0) stepActionsWrap.hidden = false;
      } else {
        detectionChip.hidden = true;
      }
    }
    // Scroll the card (not the body) so step-header stays visible after navigation.
    if (stepCard && typeof stepCard.scrollIntoView === 'function') {
      stepCard.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }

  // AI skills step: dispatch button clicks (install skills / run cmd) before
  // the generic link interceptor sees them.
  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest && e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'install-skills') {
      const ide = btn.getAttribute('data-ide') || '';
      e.preventDefault();
      post({type: 'aiSkills.installSkills', ide: ide});
    } else if (action === 'run-cmd') {
      const cmd = btn.getAttribute('data-cmd') || '';
      const label = btn.getAttribute('data-label') || 'Install';
      e.preventDefault();
      post({type: 'aiSkills.runCommand', cmd: cmd, label: label});
    } else if (action === 'ai-recheck') {
      e.preventDefault();
      post({type: 'aiSkills.recheck'});
    }
  });

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
  if (btnStartOver) {
    btnStartOver.addEventListener('click', () => post({type: 'runAction', command: 'b2c-dx.setup.resetSession'}));
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
