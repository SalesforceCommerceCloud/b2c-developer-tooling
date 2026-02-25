/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
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
 * | Flag | Env Variable | Description |
 * |------|--------------|-------------|
 * | `--toolsets` | `SFCC_TOOLSETS` | Comma-separated toolsets to enable (case-insensitive) |
 * | `--tools` | `SFCC_TOOLS` | Comma-separated individual tools to enable (case-insensitive) |
 * | `--allow-non-ga-tools` | `SFCC_ALLOW_NON_GA_TOOLS` | Enable experimental/non-GA tools |
 *
 * ### Environment Variables for Telemetry
 * | Env Variable | Description |
 * |--------------|-------------|
 * | `SF_DISABLE_TELEMETRY` | Set to `true` to disable telemetry (sf CLI standard) |
 * | `SFCC_DISABLE_TELEMETRY` | Set to `true` to disable telemetry |
 * | `SFCC_APP_INSIGHTS_KEY` | Override connection string from package.json |
 *
 * ### MRT Flags (from MrtCommand.baseFlags)
 * | Flag | Env Variable | Description |
 * |------|--------------|-------------|
 * | `--api-key` | `SFCC_MRT_API_KEY` | MRT API key for Managed Runtime operations |
 * | `--project` | `SFCC_MRT_PROJECT` | MRT project slug (required for MRT tools) |
 * | `--environment` | `SFCC_MRT_ENVIRONMENT` | MRT environment (e.g., staging, production) |
 * | `--cloud-origin` | `SFCC_MRT_CLOUD_ORIGIN` | MRT cloud origin URL for environment-specific ~/.mobify config |
 *
 * ### B2C Instance Flags (from InstanceCommand.baseFlags)
 * | Flag | Env Variable | Description |
 * |------|--------------|-------------|
 * | `--server` | `SFCC_SERVER` | B2C instance hostname |
 * | `--code-version` | `SFCC_CODE_VERSION` | Code version for deployments |
 * | `--username` | `SFCC_USERNAME` | Username for Basic auth (WebDAV) |
 * | `--password` | `SFCC_PASSWORD` | Password/access key for Basic auth |
 * | `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID |
 * | `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret |
 *
 * ### Global Flags (inherited from BaseCommand)
 * | Flag | Env Variable | Description |
 * |------|--------------|-------------|
 * | `--working-directory` | `SFCC_WORKING_DIRECTORY` | Project working directory (see note below) |
 * | `--config` | `SFCC_CONFIG` | Path to dw.json config file (auto-discovered if not provided) |
 * | `--instance` | `SFCC_INSTANCE` | Instance name from configuration file |
 * | `--log-level` | `SFCC_LOG_LEVEL` | Set logging verbosity (trace, debug, info, warn, error, silent) |
 * | `--debug` | `SFCC_DEBUG` | Enable debug logging |
 * | `--json` | - | Output logs as JSON lines |
 * | `--lang` | - | Language for messages |
 *
 * **Note on `--working-directory`**: Many MCP clients (Cursor, Claude Desktop) spawn servers from the
 * user's home directory (`~`) rather than the project directory. This flag is used for:
 * - Auto-discovery (detecting project type when no `--toolsets` or `--tools` are provided)
 * - Scaffolding tools (creating files in the correct project location)
 * - Any tool that needs to operate on the project directory
 *
 * Use `--working-directory` or `SFCC_WORKING_DIRECTORY` env var to specify the actual project path.
 *
 * ## Configuration
 *
 * Different tools require different configuration:
 * - **MRT tools** (e.g., `mrt_bundle_push`) → MRT flags (--project, --api-key)
 * - **B2C instance tools** (e.g., `cartridge_deploy`, SCAPI) → Instance flags or dw.json
 * - **Local tools** (e.g., scaffolding) → None
 *
 * ### B2C Instance Configuration
 * Priority (highest to lowest):
 * 1. Flags (`--server`, `--username`, `--password`, `--client-id`, `--client-secret`, `--code-version`)
 * 2. Environment variables (via oclif flag env support)
 * 3. dw.json file (via `--config` flag or auto-discovered)
 *
 * ### MRT API Key
 * Priority (highest to lowest):
 * 1. `--api-key` flag
 * 2. `SFCC_MRT_API_KEY` environment variable
 * 3. `~/.mobify` config file (or `~/.mobify--[hostname]` if `--cloud-origin` is set)
 *
 * ## Toolset Validation
 *
 * - Invalid toolsets are ignored with a warning (server still starts)
 * - If all toolsets are invalid, auto-discovery kicks in
 *
 * @example mcp.json - All toolsets
 * ```json
 * { "args": ["--toolsets", "all", "--allow-non-ga-tools"] }
 * ```
 *
 * @example mcp.json - Specific toolsets
 * ```json
 * { "args": ["--toolsets", "CARTRIDGES,MRT", "--allow-non-ga-tools"] }
 * ```
 *
 * @example mcp.json - MRT tools with project, environment, and API key
 * ```json
 * {
 *   "args": ["--toolsets", "MRT", "--project", "my-project", "--environment", "staging", "--allow-non-ga-tools"],
 *   "env": { "SFCC_MRT_API_KEY": "your-api-key" }
 * }
 * ```
 *
 * @example mcp.json - MRT tools with staging cloud origin (uses ~/.mobify--cloud-staging.mobify.com)
 * ```json
 * { "args": ["--toolsets", "MRT", "--project", "my-project", "--cloud-origin", "https://cloud-staging.mobify.com", "--allow-non-ga-tools"] }
 * ```
 *
 * @example mcp.json - Cartridge tools with dw.json config
 * ```json
 * { "args": ["--toolsets", "CARTRIDGES", "--config", "/path/to/dw.json", "--allow-non-ga-tools"] }
 * ```
 *
 * @example mcp.json - Cartridge tools with env vars
 * ```json
 * {
 *   "args": ["--toolsets", "CARTRIDGES", "--allow-non-ga-tools"],
 *   "env": {
 *     "SFCC_HOSTNAME": "your-sandbox.demandware.net",
 *     "SFCC_CLIENT_ID": "your-client-id",
 *     "SFCC_CLIENT_SECRET": "your-client-secret"
 *   }
 * }
 * ```
 *
 * @example mcp.json - Enable debug logging
 * ```json
 * { "args": ["--toolsets", "all", "--allow-non-ga-tools", "--debug"] }
 * ```
 */

