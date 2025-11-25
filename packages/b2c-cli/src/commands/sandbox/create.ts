import {Args, Flags} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling/cli';
import {t} from '../../i18n/index.js';

/**
 * Stub command demonstrating OAuthCommand usage.
 * Sandbox API operations require OAuth but not instance credentials.
 */
export default class SandboxCreate extends OAuthCommand<typeof SandboxCreate> {
  static args = {
    realm: Args.string({
      description: 'Realm ID',
      required: true,
    }),
  };

  static description = t('commands.sandbox.create.description', 'Create a new on-demand sandbox');

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
    this.requireOAuthCredentials();

    const realm = this.args.realm;
    const profile = this.flags.profile;
    const ttl = this.flags.ttl;
    const clientId = this.resolvedConfig.clientId;

    this.log(t('commands.sandbox.create.creating', 'Creating sandbox in realm {{realm}}...', {realm}));
    this.log(t('commands.sandbox.create.profile', 'Profile: {{profile}}', {profile}));
    this.log(t('commands.sandbox.create.ttl', 'TTL: {{ttl}} hours', {ttl}));

    // TODO: Implement actual ODS API call using this.getOAuthStrategy()

    this.log('');
    this.log(t('commands.sandbox.create.stub', '(stub) Sandbox creation not yet implemented'));
    this.log(
      t('commands.sandbox.create.wouldCreate', 'Would create sandbox with OAuth client: {{clientId}}', {clientId}),
    );
  }
}
