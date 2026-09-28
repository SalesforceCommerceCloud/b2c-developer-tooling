/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {confirm, input} from '@inquirer/prompts';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import {updateInstanceConfig} from '@salesforce/b2c-tooling-sdk/config';
import type {MtlsCertificate} from '@salesforce/b2c-tooling-sdk/operations/mtls';
import {EcdnCommand} from '../../../utils/ecdn/index.js';
import {
  caKeySecurityNotice,
  clientCertificateNotice,
  defaultCaCommonName,
  generateAndUploadCodeUploadCertificate,
  stagingOrganizationWarning,
  type CodeUploadCertificateFiles,
} from '../../../utils/ecdn/mtls.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the setup command.
 */
interface SetupOutput {
  certificate?: MtlsCertificate;
  clientPassphrase?: string;
  /** Path of dw.json if it was updated */
  configUpdated?: string;
  created: boolean;
  files?: CodeUploadCertificateFiles;
}

/**
 * Interactive wizard for end-to-end mTLS code upload certificate setup.
 */
export default class EcdnMtlsSetup extends EcdnCommand<typeof EcdnMtlsSetup> {
  static description = withDocs(
    t(
      'commands.ecdn.mtls.setup.description',
      'Interactively set up two-factor (mTLS) code upload: generate and upload a CA, issue a client certificate, and configure dw.json',
    ),
    '/cli/ecdn.html#b2c-ecdn-mtls-setup',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd'];

  static flags = {
    ...EcdnCommand.baseFlags,
    'p12-passphrase': Flags.string({
      description: t('flags.p12Passphrase.description', 'Passphrase for the generated .p12 (default: random)'),
      env: 'SFCC_MTLS_P12_PASSPHRASE',
    }),
  };

  async run(): Promise<SetupOutput> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      this.error(
        t(
          'commands.ecdn.mtls.setup.notInteractive',
          'This command is interactive. For non-interactive use, run "b2c ecdn mtls create --generate".',
        ),
      );
    }

    this.requireOAuthCredentials();

    const stagingWarning = stagingOrganizationWarning(this.getOrganizationId());
    if (stagingWarning) this.warn(stagingWarning);

    const existing = await this.listExisting();
    if (existing.length > 0) {
      ux.stdout(t('commands.ecdn.mtls.setup.existing', 'Existing code upload certificates:'));
      for (const cert of existing) {
        ux.stdout(
          `  - ${cert.mtlsCertificateName ?? cert.mtlsCertificateId} (expires ${cert.expiresOn ?? '-'}, hostname ${cert.mtlsAssociatedCodeUploadHostname ?? '-'})`,
        );
      }
      ux.stdout('');
      ux.stdout(
        t(
          'commands.ecdn.mtls.setup.rotationHint',
          'Create a new CA to rotate an expiring or compromised one: keep the old CA until every client certificate is re-issued from the new CA, then remove it with "b2c ecdn mtls delete".',
        ),
      );
      const proceed = await confirm({
        message: t('commands.ecdn.mtls.setup.createAnother', 'Create a new CA certificate?'),
        default: false,
      });
      if (!proceed) {
        ux.stdout(
          t(
            'commands.ecdn.mtls.setup.useIssue',
            'To add a client certificate for an existing CA, use "b2c ecdn mtls issue".',
          ),
        );
        return {created: false};
      }
    }

    const name = await input({
      message: t('commands.ecdn.mtls.setup.namePrompt', 'Certificate name:'),
      default: 'code-upload',
      validate: (v) => v.trim().length > 0 || 'Name is required',
    });
    const clientName = await input({
      message: t(
        'commands.ecdn.mtls.setup.clientNamePrompt',
        'Client certificate name (recommended: your Business Manager username):',
      ),
      default: this.resolvedConfig.values.username ?? os.userInfo().username,
      validate: (v) => v.trim().length > 0 || 'Name is required',
    });
    const outDir = await input({
      message: t('commands.ecdn.mtls.setup.outDirPrompt', 'Directory for generated files:'),
      default: 'mtls-certs',
    });

    const force = await this.confirmOverwrite(outDir);
    if (force === undefined) {
      return {created: false};
    }

    const result = await generateAndUploadCodeUploadCertificate({
      client: this.getCdnZonesRwClient(),
      organizationId: this.getOrganizationId(),
      name: name.trim(),
      caCommonName: defaultCaCommonName(name.trim(), this.resolvedConfig.values.hostname),
      clientName: clientName.trim(),
      outDir,
      passphrase: this.flags['p12-passphrase'],
      force,
      onProgress: (message) => ux.stdout(message),
    }).catch((error: unknown) => this.error(error instanceof Error ? error.message : String(error)));