import {Flags} from '@oclif/core';
import {
  BaseCommand,
  MrtCommand,
  InstanceCommand,
  loadConfig,
  extractInstanceFlags,
  extractMrtFlags,
} from '@salesforce/b2c-tooling-sdk/cli';
import type {LoadConfigOptions} from '@salesforce/b2c-tooling-sdk/cli';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {B2CDxMcpServer} from '../server.js';
import {Services} from '../services.js';
import {registerToolsets} from '../registry.js';
import {TOOLSETS, type StartupFlags} from '../utils/index.js';

/**
 * oclif Command that starts the B2C DX MCP server.
 *
 * Uses oclif's single-command strategy - this IS the CLI, not a subcommand.
 * Extends BaseCommand from @salesforce/b2c-tooling-sdk which provides:
 * - Global flags for config, logging, and debugging
 * - Structured pino logging via `this.logger`
 * - Automatic dw.json loading via `this.resolvedConfig`
 * - Automatic telemetry initialization via `this.telemetry`
 * - `this.config` - package.json metadata and standard config paths
 */
export default class McpServerCommand extends BaseCommand<typeof McpServerCommand> {
  static description =
    'Salesforce B2C Commerce Cloud Developer Experience MCP Server - Expose B2C Commerce Developer Experience tools to AI assistants';

