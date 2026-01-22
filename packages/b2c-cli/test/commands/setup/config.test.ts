/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';

import SetupConfig from '../../../src/commands/setup/config.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import type {ConfigSourceInfo, NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';

/* eslint-disable @typescript-eslint/no-explicit-any */

function stubCommandConfigAndLogger(command: any): void {
  Object.defineProperty(command, 'config', {
    value: {
      findConfigFile: () => ({
        read: () => ({}),
      }),
    },
    configurable: true,
  });

  Object.defineProperty(command, 'logger', {
    value: {info() {}, debug() {}, warn() {}, error() {}},
    configurable: true,
  });
}

function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

/**
 * Stub the resolved config with custom values and sources.
 */
function stubResolvedConfig(
  command: any,
  values: Partial<NormalizedConfig>,
  sources: ConfigSourceInfo[] = [],
  warnings: Array<{code: string; message: string}> = [],
): void {
  Object.defineProperty(command, 'resolvedConfig', {
    get: () => ({
      values,
      warnings,
      sources,
    }),
    configurable: true,
  });
}

/**
 * Unit tests for setup config command.
 */
describe('setup config', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(SetupConfig.description).to.be.a('string');
      expect(SetupConfig.description).to.include('configuration');
    });

    it('should enable JSON flag', () => {
      expect(SetupConfig.enableJsonFlag).to.be.true;
    });

    it('should have unmask flag', () => {
      expect(SetupConfig.flags).to.have.property('unmask');
    });
  });

  describe('masking', () => {
    it('should mask password by default', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {
        hostname: 'test.example.com',
        password: 'my-secret-password-123',
      });

      const result = await command.run();

      expect(result.config.hostname).to.equal('test.example.com');
      expect(result.config.password).to.equal('my-s...REDACTED');
    });

    it('should mask clientSecret by default', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {
        clientId: 'my-client-id',
        clientSecret: 'super-secret-client-secret',
      });

      const result = await command.run();

      expect(result.config.clientId).to.equal('my-client-id');
      expect(result.config.clientSecret).to.equal('supe...REDACTED');
    });

    it('should mask mrtApiKey by default', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {
        mrtProject: 'my-project',
        mrtApiKey: 'mrt-api-key-12345678',
      });

      const result = await command.run();

      expect(result.config.mrtProject).to.equal('my-project');
      expect(result.config.mrtApiKey).to.equal('mrt-...REDACTED');
    });

    it('should show REDACTED for short secrets', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {
        password: 'short',
      });

      const result = await command.run();

      expect(result.config.password).to.equal('REDACTED');
    });

    it('should unmask values when --unmask flag is provided', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: true};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      const warnings: string[] = [];
      (command as any).warn = (msg: string) => {
        warnings.push(msg);
      };

      stubResolvedConfig(command, {
        hostname: 'test.example.com',
        password: 'my-secret-password-123',
        clientSecret: 'super-secret-client-secret',
        mrtApiKey: 'mrt-api-key-12345678',
      });

      const result = await command.run();

      expect(result.config.password).to.equal('my-secret-password-123');
      expect(result.config.clientSecret).to.equal('super-secret-client-secret');
      expect(result.config.mrtApiKey).to.equal('mrt-api-key-12345678');
    });
  });

  describe('output formatting', () => {
    it('should return structured JSON in --json mode', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(
        command,
        {
          hostname: 'test.example.com',
          username: 'admin',
        },
        [
          {
            name: 'dw.json',
            location: '/path/to/dw.json',
            fields: ['hostname', 'username'],
          },
        ],
      );

      const result = await command.run();

      expect(result).to.have.property('config');
      expect(result).to.have.property('sources');
      expect(result.config.hostname).to.equal('test.example.com');
      expect(result.sources).to.have.length(1);
      expect(result.sources[0].name).to.equal('dw.json');
    });

    it('should display warnings if present', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(
        command,
        {hostname: 'test.example.com'},
        [],
        [{code: 'HOSTNAME_MISMATCH', message: 'Hostname mismatch detected'}],
      );

      const result = await command.run();

      expect(result.warnings).to.deep.equal(['Hostname mismatch detected']);
    });

    it('should handle empty config gracefully', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {});

      const result = await command.run();

      expect(result.config).to.deep.equal({});
      expect(result.sources).to.deep.equal([]);
    });

    it('should handle array values (scopes)', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(command, {
        scopes: ['sfcc.products', 'sfcc.orders'],
      });

      const result = await command.run();

      expect(result.config.scopes).to.deep.equal(['sfcc.products', 'sfcc.orders']);
    });
  });

  describe('source tracking', () => {
    it('should track which source provided each field', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(
        command,
        {
          hostname: 'test.example.com',
          username: 'admin',
          mrtApiKey: 'mrt-api-key-12345678',
        },
        [
          {
            name: 'dw.json',
            location: '/path/to/dw.json',
            fields: ['hostname', 'username'],
          },
          {
            name: '~/.mobify',
            location: '/home/user/.mobify',
            fields: ['mrtApiKey'],
          },
        ],
      );

      const result = await command.run();

      expect(result.sources).to.have.length(2);
      expect(result.sources[0].fields).to.include('hostname');
      expect(result.sources[1].fields).to.include('mrtApiKey');
    });

    it('should handle fieldsIgnored correctly', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubResolvedConfig(
        command,
        {
          hostname: 'test.example.com',
          shortCode: 'abc123',
        },
        [
          {
            name: 'CLI flags',
            location: undefined,
            fields: ['hostname'],
          },
          {
            name: 'dw.json',
            location: '/path/to/dw.json',
            fields: ['hostname', 'shortCode'],
            fieldsIgnored: ['hostname'],
          },
        ],
      );

      const result = await command.run();

      // hostname should come from CLI flags (first source without ignore)
      // shortCode should come from dw.json
      expect(result.sources[0].fields).to.include('hostname');
      expect(result.sources[1].fieldsIgnored).to.include('hostname');
    });
  });

  describe('human-readable output', () => {
    it('should display formatted info in non-JSON mode', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: false};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);

      const logs: string[] = [];
      command.log = (msg?: string) => {
        if (msg !== undefined) logs.push(msg);
      };

      stubResolvedConfig(
        command,
        {
          hostname: 'test.example.com',
          username: 'admin',
          password: 'secret-password-12345',
        },
        [
          {
            name: 'dw.json',
            location: '/path/to/dw.json',
            fields: ['hostname', 'username', 'password'],
          },
        ],
      );

      const result = await command.run();

      expect(result).to.have.property('config');
      expect(result.config.hostname).to.equal('test.example.com');
    });

    it('should show unmask warning when --unmask is used', async () => {
      const command = new SetupConfig([], {} as any);
      (command as any).flags = {unmask: true};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);

      const warnings: string[] = [];
      (command as any).warn = (msg: string) => {
        warnings.push(msg);
      };

      stubResolvedConfig(command, {hostname: 'test.example.com'});

      await command.run();

      expect(warnings).to.include('Sensitive values are displayed unmasked.');
    });
  });
});
