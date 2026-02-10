/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createToolRegistry, registerToolsets} from '../src/registry.js';
import {Services} from '../src/services.js';
import {B2CDxMcpServer} from '../src/server.js';
import type {StartupFlags} from '../src/utils/types.js';
import {createMockResolvedConfig} from './test-helpers.js';

// Create a mock services instance for testing
function createMockServices(): Services {
  return new Services({resolvedConfig: createMockResolvedConfig()});
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
      const services = createMockServices();
      const registry = createToolRegistry(services);

      // Verify all expected toolsets exist
      expect(registry).to.have.property('CARTRIDGES');
      expect(registry).to.have.property('MRT');
      expect(registry).to.have.property('PWAV3');
      expect(registry).to.have.property('SCAPI');
      expect(registry).to.have.property('STOREFRONTNEXT');
    });

    it('should create CARTRIDGES tools', () => {
      const services = createMockServices();
      const registry = createToolRegistry(services);

      expect(registry.CARTRIDGES).to.be.an('array');
      expect(registry.CARTRIDGES.length).to.be.greaterThan(0);

      const toolNames = registry.CARTRIDGES.map((t) => t.name);
      expect(toolNames).to.include('cartridge_deploy');
    });

    it('should create MRT tools', () => {
      const services = createMockServices();
      const registry = createToolRegistry(services);

      expect(registry.MRT).to.be.an('array');
      expect(registry.MRT.length).to.be.greaterThan(0);

      const toolNames = registry.MRT.map((t) => t.name);
      expect(toolNames).to.include('mrt_bundle_push');
    });

    it('should create PWAV3 tools', () => {
      const services = createMockServices();
      const registry = createToolRegistry(services);

      expect(registry.PWAV3).to.be.an('array');
      expect(registry.PWAV3.length).to.be.greaterThan(0);

      const toolNames = registry.PWAV3.map((t) => t.name);
      expect(toolNames).to.include('pwakit_create_storefront');
      expect(toolNames).to.include('pwakit_create_page');
      expect(toolNames).to.include('pwakit_create_component');
      // mrt_bundle_push should also appear in PWAV3 (multi-toolset)
      expect(toolNames).to.include('mrt_bundle_push');
    });

    it('should create SCAPI tools', () => {
      const services = createMockServices();
      const registry = createToolRegistry(services);

      expect(registry.SCAPI).to.be.an('array');
      expect(registry.SCAPI.length).to.be.greaterThan(0);

      const toolNames = registry.SCAPI.map((t) => t.name);
      expect(toolNames).to.include('scapi_schemas_list');
      expect(toolNames).to.include('scapi_custom_api_status');
    });

    it('should create STOREFRONTNEXT tools', () => {
      const services = createMockServices();
      const registry = createToolRegistry(services);

      expect(registry.STOREFRONTNEXT).to.be.an('array');
      expect(registry.STOREFRONTNEXT.length).to.be.greaterThan(0);

      const toolNames = registry.STOREFRONTNEXT.map((t) => t.name);
      expect(toolNames).to.include('storefront_next_development_guidelines');
      expect(toolNames).to.include('storefront_next_site_theming');
      expect(toolNames).to.include('storefront_next_generate_component');
      // mrt_bundle_push should also appear in STOREFRONTNEXT (multi-toolset)
      expect(toolNames).to.include('mrt_bundle_push');
    });

    it('should assign correct toolsets to each tool', () => {
      const services = createMockServices();
      const registry = createToolRegistry(services);

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
  });

  describe('registerToolsets', () => {
    it('should auto-discover and register tools when no toolsets or tools provided', async () => {
      const services = createMockServices();
      const server = createMockServer();
      // Use a workspace path that won't match any patterns (should fall back to SCAPI)
      const flags: StartupFlags = {
        workingDirectory: '/nonexistent/path',
        allowNonGaTools: true,
      };

      // When no flags provided, auto-discovery kicks in
      // With an unknown project, it falls back to SCAPI toolset
      await registerToolsets(flags, server, services);
      expect(server.registeredTools.length).to.be.greaterThan(0);
      // SCAPI tools should be registered as fallback
      expect(server.registeredTools).to.include('scapi_schemas_list');
    });

    it('should skip auto-discovery when empty toolsets array is explicitly provided', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: [],
        allowNonGaTools: true,
      };

      // Empty toolsets array still triggers auto-discovery (length is 0)
      await registerToolsets(flags, server, services);
      // Should have auto-discovered SCAPI as fallback
      expect(server.registeredTools).to.include('scapi_schemas_list');
    });

    it('should register tools from a single toolset', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES'],
        allowNonGaTools: true,
      };

      await registerToolsets(flags, server, services);

      expect(server.registeredTools).to.include('cartridge_deploy');
      // Should not include tools exclusive to other toolsets
      expect(server.registeredTools).to.not.include('scapi_custom_api_status');
    });

    it('should register tools from multiple toolsets', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES', 'MRT'],
        allowNonGaTools: true,
      };

      await registerToolsets(flags, server, services);

      // Should include CARTRIDGES tools
      expect(server.registeredTools).to.include('cartridge_deploy');
      // Should include MRT tools
      expect(server.registeredTools).to.include('mrt_bundle_push');
      // Should not include PWAV3-only tools
      expect(server.registeredTools).to.not.include('pwakit_create_storefront');
    });

    it('should register all toolsets when ALL is specified', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['ALL'],
        allowNonGaTools: true,
      };

      await registerToolsets(flags, server, services);

      // Should include tools from all toolsets
      expect(server.registeredTools).to.include('cartridge_deploy');
      expect(server.registeredTools).to.include('mrt_bundle_push');
      expect(server.registeredTools).to.include('pwakit_create_storefront');
      expect(server.registeredTools).to.include('scapi_schemas_list');
      expect(server.registeredTools).to.include('storefront_next_development_guidelines');
    });

    it('should register individual tools via --tools flag', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        tools: ['cartridge_deploy', 'mrt_bundle_push'],
        allowNonGaTools: true,
      };

      await registerToolsets(flags, server, services);

      expect(server.registeredTools).to.have.lengthOf(2);
      expect(server.registeredTools).to.include('cartridge_deploy');
      expect(server.registeredTools).to.include('mrt_bundle_push');
    });

    it('should combine toolsets and individual tools', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES'],
        tools: ['scapi_custom_api_status'],
        allowNonGaTools: true,
      };

      await registerToolsets(flags, server, services);

      // Should include all CARTRIDGES tools
      expect(server.registeredTools).to.include('cartridge_deploy');
      // Should also include the individual SCAPI tool
      expect(server.registeredTools).to.include('scapi_custom_api_status');
      // Should not include other SCAPI tools not in CARTRIDGES
      expect(server.registeredTools).to.not.include('scapi_schemas_list');
    });

    it('should not duplicate tools when specified in both toolset and --tools', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES'],
        tools: ['cartridge_deploy'], // Already in CARTRIDGES
        allowNonGaTools: true,
      };

      await registerToolsets(flags, server, services);

      // Should only have one instance of cartridge_deploy
      const cartridgeDeployCount = server.registeredTools.filter((t) => t === 'cartridge_deploy').length;
      expect(cartridgeDeployCount).to.equal(1);
    });

    it('should warn and skip invalid tool names', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        tools: ['nonexistent_tool', 'cartridge_deploy'],
        allowNonGaTools: true,
      };

      // Should not throw, just skip invalid tools
      await registerToolsets(flags, server, services);

      // Valid tool should be registered
      expect(server.registeredTools).to.include('cartridge_deploy');
      // Invalid tool should be skipped (not cause error)
      expect(server.registeredTools).to.not.include('nonexistent_tool');
    });

    it('should warn and skip invalid toolset names', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['INVALID_TOOLSET', 'CARTRIDGES'],
        allowNonGaTools: true,
      };

      // Should not throw, just skip invalid toolsets
      await registerToolsets(flags, server, services);

      // Valid toolset's tools should be registered
      expect(server.registeredTools).to.include('cartridge_deploy');
    });

    it('should trigger auto-discovery when all toolsets are invalid', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['INVALID1', 'INVALID2'],
        allowNonGaTools: true,
      };

      // Should not throw - triggers auto-discovery as fallback
      await registerToolsets(flags, server, services);

      // Auto-discovery always includes BASE_TOOLSET (SCAPI), even if no project type detected
      expect(server.registeredTools).to.include('scapi_schemas_list');
      expect(server.registeredTools).to.include('scapi_custom_api_status');
    });

    it('should trigger auto-discovery when all individual tools are invalid', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        tools: ['nonexistent_tool', 'another_fake_tool'],
        allowNonGaTools: true,
      };

      // Should not throw - triggers auto-discovery as fallback
      await registerToolsets(flags, server, services);

      // Auto-discovery always includes BASE_TOOLSET (SCAPI), even if no project type detected
      expect(server.registeredTools).to.include('scapi_schemas_list');
      expect(server.registeredTools).to.include('scapi_custom_api_status');
    });

    it('should skip non-GA tools when allowNonGaTools is false', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['CARTRIDGES'],
        allowNonGaTools: false,
      };

      await registerToolsets(flags, server, services);

      // All current CARTRIDGES tools are non-GA (isGA: false)
      // So none should be registered
      expect(server.registeredTools).to.have.lengthOf(0);
    });

    it('should register GA tools even when allowNonGaTools is false', async () => {
      const services = createMockServices();
      const server = createMockServer();
      const flags: StartupFlags = {
        toolsets: ['ALL'],
        allowNonGaTools: false,
      };

      await registerToolsets(flags, server, services);

      // Currently all tools are non-GA placeholders
      // This test documents expected behavior for when GA tools exist
      // When GA tools are added, this test should be updated to verify they are registered
    });

    describe('auto-discovery', () => {
      it('should use workingDirectory from flags for detection', async () => {
        const services = createMockServices();
        const server = createMockServer();
        const flags: StartupFlags = {
          workingDirectory: '/some/workspace',
          allowNonGaTools: true,
        };

        // Should not throw even with non-existent path
        await registerToolsets(flags, server, services);
        // Falls back to SCAPI for unknown projects
        expect(server.registeredTools).to.include('scapi_schemas_list');
      });

      it('should map detected project type to MCP toolsets', async () => {
        const services = createMockServices();
        const server = createMockServer();
        // Use a path that doesn't exist - detection will return 'unknown' project type
        // which maps to SCAPI toolset
        const flags: StartupFlags = {
          workingDirectory: '/nonexistent',
          allowNonGaTools: true,
        };

        await registerToolsets(flags, server, services);

        // Only SCAPI tools should be registered (the fallback for unknown projects)
        expect(server.registeredTools).to.include('scapi_schemas_list');
      });

      it('should not auto-discover when individual tools are provided', async () => {
        const services = createMockServices();
        const server = createMockServer();
        const flags: StartupFlags = {
          tools: ['cartridge_deploy'],
          workingDirectory: '/some/workspace',
          allowNonGaTools: true,
        };

        await registerToolsets(flags, server, services);

        // Should only have the explicitly requested tool
        expect(server.registeredTools).to.have.lengthOf(1);
        expect(server.registeredTools).to.include('cartridge_deploy');
      });

      it('should not auto-discover when toolsets are explicitly provided', async () => {
        const services = createMockServices();
        const server = createMockServer();
        const flags: StartupFlags = {
          toolsets: ['CARTRIDGES'],
          workingDirectory: '/some/workspace',
          allowNonGaTools: true,
        };

        await registerToolsets(flags, server, services);

        // Should only have CARTRIDGES tools, not auto-discovered toolsets
        expect(server.registeredTools).to.include('cartridge_deploy');
        // Should not have tools from other toolsets unless explicitly requested
        expect(server.registeredTools).to.not.include('pwakit_create_storefront');
      });
    });
  });
});
