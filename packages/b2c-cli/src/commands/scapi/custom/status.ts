/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags, ux} from '@oclif/core';
import {OAuthCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createCustomApisClient,
  getApiErrorMessage,
  toOrganizationId,
  type CustomApisComponents,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type CustomApiEndpoint = CustomApisComponents['schemas']['CustomApiEndpoint'];

/**
 * Maps security scheme to human-readable API type.
 */
function getApiType(securityScheme?: string): string {
  switch (securityScheme) {
    case 'AmOAuth2': {
      return 'Admin';
    }
    case 'ShopperToken': {
      return 'Shopper';
    }
    default: {
      return securityScheme || '-';
    }
  }
}

/**
 * Rolled-up endpoint with sites combined.
 * Multiple endpoints with same API/version/path/method are grouped, with siteIds combined.
 */
interface RolledUpEndpoint extends Omit<CustomApiEndpoint, 'siteId'> {
  siteIds: string[];
  type: string;
}

/**
 * Creates a unique key for grouping endpoints.
 */
function getEndpointKey(endpoint: CustomApiEndpoint): string {
  return [
    endpoint.apiName,
    endpoint.apiVersion,
    endpoint.cartridgeName,
    endpoint.endpointPath,
    endpoint.httpMethod,
    endpoint.status,
    endpoint.securityScheme,
  ].join('|');
}

/**
 * Rolls up endpoints by combining those with the same key into a single entry with multiple siteIds.
 */
function rollUpEndpoints(endpoints: CustomApiEndpoint[]): RolledUpEndpoint[] {
  const grouped = new Map<string, RolledUpEndpoint>();

  for (const endpoint of endpoints) {
    const key = getEndpointKey(endpoint);
    const existing = grouped.get(key);

    if (existing) {
      // Add site to existing entry if not already present
      if (endpoint.siteId && !existing.siteIds.includes(endpoint.siteId)) {
        existing.siteIds.push(endpoint.siteId);
      }
    } else {
      // Create new rolled-up entry
      const {siteId, ...rest} = endpoint;
      grouped.set(key, {
        ...rest,
        siteIds: siteId ? [siteId] : [],
        type: getApiType(endpoint.securityScheme),
      });
    }
  }

  return [...grouped.values()];
}

/**
 * Response type for the status command.
 */
interface CustomApiStatusResponse {
  total: number;
  activeCodeVersion?: string;
  data: CustomApiEndpoint[];
}

const COLUMNS: Record<string, ColumnDef<RolledUpEndpoint>> = {
  type: {
    header: 'Type',
    get: (e) => e.type,
  },
  apiName: {
    header: 'API Name',
    get: (e) => e.apiName || '-',
  },
  apiVersion: {
    header: 'Version',
    get: (e) => e.apiVersion || '-',
  },
  cartridgeName: {
    header: 'Cartridge',
    get: (e) => e.cartridgeName || '-',
  },
  endpointPath: {
    header: 'Path',
    get: (e) => e.endpointPath || '-',
  },
  httpMethod: {
    header: 'Method',
    get: (e) => e.httpMethod || '-',
  },
  status: {
    header: 'Status',
    get: (e) => e.status || '-',
  },
  sites: {
    header: 'Sites',
    get: (e) => (e.siteIds.length > 0 ? e.siteIds.join(', ') : '-'),
    extended: true,
  },
  securityScheme: {
    header: 'Security',
    get: (e) => e.securityScheme || '-',
    extended: true,
  },
  operationId: {
    header: 'Operation ID',
    get: (e) => e.operationId || '-',
    extended: true,
  },
  schemaFile: {
    header: 'Schema File',
    get: (e) => e.schemaFile || '-',
    extended: true,
  },
  implementationScript: {
    header: 'Script',
    get: (e) => e.implementationScript || '-',
    extended: true,
  },
  errorReason: {
    header: 'Error Reason',
    get: (e) => e.errorReason || '-',
    extended: true,
  },
  id: {
    header: 'ID',
    get: (e) => e.id || '-',
    extended: true,
  },
};

/** Default columns shown without --extended */
const DEFAULT_COLUMNS = ['type', 'apiName', 'endpointPath', 'httpMethod', 'status'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Base command for SCAPI Custom API operations.
 */
abstract class ScapiCustomCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'tenant-id': Flags.string({
      description: 'Organization/tenant ID',
      env: 'SFCC_TENANT_ID',
      required: true,
    }),
  };
}

/**
 * Command to get the status of Custom API endpoints.
 */
export default class ScapiCustomStatus extends ScapiCustomCommand<typeof ScapiCustomStatus> {
  static description = withDocs(
    t('commands.scapi.custom.status.description', 'Get the status of Custom API endpoints'),
    '/cli/custom-apis.html#b2c-scapi-custom-status',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --status active',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --group-by type',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --group-by site',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --columns type,apiName,status,sites',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --json',
  ];

