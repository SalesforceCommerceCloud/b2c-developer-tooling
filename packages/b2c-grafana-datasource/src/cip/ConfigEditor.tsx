/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Field, Input, SecretInput } from '@grafana/ui';

import { CIPDataSourceOptions, CIPSecureJsonData } from './types';

type Props = DataSourcePluginOptionsEditorProps<CIPDataSourceOptions, CIPSecureJsonData>;

export function ConfigEditor(props: Props) {
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonFields } = options;
  const secureJsonData = (options.secureJsonData || {}) as CIPSecureJsonData;

  const onJsonChange = (key: keyof CIPDataSourceOptions) => (e: ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({ ...options, jsonData: { ...jsonData, [key]: e.target.value } });

  const onSecretChange = (e: ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({ ...options, secureJsonData: { ...secureJsonData, clientSecret: e.target.value } });

  const onSecretReset = () =>
    onOptionsChange({
      ...options,
      secureJsonFields: { ...secureJsonFields, clientSecret: false },
      secureJsonData: { ...secureJsonData, clientSecret: '' },
    });

  return (
    <div className="gf-form-group">
      <Field label="Instance" description="CIP instance id, e.g. bdpx_prd (falls back to Tenant ID if blank)">
        <Input width={40} value={jsonData.instance || ''} onChange={onJsonChange('instance')} placeholder="bdpx_prd" />
      </Field>
      <Field label="Tenant ID" description="Used as the instance when Instance is blank">
        <Input width={40} value={jsonData.tenantId || ''} onChange={onJsonChange('tenantId')} placeholder="bdpx_prd" />
      </Field>
      <Field label="Client ID" description="OAuth client ID (Account Manager)">
        <Input width={40} value={jsonData.clientId || ''} onChange={onJsonChange('clientId')} />
      </Field>
      <Field label="Client Secret" description="OAuth client secret (stored encrypted)">
        <SecretInput
          width={40}
          isConfigured={Boolean(secureJsonFields?.clientSecret)}
          value={secureJsonData.clientSecret || ''}
          onChange={onSecretChange}
          onReset={onSecretReset}
        />
      </Field>
      <Field label="Account Manager Host" description="Optional (defaults to account.demandware.com)">
        <Input width={40} value={jsonData.accountManagerHost || ''} onChange={onJsonChange('accountManagerHost')} placeholder="account.demandware.com" />
      </Field>
      <Field label="CIP Host" description="Optional Avatica host override (staging analytics)">
        <Input width={40} value={jsonData.cipHost || ''} onChange={onJsonChange('cipHost')} placeholder="jdbc.analytics.commercecloud.salesforce.com" />
      </Field>
    </div>
  );
}
