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
import * as zlib from 'node:zlib';
import {Readable} from 'node:stream';
import tar from 'tar-fs';
import {
  createBundle,
  createBundleV2,
  DEFAULT_SSR_PARAMETERS,
  DEFAULT_SSR_ONLY,
  DEFAULT_SSR_SHARED,
} from '../../../src/operations/mrt/bundle.js';

/**
 * Gunzips and extracts a v2 bundle archive to a temp dir, returning the list of
 * archived file paths (posix, relative to the archive root) and a reader for
 * individual entry contents.
 */
async function extractArchive(
  archive: Buffer,
  destDir: string,
): Promise<{files: string[]; read: (relPath: string) => string}> {
  const tarBuf = zlib.gunzipSync(archive);
  await new Promise<void>((resolve, reject) => {
    const extract = tar.extract(destDir);
    extract.on('error', reject);
    extract.on('finish', resolve);
    Readable.from(tarBuf).pipe(extract);
  });

  const files: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel);
      } else {
        files.push(rel);
      }
    }
  };
  walk(destDir, '');

  return {
    files,
    read: (relPath: string) => fs.readFileSync(path.join(destDir, relPath), 'utf8'),
  };
}

/**
 * Lists the raw entry names in an (already gunzipped) tar buffer by walking its
 * 512-byte header blocks. Unlike {@link extractArchive}, this counts duplicate
 * entries with the same name (extraction to disk would collapse them), so it
 * can prove a file appears exactly once in the archive.
 */