    const output: SetupOutput = {created: true, ...result};
    output.configUpdated = await this.maybeUpdateConfig(result.certificate, result.files, result.clientPassphrase);

    const cert = result.certificate;
    ux.stdout('');
    ux.stdout(ux.colorize('green', t('commands.ecdn.mtls.setup.success', 'Two-factor code upload is set up.')));
    ux.stdout(`  Certificate ID:  ${cert.mtlsCertificateId ?? '-'}`);
    ux.stdout(`  Hostname:        ${cert.mtlsAssociatedCodeUploadHostname ?? '-'}`);
    ux.stdout(`  CA certificate:  ${result.files.caCertificate}`);
    ux.stdout('');
    ux.stdout(caKeySecurityNotice(result.files.caPrivateKey, result.caExpiresOn));
    ux.stdout('');
    ux.stdout(
      clientCertificateNotice({
        file: result.files.clientCertificate,
        hostname: cert.mtlsAssociatedCodeUploadHostname,
        passphrase: result.clientPassphrase,
      }),
    );
    if (output.configUpdated) {
      ux.stdout('');
      ux.stdout(
        t(
          'commands.ecdn.mtls.setup.configNote',
          'dw.json now contains the .p12 passphrase; make sure dw.json is not committed to your repository.',
        ),
      );
    }

    return output;
  }

  /**
   * Returns `false` if no generated files exist, `true` if the user agreed to overwrite, or `undefined` to cancel.
   */
  private async confirmOverwrite(outDir: string): Promise<boolean | undefined> {
    const existing = ['ca.pem', 'ca.key'].map((f) => path.resolve(outDir, f)).filter((f) => fs.existsSync(f));
    if (existing.length === 0) {
      return false;
    }
    const overwrite = await confirm({
      message: t('commands.ecdn.mtls.setup.overwrite', 'Overwrite existing files ({{files}})?', {
        files: existing.join(', '),
      }),
      default: false,
    });
    return overwrite ? true : undefined;
  }

  private async listExisting(): Promise<MtlsCertificate[]> {
    const {data, error} = await this.getCdnZonesClient().GET(
      '/organizations/{organizationId}/mtls/code-upload-certificates',
      {params: {path: {organizationId: this.getOrganizationId()}}},
    );
    if (error) {
      this.logger.debug({error}, 'Failed to list existing mTLS certificates');
      return [];
    }
    return data?.data ?? [];
  }

  private async maybeUpdateConfig(
    cert: MtlsCertificate,
    files: CodeUploadCertificateFiles,
    passphrase: string,
  ): Promise<string | undefined> {
    // Prefer the dw.json the configuration was actually loaded from (it may be in a parent directory).
    const loadedFrom = this.resolvedConfig.sources.find((s) => s.name === 'DwJsonSource' && s.location)?.location;
    const dwJsonPath = path.resolve(
      loadedFrom ?? this.flags.config ?? path.join(this.flags['project-directory'] ?? process.cwd(), 'dw.json'),
    );
    if (!fs.existsSync(dwJsonPath)) {
      ux.stdout(
        t(
          'commands.ecdn.mtls.setup.noConfig',
          'No dw.json found; configure "webdav-hostname", "certificate", and "certificate-passphrase" manually.',
        ),
      );
      return undefined;
    }

    const update = await confirm({
      message: t(
        'commands.ecdn.mtls.setup.updateConfig',
        'Update {{path}} with the code upload hostname, certificate, and passphrase?',
        {path: dwJsonPath},
      ),
      default: true,
    });
    if (!update) {
      return undefined;
    }

    try {
      const result = await updateInstanceConfig(
        {
          webdavHostname: cert.mtlsAssociatedCodeUploadHostname,
          certificate: path.relative(path.dirname(dwJsonPath), files.clientCertificate),
          certificatePassphrase: passphrase,
        },
        {path: dwJsonPath, instance: this.flags.instance},
      );
      ux.stdout(
        t('commands.ecdn.mtls.setup.configUpdated', 'Updated instance "{{name}}" in {{path}}', {
          name: result.name ?? 'root',
          path: result.path,
        }),
      );
      return result.path;
    } catch (error) {
      this.warn(
        t('commands.ecdn.mtls.setup.configUpdateFailed', 'Could not update dw.json: {{message}}', {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
      return undefined;
    }
  }
}
