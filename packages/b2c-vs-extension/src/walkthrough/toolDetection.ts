/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as cp from 'child_process';
import type {StepAction} from './personas.js';

export interface ToolStatus {
  name: string;
  installed: boolean;
  version?: string;
  label: string;
}

export interface ToolDetectionResult {
  node: ToolStatus;
  npm: ToolStatus;
  homebrew: ToolStatus;
  npx: ToolStatus;
  b2cCli: ToolStatus;
  b2cCliLatest?: string;
  b2cCliOutdated?: boolean;
}

function execVersion(command: string, args: string[]): Promise<string | undefined> {
  return new Promise((resolve) => {
    cp.execFile(command, args, {timeout: 5000}, (err, stdout) => {
      if (err) {
        resolve(undefined);
        return;
      }
      const output = stdout.toString().trim();
      resolve(output || undefined);
    });
  });
}

function extractVersion(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/);
  return match ? match[1] : raw;
}

export function compareSemver(a: string, b: string): number {
  const norm = (v: string) =>
    v
      .split(/[-+]/)[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const [aA, aB] = [norm(a), norm(b)];
  for (let i = 0; i < 3; i++) {
    if ((aA[i] ?? 0) !== (aB[i] ?? 0)) return (aA[i] ?? 0) - (aB[i] ?? 0);
  }
  const aPre = a.includes('-');
  const bPre = b.includes('-');
  if (aPre !== bPre) return aPre ? -1 : 1;
  return 0;
}

export async function detectTools(latestCliVersion?: string): Promise<ToolDetectionResult> {
  const [nodeRaw, npmRaw, brewRaw, npxRaw, b2cRaw] = await Promise.all([
    execVersion('node', ['--version']),
    execVersion('npm', ['--version']),
    execVersion('brew', ['--version']),
    execVersion('npx', ['--version']),
    execVersion('b2c', ['--version']),
  ]);

  const nodeVersion = extractVersion(nodeRaw);
  const npmVersion = extractVersion(npmRaw);
  const brewVersion = extractVersion(brewRaw);
  const npxVersion = extractVersion(npxRaw);
  const b2cVersion = extractVersion(b2cRaw);

  let b2cCliOutdated: boolean | undefined;
  let b2cCliLatest: string | undefined;
  if (b2cVersion && latestCliVersion) {
    b2cCliOutdated = compareSemver(b2cVersion, latestCliVersion) < 0;
    b2cCliLatest = latestCliVersion;
  }

  return {
    node: {
      name: 'node',
      installed: !!nodeVersion,
      version: nodeVersion,
      label: 'Node.js',
    },
    npm: {
      name: 'npm',
      installed: !!npmVersion,
      version: npmVersion,
      label: 'npm',
    },
    homebrew: {
      name: 'homebrew',
      installed: !!brewVersion,
      version: brewVersion,
      label: 'Homebrew',
    },
    npx: {
      name: 'npx',
      installed: !!npxVersion,
      version: npxVersion,
      label: 'npx',
    },
    b2cCli: {
      name: 'b2c-cli',
      installed: !!b2cVersion,
      version: b2cVersion,
      label: 'B2C CLI',
    },
    b2cCliLatest: b2cCliLatest,
    b2cCliOutdated: b2cCliOutdated,
  };
}

function toolRowHtml(tool: ToolStatus, note?: string): string {
  if (tool.installed) {
    const extra = note ? `<span class="tool-note">${note}</span>` : '';
    return [
      `<div class="tool-row tool-ok">`,
      `<span class="tool-icon" aria-label="installed">&#x2714;</span>`,
      `<span class="tool-name">${tool.label}</span>`,
      `<span class="tool-version">v${tool.version}</span>`,
      extra,
      `</div>`,
    ].join('');
  }
  const extra = note ? `<span class="tool-note">${note}</span>` : '';
  return [
    `<div class="tool-row tool-missing">`,
    `<span class="tool-icon" aria-label="not found">&#x2717;</span>`,
    `<span class="tool-name">${tool.label}</span>`,
    `<span class="tool-version">not found</span>`,
    extra,
    `</div>`,
  ].join('');
}

/**
 * Generates styled HTML for the install-cli step. This bypasses the markdown
 * renderer to allow colored status indicators and version badges.
 */
export function generateInstallCliHtml(result: ToolDetectionResult): string {
  const parts: string[] = [];

  // Scoped styles for tool detection UI
  parts.push(`<style>
h1 { margin: 0 0 8px; }
h2 { margin: 20px 0 8px; }
h3 { margin: 14px 0 6px; }
p { margin: 0 0 8px; }
blockquote { margin: 8px 0 12px; padding: 12px 16px; }
blockquote p, .markdown-body blockquote p { margin: 0; padding: 0; }
ul { margin: 6px 0 12px; padding-left: 22px; }
li { margin-bottom: 4px; }
.tool-grid { display: flex; flex-direction: column; gap: 6px; margin: 10px 0 20px; }
.tool-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; border-radius: 8px;
  font-size: 0.92rem; line-height: 1.4;
}
.tool-ok { background: rgba(26, 135, 84, 0.10); }
.tool-ok .tool-icon { color: #1A8754; font-size: 1.1rem; font-weight: 700; }
.tool-ok .tool-version {
  background: rgba(26, 135, 84, 0.18); color: #1A8754;
  padding: 2px 8px; border-radius: 4px; font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.82rem; font-weight: 600;
}
.tool-missing { background: rgba(199, 119, 0, 0.08); }
.tool-missing .tool-icon { color: #C77700; font-size: 1.1rem; font-weight: 700; }
.tool-missing .tool-version {
  background: rgba(199, 119, 0, 0.15); color: #C77700;
  padding: 2px 8px; border-radius: 4px; font-size: 0.82rem; font-weight: 600;
}
.tool-name { font-weight: 600; min-width: 80px; }
.tool-note { color: var(--vscode-descriptionForeground); font-size: 0.82rem; margin-left: auto; }
.cli-status {
  margin: 12px 0; padding: 12px 16px; border-radius: 10px; border-left: 4px solid;
}
.cli-status.cli-ok { border-color: #1A8754; background: rgba(26, 135, 84, 0.08); }
.cli-status.cli-outdated { border-color: #C77700; background: rgba(199, 119, 0, 0.08); }
.cli-status.cli-none { border-color: #C77700; background: rgba(199, 119, 0, 0.08); }
.cli-status > strong:first-child { display: block; margin-bottom: 4px; }
.cli-status p { margin: 0 0 4px; }
.cli-status p:last-child { margin-bottom: 0; }
.cli-ver {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-family: var(--vscode-editor-font-family, monospace); font-size: 0.85rem; font-weight: 600;
}
.cli-ok .cli-ver { background: rgba(26, 135, 84, 0.18); color: #1A8754; }
.cli-outdated .cli-ver { background: rgba(199, 119, 0, 0.15); color: #C77700; }
</style>`);

  // Intro (title is already shown in the step header — skip h1 to avoid duplication)
  parts.push(
    `<p>The B2C CLI (<code>b2c</code>) drives deploys, log tailing, sandbox management, and more from the terminal. The VS Code extension uses it under the hood for some commands.</p>`,
  );
  parts.push(
    `<blockquote><p><strong>Optional.</strong> You can use the extension&#39;s Cartridges, WebDAV, and Sandbox views without the CLI. Install it when you want to script the same operations from the terminal or CI.</p></blockquote>`,
  );

  // Prerequisites grid
  parts.push(`<h2>Prerequisites</h2>`);
  parts.push(`<div class="tool-grid">`);
  parts.push(toolRowHtml(result.node, result.node.installed ? undefined : 'required, v22.0.0+'));
  parts.push(toolRowHtml(result.npm, result.npm.installed ? 'for global install' : undefined));
  parts.push(toolRowHtml(result.npx, result.npx.installed ? 'for one-off runs' : undefined));
  parts.push(toolRowHtml(result.homebrew, result.homebrew.installed ? 'alt install method' : 'optional'));
  parts.push(`</div>`);

  // B2C CLI status
  parts.push(`<h2>B2C CLI</h2>`);

  if (result.b2cCli.installed) {
    const ver = result.b2cCli.version ?? 'unknown';
    if (result.b2cCliOutdated && result.b2cCliLatest) {
      parts.push(`<div class="cli-status cli-outdated">`);
      parts.push(`<strong>Update available</strong>`);
      parts.push(
        `<p>Installed: <span class="cli-ver">${ver}</span> &#x2192; Latest: <span class="cli-ver">${result.b2cCliLatest}</span></p>`,
      );
      parts.push(`<p>Run the <strong>Update CLI</strong> action above to upgrade.</p>`);
      parts.push(`</div>`);
    } else {
      parts.push(`<div class="cli-status cli-ok">`);
      parts.push(`<strong>&#x2714; Installed &amp; up to date</strong>`);
      parts.push(`<p><span class="cli-ver">${ver}</span>${result.b2cCliLatest ? ' (latest)' : ''}</p>`);
      parts.push(
        `<p>The CLI is on your PATH and ready to use. Move to the next step or run <code>b2c --version</code> in the terminal to confirm.</p>`,
      );
      parts.push(`</div>`);
    }
  } else {
    parts.push(`<div class="cli-status cli-none">`);
    parts.push(`<strong>&#x2717; Not found on PATH</strong>`);
    parts.push(`<p>Install using one of the methods below, then click <strong>Re-check</strong> above.</p>`);
    parts.push(`</div>`);

    parts.push(`<h3>Install</h3>`);
    parts.push(`<p>Pick whichever fits your toolchain:</p>`);
    parts.push(`<ul>`);
    parts.push(`<li><strong>npm</strong> &#8212; <code>npm install -g @salesforce/b2c-cli</code></li>`);
    parts.push(
      `<li><strong>Homebrew</strong> &#8212; <code>brew install salesforcecommercecloud/tools/b2c-cli</code></li>`,
    );
    parts.push(`<li><strong>npx (no install)</strong> &#8212; <code>npx @salesforce/b2c-cli --help</code></li>`);
    parts.push(`</ul>`);
    parts.push(`<p>After installing, click <strong>Re-check</strong> above to confirm detection.</p>`);
  }

  // What it unlocks
  parts.push(`<h2>What it unlocks</h2>`);
  parts.push(`<ul>`);
  parts.push(`<li><code>b2c code:deploy</code> &#8212; same flow the Cartridges view uses, scriptable from CI.</li>`);
  parts.push(`<li><code>b2c sandbox:*</code> &#8212; create/start/stop/delete sandboxes from the terminal.</li>`);
  parts.push(`<li><code>b2c log:tail</code> &#8212; stream instance logs.</li>`);
  parts.push(`<li><code>b2c auth:*</code> &#8212; non-interactive OAuth client login for pipelines.</li>`);
  parts.push(`</ul>`);

  // Troubleshooting
  parts.push(`<h2>Troubleshooting</h2>`);
  parts.push(`<ul>`);
  parts.push(
    `<li><strong>Command not found after <code>npm install -g</code></strong> &#8212; your global npm prefix isn&#39;t on PATH. Run <code>npm config get prefix</code> and add <code>&lt;prefix&gt;/bin</code> to PATH.</li>`,
  );
  parts.push(
    `<li><strong>EACCES on install</strong> &#8212; use a Node version manager (<code>nvm</code>, <code>fnm</code>, <code>volta</code>) instead of <code>sudo npm</code>. Avoid <code>sudo</code>.</li>`,
  );
  parts.push(
    `<li><strong>Old version behaves oddly</strong> &#8212; run <strong>Update CLI</strong> (or <code>npm install -g @salesforce/b2c-cli@latest</code>) to upgrade.</li>`,
  );
  parts.push(`</ul>`);

  parts.push(
    `<p><a href="https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/installation.html">Full installation guide on the docs site</a></p>`,
  );

  return parts.join('\n');
}

/**
 * Builds the Quick-actions for the "Install the B2C CLI" step based on detected
 * tool state. Extracted as a pure function so the enable/disable logic is unit
 * testable without the VS Code panel.
 *
 * Notable behavior: "Update CLI" is only actionable when an update is actually
 * available. When the CLI is installed and confirmed up to date
 * (`b2cCliOutdated === false`) the button renders disabled with an explanatory
 * tooltip. When the latest version is unknown (offline / version cache empty,
 * so `b2cCliOutdated` is `undefined`) it stays enabled — we don't block an
 * update we simply couldn't verify.
 */
export function buildInstallCliActions(result: ToolDetectionResult): StepAction[] {
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
    // Installed. Only offer an actionable Update when we know a newer version
    // exists; otherwise disable it (up to date) or leave it enabled when the
    // latest version couldn't be resolved.
    const upToDate = result.b2cCliOutdated === false;
    actions.push({label: 'Verify CLI', command: 'b2c-dx.cli.verify', primary: true});
    actions.push({
      label: upToDate ? 'Up to date' : 'Update CLI',
      command: 'b2c-dx.cli.update',
      disabled: upToDate,
      tooltip: upToDate
        ? `B2C CLI ${result.b2cCli.version ?? ''} is the latest version — no update available.`.trim()
        : undefined,
    });
    actions.push({label: 'Re-check', command: 'b2c-dx.cli.recheck'});
  }

  return actions;
}
