/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import cliui from 'cliui';
import {addStaticIpRows, formatOutboundIps} from '../../../src/utils/mrt/static-ips.js';

describe('utils/mrt/static-ips', () => {
  describe('formatOutboundIps', () => {
    it('returns one line per address for an array', () => {
      expect(formatOutboundIps(['203.0.113.10', '203.0.113.11'])).to.deep.equal(['203.0.113.10', '203.0.113.11']);
    });

    it('returns key: value lines for an object, stringifying non-string values', () => {
      expect(formatOutboundIps({a: '203.0.113.10', b: ['203.0.113.11']})).to.deep.equal([
        'a: 203.0.113.10',
        'b: ["203.0.113.11"]',
      ]);
    });

    it('returns a single line for a non-empty string so unexpected shapes are not dropped', () => {
      expect(formatOutboundIps('203.0.113.10')).to.deep.equal(['203.0.113.10']);
    });

    it('returns no lines for null, undefined, empty array and empty object', () => {
      expect(formatOutboundIps(null)).to.deep.equal([]);
      expect(formatOutboundIps(undefined)).to.deep.equal([]);
      expect(formatOutboundIps([])).to.deep.equal([]);
      expect(formatOutboundIps({})).to.deep.equal([]);
    });
  });

  describe('addStaticIpRows', () => {
    function render(env: Parameters<typeof addStaticIpRows>[1]): string {
      const ui = cliui({width: 80});
      addStaticIpRows(ui, env, 18);
      return ui.toString();
    }

    it('labels only the first outbound IP row', () => {
      const out = render({ssr_static_ips: true, ssr_static_outbound_ips: ['203.0.113.10', '203.0.113.11']});
      expect(out.match(/Outbound IPs:/g)).to.have.lengthOf(1);
      expect(out).to.include('203.0.113.11');
    });

    it('renders nothing when the API reports no static IP data', () => {
      expect(render({}).trim()).to.equal('');
      expect(render({ssr_static_ips: null, ssr_static_outbound_ips: null}).trim()).to.equal('');
    });
  });
});
