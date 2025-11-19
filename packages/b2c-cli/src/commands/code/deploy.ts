import { Args, Command, Flags } from '@oclif/core';
import { B2CInstance, uploadCartridges } from '@salesforce/b2c-tooling';
import { loadConfig } from '../../config/loader.js';
import { AuthResolver } from '../../config/auth-resolver.js';

export default class Deploy extends Command {
  static args = {
    cartridgePath: Args.string({
      description: 'Path to cartridges directory',
      default: './cartridges',
    }),
  };

  static description = 'Deploy cartridges to a B2C Commerce instance';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./my-cartridges',
    '<%= config.bin %> <%= command.id %> --hostname my-sandbox.demandware.net --code-version v1',
  ];

  static flags = {
    hostname: Flags.string({
      char: 'h',
      description: 'Instance hostname',
    }),
    'code-version': Flags.string({
      char: 'v',
      description: 'Code version to deploy to',
    }),
    username: Flags.string({
      char: 'u',
      description: 'Username for Basic Auth',
    }),
    password: Flags.string({
      char: 'p',
      description: 'Password for Basic Auth',
    }),
    'client-id': Flags.string({
      description: 'Client ID for OAuth',
    }),
    'client-secret': Flags.string({
      description: 'Client Secret for OAuth',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Deploy);

    // 1. Load Config with precedence (CLI > Env > dw.json)
    const config = await loadConfig({
      hostname: flags.hostname,
      codeVersion: flags['code-version'],
      username: flags.username,
      password: flags.password,
      clientId: flags['client-id'],
      clientSecret: flags['client-secret'],
    });

    // Validate required config
    if (!config.hostname) {
      this.error('Hostname is required. Set via --hostname, DW_HOSTNAME env var, or dw.json');
    }

    if (!config.codeVersion) {
      this.error(
        'Code version is required. Set via --code-version, DW_CODE_VERSION env var, or dw.json'
      );
    }

    // 2. Create Auth Resolver
    const resolver = new AuthResolver(config);

    if (!resolver.hasWebDavCredentials()) {
      this.error(
        'No valid credentials found. Provide username/password or clientId/clientSecret.'
      );
    }

    // 3. Create Instance with WebDAV Auth Strategy
    const instance = new B2CInstance(
      {
        hostname: config.hostname,
        codeVersion: config.codeVersion,
      },
      resolver.getForWebDav()
    );

    // 4. Execute the operation
    this.log(`Deploying cartridges from ${args.cartridgePath}...`);
    this.log(`Target: ${config.hostname}`);
    this.log(`Code Version: ${config.codeVersion}`);

    try {
      await uploadCartridges(instance, args.cartridgePath);
      this.log('✓ Deployment complete');
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Deployment failed: ${error.message}`);
      }
      throw error;
    }
  }
}
