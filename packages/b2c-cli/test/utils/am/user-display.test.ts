/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {printUserDetails} from '../../../src/utils/am/user-display.js';

describe('utils/am/user-display', () => {
  afterEach(() => {
    sinon.restore();
  });

  const baseRoleMapping = {
    byId: new Map([
      ['admin', 'ACCOUNT_ADMINISTRATOR'],
      ['bm-user', 'BUSINESS_MANAGER_USER'],
    ]),
    byEnumName: new Map([
      ['ACCOUNT_ADMINISTRATOR', 'admin'],
      ['BUSINESS_MANAGER_USER', 'bm-user'],
    ]),
    descriptions: new Map([
      ['ACCOUNT_ADMINISTRATOR', 'Account Administrator'],
      ['BUSINESS_MANAGER_USER', 'Business Manager User'],
    ]),
  };

  const baseOrgMapping = {
    byId: new Map([
      ['org-1', 'My Org'],
      ['org-2', 'Other Org'],
    ]),
    byName: new Map([
      ['My Org', 'org-1'],
      ['Other Org', 'org-2'],
    ]),
  };

  it('prints basic user details', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      userState: 'ACTIVE',
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('John');
    expect(text).to.include('Doe');
    expect(text).to.include('ACTIVE');
  });

  it('prints user with organizations', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      organizations: [{id: 'org-1'}, {id: 'org-2'}],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('Organizations');
    expect(text).to.include('My Org');
  });

  it('prints user with string organization IDs', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      organizations: ['org-1'],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('prints user with roles', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      roles: [{roleEnumName: 'ACCOUNT_ADMINISTRATOR'}],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('Roles');
    expect(text).to.include('Account Administrator');
  });

  it('prints user with string role names', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      roles: ['BUSINESS_MANAGER_USER'],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('Roles');
  });

  it('prints user with role scopes', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      roleTenantFilterMap: {
        ACCOUNT_ADMINISTRATOR: 'f_ecom_zzxy_prd',
        BUSINESS_MANAGER_USER: ['f_ecom_aaaa_prd', 'f_ecom_bbbb_prd'],
      },
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('Role Scopes');
  });

  it('handles password expiration fields', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      passwordExpirationTimestamp: Date.now() - 86_400_000, // expired
      verifiers: ['totp'],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('Yes'); // 2FA enabled, password expired
  });

  it('handles primary organization', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      primaryOrganization: 'org-1',
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('My Org');
  });

  it('handles unknown org and role IDs', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      primaryOrganization: 'unknown-org',
      organizations: [{id: 'unknown-org'}],
      roles: [{id: 'unknown-role'}],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('unknown-org');
  });

  it('handles created and last modified dates', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      createdAt: 1_706_200_000_000,
      lastModified: 1_706_300_000_000,
      lastLoginDate: '2025-01-25',
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('handles non-expired password', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      passwordExpirationTimestamp: Date.now() + 86_400_000, // not expired
      verifiers: [],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('No'); // password not expired, 2FA not enabled
  });

  it('handles role with no roleEnumName or id', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      roles: [{}],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    // Fallback: 'Unknown' is transformed to 'UNKNOWN' by resolveToInternalRole
    expect(text).to.include('UNKNOWN');
  });

  it('handles organization with no id', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      organizations: [{}],
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('handles optional phone fields', () => {
    const stdoutStub = sinon.stub(ux, 'stdout');
    const user = {
      id: 'user-1',
      mail: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      businessPhone: '+1 555-0100',
      homePhone: '+1 555-0200',
      mobilePhone: '+1 555-0300',
      preferredLocale: 'en_US',
      linkedToSfIdentity: true,
    } as any;

    printUserDetails(user, baseRoleMapping, baseOrgMapping);
    expect(stdoutStub.calledOnce).to.equal(true);
    const text = stdoutStub.firstCall.args[0];
    expect(text).to.include('+1 555-0100');
    expect(text).to.include('en_US');
  });
});
