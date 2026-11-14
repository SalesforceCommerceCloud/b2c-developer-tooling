/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  customApiGroups,
  endpointIssues,
  hookChains,
  hookRegistrationIssue,
  type IndexedEndpoint,
  type IndexedHook,
  type ProjectIndex,
} from '@salesforce/b2c-tooling-sdk/project-index';

const hook = (name: string, cartridge: string, returnsValue: IndexedHook['returnsValue']): IndexedHook => ({
  name,
  kind: name.startsWith('dw.') ? 'system' : 'custom',
  function: name.split('.').at(-1),
  cartridge,
  script: './h',
  relPath: 'cartridge/scripts/h.js',
  line: 1,
  returnsValue,
});

const base: ProjectIndex = {
  version: 1,
  cartridges: [
    {name: 'app_custom', src: '/p/app_custom'},
    {name: 'app_base', src: '/p/app_base'},
  ],
  endpoints: [],
  hooks: [],
  customApis: [],
  jobSteps: [],
  errors: [],
};

describe('project-index insights', () => {
  describe('hookChains', () => {
    it('orders registrations by cartridge path', () => {
      const [chain] = hookChains({
        ...base,
        hooks: [hook('app.x', 'app_base', 'no'), hook('app.x', 'app_custom', 'no')],
      });
      expect(chain.registrations.map((r) => r.cartridge)).to.deep.equal(['app_custom', 'app_base']);
      expect(chain.issue).to.equal(undefined);
    });

    it('flags a system hook that returns a value before later registrations', () => {
      const [chain] = hookChains({
        ...base,
        hooks: [hook('dw.order.calculate', 'app_custom', 'yes'), hook('dw.order.calculate', 'app_base', 'yes')],
      });
      expect(chain.stopsAt).to.equal(0);
      expect(chain.issue).to.equal(
        'app_custom can return a value, which skips 1 later registration and the system implementation.',
      );
      expect(hookRegistrationIssue(chain, chain.registrations[0])).to.match(/later registrations/);
      expect(hookRegistrationIssue(chain, chain.registrations[1]), 'the last one is the override').to.equal(undefined);
    });

    it('notes, rather than flags, the last registration replacing a system implementation', () => {
      const [chain] = hookChains({...base, hooks: [hook('dw.order.calculate', 'app_base', 'yes')]});
      expect(chain.issue).to.equal(undefined);
      expect(chain.note).to.equal('app_base returns a value, replacing the system implementation.');
      expect(hookRegistrationIssue(chain, chain.registrations[0])).to.equal(undefined);
    });

    it('always flags OCAPI/SCAPI hooks that return a value', () => {
      const [chain] = hookChains({...base, hooks: [hook('dw.ocapi.shop.basket.afterPOST', 'app_base', 'yes')]});
      expect(chain.issue).to.equal('app_base can return a value, which skips the system implementation.');
      expect(hookRegistrationIssue(chain, chain.registrations[0])).to.match(/basket calculation/);
    });

    it('never flags return values of custom hooks, but flags missing scripts and functions', () => {
      const [custom] = hookChains({...base, hooks: [hook('app.custom.notify', 'app_base', 'yes')]});
      expect(custom.issue).to.equal(undefined);
      expect(hookRegistrationIssue(custom, custom.registrations[0])).to.equal(undefined);
      const missing = {...hook('dw.order.calculate', 'app_base', 'unknown'), relPath: undefined};
      const [chain] = hookChains({...base, hooks: [missing]});
      expect(hookRegistrationIssue(chain, missing)).to.equal('Script ./h not found.');
    });
  });

  it('endpointIssues reports POST without CSRF and dropped middleware', () => {
    const endpoint = {
      id: 'A-B',
      methods: ['POST'],
      csrf: 'none',
      steps: [
        {method: 'replace', cartridge: 'app_custom', relPath: 'x', line: 1, dropped: ['userLoggedIn.validateLoggedIn']},
      ],
    } as unknown as IndexedEndpoint;
    expect(endpointIssues(endpoint)).to.deep.equal([
      'Accepts POST without a CSRF token check.',
      'server.replace() in app_custom dropped the login check.',
    ]);
    expect(
      endpointIssues({...endpoint, methods: ['ANY'], steps: [], chain: []} as unknown as IndexedEndpoint),
    ).to.deep.equal([]);
  });

  it('customApiGroups groups by API and flags duplicates', () => {
    const api = (cartridge: string) => ({
      api: 'loyalty',
      endpoint: 'get',
      cartridge,
      apiType: 'shopper' as const,
      problems: [],
    });
    const [group] = customApiGroups({...base, customApis: [api('app_custom'), api('app_base')]});
    expect(group).to.include({api: 'loyalty'});
    expect(group.types).to.deep.equal(['shopper']);
    expect(group.issue).to.match(/more than one cartridge/);
  });
});