  static examples = [
    {
      description: 'All toolsets',
      command: '<%= config.bin %> --toolsets all --allow-non-ga-tools',
    },
    {
      description: 'MRT tools with project and API key',
      command: '<%= config.bin %> --toolsets MRT --project my-project --api-key your-api-key --allow-non-ga-tools',
    },
    {
      description: 'MRT tools with project, environment, and API key',
      command:
        '<%= config.bin %> --toolsets MRT --project my-project --environment staging --api-key your-api-key --allow-non-ga-tools',
    },
    {
      description: 'Cartridge tools with explicit config',
      command: '<%= config.bin %> --toolsets CARTRIDGES --config /path/to/dw.json --allow-non-ga-tools',
    },
    {
      description: 'Debug logging',
      command: '<%= config.bin %> --toolsets all --allow-non-ga-tools --debug',
    },
  ];

  static flags = {
    // Inherit MRT flags (api-key, cloud-origin, project, environment)
    // Also includes BaseCommand flags (config, debug, log-level, etc.) - safe to re-spread
    ...MrtCommand.baseFlags,

    // Inherit Instance flags (server, code-version, username, password, client-id, client-secret)
    // These provide B2C instance configuration for tools like cartridge_deploy
    ...InstanceCommand.baseFlags,

    // MCP-specific toolset selection flags
    toolsets: Flags.string({
      description: `Toolsets to enable (comma-separated). Options: all, ${TOOLSETS.join(', ')}`,
      env: 'SFCC_TOOLSETS',
      parse: async (input) => input.toUpperCase(),
    }),
    tools: Flags.string({
      description: 'Individual tools to enable (comma-separated)',
      env: 'SFCC_TOOLS',
      parse: async (input) => input.toLowerCase(),
    }),

    // Feature flags
    'allow-non-ga-tools': Flags.boolean({
      description: 'Enable non-GA (experimental) tools',
      env: 'SFCC_ALLOW_NON_GA_TOOLS',
      default: false,
    }),
  };

  /** Signal that triggered shutdown (if any) - used to exit process after finally() */
  private shutdownSignal?: string;

  /** Promise that resolves when stdin closes (MCP client disconnects) */
  private stdinClosePromise?: Promise<void>;

  /**
   * Override finally() to wait for stdin close before stopping telemetry.
   * This ensures SERVER_STOPPED is sent before telemetry.stop() is called.
   */
  protected async finally(err: Error | undefined): Promise<void> {
    // Wait for stdin to close and SERVER_STOPPED to be sent
    // This keeps the command "running" until the MCP client disconnects
    await this.stdinClosePromise;

    // Now call super.finally() which sends COMMAND_SUCCESS and stops telemetry
    await super.finally(err);

    // Exit process if shutdown was triggered by a signal (SIGINT/SIGTERM)
    // Catching these signals prevents Node's default exit behavior
    if (this.shutdownSignal === 'SIGINT' || this.shutdownSignal === 'SIGTERM') {
      // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
      process.exit(0);
    }
  }

  /**
   * Loads configuration from flags, environment variables, and config files.
   *
   * Combines configuration from both InstanceCommand (B2C instance) and MrtCommand (MRT)
   * since this command supports both B2C instance tools and MRT tools.
   *
   * Uses SDK helper functions for flag extraction:
   * - extractInstanceFlags() - B2C instance flags (--server, --username, etc.)
   * - extractMrtFlags() - MRT flags (--api-key, --project, etc.) and loading options
   *
   * Priority (highest to lowest):
   * 1. CLI flags (--server, --username, --api-key, etc.)
   * 2. Environment variables (SFCC_SERVER, SFCC_USERNAME, SFCC_MRT_API_KEY, etc.)
   * 3. dw.json file (via --config flag or auto-discovered from --working-directory)
   * 4. ~/.mobify file (for MRT API key)
   */
  protected override loadConfiguration(): ResolvedB2CConfig {
    const mrt = extractMrtFlags(this.flags as Record<string, unknown>);
    const options: LoadConfigOptions = {
      ...this.getBaseConfigOptions(),
      ...mrt.options,
    };

    // Combine B2C instance flags, MRT config, and working directory so tools use the configured project path
    const flagConfig = {
      ...extractInstanceFlags(this.flags as Record<string, unknown>),
      ...mrt.config,
    };

    return loadConfig(flagConfig, options);
  }