function listTarEntryNames(tarBuf: Buffer): string[] {
  const names: string[] = [];
  let offset = 0;
  while (offset + 512 <= tarBuf.length) {
    const block = tarBuf.subarray(offset, offset + 512);
    // Two consecutive zero blocks mark the end of the archive; a single zero
    // header block is enough to stop scanning.
    if (block.every((b) => b === 0)) break;
    const name = block.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const sizeField = block.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim();
    const size = parseInt(sizeField, 8) || 0;
    names.push(name);
    // Header block + the data blocks (rounded up to the next 512-byte boundary).
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return names;
}

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
        expect(error.message).to.include('ssrOnly patterns are required');
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

    it('reads SSR config from config.server.ts in the project directory', async () => {
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(path.join(buildDir, 'static'), {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');
      fs.writeFileSync(path.join(buildDir, 'static', 'index.html'), '<html></html>');

      // A .ts config (with a type annotation) proves it is read straight from
      // source via jiti — no compiled config.server.js in the build output.
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'config.server.ts'),
        'const config: {ssrOnly: string[]; ssrShared: string[]; ssrParameters: Record<string, unknown>} = {' +
          "ssrOnly: ['ssr.js'], ssrShared: ['static/**/*'], ssrParameters: {FromProjectConfig: 'yes'}};" +
          'export {config};',
      );

      const bundle = await createBundle({
        projectSlug: 'test-project',
        buildDirectory: buildDir,
        projectDirectory: projectDir,
      });

      expect(bundle.ssr_only.some((f) => f.includes('ssr.js'))).to.be.true;
      expect(bundle.ssr_shared.some((f) => f.includes('index.html'))).to.be.true;
      expect(bundle.ssr_parameters).to.have.property('FromProjectConfig', 'yes');
    });

    it('allows an empty ssrShared from config.server.ts (pure-SSR app)', async () => {
      // Mirrors the welcome app: a pure-SSR app with no shared/static assets
      // declares ssrShared: []. This must not be rejected client-side nor fall
      // back to DEFAULT_SSR_SHARED.
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');

      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'config.server.ts'),
        "export const config = {ssrOnly: ['ssr.js'], ssrShared: [], ssrParameters: {}};",
      );

      const bundle = await createBundle({
        projectSlug: 'test-project',
        buildDirectory: buildDir,
        projectDirectory: projectDir,
      });

      expect(bundle.ssr_shared).to.deep.equal([]);
      expect(bundle.ssr_only).to.deep.equal(['ssr.js']);
    });

    it('includes merged package.json dependencies in bundle_metadata', async () => {
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');

      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'test-app',
          dependencies: {express: '^5.1.0'},
          devDependencies: {typescript: '^5.0.0'},
        }),
      );

      const bundle = await createBundle({
        projectSlug: 'test-project',
        ssrOnly: ['ssr.js'],
        ssrShared: ['**/*'],
        buildDirectory: buildDir,
        projectDirectory: projectDir,
      });

      expect(bundle.bundle_metadata).to.deep.equal({
        dependencies: {express: '^5.1.0', typescript: '^5.0.0'},
      });
    });
  });

  describe('createBundleV2', () => {
    function makeBuildDir(): string {
      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(path.join(buildDir, 'static'), {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');
      fs.writeFileSync(path.join(buildDir, 'static', 'index.html'), '<html></html>');
      return buildDir;
    }

    it('places built files under rootDir with no project-slug prefix', async () => {
      const buildDir = makeBuildDir();

      const bundle = await createBundleV2({
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        message: 'v2 test',
      });

      expect(bundle.message).to.equal('v2 test');
      expect(bundle.rootDir).to.equal('bld');
      expect(bundle.configPath).to.equal('.mrt/config.json');
      expect(bundle.matchMode).to.equal('strict');
      expect(bundle.archive).to.be.instanceOf(Buffer);

      const {files} = await extractArchive(bundle.archive, path.join(tempDir, 'out'));
      expect(files).to.include.members(['bld/ssr.js', 'bld/static/index.html', 'bld/.mrt/config.json']);
      // No project-slug segment anywhere.
      expect(files.every((f) => f.startsWith('bld/'))).to.be.true;
    });

    it('writes the in-archive config file with the expected keys', async () => {
      const buildDir = makeBuildDir();
      // Use an empty project dir so no ambient package.json contributes metadata.
      const projectDir = path.join(tempDir, 'empty-project');
      fs.mkdirSync(projectDir, {recursive: true});

      const bundle = await createBundleV2({
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        projectDirectory: projectDir,
      });

      const {read} = await extractArchive(bundle.archive, path.join(tempDir, 'out'));
      const config = JSON.parse(read('bld/.mrt/config.json'));

      expect(config.ssrOnly).to.deep.equal(['ssr.js']);
      expect(config.ssrShared).to.deep.equal(['static/**/*']);
      expect(config.ssrParameters).to.deep.equal(DEFAULT_SSR_PARAMETERS);
      expect(config).to.not.have.property('bundleMetadata');
      // The returned config mirrors what was written into the archive.
      expect(bundle.config).to.deep.equal(config);
    });

    it('honors rootDir and configPath overrides', async () => {
      const buildDir = makeBuildDir();

      const bundle = await createBundleV2({
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        rootDir: 'dist',
        configPath: 'config/mrt.json',
      });

      expect(bundle.rootDir).to.equal('dist');
      expect(bundle.configPath).to.equal('config/mrt.json');

      const {files, read} = await extractArchive(bundle.archive, path.join(tempDir, 'out'));
      expect(files).to.include.members(['dist/ssr.js', 'dist/config/mrt.json']);
      expect(JSON.parse(read('dist/config/mrt.json')).ssrOnly).to.deep.equal(['ssr.js']);
    });

    it('writes bundleMetadata when dependencies or ccOverrides are provided', async () => {
      const buildDir = makeBuildDir();

      const bundle = await createBundleV2({
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        bundleMetadata: {dependencies: {react: '18.0.0'}, ccOverrides: ['override-a']},
      });

      const {read} = await extractArchive(bundle.archive, path.join(tempDir, 'out'));
      const config = JSON.parse(read('bld/.mrt/config.json'));

      expect(config.bundleMetadata).to.deep.equal({
        dependencies: {react: '18.0.0'},
        ccOverrides: ['override-a'],
      });
    });

    it('honors matchMode and merges custom ssrParameters over defaults', async () => {
      const buildDir = makeBuildDir();

      const bundle = await createBundleV2({
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        matchMode: 'ignore_missing',
        ssrParameters: {EnvBasePath: '/mobify'},
      });

      expect(bundle.matchMode).to.equal('ignore_missing');
      expect(bundle.config.ssrParameters).to.deep.equal({
        SSRFunctionNodeVersion: '24.x',
        EnvBasePath: '/mobify',
      });
    });

    it('falls back to default SSR patterns when none are provided', async () => {
      const buildDir = makeBuildDir();

      const bundle = await createBundleV2({buildDirectory: buildDir});

      expect(bundle.config.ssrOnly).to.deep.equal(DEFAULT_SSR_ONLY);
      expect(bundle.config.ssrShared).to.deep.equal(DEFAULT_SSR_SHARED);
    });

    /** Writes a v2 config file into a build dir at the default config path. */
    function writeV2ConfigFile(
      buildDir: string,
      config: Record<string, unknown>,
      configPath = '.mrt/config.json',
    ): void {
      const filePath = path.join(buildDir, configPath);
      fs.mkdirSync(path.dirname(filePath), {recursive: true});
      fs.writeFileSync(filePath, JSON.stringify(config));
    }

    it('reads the SSR config from the on-disk v2 config file and preserves unknown keys', async () => {
      const buildDir = makeBuildDir();
      writeV2ConfigFile(buildDir, {
        ssrOnly: ['file-ssr.js'],
        ssrShared: ['file-static/**/*'],
        ssrParameters: {SSRFunctionNodeVersion: '20.x', FromFile: 'yes'},
        bundleMetadata: {dependencies: {react: '18.0.0'}},
        customKey: 'preserved',
      });

      const bundle = await createBundleV2({buildDirectory: buildDir});

      const {read} = await extractArchive(bundle.archive, path.join(tempDir, 'out'));
      const config = JSON.parse(read('bld/.mrt/config.json'));

      expect(config.ssrOnly).to.deep.equal(['file-ssr.js']);
      expect(config.ssrShared).to.deep.equal(['file-static/**/*']);
      expect(config.ssrParameters).to.deep.equal({SSRFunctionNodeVersion: '20.x', FromFile: 'yes'});
      expect(config.bundleMetadata).to.deep.equal({dependencies: {react: '18.0.0'}});
      // Unknown top-level keys the build wrote are carried through untouched.
      expect(config.customKey).to.equal('preserved');
      expect(bundle.config).to.deep.equal(config);
    });

    it('lets explicit options override the on-disk v2 config file per key', async () => {
      const buildDir = makeBuildDir();
      writeV2ConfigFile(buildDir, {
        ssrOnly: ['file-ssr.js'],
        ssrShared: ['file-static/**/*'],
        ssrParameters: {SSRFunctionNodeVersion: '18.x'},
        bundleMetadata: {dependencies: {react: '17.0.0'}, ccOverrides: ['file-override']},
      });

      const bundle = await createBundleV2({
        buildDirectory: buildDir,
        ssrOnly: ['opt-ssr.js'],
        ssrParameters: {SSRFunctionNodeVersion: '22.x'},
        bundleMetadata: {dependencies: {vue: '3.0.0'}},
      });

      // Options win where provided; the file supplies the rest.
      expect(bundle.config.ssrOnly).to.deep.equal(['opt-ssr.js']);
      expect(bundle.config.ssrShared).to.deep.equal(['file-static/**/*']);
      expect(bundle.config.ssrParameters).to.deep.equal({SSRFunctionNodeVersion: '22.x'});
      // Metadata merges per key: option overrides dependencies, file keeps ccOverrides.
      expect(bundle.config.bundleMetadata).to.deep.equal({
        dependencies: {vue: '3.0.0'},
        ccOverrides: ['file-override'],
      });
    });

    it('does not duplicate the on-disk v2 config file in the archive', async () => {
      const buildDir = makeBuildDir();
      writeV2ConfigFile(buildDir, {ssrOnly: ['file-ssr.js'], ssrShared: ['file-static/**/*'], ssrParameters: {}});

      const bundle = await createBundleV2({buildDirectory: buildDir});

      const tarBuf = zlib.gunzipSync(bundle.archive);
      const configEntries = listTarEntryNames(tarBuf).filter((n) => n === 'bld/.mrt/config.json');
      expect(configEntries).to.have.length(1);
    });

    it('falls back to config.server.js when there is no v2 config file', async () => {
      const buildDir = makeBuildDir();
      fs.writeFileSync(
        path.join(buildDir, 'config.server.js'),
        'module.exports = {ssrOnly: ["server-ssr.js"], ssrShared: ["server-static/**/*"], ssrParameters: {FromServerConfig: "yes"}};',
      );

      const bundle = await createBundleV2({buildDirectory: buildDir});

      expect(bundle.config.ssrOnly).to.deep.equal(['server-ssr.js']);
      expect(bundle.config.ssrShared).to.deep.equal(['server-static/**/*']);
      expect(bundle.config.ssrParameters).to.have.property('FromServerConfig', 'yes');
    });

    it('reads config.server.ts from the project directory when there is no v2 config file', async () => {
      const buildDir = makeBuildDir();
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'config.server.ts'),
        'const config: {ssrOnly: string[]; ssrShared: string[]; ssrParameters: Record<string, unknown>} = {' +
          "ssrOnly: ['proj-ssr.js'], ssrShared: ['proj-static/**/*'], ssrParameters: {FromProjectConfig: 'yes'}};" +
          'export {config};',
      );

      const bundle = await createBundleV2({buildDirectory: buildDir, projectDirectory: projectDir});

      expect(bundle.config.ssrOnly).to.deep.equal(['proj-ssr.js']);
      expect(bundle.config.ssrShared).to.deep.equal(['proj-static/**/*']);
      expect(bundle.config.ssrParameters).to.have.property('FromProjectConfig', 'yes');
    });

    it('allows an empty ssrShared from config.server.ts (pure-SSR app)', async () => {
      // The welcome app is pure-SSR (ssrShared: []); an empty ssrShared must be
      // preserved, not rejected nor replaced with DEFAULT_SSR_SHARED.
      const buildDir = makeBuildDir();
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'config.server.ts'),
        "export const config = {ssrOnly: ['ssr.js'], ssrShared: [], ssrParameters: {}};",
      );

      const bundle = await createBundleV2({buildDirectory: buildDir, projectDirectory: projectDir});

      expect(bundle.config.ssrOnly).to.deep.equal(['ssr.js']);
      expect(bundle.config.ssrShared).to.deep.equal([]);
    });

    it('auto-derives bundleMetadata dependencies from package.json when none are provided', async () => {
      const buildDir = makeBuildDir();
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({name: 'test-app', dependencies: {express: '^5.1.0'}, devDependencies: {typescript: '^5.0.0'}}),
      );

      const bundle = await createBundleV2({
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        projectDirectory: projectDir,
      });

      expect(bundle.config.bundleMetadata).to.deep.equal({
        dependencies: {express: '^5.1.0', typescript: '^5.0.0'},
      });
    });

    it('prefers explicit dependencies over auto-derived package.json dependencies', async () => {
      const buildDir = makeBuildDir();
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({name: 'test-app', dependencies: {express: '^5.1.0'}}),
      );

      const bundle = await createBundleV2({
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        buildDirectory: buildDir,
        projectDirectory: projectDir,
        bundleMetadata: {dependencies: {react: '18.0.0'}},
      });

      expect(bundle.config.bundleMetadata).to.deep.equal({dependencies: {react: '18.0.0'}});
    });

    it('prefers the on-disk v2 config file over the project config.server.ts', async () => {
      const buildDir = makeBuildDir();
      writeV2ConfigFile(buildDir, {
        ssrOnly: ['v2-ssr.js'],
        ssrShared: ['v2-static/**/*'],
        ssrParameters: {Source: 'v2-config-file'},
      });
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(
        path.join(projectDir, 'config.server.ts'),
        "export const config = {ssrOnly: ['proj-ssr.js'], ssrShared: ['proj-static/**/*'], ssrParameters: {Source: 'config.server.ts'}};",
      );

      const bundle = await createBundleV2({buildDirectory: buildDir, projectDirectory: projectDir});

      // config.json takes precedence; config.server.ts is not consulted.
      expect(bundle.config.ssrOnly).to.deep.equal(['v2-ssr.js']);
      expect(bundle.config.ssrParameters).to.have.property('Source', 'v2-config-file');
    });

    it('throws a clear error when config.server.ts cannot be imported', async () => {
      const buildDir = makeBuildDir();
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(path.join(projectDir, 'config.server.ts'), 'throw new Error("boom in config");');

      try {
        await createBundleV2({buildDirectory: buildDir, projectDirectory: projectDir});
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to load server config');
      }
    });

    it('prefers the v2 config file over config.server.js when both are present', async () => {
      const buildDir = makeBuildDir();
      fs.writeFileSync(
        path.join(buildDir, 'config.server.js'),
        'module.exports = {ssrOnly: ["server-ssr.js"], ssrShared: ["server-static/**/*"], ssrParameters: {Source: "config.server.js"}};',
      );
      writeV2ConfigFile(buildDir, {
        ssrOnly: ['v2-ssr.js'],
        ssrShared: ['v2-static/**/*'],
        ssrParameters: {Source: 'v2-config-file'},
      });

      const bundle = await createBundleV2({buildDirectory: buildDir});

      // The v2 config file wins; config.server.js is not consulted.
      expect(bundle.config.ssrOnly).to.deep.equal(['v2-ssr.js']);
      expect(bundle.config.ssrShared).to.deep.equal(['v2-static/**/*']);
      expect(bundle.config.ssrParameters).to.have.property('Source', 'v2-config-file');
    });

    it('strips non-allowlisted bundleMetadata sub-keys from the on-disk config file', async () => {
      const buildDir = makeBuildDir();
      writeV2ConfigFile(buildDir, {
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        ssrParameters: {},
        bundleMetadata: {dependencies: {react: '18.0.0'}, secretKey: 'should-be-dropped'},
      });

      const bundle = await createBundleV2({buildDirectory: buildDir});

      // Only the server-allowlisted sub-keys survive.
      expect(bundle.config.bundleMetadata).to.deep.equal({dependencies: {react: '18.0.0'}});
      expect(bundle.config.bundleMetadata).to.not.have.property('secretKey');
    });

    it('throws when the on-disk v2 config file is not valid JSON', async () => {
      const buildDir = makeBuildDir();
      const filePath = path.join(buildDir, '.mrt', 'config.json');
      fs.mkdirSync(path.dirname(filePath), {recursive: true});
      fs.writeFileSync(filePath, '{ not valid json');

      try {
        await createBundleV2({buildDirectory: buildDir});
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('v2 bundle config');
      }
    });

    it('throws when ssr patterns are empty', async () => {
      const buildDir = makeBuildDir();

      try {
        await createBundleV2({ssrOnly: [], ssrShared: [], buildDirectory: buildDir});
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('ssrOnly patterns are required');
      }
    });

    it('throws when the build directory does not exist', async () => {
      try {
        await createBundleV2({
          ssrOnly: ['ssr.js'],
          ssrShared: ['static/**/*'],
          buildDirectory: path.join(tempDir, 'nonexistent'),
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Build directory at path');
        expect(error.message).to.include('not found');
      }
    });
  });

  describe('DEFAULT_SSR_PARAMETERS', () => {
    it('should have SSRFunctionNodeVersion set to 24.x', () => {
      expect(DEFAULT_SSR_PARAMETERS).to.have.property('SSRFunctionNodeVersion');
      expect(DEFAULT_SSR_PARAMETERS.SSRFunctionNodeVersion).to.equal('24.x');
    });
  });
});
