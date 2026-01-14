/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {createBundle, DEFAULT_SSR_PARAMETERS} from '../../../src/operations/mrt/bundle.js';

describe('operations/mrt/bundle', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-bundle-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  describe('createBundle', () => {
    it('should create a bundle from a build directory', async () => {
      // Create a mock build directory
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');
      fs.mkdirSync(path.join(buildDir, 'static'), {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'static', 'index.html'), '<html></html>');

      const bundle = await createBundle({
        projectSlug: 'test-project',
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        message: 'Test bundle',
      });

      expect(bundle.message).to.equal('Test bundle');
      expect(bundle.encoding).to.equal('base64');
      expect(bundle.data).to.be.a('string');
      expect(bundle.data.length).to.be.greaterThan(0);
      expect(bundle.ssr_parameters).to.deep.equal(DEFAULT_SSR_PARAMETERS);
      expect(bundle.ssr_only).to.be.an('array');
      expect(bundle.ssr_shared).to.be.an('array');
      // The function resolves globs to actual files
      expect(bundle.ssr_only.some((f) => f.includes('ssr.js'))).to.be.true;
      expect(bundle.ssr_shared.some((f) => f.includes('index.html'))).to.be.true;
    });

    it('should use custom SSR parameters', async () => {
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');

      const customParams = {
        SSRFunctionNodeVersion: '18.x',
        CustomParam: 'value',
      };

      const bundle = await createBundle({
        projectSlug: 'test-project',
        ssrOnly: ['ssr.js'],
        ssrShared: ['**/*.json'],
        buildDirectory: buildDir,
        ssrParameters: customParams,
      });

      expect(bundle.ssr_parameters).to.deep.equal(customParams);
    });

    it('should use default build directory when not specified', async () => {
      // Create a build directory in tempDir
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');

      // Change to tempDir
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);

        const bundle = await createBundle({
          projectSlug: 'test-project',
          ssrOnly: ['ssr.js'],
          ssrShared: ['**/*.json'],
        });

        expect(bundle.data).to.be.a('string');
        expect(bundle.data.length).to.be.greaterThan(0);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should generate default message when not provided', async () => {
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');

      const bundle = await createBundle({
        projectSlug: 'test-project',
        ssrOnly: ['ssr.js'],
        ssrShared: ['**/*.json'],
        buildDirectory: buildDir,
      });

      expect(bundle.message).to.be.a('string');
      expect(bundle.message.length).to.be.greaterThan(0);
    });

    it('should require non-empty patterns', async () => {
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, {recursive: true});

      try {
        await createBundle({
          projectSlug: 'test-project',
          ssrOnly: [],
          ssrShared: [],
          buildDirectory: buildDir,
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('ssrOnly and ssrShared patterns are required');
      }
    });

    it('should handle nested directories', async () => {
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(path.join(buildDir, 'static', 'css'), {recursive: true});
      fs.mkdirSync(path.join(buildDir, 'static', 'js'), {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'static', 'css', 'style.css'), 'body {}');
      fs.writeFileSync(path.join(buildDir, 'static', 'js', 'app.js'), 'console.log("app");');
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');

      const bundle = await createBundle({
        projectSlug: 'test-project',
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
      });

      expect(bundle.data).to.be.a('string');
      expect(bundle.data.length).to.be.greaterThan(0);
    });

    it('should throw error when build directory does not exist', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      try {
        await createBundle({
          projectSlug: 'test-project',
          ssrOnly: ['ssr.js'],
          ssrShared: ['static/**/*'],
          buildDirectory: nonExistentDir,
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Build directory at path');
        expect(error.message).to.include('not found');
      }
    });
  });

  describe('DEFAULT_SSR_PARAMETERS', () => {
    it('should have SSRFunctionNodeVersion set to 22.x', () => {
      expect(DEFAULT_SSR_PARAMETERS).to.have.property('SSRFunctionNodeVersion');
      expect(DEFAULT_SSR_PARAMETERS.SSRFunctionNodeVersion).to.equal('22.x');
    });
  });
});
