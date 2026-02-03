/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {Agent} from 'undici';
import {createTlsDispatcher} from '../../src/clients/tls-dispatcher.js';

describe('tls-dispatcher', () => {
  describe('createTlsDispatcher', () => {
    it('returns undefined when no TLS options are needed', () => {
      const result = createTlsDispatcher({});
      expect(result).to.be.undefined;
    });

    it('returns undefined when only rejectUnauthorized is true (default behavior)', () => {
      const result = createTlsDispatcher({rejectUnauthorized: true});
      expect(result).to.be.undefined;
    });

    it('returns an Agent when rejectUnauthorized is false (self-signed mode)', () => {
      const result = createTlsDispatcher({rejectUnauthorized: false});
      expect(result).to.be.instanceOf(Agent);
    });

    describe('error handling', () => {
      it('throws an error when certificate file does not exist', () => {
        expect(() => {
          createTlsDispatcher({certificate: '/nonexistent/path/to/cert.p12'});
        }).to.throw(/Failed to read certificate file/);
      });

      describe('with invalid certificate files', () => {
        let tempDir: string;

        beforeEach(() => {
          tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tls-test-'));
        });

        afterEach(() => {
          // Clean up temp directory
          if (fs.existsSync(tempDir)) {
            for (const file of fs.readdirSync(tempDir)) {
              fs.unlinkSync(path.join(tempDir, file));
            }
            fs.rmdirSync(tempDir);
          }
        });

        it('throws user-friendly error for invalid PKCS12 file', () => {
          const certPath = path.join(tempDir, 'invalid.p12');
          fs.writeFileSync(certPath, Buffer.from('not a real certificate'));

          expect(() => {
            createTlsDispatcher({certificate: certPath});
          }).to.throw(/does not appear to be a valid PKCS12/);
        });

        it('throws user-friendly error when passphrase is required but not provided', () => {
          // Create a minimal encrypted PKCS12-like structure that will trigger mac verify failure
          // This is a real-ish PKCS12 header that will be recognized but fail MAC verification
          const pkcs12Header = Buffer.from([
            0x30,
            0x82,
            0x00,
            0x50, // SEQUENCE
            0x02,
            0x01,
            0x03, // INTEGER 3 (PKCS12 version)
            0x30,
            0x82,
            0x00,
            0x30, // SEQUENCE (authSafe)
            0x06,
            0x09, // OID
            0x2a,
            0x86,
            0x48,
            0x86,
            0xf7,
            0x0d,
            0x01,
            0x07,
            0x01, // pkcs7-data
            0xa0,
            0x82,
            0x00,
            0x1f, // context [0]
            0x04,
            0x82,
            0x00,
            0x1b, // OCTET STRING
            // Some dummy encrypted content
            ...Buffer.alloc(27, 0xff),
          ]);
          const certPath = path.join(tempDir, 'encrypted.p12');
          fs.writeFileSync(certPath, pkcs12Header);

          expect(() => {
            createTlsDispatcher({certificate: certPath});
          }).to.throw(/requires a passphrase|does not appear to be a valid PKCS12/);
        });
      });
    });
  });
});
