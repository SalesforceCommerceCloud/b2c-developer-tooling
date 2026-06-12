// Adventure: Debug server-side scripts (b2c debug, b2c debug cli).
//
// The B2C script debugger (SDAPI) requires Basic auth (BM username + WebDAV
// access key). OAuth tokens are not sufficient. This wizard helps the user
// pick a debugging surface (VS Code DAP, CLI REPL, or JSONL RPC) and
// persistence strategy, then synthesizes the right dw.json / env vars +
// checklist.

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link} from './_helpers.js';

export const debugAdventure = defineAdventure({
  id: 'debug',
  title: 'Debug server-side scripts',
  tagline: 'Set breakpoints and step through cartridges, jobs, and APIs from your IDE or a REPL.',
  icon: 'mdi:bug-outline',
  tags: ['debug', 'vscode', 'dap', 'repl'],
  priority: 'common',
  intro:
    "The B2C script debugger lets you pause server-side scripts, inspect variables, and step through controllers, jobs, hooks, and Custom APIs. It speaks SDAPI under the hood and authenticates with Basic auth (BM username + WebDAV access key) — OAuth tokens won't work.",

  steps: [
    step('surface', {
      title: 'How will you drive the debugger?',
      doc: doc('/cli/debug', undefined, 'Debug Commands'),
      choices: [
        choice('vscode', {
          title: 'VS Code (DAP)',
          subtitle: 'Recommended for IDEs',
          icon: 'mdi:microsoft-visual-studio-code',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`Use the B2C DX VS Code extension or wire \`b2c debug\` in as a DAP adapter for any IDE that speaks the Debug Adapter Protocol.`,
          contributes: {surface: 'vscode'},
        }),
        choice('repl', {
          title: 'Terminal REPL',
          subtitle: 'b2c debug cli',
          icon: 'mdi:console',
          badges: [{text: 'Quick', tone: 'quick'}],
          body: md`Interactive terminal session with \`break\`, \`continue\`, \`step\`, \`vars\`, and \`eval\` commands. No IDE setup required.`,
          contributes: {surface: 'repl'},
        }),
        choice('rpc', {
          title: 'JSONL RPC',
          subtitle: 'b2c debug cli --rpc',
          icon: 'mdi:robot-outline',
          body: md`Headless JSONL-over-stdio mode for scripts and agents. Drive breakpoints and stepping programmatically.`,
          contributes: {surface: 'rpc'},
        }),
      ],
    }),

    step('persistence', {
      title: 'How should the CLI find your config?',
      doc: doc('/guide/configuration', 'configuration-file', 'Configuration file (dw.json)'),
      choices: [
        choice('dw-json', {
          title: 'dw.json (project root)',
          subtitle: 'Recommended',
          icon: 'mdi:file-cog-outline',
          body: md`Per-project config file with walk-up discovery — usually colocated with your cartridges.`,
          contributes: {configSource: 'dw-json'},
        }),
        choice('env', {
          title: '.env / environment variables',
          subtitle: 'CI-friendly',
          icon: 'mdi:console-line',
          body: md`Use \`SFCC_*\` env vars; the CLI auto-loads a \`.env\` file.`,
          contributes: {configSource: 'env'},
        }),
      ],
    }),
  ],

  synthesize(state) {
    const surface = state.surface as string | undefined;
    const useEnv = state.configSource === 'env';

    const isVscode = surface === 'vscode';
    const isRepl = surface === 'repl';
    const isRpc = surface === 'rpc';

    const dw = useEnv
      ? '# Using environment variables — see .env tab below.'
      : dwJson({
          hostname: true,
          codeVersion: 'version1',
          username: true,
          password: true,
        });

    const env = useEnv
      ? [
          'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
          'SFCC_CODE_VERSION=version1',
          'SFCC_USERNAME=<BM_USERNAME>',
          'SFCC_PASSWORD=<WEBDAV_ACCESS_KEY>',
        ].join('\n')
      : undefined;

    const checklist = [
      check(
        'Enable Script Debugger in Business Manager (Administration → Development Configuration → Script Debugger)',
        link('/cli/debug', undefined, 'Debug Commands · Authentication'),
      ),
      check(
        'Generate a WebDAV access key for your BM user',
        link('/guide/authentication', 'option-a-basic-authentication-recommended', 'Basic Authentication'),
      ),
      check(
        useEnv
          ? 'Set SFCC_SERVER, SFCC_USERNAME, and SFCC_PASSWORD environment variables'
          : 'Save the dw.json snippet to your project root (alongside your cartridges)',
        link(
          '/guide/configuration',
          useEnv ? 'environment-variables' : 'configuration-file',
          useEnv ? 'Environment Variables' : 'Configuration File',
        ),
      ),
      ...(isVscode
        ? [
            check(
              'Install the B2C DX VS Code extension (recommended) — it ships its own DAP integration',
              link('/vscode-extension/', undefined, 'B2C DX VS Code Extension'),
            ),
            check(
              'Or wire `b2c debug` into your IDE as a custom DAP adapter',
              link('/cli/debug', undefined, 'b2c debug · IDE Integration'),
            ),
          ]
        : []),
      ...(isRpc
        ? [
            check(
              'Drive the debugger over JSONL stdio with `b2c debug cli --rpc`',
              link('/cli/debug', undefined, 'RPC Mode'),
            ),
          ]
        : []),
    ];

    const warnings: string[] = [
      'OAuth tokens cannot be used for the script debugger — Basic auth (BM username + WebDAV access key) is required.',
      'Make sure your local cartridge tree matches the code version deployed to the instance, otherwise breakpoints may not bind.',
    ];

    if (isVscode) {
      // Snippet matches the contributed debugger type in the B2C DX VS Code
      // extension (packages/b2c-vs-extension/package.json contributes.debuggers).
      warnings.push(
        'Sample VS Code launch.json snippet:\n\n' +
          '```json\n' +
          JSON.stringify(
            {
              version: '0.2.0',
              configurations: [
                {
                  type: 'b2c-script',
                  request: 'launch',
                  name: 'B2C Script Debugger',
                  cartridgePath: '${workspaceFolder}/cartridges',
                },
              ],
            },
            null,
            2,
          ) +
          '\n```',
      );
    }

    let verifyCommand: string;
    if (isRepl) {
      verifyCommand = 'b2c debug cli';
    } else if (isRpc) {
      verifyCommand = 'b2c debug cli --rpc';
    } else {
      verifyCommand = 'b2c debug --help';
    }

    return {
      dwJson: dw,
      env,
      checklist,
      warnings,
      verifyCommand,
    };
  },
});
