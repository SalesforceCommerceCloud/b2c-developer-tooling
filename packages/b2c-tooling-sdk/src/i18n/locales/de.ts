/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * DE
 */
export const de = {
  error: {
    serverRequired: 'Server ist erforderlich. Setzen Sie --server, SFCC_SERVER Umgebungsvariable, oder dw.json.',
    codeVersionRequired:
      'Code-Version ist erforderlich. Setzen Sie --code-version, SFCC_CODE_VERSION Umgebungsvariable, oder dw.json.',
    oauthCredentialsRequired:
      'OAuth-Anmeldedaten erforderlich. Geben Sie --client-id/--client-secret an oder setzen Sie SFCC_CLIENT_ID/SFCC_CLIENT_SECRET.',
    webdavCredentialsRequired:
      'WebDAV-Anmeldedaten erforderlich. Geben Sie --username/--password oder --client-id/--client-secret an, oder setzen Sie SFCC_USERNAME/SFCC_PASSWORD oder SFCC_CLIENT_ID/SFCC_CLIENT_SECRET.',
    webdavCredentialsRequiredShort:
      'WebDAV-Anmeldedaten erforderlich. Geben Sie --username/--password oder --client-id/--client-secret an, oder setzen Sie entsprechende SFCC_* Umgebungsvariablen.',
    mrtApiKeyRequired: 'MRT API-Schlüssel erforderlich. Geben Sie --api-key an oder setzen Sie SFCC_MRT_API_KEY.',
  },
};
