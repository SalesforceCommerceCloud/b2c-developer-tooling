/**
 * EN - English translations for b2c-cli commands.
 *
 * Note: These serve as documentation of translatable strings.
 * English defaults are also defined inline at point of use via t().
 */
export const en = {
  commands: {
    sites: {
      list: {
        description: 'List sites on a B2C Commerce instance',
        fetching: 'Fetching sites from {{hostname}}...',
        fetchFailed: 'Failed to fetch sites: {{status}} {{statusText}}\n{{error}}',
        noSites: 'No sites found.',
        foundSites: 'Found {{count}} site(s):',
        displayName: 'Display Name: {{name}}',
        status: 'Status: {{status}}',
        error: 'Failed to fetch sites: {{message}}',
      },
    },
    code: {
      deploy: {
        description: 'Deploy cartridges to a B2C Commerce instance',
        deploying: 'Deploying cartridges from {{path}}...',
        target: 'Target: {{hostname}}',
        codeVersion: 'Code Version: {{version}}',
        complete: 'Deployment complete',
        failed: 'Deployment failed: {{message}}',
      },
    },
    sandbox: {
      create: {
        description: 'Create a new on-demand sandbox',
        creating: 'Creating sandbox in realm {{realm}}...',
        profile: 'Profile: {{profile}}',
        ttl: 'TTL: {{ttl}} hours',
        stub: '(stub) Sandbox creation not yet implemented',
        wouldCreate: 'Would create sandbox with OAuth client: {{clientId}}',
      },
    },
    mrt: {
      envVar: {
        set: {
          description: 'Set an environment variable on a Managed Runtime project',
          setting: 'Setting {{key}} on {{project}}/{{environment}}...',
          stub: '(stub) Environment variable setting not yet implemented',
          wouldSet: 'Would set {{key}}={{value}}',
          project: 'Project: {{project}}',
          environment: 'Environment: {{environment}}',
        },
      },
    },
  },
};
