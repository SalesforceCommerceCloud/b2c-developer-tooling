/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {ERROR_CODE} from '@salesforce/b2c-tooling-sdk/cli';
import {SlasClientCommand, formatApiError, isSlasNotFound, readJsonObjectInput} from '../../../utils/slas/client.js';
import {
  IDP_PROVIDERS,
  REDACTED,
  buildIdpRequest,
  defaultIdpRedirectUrl,
  isValidIdpName,
  printIdp,
  redactIdp,
  type IdentityProvider,
  type IdentityProviderRequest,
} from '../../../utils/slas/idp.js';
import {t, withDocs} from '../../../i18n/index.js';

const listFlag = (description: string) =>
  Flags.string({description, multiple: true, multipleNonGreedy: true, delimiter: ','});

export default class SlasIdpSet extends SlasClientCommand<typeof SlasIdpSet> {
  static args = {
    name: Args.string({
      description: `Identity provider name: a provider (${IDP_PROVIDERS.join(', ')}), optionally followed by -<suffix>`,
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.slas.idp.set.description',
      'Create or update a SLAS identity provider\n\nUpdates start from the current configuration, so pass only the fields to change. Use --file for a full JSON configuration (for example, the output of "slas idp get --json --show-secret").',
    ),
    '/cli/slas.html#b2c-slas-idp-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> google --tenant-id abcd_123 --idp-client-id 1234.apps.googleusercontent.com --idp-client-secret xxx --well-known-url https://accounts.google.com/.well-known/openid-configuration --auth-url https://accounts.google.com/o/oauth2/v2/auth --token-url https://oauth2.googleapis.com/token --token-info-url https://oauth2.googleapis.com/tokeninfo --user-info-url https://www.googleapis.com/oauth2/v3/userinfo --scopes openid,email,profile',
    '<%= config.bin %> <%= command.id %> okta-staging --tenant-id abcd_123 --file okta.json',
    '<%= config.bin %> <%= command.id %> google --tenant-id abcd_123 --scopes openid,email,profile --preferred',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    file: Flags.string({
      description: 'JSON file with IDP configuration fields ("-" reads stdin); flags override file values',
    }),
    'idp-client-id': Flags.string({description: 'Client ID registered with the identity provider'}),
    'idp-client-secret': Flags.string({description: 'Client secret registered with the identity provider'}),
    'auth-url': Flags.string({description: 'IDP authorization URL'}),
    'token-url': Flags.string({description: 'IDP token URL'}),
    'token-info-url': Flags.string({description: 'IDP token info (introspection) URL'}),
    'user-info-url': Flags.string({description: 'IDP user info URL'}),
    'well-known-url': Flags.string({description: 'IDP OpenID configuration (well-known) URL'}),
    'redirect-url': Flags.string({
      description: 'SLAS callback URL registered with the IDP (default: the SLAS IDP callback for this name)',
    }),
    scopes: listFlag('Scopes to request from the IDP (comma-separated)'),
    'login-merge-claims': listFlag('User info claims used to merge with existing shopper profiles (comma-separated)'),
    'claim-mapper': listFlag('OIDC claim mappings as slasKey=claim (comma-separated)'),
    preferred: Flags.boolean({description: 'Make this the preferred identity provider for the tenant', allowNo: true}),
    'client-creds-body': Flags.boolean({
      description: 'Send IDP client credentials in the POST body instead of a Basic header',
      allowNo: true,
    }),
    'use-well-known': Flags.boolean({
      description: 'Populate endpoints and scopes from the well-known URL',
      allowNo: true,
    }),
    'team-id': Flags.string({description: 'Apple team ID (Sign in with Apple)'}),
    'key-id': Flags.string({description: 'Apple key ID (Sign in with Apple)'}),
    'show-secret': Flags.boolean({description: 'Show the IDP client secret in output', default: false}),
  };

  async run(): Promise<IdentityProvider> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const {name} = this.args;
    const f = this.flags;

    if (!isValidIdpName(name)) {
      this.error(
        t(
          'commands.slas.idp.set.invalidName',
          'Invalid identity provider name "{{name}}". Use a provider name ({{providers}}), optionally followed by -<suffix>, for example google-staging.',
          {name, providers: IDP_PROVIDERS.join(', ')},
        ),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    let fileValues: Partial<IdentityProviderRequest> = {};
    if (f.file) {
      try {
        fileValues = (await readJsonObjectInput(f.file)) as Partial<IdentityProviderRequest>;
      } catch (error) {
        this.error(
          t('commands.slas.idp.set.fileError', 'Failed to read {{file}}: {{message}}', {
            file: f.file,
            message: (error as Error).message,
          }),
          {code: ERROR_CODE.VALIDATION},
        );
      }
      // Accept the published contract field name too.
      const legacy = fileValues as Record<string, unknown>;
      if (legacy.preferenceValue !== undefined && legacy.isPreferred === undefined) {
        legacy.isPreferred = legacy.preferenceValue;
      }
      delete legacy.preferenceValue;
      if (fileValues.clientSecret === REDACTED) delete fileValues.clientSecret;
    }

    const flagValues: Partial<IdentityProviderRequest> = {
      clientId: f['idp-client-id'],
      clientSecret: f['idp-client-secret'],
      authUrl: f['auth-url'],
      tokenUrl: f['token-url'],
      tokenInfoUrl: f['token-info-url'],
      userInfoUrl: f['user-info-url'],
      wellKnownUrl: f['well-known-url'],
      redirectUrl: f['redirect-url'],
      scopes: f.scopes,
      loginMergeClaims: f['login-merge-claims'],
      oidcClaimMapper: f['claim-mapper'],
      isPreferred: f.preferred,
      isClientCredsBody: f['client-creds-body'],
      useWellKnown: f['use-well-known'],
      teamId: f['team-id'],
      keyId: f['key-id'],
    };
    // Drop unset flags first so they do not erase --file values.
    const setFlags = Object.fromEntries(Object.entries(flagValues).filter(([, v]) => v !== undefined));
    const changes = {...fileValues, ...setFlags} as Partial<IdentityProviderRequest>;

    const slasClient = this.getSlasClient();
    const current = await slasClient.GET('/tenants/{tenantId}/idps/{name}', {params: {path: {tenantId, name}}});
    let existing: IdentityProvider | undefined;
    if (current.error) {
      if (!isSlasNotFound(current.error, current.response, 'IdpNotFoundException')) {
        this.error(
          t('commands.slas.idp.get.error', 'Failed to get identity provider: {{message}}', {
            message: formatApiError(current.error, current.response),
          }),
        );
      }
    } else {
      existing = current.data as IdentityProvider;
    }

    if (!existing && !changes.redirectUrl) {
      changes.redirectUrl = defaultIdpRedirectUrl(this.resolvedConfig.values.shortCode!, name);
    }

    const body = buildIdpRequest(name, existing, changes);

    if (!existing) {
      const required = [
        'clientId',
        'clientSecret',
        'authUrl',
        'tokenUrl',
        'tokenInfoUrl',
        'userInfoUrl',
        'wellKnownUrl',
        'scopes',
      ] as const;
      const missing = required.filter((k) => body[k] === undefined || body[k] === '');
      if (missing.length > 0) {
        this.error(
          t(
            'commands.slas.idp.set.missingFields',
            'Identity provider {{name}} does not exist yet. Provide these fields with flags or --file: {{fields}}',
            {name, fields: missing.join(', ')},
          ),
          {code: ERROR_CODE.VALIDATION},
        );
      }
    }

    if (!this.jsonEnabled()) {
      this.log(
        existing
          ? t('commands.slas.idp.set.updating', 'Updating identity provider {{name}}...', {name})
          : t('commands.slas.idp.set.creating', 'Creating identity provider {{name}}...', {name}),
      );
    }

    const {data, error, response} = await slasClient.PUT('/tenants/{tenantId}/idps/{name}', {
      params: {path: {tenantId, name}},
      body,
    });

    if (error) {
      this.error(
        t('commands.slas.idp.set.error', 'Failed to save identity provider: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    const idp = redactIdp(data as IdentityProvider, f['show-secret']);
    if (!this.jsonEnabled()) printIdp(idp);
    return idp;
  }
}
