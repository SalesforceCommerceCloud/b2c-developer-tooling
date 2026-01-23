/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {evaluateScript, type EvaluateScriptResult} from '@salesforce/b2c-tooling-sdk/operations/script';
import {getActiveCodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
import {t} from '../../i18n/index.js';

export default class ScriptEval extends InstanceCommand<typeof ScriptEval> {
  static args = {
    expression: Args.string({
      description: 'Script expression to evaluate',
      required: false,
    }),
  };

  static description = t(
    'commands.script.eval.description',
    'Evaluate a Script API expression on a B2C Commerce instance',
  );

  static enableJsonFlag = true;

  static examples = [
    // Inline expression
    '<%= config.bin %> <%= command.id %> "dw.system.Site.getCurrent().getName()"',
    // With server flag
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net "1+1"',
    // From file
    '<%= config.bin %> <%= command.id %> --file script.js',
    // With site ID
    '<%= config.bin %> <%= command.id %> --site RefArch "dw.system.Site.getCurrent().getName()"',
    // JSON output
    '<%= config.bin %> <%= command.id %> --json "dw.catalog.ProductMgr.getProduct(\'123\')"',
    // Multi-statement via heredoc (shell)
    `echo 'var site = dw.system.Site.getCurrent(); site.getName();' | <%= config.bin %> <%= command.id %>`,
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    file: Flags.string({
      char: 'f',
      description: 'Read expression from file',
    }),
    site: Flags.string({
      description: 'Site ID to use for controller trigger (default: RefArch)',
      default: 'RefArch',
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds for waiting for breakpoint (default: 30)',
      default: 30,
    }),
  };

  async run(): Promise<EvaluateScriptResult> {
    // Require both Basic auth (for SDAPI) and OAuth (for OCAPI)
    this.requireWebDavCredentials();
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    let codeVersion = this.resolvedConfig.values.codeVersion;

    // If no code version specified, discover the active one
    if (!codeVersion) {
      if (!this.jsonEnabled()) {
        this.log(
          t('commands.script.eval.discoveringCodeVersion', 'No code version specified, discovering active version...'),
        );
      }
      const activeVersion = await getActiveCodeVersion(this.instance);
      if (!activeVersion?.id) {
        this.error(
          t('commands.script.eval.noActiveVersion', 'No active code version found. Specify one with --code-version.'),
        );
      }
      codeVersion = activeVersion.id;
      // Update the instance config
      this.instance.config.codeVersion = codeVersion;
    }

    // Get expression from args, file, or stdin
    const expression = await this.getExpression();

    if (!expression || expression.trim() === '') {
      this.error(
        t(
          'commands.script.eval.noExpression',
          'No expression provided. Pass as argument, use --file, or pipe to stdin.',
        ),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.script.eval.evaluating', 'Evaluating expression on {{hostname}} ({{codeVersion}})...', {
          hostname,
          codeVersion,
        }),
      );
    }

    try {
      const result = await evaluateScript(this.instance, expression, {
        siteId: this.flags.site,
        timeout: this.flags.timeout * 1000,
      });

      if (result.success) {
        if (!this.jsonEnabled()) {
          this.log(t('commands.script.eval.result', 'Result:'));
          // Output the raw result without additional formatting
          process.stdout.write(result.result ?? 'undefined');
          process.stdout.write('\n');
        }
      } else if (!this.jsonEnabled()) {
        this.log(t('commands.script.eval.error', 'Error: {{error}}', {error: result.error ?? 'Unknown error'}));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.script.eval.failed', 'Evaluation failed: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }

  /**
   * Gets the expression from various input sources.
   *
   * Priority:
   * 1. --file flag (reads from file)
   * 2. Positional argument (inline expression)
   * 3. stdin (for heredocs/piping)
   */
  private async getExpression(): Promise<string> {
    // Priority 1: --file flag
    if (this.flags.file) {
      try {
        return await fs.promises.readFile(this.flags.file, 'utf8');
      } catch (error) {
        this.error(
          t('commands.script.eval.fileReadError', 'Failed to read file {{file}}: {{error}}', {
            file: this.flags.file,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    }

    // Priority 2: Positional argument
    if (this.args.expression) {
      return this.args.expression;
    }

    // Priority 3: stdin (check if stdin has data)
    if (!process.stdin.isTTY) {
      return this.readStdin();
    }

    return '';
  }

  /**
   * Reads all data from stdin.
   */
  private readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (chunk) => {
        data += chunk;
      });

      process.stdin.on('end', () => {
        resolve(data);
      });

      process.stdin.on('error', (err) => {
        reject(err);
      });

      // Set a timeout for stdin reading
      setTimeout(() => {
        if (data === '') {
          resolve('');
        }
      }, 100);
    });
  }
}
