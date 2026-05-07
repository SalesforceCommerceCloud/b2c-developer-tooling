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
  addOrgMember,
  getOrgMember,
  listOrgMembers,
  removeOrgMember,
  updateOrgMember,
} from '../../../src/operations/mrt/organization-member.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

describe('operations/mrt/organization-member', () => {
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

  it('listOrgMembers returns paginated results', async () => {
    server.use(
      http.get(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/`, () =>
        HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [
            {user: 'a@x.com', email: 'a@x.com', role: 0, can_view_all_projects: true},
            {user: 'b@x.com', email: 'b@x.com', role: 1, can_view_all_projects: false},
          ],
        }),
      ),
    );

    const result = await listOrgMembers({organizationSlug: 'my-org'}, auth);
    expect(result.count).to.equal(2);
    expect(result.members).to.have.lengthOf(2);
  });

  it('addOrgMember posts the member and re-fetches the full record', async () => {
    let receivedBody: any;
    server.use(
      http.post(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/`, async ({request}) => {
        receivedBody = await request.json();
        return HttpResponse.json(receivedBody, {status: 201});
      }),
      http.get(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/:email/`, ({params}) =>
        HttpResponse.json({
          user: params.email,
          email: params.email,
          role: 1,
          first_name: 'New',
          last_name: 'User',
          can_view_all_projects: true,
        }),
      ),
    );

    const result = await addOrgMember(
      {organizationSlug: 'my-org', email: 'new@x.com', role: 1, canViewAllProjects: true},
      auth,
    );
    expect(receivedBody.user).to.equal('new@x.com');
    expect(receivedBody.role).to.equal(1);
    expect(receivedBody.can_view_all_projects).to.be.true;
    expect(result.email).to.equal('new@x.com');
    expect(result.first_name).to.equal('New');
  });

  it('getOrgMember fetches by email', async () => {
    server.use(
      http.get(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/:email/`, ({params}) =>
        HttpResponse.json({user: params.email, email: params.email, role: 0}),
      ),
    );
    const result = await getOrgMember({organizationSlug: 'my-org', email: 'x@y.com'}, auth);
    expect(result.email).to.equal('x@y.com');
  });

  it('updateOrgMember sends only changed fields and re-fetches the full record', async () => {
    let receivedBody: any;
    server.use(
      http.patch(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/:email/`, async ({request}) => {
        receivedBody = await request.json();
        return HttpResponse.json(receivedBody);
      }),
      http.get(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/:email/`, ({params}) =>
        HttpResponse.json({user: params.email, email: params.email, role: 1, can_view_all_projects: true}),
      ),
    );

    const result = await updateOrgMember(
      {organizationSlug: 'my-org', email: 'x@y.com', canViewAllProjects: true},
      auth,
    );
    expect(receivedBody).to.deep.equal({can_view_all_projects: true});
    expect(result.email).to.equal('x@y.com');
  });

  it('removeOrgMember resolves on 204', async () => {
    server.use(
      http.delete(
        `${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/:email/`,
        () => new HttpResponse(null, {status: 204}),
      ),
    );
    await removeOrgMember({organizationSlug: 'my-org', email: 'x@y.com'}, auth);
  });

  it('throws on error response', async () => {
    server.use(
      http.get(`${DEFAULT_MRT_ORIGIN}/api/organizations/:org/members/:email/`, () =>
        HttpResponse.json({message: 'Not found'}, {status: 404}),
      ),
    );
    try {
      await getOrgMember({organizationSlug: 'my-org', email: 'x@y.com'}, auth);
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).to.include('get organization member');
    }
  });
});
