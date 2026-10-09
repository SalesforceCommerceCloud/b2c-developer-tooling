/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {issueClientCertificate} from '@salesforce/b2c-tooling-sdk/operations/mtls';
import {assertFilesWritable, clientCertificateNotice, toFileStem, writePrivateFile} from '../../../utils/ecdn/mtls.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the issue command.
 */
interface IssueOutput {
  /** Path to the written PKCS12 file */
  file: string;
  /** Certificate expiry */
  notAfter: string;
  /** Passphrase protecting the PKCS12 file */
  passphrase: string;
  /** Hex serial number */
  serialNumber: string;
  /** Certificate subject */
  subject: string;
}

/**
 * Command to issue a client certificate (.p12) for mTLS code upload from an existing CA.
 */
export default class EcdnMtlsIssue extends BaseCommand<typeof EcdnMtlsIssue> {
  static description = withDocs(
    t(
      'commands.ecdn.mtls.issue.description',
      'Issue a client certificate (.p12) for mTLS code upload, signed by an existing CA (runs locally)',
    ),
    '/cli/ecdn.html#b2c-ecdn-mtls-issue',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --ca-cert-file mtls-certs/ca.pem --ca-key-file mtls-certs/ca.key --name jane.doe',
    '<%= config.bin %> <%= command.id %> --ca-cert-file ca.pem --ca-key-file ca.key --name ci --output ci.p12 --days 90',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    'ca-cert-file': Flags.string({
      description: t('flags.caCertFile.description', 'Path to PEM-encoded CA certificate file'),
      required: true,
    }),
    'ca-key-file': Flags.string({
      description: t('flags.caKeyFile.description', 'Path to PEM-encoded CA private key file'),
      required: true,
    }),
    name: Flags.string({
      description: t('flags.clientCommonName.description', 'Common name identifying the client (user or pipeline)'),
      required: true,
    }),
    output: Flags.string({
      char: 'o',
      description: t(
        'flags.p12Output.description',
        'Output path for the .p12 file (default: <name>.p12 next to the CA)',
      ),
    }),
    'p12-passphrase': Flags.string({
      description: t('flags.p12Passphrase.description', 'Passphrase for the .p12 (default: random)'),
      env: 'SFCC_MTLS_P12_PASSPHRASE',
    }),
    days: Flags.integer({
      description: t('flags.clientDays.description', 'Validity of the client certificate in days'),
      default: 365,
      min: 1,
    }),
    force: Flags.boolean({
      description: t('flags.force.description', 'Overwrite an existing output file'),
      default: false,
    }),
  };

  async run(): Promise<IssueOutput> {
    const {flags} = this;
    const file = path.resolve(
      flags.output ?? path.join(path.dirname(flags['ca-cert-file']), `${toFileStem(flags.name)}.p12`),
    );

    let issued: ReturnType<typeof issueClientCertificate>;
    try {
      assertFilesWritable([file], flags.force);
      issued = issueClientCertificate({
        ca: {
          certificatePem: fs.readFileSync(flags['ca-cert-file'], 'utf8'),
          privateKeyPem: fs.readFileSync(flags['ca-key-file'], 'utf8'),
        },
        commonName: flags.name,
        validityDays: flags.days,
        passphrase: flags['p12-passphrase'],
      });
      writePrivateFile(file, issued.pkcs12);
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }

    const output: IssueOutput = {
      file,
      passphrase: issued.passphrase,
      subject: issued.subject,
      serialNumber: issued.serialNumber,
      notAfter: issued.notAfter.toISOString(),
    };

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(t('commands.ecdn.mtls.issue.success', 'Client certificate issued successfully!'));
    ux.stdout(`  Subject:     ${output.subject}`);
    ux.stdout(`  Expires:     ${output.notAfter}`);
    ux.stdout('');
    ux.stdout(clientCertificateNotice({file: output.file, passphrase: output.passphrase}));
    ux.stdout('');
    ux.stdout(
      t(
        'commands.ecdn.mtls.issue.caReminder',
        'Reminder: return the CA private key to secure storage when you are done issuing certificates.',
      ),
    );

    return output;
  }
}
