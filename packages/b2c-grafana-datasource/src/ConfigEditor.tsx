/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Field, Input, SecretInput } from '@grafana/ui';

import { B2CMetricsDataSourceOptions, B2CMetricsSecureJsonData } from './types';

interface Props extends DataSourcePluginOptionsEditorProps<B2CMetricsDataSourceOptions, B2CMetricsSecureJsonData> {}

/**
 * ConfigEditor component for B2C Metrics datasource
 *
 * Provides form fields for:
 * - shortCode (instance short code)
 * - tenantId (organization/tenant identifier)
 * - clientId (OAuth client ID)
 * - accountManagerHost (optional, defaults to SDK value)
 * - clientSecret (secure field)
 */
export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  // Handler for jsonData field changes
  const onJsonDataChange = <K extends keyof B2CMetricsDataSourceOptions>(key: K) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      onOptionsChange({
        ...options,
        jsonData: {
          ...jsonData,
          [key]: event.target.value,
        },
      });
    };
  };

  // Handler for secureJsonData field changes
  const onSecretChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...secureJsonData,
        clientSecret: event.target.value,
      },
    });
  };

  // Handler for reset secure field
  const onResetSecret = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...secureJsonFields,
        clientSecret: false,
      },
      secureJsonData: {
        ...secureJsonData,
        clientSecret: '',
      },
    });
  };

  return (
    <div className="gf-form-group">
      <Field
        label="Short Code"
        description="Instance short code (e.g., zzpq_013)"
        required
        invalid={!jsonData.shortCode}
        error={!jsonData.shortCode ? 'Short code is required' : undefined}
      >
        <Input
          width={40}
          value={jsonData.shortCode || ''}
          onChange={onJsonDataChange('shortCode')}
          placeholder="zzpq_013"
        />
      </Field>

      <Field
        label="Tenant ID"
        description="Organization/tenant identifier (e.g., f_ecom_bdpx_prd or bdpx_prd)"
        required
        invalid={!jsonData.tenantId}
        error={!jsonData.tenantId ? 'Tenant ID is required' : undefined}
      >
        <Input
          width={40}
          value={jsonData.tenantId || ''}
          onChange={onJsonDataChange('tenantId')}
          placeholder="bdpx_prd"
        />
      </Field>

      <Field
        label="Client ID"
        description="OAuth client ID for Account Manager authentication"
        required
        invalid={!jsonData.clientId}
        error={!jsonData.clientId ? 'Client ID is required' : undefined}
      >
        <Input
          width={40}
          value={jsonData.clientId || ''}
          onChange={onJsonDataChange('clientId')}
          placeholder="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        />
      </Field>

      <Field
        label="Client Secret"
        description="OAuth client secret (stored encrypted)"
        required
        invalid={!secureJsonFields.clientSecret && !secureJsonData?.clientSecret}
        error={
          !secureJsonFields.clientSecret && !secureJsonData?.clientSecret
            ? 'Client secret is required'
            : undefined
        }
      >
        <SecretInput
          width={40}
          isConfigured={Boolean(secureJsonFields.clientSecret)}
          value={secureJsonData?.clientSecret || ''}
          onChange={onSecretChange}
          onReset={onResetSecret}
          placeholder="Enter client secret"
        />
      </Field>

      <Field
        label="Account Manager Host"
        description="Account Manager host (optional, defaults to account.demandware.com)"
      >
        <Input
          width={40}
          value={jsonData.accountManagerHost || ''}
          onChange={onJsonDataChange('accountManagerHost')}
          placeholder="account.demandware.com"
        />
      </Field>

      <Field
        label="API URL Override"
        description="Full Metrics API base URL including path (optional, for testing/local mock)"
      >
        <Input
          width={40}
          value={jsonData.apiUrl || ''}
          onChange={onJsonDataChange('apiUrl')}
          placeholder="http://mock-metrics:8080/observability/metrics/v1"
        />
      </Field>

      <Field
        label="Token URL Override"
        description="Full OAuth token endpoint URL (optional, for testing/local mock)"
      >
        <Input
          width={40}
          value={jsonData.tokenUrl || ''}
          onChange={onJsonDataChange('tokenUrl')}
          placeholder="http://mock-metrics:8080/dwsso/oauth2/access_token"
        />
      </Field>
    </div>
  );
}
