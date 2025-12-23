/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * MCP Server Command - Salesforce B2C Commerce Developer Experience
 *
 * This is the main entry point for the B2C DX MCP server, built with oclif.
 * It exposes B2C Commerce Cloud developer tools to AI assistants via the
 * Model Context Protocol (MCP).
 *
 * ## Flags
 *
 * ### MCP-Specific Flags
 * | Flag | Description |
 * |------|-------------|
 * | `--toolsets` | Comma-separated toolsets to enable (case-insensitive) |
 * | `--tools` | Comma-separated individual tools to enable (case-insensitive) |
 * | `--allow-non-ga-tools` | Enable experimental/non-GA tools |
 *
 * ### Global Flags (inherited from BaseCommand)
 * | Flag | Description |
 * |------|-------------|
 * | `--config` | Path to dw.json config file (auto-discovered if not provided) |
 * | `--instance` | Instance name from configuration file |
 * | `--log-level` | Set logging verbosity (trace, debug, info, warn, error, silent) |
 * | `--debug` | Enable debug logging |
 * | `--json` | Output logs as JSON lines |
 * | `--lang` | Language for messages |
 *
 * ## Configuration Priority
 *
 * 1. Environment variables (SFCC_*) - highest priority, override dw.json
 * 2. dw.json file (explicit path via --config, or auto-discovered)
 * 3. Auto-discovery (searches upward from cwd)
 *
 * ## Toolset Validation
 *
 * - Invalid toolsets are ignored with a warning (server still starts)
 * - If all toolsets are invalid, auto-discovery kicks in
 *
 * @example Start with all toolsets
 * ```bash
 * b2c-dx-mcp --toolsets all
 * ```
 *
 * @example Start with specific toolsets
 * ```bash
 * b2c-dx-mcp --toolsets CARTRIDGES,JOBS
 * ```
 *
 * @example Start with specific individual tools
 * ```bash
 * b2c-dx-mcp --tools cartridge_deploy,cartridge_activate
 * ```
 *
 * @example Combine toolsets and specific tools
 * ```bash
 * b2c-dx-mcp --toolsets SCAPI --tools cartridge_deploy
 * ```
 *
 * @example Specify config file location
 * ```bash
 * b2c-dx-mcp --toolsets all --config /path/to/dw.json
 * ```
 *
 * @example Enable debug logging
 * ```bash
 * b2c-dx-mcp --toolsets all --debug
 * ```
 */

import { Flags } from "@oclif/core";
import { BaseCommand } from "@salesforce/b2c-tooling-sdk/cli";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { B2CDxMcpServer } from "../server.js";
import { Services } from "../services.js";
import { registerToolsets } from "../registry.js";
import { TOOLSETS, type StartupFlags } from "../utils/index.js";

/**
 * oclif Command that starts the B2C DX MCP server.
 *
 * Uses oclif's single-command strategy - this IS the CLI, not a subcommand.
 * Extends BaseCommand from @salesforce/b2c-tooling-sdk which provides:
 * - Global flags for config, logging, and debugging
 * - Structured pino logging via `this.logger`
 * - Automatic dw.json loading via `this.resolvedConfig`
 * - `this.config` - package.json metadata and standard config paths
 */
export default class McpServerCommand extends BaseCommand<
  typeof McpServerCommand
> {
  static description =
    "Salesforce B2C Commerce Cloud Developer Experience MCP Server - Expose B2C Commerce Developer Experience tools to AI assistants";

  static examples = [
    "<%= config.bin %> <%= command.id %> --toolsets all",
    "<%= config.bin %> <%= command.id %> --toolsets STOREFRONTNEXT,MRT",
    "<%= config.bin %> <%= command.id %> --tools sfnext_deploy,mrt_bundle_push",
    "<%= config.bin %> <%= command.id %> --toolsets STOREFRONTNEXT --tools sfnext_deploy",
    "<%= config.bin %> <%= command.id %> --toolsets MRT --config /path/to/dw.json",
    "<%= config.bin %> <%= command.id %> --toolsets all --debug",
  ];

  static flags = {
    // Toolset selection flags
    toolsets: Flags.string({
      description: `Toolsets to enable (comma-separated). Options: all, ${TOOLSETS.join(", ")}`,
      env: "SFCC_TOOLSETS",
      parse: async (input) => input.toUpperCase(),
    }),
    tools: Flags.string({
      description: "Individual tools to enable (comma-separated)",
      env: "SFCC_TOOLS",
      parse: async (input) => input.toLowerCase(),
    }),

    // Feature flags
    "allow-non-ga-tools": Flags.boolean({
      description: "Enable non-GA (experimental) tools",
      env: "SFCC_ALLOW_NON_GA_TOOLS",
      default: false,
    }),
  };

  /**
   * Main entry point - starts the MCP server.
   *
   * Execution flow:
   * 1. BaseCommand.init() parses flags and loads config
   * 2. Filter and validate toolsets (invalid ones are skipped with warning)
   * 3. Create B2CDxMcpServer instance
   * 4. Create Services for dependency injection (config, file system access)
   * 5. Register tools based on --toolsets and --tools flags
   * 6. Connect to stdio transport (JSON-RPC over stdin/stdout)
   * 7. Log startup message to stderr
   *
   * @throws Never throws - invalid toolsets are filtered, not rejected
   *
   * @remarks
   * BaseCommand provides:
   * - `this.flags` - Parsed flags including global flags (config, debug, log-level, etc.)
   * - `this.resolvedConfig` - Loaded dw.json configuration
   * - `this.logger` - Structured pino logger
   *
   * oclif provides standard config paths via `this.config`:
   * - `this.config.configDir` - User config (~/.config/b2c-dx-mcp)
   * - `this.config.dataDir` - User data (~/.local/share/b2c-dx-mcp)
   * - `this.config.cacheDir` - Cache (~/.cache/b2c-dx-mcp)
   * These can be exposed to Services if needed for features like telemetry or caching.
   */
  async run(): Promise<void> {
    // Flags are already parsed by BaseCommand.init()
    // Parse toolsets and tools from comma-separated strings
    // Note: toolsets are uppercased, tools are lowercased by their parse functions
    const startupFlags: StartupFlags = {
      toolsets: this.flags.toolsets
        ? this.flags.toolsets.split(",").map((s) => s.trim())
        : undefined,
      tools: this.flags.tools
        ? this.flags.tools.split(",").map((s) => s.trim())
        : undefined,
      allowNonGaTools: this.flags["allow-non-ga-tools"],
      configPath: this.flags.config,
    };

    // TODO: Telemetry - Initialize telemetry unless disabled
    // if (!flags["no-telemetry"]) {
    //   telemetry = new Telemetry({
    //     toolsets: (startupFlags.toolsets ?? []).join(", "),
    //     configDir,
    //     version: this.config.version,
    //   });
    //   await telemetry.start();
    //   process.stdin.on("close", (err) => {
    //     telemetry?.sendEvent(err ? "SERVER_STOPPED_ERROR" : "SERVER_STOPPED_SUCCESS");
    //     telemetry?.stop();
    //   });
    // }

    // Create MCP server
    const server = new B2CDxMcpServer(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    );

    // Create services for dependency injection
    // Pass the config path for tools that need to load configuration
    const services = new Services({
      configPath: this.flags.config,
    });

    // Register toolsets
    await registerToolsets(startupFlags, server, services);

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log startup message using the structured logger
    this.logger.info(
      { version: this.config.version, toolsets: TOOLSETS },
      "MCP Server running on stdio",
    );
    this.logger.info(
      { enabled: startupFlags.toolsets ?? [] },
      "Enabled toolsets",
    );
  }
}
