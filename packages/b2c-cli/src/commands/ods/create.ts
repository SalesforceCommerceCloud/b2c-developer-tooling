import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling/cli';
import {t} from '../../i18n/index.js';

/**
 * Command to create a new on-demand sandbox.
 */
export default class OdsCreate extends OdsCommand<typeof OdsCreate> {
  static args = {
    realm: Args.string({
      description: 'Realm ID',
      required: true,
    }),
  };

  static description = t('commands.ods.create.description', 'Create a new on-demand sandbox');

  static examples = [
    '<%= config.bin %> <%= command.id %> abcd --ttl 24',
    '<%= config.bin %> <%= command.id %> abcd --profile medium',
  ];

  static flags = {
    ttl: Flags.integer({
      description: 'Time to live in hours',
      default: 24,
    }),
    profile: Flags.string({
      description: 'Sandbox profile (small, medium, large)',
      default: 'medium',
    }),
  };

  async run(): Promise<void> {
    const realm = this.args.realm;
    const profile = this.flags.profile;
    const ttl = this.flags.ttl;
    const clientId = this.resolvedConfig.clientId;

    this.log(t('commands.ods.create.creating', 'Creating sandbox in realm {{realm}}...', {realm}));
    this.log(t('commands.ods.create.profile', 'Profile: {{profile}}', {profile}));
    this.log(t('commands.ods.create.ttl', 'TTL: {{ttl}} hours', {ttl}));

    // TODO: Implement actual ODS API call using this.odsClient

    this.log('');
    this.log(t('commands.ods.create.stub', '(stub) Sandbox creation not yet implemented'));
    this.log(t('commands.ods.create.wouldCreate', 'Would create sandbox with OAuth client: {{clientId}}', {clientId}));
  }
}
