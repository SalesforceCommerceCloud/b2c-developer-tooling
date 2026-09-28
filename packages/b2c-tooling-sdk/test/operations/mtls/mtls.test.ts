/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {X509Certificate} from 'node:crypto';
import type {AddressInfo} from 'node:net';
import * as tls from 'node:tls';
import {expect} from 'chai';
import forge from 'node-forge';
import type {CdnZonesClient} from '../../../src/clients/index.js';
import {
  createCodeUploadCertificate,
  generateCaCertificate,
  generatePassphrase,
  issueClientCertificate,
  validateCodeUploadCaCertificate,
  type GeneratedCertificate,
} from '../../../src/operations/mtls/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('operations/mtls', () => {
  let ca: GeneratedCertificate;

  before(() => {
    ca = generateCaCertificate({commonName: 'Test CA', organization: 'Test Org', validityDays: 30});
  });

  describe('generatePassphrase', () => {
    it('generates distinct URL-safe passphrases', () => {
      const a = generatePassphrase();
      const b = generatePassphrase();
      expect(a).to.match(/^[\w-]{32}$/);
      expect(a).to.not.equal(b);
    });
  });

  describe('generateCaCertificate', () => {
    it('generates a self-signed CA certificate', () => {
      const x509 = new X509Certificate(ca.certificatePem);
      expect(x509.ca).to.equal(true);
      expect(x509.subject).to.include('CN=Test CA');
      expect(x509.subject).to.include('O=Test Org');
      expect(x509.issuer).to.equal(x509.subject);
      expect(x509.verify(x509.publicKey)).to.equal(true);
      expect(ca.privateKeyPem).to.include('PRIVATE KEY');
      expect(ca.subject).to.equal('CN=Test CA, O=Test Org');
    });

    it('applies validity days', () => {
      const days = (ca.notAfter.getTime() - Date.now()) / DAY_MS;
      expect(days).to.be.closeTo(30, 0.1);
    });

    it('rejects invalid validity', () => {
      expect(() => generateCaCertificate({validityDays: 0})).to.throw(RangeError);
    });

    it('defaults to and enforces the 1 year maximum', () => {
      const defaulted = generateCaCertificate();
      const days = (defaulted.notAfter.getTime() - defaulted.notBefore.getTime()) / DAY_MS;
      expect(days).to.be.closeTo(365, 0.001);
      expect(() => validateCodeUploadCaCertificate(defaulted.certificatePem)).to.not.throw();
      expect(() => generateCaCertificate({validityDays: 366})).to.throw(RangeError, /1 year/);
    });
  });

  describe('issueClientCertificate', () => {
    it('issues a client certificate signed by the CA', () => {
      const client = issueClientCertificate({ca, commonName: 'build-server', validityDays: 7});
      const x509 = new X509Certificate(client.certificatePem);
      const caX509 = new X509Certificate(ca.certificatePem);

      expect(x509.ca).to.equal(false);
      expect(x509.subject).to.equal('CN=build-server');
      expect(x509.checkIssued(caX509)).to.equal(true);
      expect(x509.verify(caX509.publicKey)).to.equal(true);
      expect(x509.keyUsage).to.include('1.3.6.1.5.5.7.3.2'); // clientAuth
    });

    it('produces a PKCS12 bundle loadable by Node TLS with the passphrase', () => {
      const client = issueClientCertificate({ca, commonName: 'dev', passphrase: 'secret-pass'});
      expect(client.passphrase).to.equal('secret-pass');
      expect(() => tls.createSecureContext({pfx: client.pkcs12, passphrase: 'secret-pass'})).to.not.throw();
      expect(() => tls.createSecureContext({pfx: client.pkcs12, passphrase: 'wrong'})).to.throw();
    });

    it('generates a random passphrase by default', () => {
      const client = issueClientCertificate({ca, commonName: 'dev'});
      expect(client.passphrase).to.have.length(32);
      expect(() => tls.createSecureContext({pfx: client.pkcs12, passphrase: client.passphrase})).to.not.throw();
    });

    it('caps validity at the CA expiry', () => {
      const client = issueClientCertificate({ca, commonName: 'dev', validityDays: 3650});
      expect(client.notAfter.getTime()).to.equal(ca.notAfter.getTime() - (ca.notAfter.getTime() % 1000));
    });

    it('rejects a CA key that does not match the certificate', () => {
      const other = generateCaCertificate();
      expect(() =>
        issueClientCertificate({
          ca: {certificatePem: ca.certificatePem, privateKeyPem: other.privateKeyPem},
          commonName: 'dev',
        }),
      ).to.throw(/does not match/);
    });

    it('authenticates to a server that trusts the CA', async () => {
      const server = generateCaCertificate({commonName: 'localhost'});
      const client = issueClientCertificate({ca, commonName: 'mtls-client'});

      const tlsServer = tls.createServer(
        {
          cert: server.certificatePem,
          key: server.privateKeyPem,
          ca: ca.certificatePem,
          requestCert: true,
          rejectUnauthorized: true,
        },
        (socket) => {
          socket.end(socket.getPeerCertificate().subject.CN);
        },
      );
      await new Promise<void>((resolve) => tlsServer.listen(0, '127.0.0.1', resolve));
      const {port} = tlsServer.address() as AddressInfo;

      try {
        const peer = await new Promise<string>((resolve, reject) => {
          const socket = tls.connect({
            host: '127.0.0.1',
            port,
            pfx: client.pkcs12,
            passphrase: client.passphrase,
            rejectUnauthorized: false,
          });
          let data = '';
          socket.on('data', (chunk) => (data += chunk.toString()));
          socket.on('end', () => resolve(data));
          socket.on('error', reject);
        });
        expect(peer).to.equal('mtls-client');
      } finally {
        tlsServer.close();
      }
    });
  });

  describe('validateCodeUploadCaCertificate', () => {
    it('rejects client (non-CA) certificates', () => {
      const client = issueClientCertificate({ca, commonName: 'dev'});
      expect(() => validateCodeUploadCaCertificate(client.certificatePem)).to.throw(/not a CA/);
    });

    it('rejects CA certificates valid for more than 1 year', () => {
      const keys = forge.pki.rsa.generateKeyPair(1024);
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date(Date.now() + 730 * DAY_MS);
      cert.setSubject([{name: 'commonName', value: 'Long CA'}]);
      cert.setIssuer([{name: 'commonName', value: 'Long CA'}]);
      cert.setExtensions([{name: 'basicConstraints', cA: true}]);
      cert.sign(keys.privateKey, forge.md.sha256.create());

      expect(() => validateCodeUploadCaCertificate(forge.pki.certificateToPem(cert))).to.throw(
        /maximum CA expiry of 1 year/,
      );
    });

    it('rejects unparseable certificates', () => {
      expect(() => validateCodeUploadCaCertificate('garbage')).to.throw(/Invalid CA certificate/);
    });
  });

  describe('createCodeUploadCertificate', () => {
    it('posts the CA certificate and returns the created certificate', async () => {
      type PostInit = {body: unknown; params: {path: {organizationId: string}}};
      let captured: {init: PostInit; path: string} | undefined;
      const client = {
        async POST(path: string, init: PostInit) {
          captured = {path, init};
          return {data: {data: {mtlsCertificateId: 'cert-1', mtlsAssociatedCodeUploadHostname: 'cert.example.com'}}};
        },
      } as unknown as CdnZonesClient;

      const result = await createCodeUploadCertificate(client, 'f_ecom_zzxy_stg', {
        name: 'my-cert',
        certificatePem: ca.certificatePem,
        privateKeyPem: 'KEY',
      });

      expect(captured?.path).to.equal('/organizations/{organizationId}/mtls/code-upload-certificates');
      expect(captured?.init.params.path.organizationId).to.equal('f_ecom_zzxy_stg');
      expect(captured?.init.body).to.deep.equal({name: 'my-cert', certificate: ca.certificatePem, privateKey: 'KEY'});
      expect(result.mtlsCertificateId).to.equal('cert-1');
    });

    it('throws on API error', async () => {
      const client = {
        async POST() {
          return {
            error: {title: 'Bad Request', detail: 'invalid certificate'},
            response: {status: 400, statusText: 'Bad Request'},
          };
        },
      } as unknown as CdnZonesClient;

      try {
        await createCodeUploadCertificate(client, 'f_ecom_zzxy_stg', {
          name: 'x',
          certificatePem: ca.certificatePem,
          privateKeyPem: 'b',
        });
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to create mTLS certificate');
      }
    });
  });
});
