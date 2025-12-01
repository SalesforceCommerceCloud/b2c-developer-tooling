import {ux} from '@oclif/core';
import cliui from 'cliui';
import {InstanceCommand} from '@salesforce/b2c-tooling/cli';
import {listCodeVersions, type CodeVersion, type CodeVersionResult} from '@salesforce/b2c-tooling/operations/code';
import {t} from '../../i18n/index.js';

export default class CodeList extends InstanceCommand<typeof CodeList> {
  static description = t('commands.code.list.description', 'List code versions on a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  async run(): Promise<CodeVersionResult> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.hostname!;

    this.log(t('commands.code.list.fetching', 'Fetching code versions from {{hostname}}...', {hostname}));

    const versions = await listCodeVersions(this.instance);

    const result: CodeVersionResult = {
      count: versions.length,
      data: versions,
      total: versions.length,
    };

    // In JSON mode, just return the data - oclif handles output to stdout
    if (this.jsonEnabled()) {
      return result;
    }

    // Human-readable table output to stdout
    if (versions.length === 0) {
      ux.stdout(t('commands.code.list.noVersions', 'No code versions found.'));
      return result;
    }

    this.printVersionsTable(versions);

    return result;
  }

  private printVersionsTable(versions: CodeVersion[]): void {
    const ui = cliui({width: process.stdout.columns || 80});

    // Header
    ui.div(
      {text: 'ID', width: 25, padding: [0, 2, 0, 0]},
      {text: 'Active', width: 10, padding: [0, 2, 0, 0]},
      {text: 'Rollback', width: 10, padding: [0, 2, 0, 0]},
      {text: 'Last Modified', width: 25, padding: [0, 2, 0, 0]},
      {text: 'Cartridges', padding: [0, 0, 0, 0]},
    );

    // Separator
    ui.div({text: '─'.repeat(80), padding: [0, 0, 0, 0]});

    // Rows
    for (const version of versions) {
      const lastModified = version.last_modification_time
        ? new Date(version.last_modification_time).toLocaleString()
        : '-';
      const cartridgeCount = version.cartridges?.length ?? 0;

      ui.div(
        {text: version.id || '', width: 25, padding: [0, 2, 0, 0]},
        {text: version.active ? 'Yes' : 'No', width: 10, padding: [0, 2, 0, 0]},
        {text: version.rollback ? 'Yes' : 'No', width: 10, padding: [0, 2, 0, 0]},
        {text: lastModified, width: 25, padding: [0, 2, 0, 0]},
        {text: String(cartridgeCount), padding: [0, 0, 0, 0]},
      );
    }

    ux.stdout(ui.toString());
  }
}