  static flags = {
    ...ScapiCustomCommand.baseFlags,
    status: Flags.string({
      char: 's',
      description: 'Filter by endpoint status',
      options: ['active', 'not_registered'],
    }),
    'group-by': Flags.string({
      char: 'g',
      description: 'Group output by field (type or site)',
      options: ['type', 'site'],
    }),
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Show all columns including extended fields',
      default: false,
    }),
  };

  async run(): Promise<CustomApiStatusResponse> {
    this.requireOAuthCredentials();

    const {'tenant-id': tenantId, status, 'group-by': groupBy} = this.flags;
    const {shortCode} = this.resolvedConfig.values;

    if (!shortCode) {
      this.error(
        t(
          'error.shortCodeRequired',
          'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
        ),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.scapi.custom.status.fetching', 'Fetching Custom API endpoints for {{tenantId}}...', {tenantId}),
      );
    }

    const oauthStrategy = this.getOAuthStrategy();
    const client = createCustomApisClient({shortCode, tenantId}, oauthStrategy);

    // Ensure organizationId has the required f_ecom_ prefix
    const organizationId = toOrganizationId(tenantId);

    const {
      data,
      error,
      response: httpResponse,
    } = await client.GET('/organizations/{organizationId}/endpoints', {
      params: {
        path: {organizationId},
        query: status ? {status: status as 'active' | 'not_registered'} : undefined,
      },
    });

    if (error) {
      this.error(
        t('commands.scapi.custom.status.error', 'Failed to fetch Custom API endpoints: {{message}}', {
          message: getApiErrorMessage(error, httpResponse),
        }),
      );
    }

    const endpoints = data?.data ?? [];
    const response: CustomApiStatusResponse = {
      total: data?.total ?? endpoints.length,
      activeCodeVersion: data?.activeCodeVersion,
      data: endpoints,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (endpoints.length === 0) {
      this.log(t('commands.scapi.custom.status.noEndpoints', 'No Custom API endpoints found.'));
      return response;
    }

    if (data?.activeCodeVersion) {
      this.log(
        t('commands.scapi.custom.status.codeVersion', 'Active code version: {{version}}', {
          version: data.activeCodeVersion,
        }),
      );
    }

    // Roll up endpoints to combine duplicate entries with different siteIds
    const rolledUp = rollUpEndpoints(endpoints);

    this.log(
      t('commands.scapi.custom.status.count', 'Found {{count}} endpoint(s):', {
        count: rolledUp.length,
      }),
    );
    this.log('');

    // Render with optional grouping
    this.renderEndpoints(rolledUp, groupBy as 'site' | 'type' | undefined);

    return response;
  }

  /**
   * Determines which columns to display based on flags.
   */
  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      // User specified explicit columns
      const requested = columnsFlag.split(',').map((c) => c.trim());
      const valid = tableRenderer.validateColumnKeys(requested);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${tableRenderer.getColumnKeys().join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      // Show all columns
      return tableRenderer.getColumnKeys();
    }

    // Default columns (non-extended)
    return DEFAULT_COLUMNS;
  }

  /**
   * Groups endpoints by a key function.
   */
  private groupEndpointsBy(
    endpoints: RolledUpEndpoint[],
    keyFn: (e: RolledUpEndpoint) => string,
  ): Map<string, RolledUpEndpoint[]> {
    const groups = new Map<string, RolledUpEndpoint[]>();
    for (const endpoint of endpoints) {
      const key = keyFn(endpoint);
      const group = groups.get(key) || [];
      group.push(endpoint);
      groups.set(key, group);
    }
    return groups;
  }

  /**
   * Renders endpoints, optionally grouped by type or site.
   */
  private renderEndpoints(endpoints: RolledUpEndpoint[], groupBy?: 'site' | 'type'): void {
    const columns = this.getSelectedColumns();

    if (!groupBy) {
      // No grouping - render flat table
      tableRenderer.render(endpoints, columns);
      return;
    }

    if (groupBy === 'type') {
      // Group by API type (Admin/Shopper)
      const grouped = this.groupEndpointsBy(endpoints, (e) => e.type);
      for (const [type, items] of grouped) {
        ux.stdout(`${type} APIs:\n`);
        tableRenderer.render(
          items,
          columns.filter((c) => c !== 'type'),
        );
        ux.stdout('\n');
      }
    } else if (groupBy === 'site') {
      // Group by site - each endpoint may appear under multiple sites
      const siteGroups = new Map<string, RolledUpEndpoint[]>();

      for (const endpoint of endpoints) {
        if (endpoint.siteIds.length === 0) {
          // No site - put in "Global" group
          const group = siteGroups.get('Global') || [];
          group.push(endpoint);
          siteGroups.set('Global', group);
        } else {
          for (const siteId of endpoint.siteIds) {
            const group = siteGroups.get(siteId) || [];
            group.push(endpoint);
            siteGroups.set(siteId, group);
          }
        }
      }

      // Sort site names
      const sortedSites = [...siteGroups.keys()].sort();
      for (const site of sortedSites) {
        const items = siteGroups.get(site)!;
        ux.stdout(`Site: ${site}\n`);
        tableRenderer.render(
          items,
          columns.filter((c) => c !== 'sites'),
        );
        ux.stdout('\n');
      }
    }
  }
}
