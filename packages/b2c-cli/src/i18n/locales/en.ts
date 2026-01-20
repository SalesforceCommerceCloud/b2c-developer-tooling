/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
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
    docs: {
      search: {
        description: 'Search Script API documentation',
        queryRequired: 'Query is required for search. Use --list to see all entries.',
        noResults: 'No documentation found matching: {{query}}',
        resultCount: 'Found {{count}} matches for "{{query}}"',
        totalCount: '{{count}} documentation entries available',
      },
      read: {
        description: 'Read Script API documentation for a class or module',
        notFound: 'No documentation found matching: {{query}}',
      },
      download: {
        description: 'Download Script API documentation from a B2C Commerce instance',
        downloading: 'Downloading documentation from {{hostname}}...',
        success: 'Downloaded {{count}} documentation files to {{path}}',
        archiveKept: 'Archive saved to: {{path}}',
      },
      schema: {
        description: 'Read an XSD schema file',
        queryRequired: 'Schema name is required. Use --list to see all schemas.',
        notFound: 'No schema found matching: {{query}}',
        available: 'Available schemas:',
        count: '{{count}} schemas available',
      },
    },
    code: {
      list: {
        description: 'List code versions on a B2C Commerce instance',
        fetching: 'Fetching code versions from {{hostname}}...',
        noVersions: 'No code versions found.',
        error: 'Failed to list code versions: {{message}}',
      },
      activate: {
        description: 'Activate or reload a code version',
        activating: 'Activating code version {{codeVersion}} on {{hostname}}...',
        activated: 'Code version {{codeVersion}} activated successfully',
        reloading: 'Reloading code version{{version}} on {{hostname}}...',
        reloaded: 'Code version{{version}} reloaded successfully',
        failed: 'Failed to activate code version: {{message}}',
        reloadFailed: 'Failed to reload code version: {{message}}',
        versionRequired: 'Code version is required. Provide as argument or use --code-version flag.',
      },
      delete: {
        description: 'Delete a code version',
        deleting: 'Deleting code version {{codeVersion}} from {{hostname}}...',
        deleted: 'Code version {{codeVersion}} deleted successfully',
        failed: 'Failed to delete code version: {{message}}',
        confirm: 'Are you sure you want to delete code version "{{codeVersion}}" on {{hostname}}? (y/n)',
        cancelled: 'Deletion cancelled',
      },
      deploy: {
        description: 'Deploy cartridges to a B2C Commerce instance',
        deploying: 'Deploying {{path}} to {{hostname}} ({{version}})',
        noCodeVersion: 'No code version specified, discovering active code version...',
        noActiveVersion: 'No active code version found. Specify one with --code-version.',
        summary: 'Deployed {{count}} cartridge(s) to {{codeVersion}}',
        reloaded: 'Code version reloaded',
        failed: 'Deployment failed: {{message}}',
      },
      watch: {
        description: 'Watch cartridges and upload changes to an instance',
        starting: 'Starting watcher for {{path}}',
        target: 'Target: {{hostname}}',
        codeVersion: 'Code Version: {{version}}',
        watching: 'Watching {{count}} cartridge(s)...',
        pressCtrlC: 'Press Ctrl+C to stop',
        stopping: '\nStopping watcher...',
        uploaded: '[UPLOAD] {{count}} file(s)',
        deleted: '[DELETE] {{count}} file(s)',
        error: 'Error: {{message}}',
        failed: 'Watch failed: {{message}}',
      },
    },
    sandbox: {
      create: {
        description: '',
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
    setup: {
      skills: {
        description: 'Install agent skills for AI-powered IDEs',
        downloading: 'Downloading skills from release {{version}}...',
        detecting: 'Detecting installed IDEs...',
        noSkills: 'No skills found.',
        noSkillsToInstall: 'No skills to install.',
        notFound: 'Skills not found: {{skills}}',
        noIdesDetected: 'No IDEs detected. Use --ide to specify target (e.g., --ide cursor --ide manual).',
        noIdesSelected: 'No IDEs selected.',
        claudeCodeRecommendation:
          'Note: For Claude Code, we recommend using the plugin marketplace for automatic updates:\n' +
          '  claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling\n' +
          '  claude plugin install b2c-cli\n' +
          '  claude plugin install b2c\n\n' +
          'Use --ide manual for manual installation to the same paths.',
        preview: 'Installing {{count}} skills to {{ides}} ({{scope}})',
        cancelled: 'Installation cancelled.',
        installed: 'Successfully installed {{count}} skill(s):',
        skippedCount: 'Skipped {{count}} skill(s):',
        errorsCount: 'Failed to install {{count}} skill(s):',
      },
    },
  },
};