  /**
   * Loads configuration and creates a new Services instance.
   *
   * This method loads configuration files (dw.json, ~/.mobify) on each call,
   * allowing tools to pick up changes to configuration between invocations.
   * Flags remain the same (parsed once at startup).
   *
   * @returns A new Services instance with loaded configuration
   */
  protected loadServices(): Services {
    const config = this.loadConfiguration();
    return Services.fromResolvedConfig(config);
  }

  /**
   * Main entry point - starts the MCP server.
   *
   * Execution flow:
   * 1. BaseCommand.init() parses flags, loads config, and initializes telemetry
   * 2. Filter and validate toolsets (invalid ones are skipped with warning)
   * 3. Create B2CDxMcpServer instance with telemetry from BaseCommand
   * 4. Create Services via Services.fromResolvedConfig() using already-resolved config
   * 5. Register tools based on --toolsets and --tools flags
   * 6. Connect to stdio transport (JSON-RPC over stdin/stdout)
   * 7. Log startup message via structured logger
   *
   * @throws Never throws - invalid toolsets are filtered, not rejected
   *
   * BaseCommand provides:
   * - `this.flags` - Parsed flags including global flags (config, debug, log-level, etc.)
   * - `this.resolvedConfig` - Loaded dw.json configuration
   * - `this.logger` - Structured pino logger
   * - `this.telemetry` - Telemetry instance (auto-initialized from package.json config)
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
      toolsets: this.flags.toolsets ? this.flags.toolsets.split(',').map((s) => s.trim()) : undefined,
      tools: this.flags.tools ? this.flags.tools.split(',').map((s) => s.trim()) : undefined,
      allowNonGaTools: this.flags['allow-non-ga-tools'],
      configPath: this.flags.config,
      // Working directory for auto-discovery. oclif handles flag with env fallback.
      workingDirectory: this.flags['working-directory'],
    };

    // Add toolsets to telemetry attributes
    if (this.telemetry && startupFlags.toolsets) {
      this.telemetry.addAttributes({toolsets: startupFlags.toolsets.join(', ')});
    }

    // Create MCP server with telemetry from BaseCommand
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
        telemetry: this.telemetry,
      },
    );

    // Register toolsets with loader function that loads config and creates Services on each tool call
    // This allows tools to pick up changes to config files (dw.json, ~/.mobify) between invocations
    await registerToolsets(startupFlags, server, this.loadServices.bind(this));

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Create promise that resolves when server stops (stdin close or signal)
    // This allows finally() to wait for SERVER_STOPPED before stopping telemetry
    this.stdinClosePromise = new Promise((resolve) => {
      const sendStopAndResolve = (signal: string): void => {
        this.shutdownSignal = signal;
        this.telemetry?.sendEvent('SERVER_STOPPED', {signal});
        // Flush telemetry before resolving to ensure SERVER_STOPPED is sent
        // before finally() proceeds to stop telemetry
        const flushPromise = this.telemetry?.flush() ?? Promise.resolve();
        flushPromise.then(() => resolve()).catch(() => resolve());
      };

      // Handle stdin close (MCP client disconnects normally)
      process.stdin.on('close', () => sendStopAndResolve('stdin_close'));

      // Handle Ctrl+C
      process.on('SIGINT', () => sendStopAndResolve('SIGINT'));

      // Handle kill signal
      process.on('SIGTERM', () => sendStopAndResolve('SIGTERM'));
    });

    this.logger.info({version: this.config.version}, 'MCP Server running on stdio');
  }
}
