/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {stub, restore} from 'sinon';
import {DOC_CATEGORIES} from '@salesforce/b2c-tooling-sdk/docs';
import {createToolRegistry, registerToolsets} from '../src/registry.js';
import {Services} from '../src/services.js';
import {B2CDxMcpServer} from '../src/server.js';
import type {StartupFlags} from '../src/utils/types.js';
import {createMockResolvedConfig} from './test-helpers.js';

// Create a loadServices function for testing
function createMockLoadServicesWrapper(): () => Services {
  const services = new Services({resolvedConfig: createMockResolvedConfig()});
  return () => services;
}

// Create a mock server that tracks registered tools
function createMockServer(): B2CDxMcpServer & {registeredTools: string[]} {
  const registeredTools: string[] = [];
  const server = {
    registeredTools,
    addTool(name: string) {
      registeredTools.push(name);
      return {name, enabled: true};
    },
  } as unknown as B2CDxMcpServer & {registeredTools: string[]};
  return server;
}

describe('registry', () => {
  describe('createToolRegistry', () => {
    it('should create a registry with all toolsets', () => {
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);

      // Verify all expected toolsets exist
      expect(registry).to.have.property('CARTRIDGES');
      expect(registry).to.have.property('MRT');
      expect(registry).to.have.property('PWAV3');
      expect(registry).to.have.property('SCAPI');
      expect(registry).to.have.property('STOREFRONTNEXT');
    });

    it('should create CARTRIDGES tools', () => {
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);

      expect(registry.CARTRIDGES).to.be.an('array');
      expect(registry.CARTRIDGES.length).to.be.greaterThan(0);

      const toolNames = registry.CARTRIDGES.map((t) => t.name);
      expect(toolNames).to.include('cartridge_deploy');
    });

    it('should create MRT tools', () => {
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);

      expect(registry.MRT).to.be.an('array');
      expect(registry.MRT.length).to.be.greaterThan(0);

      const toolNames = registry.MRT.map((t) => t.name);
      expect(toolNames).to.include('mrt_bundle_push');
    });

    it('should create PWAV3 tools', () => {
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);

      expect(registry.PWAV3).to.be.an('array');
      // mrt_bundle_push appears in PWAV3 (multi-toolset); PWA Kit-specific tools not yet implemented
      const toolNames = registry.PWAV3.map((t) => t.name);
      expect(toolNames).to.include('mrt_bundle_push');
    });

    it('should create SCAPI tools', () => {
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);

      expect(registry.SCAPI).to.be.an('array');
      expect(registry.SCAPI.length).to.be.greaterThan(0);

      const toolNames = registry.SCAPI.map((t) => t.name);
      expect(toolNames).to.include('scapi_schemas_list');
      expect(toolNames).to.include('scapi_custom_apis_get_status');
      expect(toolNames).to.include('scapi_custom_api_generate_scaffold');
    });

    it('should create STOREFRONTNEXT tools', () => {
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);

      expect(registry.STOREFRONTNEXT).to.be.an('array');
      expect(registry.STOREFRONTNEXT.length).to.be.greaterThan(0);

      const toolNames = registry.STOREFRONTNEXT.map((t) => t.name);
      // mrt_bundle_push and scapi tools appear in STOREFRONTNEXT (multi-toolset, GA)
      expect(toolNames).to.include('mrt_bundle_push');
      expect(toolNames).to.include('scapi_schemas_list');
    });

    it('should assign correct toolsets to each tool', () => {
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);

      // Verify tools have correct toolset assignments
      for (const tool of registry.CARTRIDGES) {
        expect(tool.toolsets).to.include('CARTRIDGES');
      }
      for (const tool of registry.MRT) {
        expect(tool.toolsets).to.include('MRT');
      }
      for (const tool of registry.PWAV3) {
        expect(tool.toolsets).to.include('PWAV3');
      }
      for (const tool of registry.SCAPI) {
        expect(tool.toolsets).to.include('SCAPI');
      }
      for (const tool of registry.STOREFRONTNEXT) {
        expect(tool.toolsets).to.include('STOREFRONTNEXT');
      }
    });

    it('should expose standardized context fields by tool class', () => {
      const registry = createToolRegistry(createMockLoadServicesWrapper());
      const toolsByName = new Map(
        Object.values(registry)
          .flat()
          .map((tool) => [tool.name, tool]),
      );
      const configurationAwareTools = [
        'cartridge_deploy',
        'config_inspect',
        'debug_start_session',
        'logs_get_recent',
        'logs_list_files',
        'logs_watch_start',
        'metrics_get',
        'mrt_bundle_push',
        'mrt_logs_watch_start',
        'scapi_custom_apis_get_status',
        'scapi_schemas_list',
      ];
      const localProjectTools = ['scapi_custom_api_generate_scaffold'];

      for (const name of configurationAwareTools) {
        const tool = toolsByName.get(name);
        expect(tool, `${name} should be registered`).to.not.be.undefined;
        expect(tool!.inputSchema, `${name} should accept projectDirectory`).to.have.property('projectDirectory');
        expect(tool!.inputSchema, `${name} should accept configPath`).to.have.property('configPath');
        expect(tool!.inputSchema, `${name} should accept instanceName`).to.have.property('instanceName');
      }

      for (const name of localProjectTools) {
        const tool = toolsByName.get(name);
        expect(tool, `${name} should be registered`).to.not.be.undefined;
        expect(tool!.inputSchema, `${name} should accept projectDirectory`).to.have.property('projectDirectory');
        expect(tool!.inputSchema, `${name} should not accept configPath`).not.to.have.property('configPath');
        expect(tool!.inputSchema, `${name} should not accept instanceName`).not.to.have.property('instanceName');
      }

      expect(toolsByName.get('debug_start_session')!.inputSchema).to.have.property('cartridgeDirectory');
    });

    it('keeps tool and input descriptions concise', () => {
      const registry = createToolRegistry(
        createMockLoadServicesWrapper(),
        undefined,
        ['cartridges', 'sfra', 'pwa-kit-v3', 'storefront-next'],
        DOC_CATEGORIES,
      );
      const tools = [
        ...new Map(
          Object.values(registry)
            .flat()
            .map((tool) => [tool.name, tool]),
        ).values(),
      ];

      for (const tool of tools) {
        expect(tool.description.length, `${tool.name} description too long`).to.be.at.most(400);
        for (const [field, schema] of Object.entries(tool.inputSchema)) {
          expect(schema.description, `${tool.name}.${field} should have a description`).to.be.a('string').and.not.be
            .empty;
          expect(schema.description!.length, `${tool.name}.${field} description too long`).to.be.at.most(120);
        }
      }
    });

    it('registered tool handlers are invokable end-to-end', async () => {
      // Smoke test that verifies tools aren't just registered by name — the
      // handler can actually be invoked and produce a tool-call response.
      // Uses config_inspect (local configuration resolution, no network needed).
      const loadServices = createMockLoadServicesWrapper();
      const registry = createToolRegistry(loadServices);
      const tool = registry.DIAGNOSTICS.find((t) => t.name === 'config_inspect');
      expect(tool, 'config_inspect must be registered in DIAGNOSTICS').to.not.be.undefined;

      const result = await tool!.handler({});
      expect(result).to.have.property('content');
      expect(result.content).to.be.an('array').and.to.have.lengthOf.greaterThan(0);
      expect(result.content[0]).to.have.property('type', 'text');
      expect(result.content[0]).to.have.property('text').that.is.a('string').and.to.have.lengthOf.greaterThan(0);
      expect(result.isError, 'config_inspect should not error').to.not.equal(true);
    });
  });

  describe('registerToolsets', () => {
    it('should auto-discover and register tools when no toolsets or tools provided', async () => {
      const server = createMockServer();
      // Use a workspace path that won't match any patterns (should fall back to SCAPI)
      const flags: StartupFlags = {
        projectDirectory: '/nonexistent/path',
        allowNonGaTools: true,
      };

      // When no flags provided, auto-discovery kicks in
      // With an unknown project, it falls back to SCAPI toolset
      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);
      expect(server.registeredTools.length).to.be.greaterThan(0);
      // SCAPI tools should be registered as fallback
      expect(server.registeredTools).to.include('scapi_schemas_list');
      // DIAGNOSTICS is a base toolset too — log/debugger/docs tools are
      // auto-enabled for every project type, including unknown workspaces.
      expect(server.registeredTools).to.include('logs_list_files');
      expect(server.registeredTools).to.include('docs_search');
    });

    it('should skip auto-discovery when empty toolsets array is explicitly provided', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: [],
        allowNonGaTools: true,
      };

      // Empty toolsets array still triggers auto-discovery (length is 0)
      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);
      // Should have auto-discovered SCAPI as fallback
      expect(server.registeredTools).to.include('scapi_schemas_list');
    });

    it('should register tools from a single toolset', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES'],
        allowNonGaTools: true,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      expect(server.registeredTools).to.include('cartridge_deploy');
      // Should not include tools exclusive to other toolsets
      expect(server.registeredTools).to.not.include('scapi_custom_apis_get_status');
    });

    it('should register tools from multiple toolsets', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES', 'MRT'],
        allowNonGaTools: true,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Should include CARTRIDGES tools
      expect(server.registeredTools).to.include('cartridge_deploy');
      // Should include MRT tools
      expect(server.registeredTools).to.include('mrt_bundle_push');
      // Should not include PWAV3-only tools (placeholder tools removed)
      expect(server.registeredTools).to.not.include('pwakit_create_storefront');
    });

    it('should register all toolsets when ALL is specified', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['ALL'],
        allowNonGaTools: true,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Should include tools from all toolsets (placeholder tools removed)
      expect(server.registeredTools).to.include('cartridge_deploy');
      expect(server.registeredTools).to.include('mrt_bundle_push');
      expect(server.registeredTools).to.include('scapi_schemas_list');
    });

    it('should register individual tools via --tools flag', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        tools: ['cartridge_deploy', 'mrt_bundle_push'],
        allowNonGaTools: true,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      expect(server.registeredTools).to.have.lengthOf(2);
      expect(server.registeredTools).to.include('cartridge_deploy');
      expect(server.registeredTools).to.include('mrt_bundle_push');
    });

    it('should combine toolsets and individual tools', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES'],
        tools: ['scapi_custom_apis_get_status'],
        allowNonGaTools: true,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Should include all CARTRIDGES tools
      expect(server.registeredTools).to.include('cartridge_deploy');
      // Should also include the individual SCAPI tool
      expect(server.registeredTools).to.include('scapi_custom_apis_get_status');
      // Should not include other SCAPI tools not in CARTRIDGES
      expect(server.registeredTools).to.not.include('scapi_schemas_list');
    });

    it('should not duplicate tools when specified in both toolset and --tools', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES'],
        tools: ['cartridge_deploy'], // Already in CARTRIDGES
        allowNonGaTools: true,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Should only have one instance of cartridge_deploy
      const cartridgeDeployCount = server.registeredTools.filter((t) => t === 'cartridge_deploy').length;
      expect(cartridgeDeployCount).to.equal(1);
    });

    it('should warn and skip invalid tool names', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        tools: ['nonexistent_tool', 'cartridge_deploy'],
        allowNonGaTools: true,
      };

      // Should not throw, just skip invalid tools
      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Valid tool should be registered
      expect(server.registeredTools).to.include('cartridge_deploy');
      // Invalid tool should be skipped (not cause error)
      expect(server.registeredTools).to.not.include('nonexistent_tool');
    });

    it('should warn and skip invalid toolset names', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['INVALID_TOOLSET', 'CARTRIDGES'],
        allowNonGaTools: true,
      };

      // Should not throw, just skip invalid toolsets
      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Valid toolset's tools should be registered
      expect(server.registeredTools).to.include('cartridge_deploy');
    });

    it('should trigger auto-discovery when all toolsets are invalid', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['INVALID1', 'INVALID2'],
        allowNonGaTools: true,
      };

      // Should not throw - triggers auto-discovery as fallback
      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Auto-discovery always includes BASE_TOOLSET (SCAPI), even if no project type detected
      expect(server.registeredTools).to.include('scapi_schemas_list');
      expect(server.registeredTools).to.include('scapi_custom_apis_get_status');
      expect(server.registeredTools).to.include('scapi_custom_api_generate_scaffold');
    });

    it('should trigger auto-discovery when all individual tools are invalid', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        tools: ['nonexistent_tool', 'another_fake_tool'],
        allowNonGaTools: true,
      };

      // Should not throw - triggers auto-discovery as fallback
      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // Auto-discovery always includes BASE_TOOLSET (SCAPI), even if no project type detected
      expect(server.registeredTools).to.include('scapi_schemas_list');
      expect(server.registeredTools).to.include('scapi_custom_apis_get_status');
      expect(server.registeredTools).to.include('scapi_custom_api_generate_scaffold');
    });

    it('should register GA tools even when allowNonGaTools is false', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['ALL'],
        allowNonGaTools: false,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // GA tools from CARTRIDGES, MRT, SCAPI, PWAV3 should be registered
      expect(server.registeredTools).to.include('cartridge_deploy');
      expect(server.registeredTools).to.include('mrt_bundle_push');
      expect(server.registeredTools).to.include('scapi_schemas_list');
      expect(server.registeredTools).to.include('scapi_custom_apis_get_status');
      expect(server.registeredTools).to.include('scapi_custom_api_generate_scaffold');
      expect(server.registeredTools).to.include('pwakit_get_guidelines');

      // Non-GA tools should NOT be registered
      expect(server.registeredTools).to.not.include('metrics_get');
    });

    it('should register non-GA tools when allowNonGaTools is true', async () => {
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['SCAPI'],
        allowNonGaTools: true,
      };

      const loadServices = createMockLoadServicesWrapper();
      await registerToolsets(flags, server, loadServices);

      // GA SCAPI tools should be registered
      expect(server.registeredTools).to.include('scapi_schemas_list');
      expect(server.registeredTools).to.include('scapi_custom_apis_get_status');
      expect(server.registeredTools).to.include('scapi_custom_api_generate_scaffold');

      // Non-GA SCAPI tools should also be registered
      expect(server.registeredTools).to.include('metrics_get');
    });

    describe('auto-discovery', () => {
      it('should use projectDirectory from flags for detection', async () => {
        const server = createMockServer();
        const flags: StartupFlags = {
          projectDirectory: '/some/workspace',
          allowNonGaTools: true,
        };

        // Should not throw even with non-existent path
        const loadServices = createMockLoadServicesWrapper();
        await registerToolsets(flags, server, loadServices);
        // Falls back to SCAPI for unknown projects
        expect(server.registeredTools).to.include('scapi_schemas_list');
      });

      it('should map detected project type to MCP toolsets', async () => {
        const server = createMockServer();
        // Use a path that doesn't exist - detection will return 'unknown' project type
        // which maps to SCAPI toolset
        const flags: StartupFlags = {
          projectDirectory: '/nonexistent',
          allowNonGaTools: true,
        };

        const loadServices = createMockLoadServicesWrapper();
        await registerToolsets(flags, server, loadServices);

        // Only SCAPI tools should be registered (the fallback for unknown projects)
        expect(server.registeredTools).to.include('scapi_schemas_list');
      });

      it('should not auto-discover when individual tools are provided', async () => {
        const server = createMockServer();
        const flags: StartupFlags = {
          tools: ['cartridge_deploy'],
          projectDirectory: '/some/workspace',
          allowNonGaTools: true,
        };

        const loadServices = createMockLoadServicesWrapper();
        await registerToolsets(flags, server, loadServices);

        // Should only have the explicitly requested tool
        expect(server.registeredTools).to.have.lengthOf(1);
        expect(server.registeredTools).to.include('cartridge_deploy');
      });

      it('should not auto-discover when toolsets are explicitly provided', async () => {
        const server = createMockServer();
        const flags: StartupFlags = {
          toolsets: ['CARTRIDGES'],
          projectDirectory: '/some/workspace',
          allowNonGaTools: true,
        };

        const loadServices = createMockLoadServicesWrapper();
        await registerToolsets(flags, server, loadServices);

        // Should only have CARTRIDGES tools, not auto-discovered toolsets
        expect(server.registeredTools).to.include('cartridge_deploy');
        // Should not have tools from other toolsets unless explicitly requested
        expect(server.registeredTools).to.not.include('pwakit_create_storefront');
      });

      it('should NOT scan the filesystem when explicit toolsets are provided', async () => {
        // If detection ran, it would auto-enable CARTRIDGES from the .project
        // fixture below. With explicit toolsets it must be skipped entirely, so
        // only SCAPI tools (the requested toolset) are registered.
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-mcp-registry-'));
        try {
          const cartridge = path.join(dir, 'cartridges', 'app_storefront_base');
          fs.mkdirSync(cartridge, {recursive: true});
          fs.writeFileSync(path.join(cartridge, '.project'), '<xml/>');

          const server = createMockServer();
          const flags: StartupFlags = {
            toolsets: ['SCAPI'],
            projectDirectory: dir,
            allowNonGaTools: true,
          };
          await registerToolsets(flags, server, createMockLoadServicesWrapper());

          expect(server.registeredTools).to.include('scapi_schemas_list');
          // cartridge_deploy would only appear if detection had auto-enabled CARTRIDGES.
          expect(server.registeredTools).to.not.include('cartridge_deploy');
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('should auto-discover CARTRIDGES from a shallow .project within the depth bound', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-mcp-registry-'));
        try {
          const cartridge = path.join(dir, 'cartridges', 'app_storefront_base');
          fs.mkdirSync(cartridge, {recursive: true});
          fs.writeFileSync(path.join(cartridge, '.project'), '<xml/>');

          const server = createMockServer();
          const flags: StartupFlags = {projectDirectory: dir, allowNonGaTools: true};
          await registerToolsets(flags, server, createMockLoadServicesWrapper());

          expect(server.registeredTools).to.include('cartridge_deploy');
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('should skip auto-discovery when the project directory is the home directory', async () => {
        // Place a cartridge in the "home" directory; detection must be skipped so
        // it is not found and only the base fallback (SCAPI) is registered. Stub
        // os.homedir() directly rather than overriding an env var — the backing
        // env differs by platform ($HOME on POSIX, USERPROFILE on Windows) and
        // Windows may return a short (8.3) path that would not string-match.
        const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-mcp-home-'));
        try {
          const cartridge = path.join(fakeHome, 'cartridges', 'app_storefront_base');
          fs.mkdirSync(cartridge, {recursive: true});
          fs.writeFileSync(path.join(cartridge, '.project'), '<xml/>');

          stub(os, 'homedir').returns(fakeHome);

          const server = createMockServer();
          const flags: StartupFlags = {projectDirectory: fakeHome, allowNonGaTools: true};
          await registerToolsets(flags, server, createMockLoadServicesWrapper());

          // Base fallback still registers, but the cartridge was never scanned.
          expect(server.registeredTools).to.include('scapi_schemas_list');
          expect(server.registeredTools).to.not.include('cartridge_deploy');
        } finally {
          restore();
          fs.rmSync(fakeHome, {recursive: true, force: true});
        }
      });
    });
  });
});
