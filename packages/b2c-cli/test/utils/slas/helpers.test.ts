/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {buildIdpRequest, isValidIdpName, redactIdp} from '../../../src/utils/slas/idp.js';
import {flattenTemplateGroups} from '../../../src/utils/slas/template.js';
import {parseLoginIdList, summarizeLogoutError} from '../../../src/commands/slas/shopper/logout.js';

describe('slas utils', () => {
  it('validates identity provider names', () => {
    expect(isValidIdpName('google')).to.equal(true);
    expect(isValidIdpName('gigya_social-eu')).to.equal(true);
    expect(isValidIdpName('okta-')).to.equal(false);
    expect(isValidIdpName('myidp')).to.equal(false);
  });

  it('redacts identity provider secrets', () => {
    const idp = redactIdp({name: 'apple', clientSecret: 'a', privateJwtKeyPair: 'b'} as any, false);
    expect(idp.clientSecret).to.equal('********');
    expect(idp.privateJwtKeyPair).to.equal('********');
    expect(redactIdp({name: 'apple', clientSecret: 'a'} as any, true).clientSecret).to.equal('a');
  });

  it('drops null fields from IDP requests', () => {
    const body = buildIdpRequest('google', undefined, {clientId: 'c', teamId: null as any});
    expect(body).to.include({name: 'google', clientId: 'c', isPreferred: false});
    expect(body).to.not.have.property('teamId');
  });

  it('flattens template groups', () => {
    const flat = flattenTemplateGroups([
      {
        client_id: 'c',
        channel_id: 's',
        action_type: 'PWD_RESET_ACTION',
        link: 'l',
        templates: [
          {locale: 'en-us', templateType: 'EMAIL', name: 'n', subject: 'x', template: 't'},
          {locale: 'fr-fr', templateType: 'EMAIL', name: 'n', subject: 'y', template: 't'},
        ],
      },
    ]);
    expect(flat.map((x) => x.locale)).to.deep.equal(['en-us', 'fr-fr']);
    expect(flat[0]).to.include({clientId: 'c', channelId: 's', actionType: 'PWD_RESET_ACTION', link: 'l'});
  });

  it('parses login ID files and summarizes logout errors', () => {
    expect(parseLoginIdList('a@example.com\n\n# comment\n b@example.com \r\n')).to.deep.equal([
      'a@example.com',
      'b@example.com',
    ]);
    expect(summarizeLogoutError('failed: 400 {\n "message" : "User not found"\n}')).to.equal('User not found');
    expect(summarizeLogoutError(undefined)).to.equal('');
  });
});
