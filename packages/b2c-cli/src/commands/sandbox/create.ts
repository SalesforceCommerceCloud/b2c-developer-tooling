/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getApiErrorMessage,
  SandboxPollingError,
  SandboxPollingTimeoutError,
  SandboxTerminalStateError,
  waitForSandbox,
  type OdsComponents,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];
type SandboxResourceProfile = OdsComponents['schemas']['SandboxResourceProfile'];
type OcapiSettings = OdsComponents['schemas']['OcapiSettings'];
type WebDavSettings = OdsComponents['schemas']['WebDavSettings'];
type SandboxSettings = OdsComponents['schemas']['SandboxSettings'];

/**
 * Default OCAPI resources to grant the client ID access to.
 * These enable common CI/CD operations like code deployment and job execution.
 */

const DEFAULT_OCAPI_RESOURCES: NonNullable<OcapiSettings[number]['resources']> = [
  {resource_id: '/code_versions', methods: ['get'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/code_versions/*', methods: ['patch', 'delete'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/jobs/*/executions', methods: ['post'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/jobs/*/executions/*', methods: ['get'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/sites/*/cartridges', methods: ['post'], read_attributes: '(**)', write_attributes: '(**)'},
];

/**
 * Default WebDAV permissions to grant the client ID.
 * These enable common operations like code upload and data import/export.
 */
const DEFAULT_WEBDAV_PERMISSIONS: WebDavSettings[number]['permissions'] = [
  {path: '/impex', operations: ['read_write']},
  {path: '/cartridges', operations: ['read_write']},
  {path: '/static', operations: ['read_write']},
];

/**
 * Command to create a new on-demand sandbox.
 */
export default class SandboxCreate extends OdsCommand<typeof SandboxCreate> {
  static aliases = ['ods:create'];

  static description = withDocs(
    t('commands.sandbox.create.description', 'Create a new on-demand sandbox'),
    '/cli/sandbox.html#b2c-sandbox-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --realm abcd',
    '<%= config.bin %> <%= command.id %> --realm abcd --ttl 48',
    '<%= config.bin %> <%= command.id %> --realm abcd --profile large',
    '<%= config.bin %> <%= command.id %> --realm abcd --auto-scheduled',
    '<%= config.bin %> <%= command.id %> --realm abcd --wait',
    '<%= config.bin %> <%= command.id %> --realm abcd --wait --poll-interval 15',
    '<%= config.bin %> <%= command.id %> --realm abcd --json',
  ];

  static flags = {
    realm: Flags.string({
      char: 'r',
      description: 'Realm ID (four-letter ID)',
      required: true,
    }),
    ttl: Flags.integer({
      description: 'Time to live in hours (0 for infinite)',
      default: 24,
    }),
    profile: Flags.string({
      description: 'Resource profile (medium, large, xlarge, xxlarge)',
      default: 'medium',
      options: ['medium', 'large', 'xlarge', 'xxlarge'],
    }),
    'auto-scheduled': Flags.boolean({
      description: 'Enable automatic start/stop scheduling',
      default: false,
    }),
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the sandbox to reach started or failed state before returning',
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when using --wait',
      default: 10,
      dependsOn: ['wait'],
    }),
    timeout: Flags.integer({
      description: 'Maximum time to wait in seconds when using --wait (0 for no timeout)',
      default: 600,
      dependsOn: ['wait'],
    }),
    'set-permissions': Flags.boolean({
      description: 'Automatically set OCAPI and WebDAV permissions for the client ID used to create the sandbox',
      default: true,
      allowNo: true,
    }),
    'permissions-client-id': Flags.string({
      description: 'Client ID to use for default OCAPI/WebDAV permissions (defaults to auth client ID)',
    }),
    'ocapi-settings': Flags.string({
      description:
        'Custom OCAPI settings JSON array (replaces defaults). Format: [{"client_id":"...","resources":[...]}]',
    }),
    'webdav-settings': Flags.string({
      description:
        'Custom WebDAV settings JSON array (replaces defaults). Format: [{"client_id":"...","permissions":[...]}]',
    }),
    'start-scheduler': Flags.string({
      description: 'Start schedule JSON. Format: {"weekdays":["MONDAY",...],"time":"08:00:00+03:00"}',
    }),
    'stop-scheduler': Flags.string({
      description: 'Stop schedule JSON. Format: {"weekdays":["MONDAY",...],"time":"19:00:00Z"}',
    }),
  };

  async run(): Promise<SandboxModel> {
    const realm = this.flags.realm;
    const profile = this.flags.profile as SandboxResourceProfile;
    const ttl = this.flags.ttl;
    const autoScheduled = this.flags['auto-scheduled'];
    const wait = this.flags.wait;
    const pollInterval = this.flags['poll-interval'];
    const timeout = this.flags.timeout;
    const setPermissions = this.flags['set-permissions'];
    const permissionsClientId = this.flags['permissions-client-id'];
    const ocapiSettingsRaw = this.flags['ocapi-settings'];
    const webdavSettingsRaw = this.flags['webdav-settings'];
    const startSchedulerRaw = this.flags['start-scheduler'];
    const stopSchedulerRaw = this.flags['stop-scheduler'];

    this.log(t('commands.sandbox.create.creating', 'Creating sandbox in realm {{realm}}...', {realm}));
    this.log(t('commands.sandbox.create.profile', 'Profile: {{profile}}', {profile}));
    this.log(t('commands.sandbox.create.ttl', 'TTL: {{ttl}} hours', {ttl: ttl === 0 ? 'infinite' : String(ttl)}));

    // Build settings with OCAPI and WebDAV permissions if enabled
    const settings = this.buildSettings({
      setPermissions,
      permissionsClientId,
      ocapiSettings: ocapiSettingsRaw,
      webdavSettings: webdavSettingsRaw,
    });
    if (settings) {
      const effectiveClientId = permissionsClientId || this.resolvedConfig.values.clientId;
      const hasCustom = ocapiSettingsRaw || webdavSettingsRaw;
      this.log(
        t(
          'commands.sandbox.create.settingPermissions',
          'Setting OCAPI and WebDAV permissions for client ID: {{clientId}}',
          {clientId: hasCustom ? 'custom settings' : effectiveClientId!},
        ),
      );
    }

    // Parse scheduler flags
    const startScheduler = startSchedulerRaw ? this.parseJsonFlag('start-scheduler', startSchedulerRaw) : undefined;
    const stopScheduler = stopSchedulerRaw ? this.parseJsonFlag('stop-scheduler', stopSchedulerRaw) : undefined;

    const result = await this.odsClient.POST('/sandboxes', {
      body: {
        realm,
        ttl,
        resourceProfile: profile,
        autoScheduled,
        analyticsEnabled: false,
        settings,
        startScheduler,
        stopScheduler,
      },
    });

    if (!result.data?.data) {
      this.error(
        t('commands.sandbox.create.error', 'Failed to create sandbox: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    let sandbox = result.data.data;

    this.log('');
    this.logger.info({sandboxId: sandbox.id}, t('commands.sandbox.create.success', 'Sandbox created successfully'));

    if (wait && sandbox.id) {
      this.log(t('commands.sandbox.create.waiting', 'Waiting for sandbox to get started..'));

      try {
        await waitForSandbox(this.odsClient, {
          sandboxId: sandbox.id,
          targetState: 'started',
          pollIntervalSeconds: pollInterval,
          timeoutSeconds: timeout,
          onPoll: ({elapsedSeconds, state}) => {
            this.logger.info(
              {sandboxId: sandbox.id, elapsed: elapsedSeconds, state},
              `[${elapsedSeconds}s] State: ${state}`,
            );
          },
        });
      } catch (error) {
        if (error instanceof SandboxPollingTimeoutError) {
          this.error(
            t('commands.sandbox.create.timeout', 'Timeout waiting for sandbox after {{seconds}} seconds', {
              seconds: String(error.timeoutSeconds),
            }),
          );
        }

        if (error instanceof SandboxTerminalStateError) {
          if (error.state === 'deleted') {
            this.error(t('commands.sandbox.create.deleted', 'Sandbox was deleted'));
          }
          this.error(t('commands.sandbox.create.failed', 'Sandbox creation failed'));
        }

        if (error instanceof SandboxPollingError) {
          this.error(
            t('commands.sandbox.create.pollError', 'Failed to fetch sandbox status: {{message}}', {
              message: error.message,
            }),
          );
        }

        throw error;
      }

      const finalResult = await this.odsClient.GET('/sandboxes/{sandboxId}', {
        params: {
          path: {sandboxId: sandbox.id},
        },
      });

      if (!finalResult.data?.data) {
        this.error(
          t('commands.sandbox.create.pollError', 'Failed to fetch sandbox status: {{message}}', {
            message: finalResult.response?.statusText || 'Unknown error',
          }),
        );
      }

      sandbox = finalResult.data.data;

      this.log('');
      this.logger.info({sandboxId: sandbox.id}, t('commands.sandbox.create.ready', 'Sandbox is now ready'));
    }

    if (this.jsonEnabled()) {
      return sandbox;
    }

    this.printSandboxSummary(sandbox);

    return sandbox;
  }

  /**
   * Builds the sandbox settings object with OCAPI and WebDAV permissions.
   * @returns Settings object or undefined if permissions should not be set
   */
  private buildSettings(options: {
    setPermissions: boolean;
    permissionsClientId?: string;
    ocapiSettings?: string;
    webdavSettings?: string;
  }): SandboxSettings | undefined {
    if (!options.setPermissions) {
      return undefined;
    }

    const hasCustomOcapi = options.ocapiSettings !== undefined;
    const hasCustomWebdav = options.webdavSettings !== undefined;

    const clientId = options.permissionsClientId || this.resolvedConfig.values.clientId;

    // If no custom settings and no client ID, we can't build defaults
    if (!hasCustomOcapi && !hasCustomWebdav && !clientId) {
      return undefined;
    }

    const ocapi: OcapiSettings = hasCustomOcapi
      ? this.parseJsonFlag('ocapi-settings', options.ocapiSettings!)
      : clientId
        ? [{client_id: clientId, resources: DEFAULT_OCAPI_RESOURCES}]
        : [];

    const webdav: WebDavSettings = hasCustomWebdav
      ? this.parseJsonFlag('webdav-settings', options.webdavSettings!)
      : clientId
        ? [{client_id: clientId, permissions: DEFAULT_WEBDAV_PERMISSIONS}]
        : [];

    return {ocapi, webdav};
  }

  private parseJsonFlag<T>(flagName: string, value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      this.error(`Invalid JSON for --${flagName}: ${value}`);
    }
  }

  private printSandboxSummary(sandbox: SandboxModel): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: '', padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['ID', sandbox.id],
      ['Realm', sandbox.realm],
      ['Instance', sandbox.instance],
      ['State', sandbox.state],
      ['Profile', sandbox.resourceProfile],
      ['Hostname', sandbox.hostName],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 15, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    if (sandbox.links?.bm) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'BM URL:', width: 15, padding: [0, 2, 0, 0]}, {text: sandbox.links.bm, padding: [0, 0, 0, 0]});
    }

    ux.stdout(ui.toString());
  }
}
