/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import * as cliExports from '../src/index.js';

describe('index.ts exports', () => {
  it('exports run from @oclif/core', () => {
    expect(cliExports).to.have.property('run');
    expect(cliExports.run).to.be.a('function');
  });

  it('exports BaseCommand from b2c-tooling-sdk', () => {
    expect(cliExports).to.have.property('BaseCommand');
    expect(cliExports.BaseCommand).to.be.a('function');
  });

  it('exports OAuthCommand from b2c-tooling-sdk', () => {
    expect(cliExports).to.have.property('OAuthCommand');
    expect(cliExports.OAuthCommand).to.be.a('function');
  });

  it('exports InstanceCommand from b2c-tooling-sdk', () => {
    expect(cliExports).to.have.property('InstanceCommand');
    expect(cliExports.InstanceCommand).to.be.a('function');
  });

  it('exports MrtCommand from b2c-tooling-sdk', () => {
    expect(cliExports).to.have.property('MrtCommand');
    expect(cliExports.MrtCommand).to.be.a('function');
  });

  it('exports loadConfig from b2c-tooling-sdk', () => {
    expect(cliExports).to.have.property('loadConfig');
    expect(cliExports.loadConfig).to.be.a('function');
  });

  it('exports findDwJson from b2c-tooling-sdk', () => {
    expect(cliExports).to.have.property('findDwJson');
    expect(cliExports.findDwJson).to.be.a('function');
  });
});
