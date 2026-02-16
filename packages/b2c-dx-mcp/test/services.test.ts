/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {stub, restore} from 'sinon';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Services} from '../src/services.js';
import {createMockResolvedConfig} from './test-helpers.js';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {toOrganizationId, type WebDavClient, type OcapiClient} from '@salesforce/b2c-tooling-sdk/clients';

describe('services', () => {
  let mockB2CInstance: B2CInstance;
  let mockOAuthStrategy: AuthStrategy;
  let tmpDir: string;

  beforeEach(() => {
    mockB2CInstance = {
      config: {codeVersion: 'version1'},
      webdav: {} as WebDavClient,
      ocapi: {} as OcapiClient,
    } as B2CInstance;

    mockOAuthStrategy = {
      fetch: stub().resolves({} as Response),
    } as unknown as AuthStrategy;

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'services-test-'));
  });

  afterEach(() => {
    restore();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      const config = createMockResolvedConfig();
      const services = new Services({
        b2cInstance: mockB2CInstance,
        mrtConfig: {auth: mockOAuthStrategy, project: 'test-project'},
        resolvedConfig: config,
      });

      expect(services.b2cInstance).to.equal(mockB2CInstance);
      expect(services.mrtConfig.auth).to.equal(mockOAuthStrategy);
      expect(services.mrtConfig.project).to.equal('test-project');
    });

    it('should initialize with empty mrtConfig when not provided', () => {
      const config = createMockResolvedConfig();
      const services = new Services({
        resolvedConfig: config,
      });

      expect(services.mrtConfig).to.deep.equal({});
    });
  });

  describe('fromResolvedConfig', () => {
    it('should create Services with B2C instance when config has instance', () => {
      const config = createMockResolvedConfig();
      stub(config, 'hasB2CInstanceConfig').returns(true);
      stub(config, 'createB2CInstance').returns(mockB2CInstance);
      stub(config, 'hasMrtConfig').returns(false);

      const services = Services.fromResolvedConfig(config);

      expect(services.b2cInstance).to.equal(mockB2CInstance);
    });

    it('should create Services without B2C instance when config lacks instance', () => {
      const config = createMockResolvedConfig();
      stub(config, 'hasB2CInstanceConfig').returns(false);
      stub(config, 'hasMrtConfig').returns(false);

      const services = Services.fromResolvedConfig(config);

      expect(services.b2cInstance).to.be.undefined;
    });

    it('should create Services with MRT config when available', () => {
      const config = createMockResolvedConfig();
      stub(config, 'hasB2CInstanceConfig').returns(false);
      stub(config, 'hasMrtConfig').returns(true);
      stub(config, 'createMrtAuth').returns(mockOAuthStrategy);
      config.values.mrtProject = 'test-project';
      config.values.mrtEnvironment = 'staging';

      const services = Services.fromResolvedConfig(config);

      expect(services.mrtConfig.auth).to.equal(mockOAuthStrategy);
      expect(services.mrtConfig.project).to.equal('test-project');
      expect(services.mrtConfig.environment).to.equal('staging');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});
      const testFile = path.join(tmpDir, 'test.txt');
      fs.writeFileSync(testFile, 'test');

      expect(services.exists(testFile)).to.be.true;
    });

    it('should return false for non-existing file', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.exists(path.join(tmpDir, 'nonexistent.txt'))).to.be.false;
    });
  });

  describe('getCustomApisClient', () => {
    it('should create Custom APIs client with valid config', () => {
      const config = createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      });
      stub(config, 'hasOAuthConfig').returns(true);
      stub(config, 'createOAuth').returns(mockOAuthStrategy);

      const services = new Services({resolvedConfig: config});
      const client = services.getCustomApisClient();

      expect(client).to.exist;
    });

    it('should throw error when shortCode is missing', () => {
      const config = createMockResolvedConfig({tenantId: 'test_tenant'});
      const services = new Services({resolvedConfig: config});

      expect(() => services.getCustomApisClient()).to.throw('SCAPI short code required');
    });

    it('should throw error when tenantId is missing', () => {
      const config = createMockResolvedConfig({shortCode: 'test-shortcode'});
      const services = new Services({resolvedConfig: config});

      expect(() => services.getCustomApisClient()).to.throw('Tenant ID required');
    });

    it('should throw error when OAuth is missing', () => {
      const config = createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      });
      stub(config, 'hasOAuthConfig').returns(false);
      const services = new Services({resolvedConfig: config});

      expect(() => services.getCustomApisClient()).to.throw('OAuth client ID required');
    });
  });

  describe('getCwd', () => {
    it('should return current working directory', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.getCwd()).to.equal(process.cwd());
    });
  });

  describe('getWorkingDirectory', () => {
    it('should return working directory when provided in config', () => {
      const workingDir = '/path/to/project';
      const config = createMockResolvedConfig({startDir: workingDir});
      const services = new Services({resolvedConfig: config});

      expect(services.getWorkingDirectory()).to.equal(workingDir);
    });

    it('should fall back to process.cwd() when not provided', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.getWorkingDirectory()).to.equal(process.cwd());
    });

    it('should return working directory from fromResolvedConfig when provided in config', () => {
      const workingDir = '/path/to/project';
      const config = createMockResolvedConfig({startDir: workingDir});
      const services = Services.fromResolvedConfig(config);

      expect(services.getWorkingDirectory()).to.equal(workingDir);
    });

    it('should fall back to process.cwd() from fromResolvedConfig when not provided in config', () => {
      const config = createMockResolvedConfig();
      const services = Services.fromResolvedConfig(config);

      expect(services.getWorkingDirectory()).to.equal(process.cwd());
    });
  });

  describe('getHomeDir', () => {
    it('should return home directory', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.getHomeDir()).to.equal(os.homedir());
    });
  });

  describe('getOrganizationId', () => {
    it('should return organization ID with f_ecom_ prefix', () => {
      const config = createMockResolvedConfig({tenantId: 'test_tenant'});
      const services = new Services({resolvedConfig: config});

      expect(services.getOrganizationId()).to.equal(toOrganizationId('test_tenant'));
    });

    it('should throw error when tenantId is missing', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(() => services.getOrganizationId()).to.throw('Tenant ID required');
    });
  });

  describe('getPlatform', () => {
    it('should return OS platform', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.getPlatform()).to.equal(os.platform());
    });
  });

  describe('getScapiSchemasClient', () => {
    it('should create SCAPI Schemas client with valid config', () => {
      const config = createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      });
      stub(config, 'hasOAuthConfig').returns(true);
      stub(config, 'createOAuth').returns(mockOAuthStrategy);

      const services = new Services({resolvedConfig: config});
      const client = services.getScapiSchemasClient();

      expect(client).to.exist;
    });

    it('should throw error when shortCode is missing', () => {
      const config = createMockResolvedConfig({tenantId: 'test_tenant'});
      const services = new Services({resolvedConfig: config});

      expect(() => services.getScapiSchemasClient()).to.throw('SCAPI short code required');
    });

    it('should throw error when tenantId is missing', () => {
      const config = createMockResolvedConfig({shortCode: 'test-shortcode'});
      const services = new Services({resolvedConfig: config});

      expect(() => services.getScapiSchemasClient()).to.throw('Tenant ID required');
    });

    it('should throw error when OAuth is missing', () => {
      const config = createMockResolvedConfig({
        shortCode: 'test-shortcode',
        tenantId: 'test_tenant',
      });
      stub(config, 'hasOAuthConfig').returns(false);
      const services = new Services({resolvedConfig: config});

      expect(() => services.getScapiSchemasClient()).to.throw('OAuth client ID required');
    });
  });

  describe('getShortCode', () => {
    it('should return shortCode when configured', () => {
      const config = createMockResolvedConfig({shortCode: 'test-shortcode'});
      const services = new Services({resolvedConfig: config});

      expect(services.getShortCode()).to.equal('test-shortcode');
    });

    it('should return undefined when not configured', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.getShortCode()).to.be.undefined;
    });
  });

  describe('getTenantId', () => {
    it('should return tenantId when configured', () => {
      const config = createMockResolvedConfig({tenantId: 'test_tenant'});
      const services = new Services({resolvedConfig: config});

      expect(services.getTenantId()).to.equal('test_tenant');
    });

    it('should return undefined when not configured', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.getTenantId()).to.be.undefined;
    });
  });

  describe('getTmpDir', () => {
    it('should return temporary directory', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.getTmpDir()).to.equal(os.tmpdir());
    });
  });

  describe('getWebDavClient', () => {
    it('should return WebDAV client when B2C instance is available', () => {
      const config = createMockResolvedConfig();
      const services = new Services({
        b2cInstance: mockB2CInstance,
        resolvedConfig: config,
      });

      expect(services.getWebDavClient()).to.equal(mockB2CInstance.webdav);
    });

    it('should throw error when B2C instance is missing', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(() => services.getWebDavClient()).to.throw('B2C instance required');
    });
  });

  describe('joinPath', () => {
    it('should join path segments', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.joinPath('a', 'b', 'c')).to.equal(path.join('a', 'b', 'c'));
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});
      fs.writeFileSync(path.join(tmpDir, 'file1.txt'), 'test');
      fs.writeFileSync(path.join(tmpDir, 'file2.txt'), 'test');
      fs.mkdirSync(path.join(tmpDir, 'subdir'));

      const entries = services.listDirectory(tmpDir);

      expect(entries.length).to.be.greaterThan(0);
      const names = entries.map((e) => e.name);
      expect(names).to.include('file1.txt');
      expect(names).to.include('file2.txt');
      expect(names).to.include('subdir');
    });
  });

  describe('readFile', () => {
    it('should read file with default encoding', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});
      const testFile = path.join(tmpDir, 'test.txt');
      const content = 'test content';
      fs.writeFileSync(testFile, content);

      expect(services.readFile(testFile)).to.equal(content);
    });

    it('should read file with specified encoding', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});
      const testFile = path.join(tmpDir, 'test.txt');
      const content = 'test content';
      fs.writeFileSync(testFile, content);

      expect(services.readFile(testFile, 'utf8')).to.equal(content);
    });
  });

  describe('resolvePath', () => {
    it('should resolve path segments', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      expect(services.resolvePath('a', 'b', 'c')).to.equal(path.resolve('a', 'b', 'c'));
    });
  });

  describe('stat', () => {
    it('should return file stats', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});
      const testFile = path.join(tmpDir, 'test.txt');
      fs.writeFileSync(testFile, 'test');

      const stats = services.stat(testFile);

      expect(stats.isFile()).to.be.true;
      expect(stats.size).to.be.greaterThan(0);
    });

    it('should return directory stats', () => {
      const config = createMockResolvedConfig();
      const services = new Services({resolvedConfig: config});

      const stats = services.stat(tmpDir);

      expect(stats.isDirectory()).to.be.true;
    });
  });
});
