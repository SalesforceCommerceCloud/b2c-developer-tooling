/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  HOOK_SEMANTICS,
  hookChains,
  hookRegistrationIssue,
  type HookChain,
  type IndexedHook,
} from '@salesforce/b2c-tooling-sdk/project-index';
import {t, withDocs} from '../../i18n/index.js';
import {displayPath, loadProjectIndex} from '../../utils/project/index.js';

/** One extension point in `b2c project hooks` output. */
export interface HookChainResult extends Omit<HookChain, 'registrations'> {
  semantics: string;
  registrations: Array<IndexedHook & {issue?: string}>;
}

export default class ProjectHooks extends BaseCommand<typeof ProjectHooks> {
  static args = {
    filter: Args.string({
      description: 'Only extension points whose name contains this text, for example "basket" or "dw.order.calculate"',
    }),
  };

  static description = withDocs(
    t(
      'commands.project.hooks.description',
      'List hook registrations by extension point in cartridge path order, flagging system hooks that can return a value and skip later registrations',
    ),
    '/cli/project.html#b2c-project-hooks',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> dw.ocapi.shop.basket',
    '<%= config.bin %> <%= command.id %> --issues --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    issues: Flags.boolean({description: 'Only extension points or registrations with issues', default: false}),
  };

  protected operations = {loadProjectIndex};

  async run(): Promise<{hooks: HookChainResult[]}> {
    const {args, flags} = await this.parse(ProjectHooks);
    const index = this.operations.loadProjectIndex(this.resolvedConfig.values.cartridges);
    const filter = args.filter?.toLowerCase();
    const hooks = hookChains(index)
      .filter((c) => !filter || c.name.toLowerCase().includes(filter))
      .map<HookChainResult>((chain) => ({
        ...chain,
        semantics: HOOK_SEMANTICS[chain.kind],
        registrations: chain.registrations.map((h) => {
          const issue = hookRegistrationIssue(chain, h);
          return issue ? {...h, issue} : h;
        }),
      }))
      .filter((c) => !flags.issues || c.issue || c.registrations.some((r) => r.issue));

    if (this.jsonEnabled()) return {hooks};
    if (hooks.length === 0) {
      this.log(t('commands.project.hooks.none', 'No matching hook registrations.'));
      return {hooks};
    }
    for (const chain of hooks) {
      const count = `${chain.registrations.length} registration${chain.registrations.length > 1 ? 's' : ''}`;
      ux.stdout(`${ux.colorize('bold', chain.name)}  (${chain.kind}, ${count})`);
      if (chain.issue) ux.stdout(ux.colorize('yellow', `  ⚠ ${chain.issue}`));
      if (chain.note) ux.stdout(ux.colorize('dim', `  ${chain.note}`));
      for (const [i, h] of chain.registrations.entries()) {
        const where = h.relPath ? displayPath(index, h.cartridge, h.relPath, h.line) : h.script;
        const detail =
          chain.kind === 'system'
            ? h.returnsValue === 'yes'
              ? 'returns a value'
              : h.returnsValue === 'no'
                ? 'returns nothing'
                : ''
            : h.exports && h.exports.length > 0
              ? `exports ${h.exports.join(', ')}`
              : '';
        ux.stdout(`  ${i + 1}. ${h.cartridge.padEnd(28)} ${where}${detail ? `  ${detail}` : ''}`);
        if (h.issue && h.returnsValue !== 'yes') ux.stdout(ux.colorize('yellow', `     ⚠ ${h.issue}`));
      }
      ux.stdout('');
    }
    ux.stdout(
      t(
        'commands.project.hooks.note',
        'System (dw.*) hooks: the first registration that returns a value skips later ones and the system implementation. Custom hooks: every registration runs.',
      ),
    );
    return {hooks};
  }
}
