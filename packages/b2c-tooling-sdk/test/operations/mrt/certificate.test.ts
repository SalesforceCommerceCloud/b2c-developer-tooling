/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '../../../src/clients/mrt.js';
import {
  createCertificate,
  deleteCertificate,
  getCertificate,
  listCertificates,
  restartCertificateValidation,
} from '../../../src/operations/mrt/certificate.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

describe('operations/mrt/certificate', () => {
  const server = setupServer();
  const auth = new MockAuthStrategy();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });
  afterEach(() => {
    server.resetHandlers();
  });
  after(() => {
    server.close();
  });

  it('listCertificates returns paginated certs', async () => {
    server.use(
      http.get(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/certificates/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [{id: 7, domain_name: 'shop.example.com', validation_status: 'pending_validation'}],
        }),
      ),
    );
    const result = await listCertificates({organizationSlug: 'org', customOnly: true}, auth);
    expect(result.count).to.equal(1);
    expect(result.certificates[0].domain_name).to.equal('shop.example.com');
  });

  it('getCertificate fetches by id', async () => {
    server.use(
      http.get(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/certificates/:id/`, ({params}) =>
        HttpResponse.json({id: Number(params.id), domain_name: 'shop.example.com'}),
      ),
    );
    const cert = await getCertificate({organizationSlug: 'org', certId: 5}, auth);
    expect(cert.id).to.equal(5);
  });

  it('createCertificate sends domain name', async () => {
    let receivedBody: any;
    server.use(
      http.post(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/certificates/`, async ({request}) => {
        receivedBody = await request.json();
        return HttpResponse.json({id: 1, domain_name: receivedBody.domain_name}, {status: 201});
      }),
    );
    const cert = await createCertificate({organizationSlug: 'org', domainName: 'shop.example.com'}, auth);
    expect(receivedBody.domain_name).to.equal('shop.example.com');
    expect(cert.id).to.equal(1);
  });

  it('deleteCertificate resolves on 204', async () => {
    server.use(
      http.delete(
        `${DEFAULT_MRT_ORIGIN}/api/organizations/:org/certificates/:id/`,
        () => new HttpResponse(null, {status: 204}),
      ),
    );
    await deleteCertificate({organizationSlug: 'org', certId: 1}, auth);
  });

  it('restartCertificateValidation patches the resource', async () => {
    server.use(
      http.patch(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/certificates/:id/restart-validation/`, ({params}) =>
        HttpResponse.json({
          id: Number(params.id),
          domain_name: 'shop.example.com',
          validation_status: 'pending_validation',
        }),
      ),
    );
    const cert = await restartCertificateValidation({organizationSlug: 'org', certId: 9}, auth);
    expect(cert.id).to.equal(9);
  });
});
