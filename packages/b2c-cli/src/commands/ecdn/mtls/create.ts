/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import * as fs from 'node:fs';
import {
  createCodeUploadCertificate,
  MAX_CODE_UPLOAD_CA_VALIDITY_DAYS,
  type MtlsCertificate,
} from '@salesforce/b2c-tooling-sdk/operations/mtls';
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
 * Response type for the create command.
 */
interface CreateOutput {
  /** Expiry of the generated CA (only with --generate) */
  caExpiresOn?: string;
  certificate: MtlsCertificate;
  /** Passphrase for the generated client certificate (only with --generate) */
  clientPassphrase?: string;
  /** Generated files (only with --generate) */
  files?: CodeUploadCertificateFiles;
}

/**
 * Command to create an mTLS certificate for code upload.
 */
export default class EcdnMtlsCreate extends EcdnCommand<typeof EcdnMtlsCreate> {
  static description = withDocs(
    t('commands.ecdn.mtls.create.description', 'Create an mTLS certificate for code upload authentication'),
    '/cli/ecdn.html#b2c-ecdn-mtls-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --name my-cert --certificate-file cert.pem --private-key-file key.pem',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --name my-cert --generate',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --name my-cert --generate --out-dir ./certs --client-name build-server',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
    name: Flags.string({
      description: t('flags.name.description', 'Certificate name for identification'),
      required: true,
    }),
    'certificate-file': Flags.string({
      description: t('flags.certificateFile.description', 'Path to PEM-encoded CA certificate file'),
      exactlyOne: ['certificate-file', 'generate'],
      dependsOn: ['private-key-file'],
    }),
    'private-key-file': Flags.string({
      description: t('flags.privateKeyFile.description', 'Path to PEM-encoded CA private key file'),
      dependsOn: ['certificate-file'],
    }),
    generate: Flags.boolean({
      description: t(
        'flags.generate.description',
        'Generate a new CA, upload it, and issue a client certificate (.p12) for code upload',
      ),
      exactlyOne: ['certificate-file', 'generate'],
    }),
    'out-dir': Flags.string({
      description: t('flags.outDir.description', 'Directory for generated files (with --generate)'),
      default: 'mtls-certs',
    }),
    'client-name': Flags.string({
      description: t(
        'flags.clientName.description',
        'Common name for the generated client certificate (with --generate; default: <name>-client)',
      ),
    }),
    'p12-passphrase': Flags.string({
      description: t(
        'flags.p12Passphrase.description',
        'Passphrase for the generated .p12 (with --generate; default: random)',
      ),
      env: 'SFCC_MTLS_P12_PASSPHRASE',
    }),
    'ca-common-name': Flags.string({
      description: t(
        'flags.caCommonName.description',
        'Common name for the generated CA (with --generate; default: the staging hostname if configured, else "<name> CA")',
      ),
    }),
    'ca-days': Flags.integer({
      description: t(
        'flags.caDays.description',
        'Validity of the generated CA certificate in days (with --generate; eCDN allows at most 365)',
      ),
      default: MAX_CODE_UPLOAD_CA_VALIDITY_DAYS,
      min: 1,
      max: MAX_CODE_UPLOAD_CA_VALIDITY_DAYS,
    }),
    'client-days': Flags.integer({
      description: t(
        'flags.clientDays.description',
        'Validity of the generated client certificate in days (with --generate; capped at the CA expiry)',
      ),
      default: 365,
      min: 1,
    }),
    force: Flags.boolean({
      description: t('flags.force.description', 'Overwrite existing generated files'),
      default: false,
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    const stagingWarning = stagingOrganizationWarning(this.getOrganizationId());
    if (stagingWarning) this.warn(stagingWarning);

    const output = this.flags.generate ? await this.generate() : await this.upload();

    if (this.jsonEnabled()) {
      return output;
    }

    const cert = output.certificate;
    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 20;

    ui.div('');
    ui.div({text: t('commands.ecdn.mtls.create.success', 'mTLS certificate created successfully!')});
    ui.div('');
    ui.div({text: 'Certificate ID:', width: labelWidth}, {text: cert.mtlsCertificateId || '-'});
    ui.div({text: 'Name:', width: labelWidth}, {text: cert.mtlsCertificateName || '-'});
    ui.div({text: 'Issuer:', width: labelWidth}, {text: cert.issuer || '-'});
    ui.div({text: 'Expires:', width: labelWidth}, {text: cert.expiresOn || '-'});

    if (cert.mtlsAssociatedCodeUploadHostname) {
      ui.div({text: 'Hostname:', width: labelWidth}, {text: cert.mtlsAssociatedCodeUploadHostname});
    }

    ux.stdout(ui.toString());

    if (output.files && output.clientPassphrase) {
      ux.stdout(`CA certificate (uploaded to eCDN): ${output.files.caCertificate}`);
      ux.stdout('');
      ux.stdout(caKeySecurityNotice(output.files.caPrivateKey, output.caExpiresOn));
      ux.stdout('');
      ux.stdout(
        clientCertificateNotice({
          file: output.files.clientCertificate,
          hostname: cert.mtlsAssociatedCodeUploadHostname,
          passphrase: output.clientPassphrase,
        }),
      );
    } else {
      ux.stdout(
        t(
          'commands.ecdn.mtls.create.issueHint',
          'Issue client certificates (.p12) signed by this CA for code upload with "b2c ecdn mtls issue".',
        ),
      );
    }

    return output;
  }

  private async generate(): Promise<CreateOutput> {
    const {flags} = this;
    try {
      return await generateAndUploadCodeUploadCertificate({
        client: this.getCdnZonesRwClient(),
        organizationId: this.getOrganizationId(),
        name: flags.name,
        caCommonName: flags['ca-common-name'] ?? defaultCaCommonName(flags.name, this.resolvedConfig.values.hostname),
        clientName: flags['client-name'] ?? `${flags.name}-client`,
        outDir: flags['out-dir'],
        passphrase: flags['p12-passphrase'],
        caValidityDays: flags['ca-days'],
        clientValidityDays: flags['client-days'],
        force: flags.force,
        onProgress: (message) => {
          if (!this.jsonEnabled()) this.log(message);
        },
      });
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }

  private async upload(): Promise<CreateOutput> {
    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mtls.create.creating', 'Creating mTLS certificate...'));
    }

    const certificatePem = fs.readFileSync(this.flags['certificate-file']!, 'utf8');
    const privateKeyPem = fs.readFileSync(this.flags['private-key-file']!, 'utf8');

    try {
      const certificate = await createCodeUploadCertificate(this.getCdnZonesRwClient(), this.getOrganizationId(), {
        name: this.flags.name,
        certificatePem,
        privateKeyPem,
      });
      return {certificate};
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
