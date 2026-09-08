/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {loadConfig, extractMrtFlags, extractOAuthFlags} from './config.js';
import type {LoadConfigOptions} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import type {AuthStrategy} from '../auth/types.js';
import type {ScapiClientConfig} from '../instance/index.js';
import {t} from '../i18n/index.js';
import {DEFAULT_MRT_ORIGIN} from '../clients/mrt.js';
import {assertScapiAdminAuthSupported} from '../clients/scapi-backend-utils.js';
import {toOrganizationId} from '../clients/storefront-deployments.js';
import {mrtScapiUnavailableMessage} from '../operations/mrt/mrt-backend.js';
import type {MrtBackendPreference, ScapiMrtConnection} from '../operations/mrt/mrt-backend.js';

/**
 * Base command for Managed Runtime (MRT) operations.
 *
 * MRT has two backends:
 * - **legacy** — the MRT Cloud API (`cloud.mobify.com`), authenticated with a
 *   per-user API key (`--api-key` / `~/.mobify`).
 * - **scapi** — the SCAPI MRT Storefront Deployments API, authenticated with a
 *   stateless OAuth flow (client-credentials or JWT Bearer) via Account Manager,
 *   reusing the same shortCode + tenant setup as other SCAPI commands.
 *
 * Because SCAPI MRT reuses the SCAPI auth stack, this base extends
 * {@link OAuthCommand} to inherit `--client-id`/`--client-secret`/`--short-code`/
 * `--tenant-id`/JWT flags plus `getOAuthStrategy()`, `requireTenantId()`, and
 * `getOrganizationId()`. The legacy API-key path is preserved via
 * {@link getMrtAuth}.
 *
 * API key resolution order (legacy):
 * 1. --api-key flag
 * 2. MRT_API_KEY environment variable (SFCC_MRT_API_KEY also supported)
 * 3. ~/.mobify config file (api_key field), or ~/.mobify--[hostname] if --cloud-origin is set
 *
 * Project/environment resolution order:
 * 1. --project (alias --storefront / -s) / --environment flags
 * 2. MRT_PROJECT / MRT_ENVIRONMENT environment variables (SFCC_-prefixed and MRT_TARGET also supported)
 * 3. dw.json (mrtProject / mrtEnvironment fields)
 *
 * Cloud origin resolution:
 * 1. --cloud-origin flag
 * 2. MRT_CLOUD_ORIGIN environment variable (SFCC_MRT_CLOUD_ORIGIN also supported)
 * 3. dw.json (mrtOrigin field)
 * 4. Default: https://cloud.mobify.com
 *
 * Backend selection:
 * - `--mrt-backend` flag > `MRT_BACKEND` env > `mrtBackend` dw.json > `auto`.
 */
export abstract class MrtCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'api-key': Flags.string({
      description: 'MRT API key',
      env: 'MRT_API_KEY',
      default: async () => process.env.SFCC_MRT_API_KEY || undefined,
      helpGroup: 'AUTH',
    }),
    project: Flags.string({
      char: 'p',
      aliases: ['storefront'],
      charAliases: ['s'],
      description:
        'MRT project slug — the SCAPI MRT storefront ID (or set mrtProject in dw.json); alias: --storefront/-s',
      env: 'MRT_PROJECT',
      default: async () => process.env.SFCC_MRT_PROJECT || undefined,
    }),
    environment: Flags.string({
      char: 'e',
      aliases: ['target'],
      description: 'MRT environment (e.g., staging, production; or set mrtEnvironment in dw.json)',
      env: 'MRT_ENVIRONMENT',
      default: async () => process.env.SFCC_MRT_ENVIRONMENT || process.env.MRT_TARGET || undefined,
    }),
    'cloud-origin': Flags.string({
      char: 'o',
      description: `MRT cloud origin URL (or set mrtOrigin in dw.json; default: ${DEFAULT_MRT_ORIGIN})`,
      env: 'MRT_CLOUD_ORIGIN',
      default: async () => process.env.SFCC_MRT_CLOUD_ORIGIN || undefined,
    }),
    'credentials-file': Flags.string({
      char: 'c',
      description: 'Path to MRT credentials file (overrides default ~/.mobify)',
      env: 'MRT_CREDENTIALS_FILE',
    }),
    'mrt-backend': Flags.option({
      description: 'MRT backend: auto (prefer SCAPI MRT when configured, else legacy), legacy, or scapi',
      options: ['auto', 'legacy', 'scapi'] as const,
      env: 'MRT_BACKEND',
    })(),
  };

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const mrt = extractMrtFlags(this.flags as Record<string, unknown>);
    const options: LoadConfigOptions = {
      ...this.getBaseConfigOptions(),
      ...mrt.options,
    };

    // Merge the OAuth flags (SCAPI MRT prerequisites — client id/secret, short
    // code, tenant id, JWT) with the MRT-specific flags. MRT values are spread
    // last so they win on any key overlap (there is none today, but keep it
    // explicit).
    const flagConfig = {
      ...extractOAuthFlags(this.flags as Record<string, unknown>),
      ...mrt.config,
    };
    return loadConfig(flagConfig, options);
  }

  /** Resolved `--mrt-backend` preference (default `'auto'`). */
  protected get mrtBackendPreference(): 'auto' | 'legacy' | 'scapi' {
    return this.resolvedConfig.values.mrtBackend ?? 'auto';
  }

  /**
   * Gets an API key auth strategy for MRT (legacy MRT Cloud API).
   */
  protected getMrtAuth(): AuthStrategy {
    if (this.resolvedConfig.hasMrtConfig()) {
      return this.resolvedConfig.createMrtAuth();
    }

    throw new Error(
      t('error.mrtApiKeyRequired', 'MRT API key required. Provide --api-key, set MRT_API_KEY, or configure ~/.mobify'),
    );
  }

  /**
   * Check if legacy MRT credentials (API key) are available.
   */
  protected hasMrtCredentials(): boolean {
    return this.resolvedConfig.hasMrtConfig();
  }

  /**
   * Validates that legacy MRT credentials are configured, errors if not.
   * @throws {Error} If MRT API key is not configured
   */
  protected requireMrtCredentials(): void {
    if (!this.hasMrtCredentials()) {
      this.error(
        t(
          'error.mrtApiKeyRequired',
          'MRT API key required. Provide --api-key, set MRT_API_KEY, or configure ~/.mobify',
        ),
      );
    }
  }

  /**
   * SCAPI MRT connection bundle (shortCode + tenantId + a SCAPI-capable OAuth
   * strategy), or `undefined` when this command cannot reach the SCAPI
   * Storefront APIs.
   *
   * Requires:
   *   1. `shortCode` and `tenantId` are configured, and
   *   2. an OAuth strategy that SCAPI Admin accepts.
   *
   * Auth is resolved via {@link OAuthCommand.getOAuthStrategy} — the same path
   * sibling SCAPI-only commands (e.g. eCDN) use — so a stored client-credentials
   * session (from `b2c auth client`) is reused just like live client-credentials
   * or JWT Bearer config. Browser user auth (Authorization Code + PKCE or the
   * deprecated implicit flow) is the only flow SCAPI Admin rejects, so
   * {@link assertScapiAdminAuthSupported} — the SCAPI client factory's own guard —
   * filters it out here too: under `auto` that lets MRT fall back to legacy, and
   * under explicit `--mrt-backend scapi` it surfaces as
   * {@link mrtScapiUnavailableMessage}.
   *
   * This runs eagerly during backend resolution, so it must never throw or start
   * browser auth. `getOAuthStrategy()` throws when no credentials are configured
   * and `assertScapiAdminAuthSupported()` throws for browser user auth; both mean
   * "SCAPI not available" and yield `undefined`. Built directly rather than via
   * `createB2CInstance`, which requires a hostname MRT commands never set.
   */
  protected getScapiMrtConfig(): ScapiClientConfig | undefined {
    const {shortCode, tenantId} = this.resolvedConfig.values;
    if (!shortCode || !tenantId) {
      return undefined;
    }

    let auth: AuthStrategy;
    try {
      auth = this.getOAuthStrategy();
      assertScapiAdminAuthSupported(auth);
    } catch {
      return undefined;
    }

    return {shortCode, tenantId, auth};
  }

  /**
   * Whether this command implements the SCAPI MRT backend. Defaults to `false`;
   * the supported commands (`mrt bundle history`, `mrt bundle deploy <bundleId>`)
   * override it to `true`. Used by {@link init} to reject an explicit
   * `--mrt-backend scapi` on commands that would otherwise silently fall back to
   * legacy — an explicit SCAPI request must never be quietly downgraded.
   */
  protected supportsScapiMrt(): boolean {
    return false;
  }

  public override async init(): Promise<void> {
    await super.init();

    // Base guardrail: a command that has not wired the SCAPI MRT backend must
    // not silently serve an explicit `--mrt-backend scapi` from legacy.
    if (!this.supportsScapiMrt() && this.mrtBackendPreference === 'scapi') {
      this.error(
        '--mrt-backend scapi is not supported by this command yet. The SCAPI MRT backend currently supports only ' +
          '"mrt bundle history" and "mrt bundle deploy <bundleId>". Re-run with --mrt-backend legacy or auto.',
      );
    }
  }

  /**
   * Resolves the MRT backend context for a supported command: the resolved
   * `--mrt-backend` preference, a SCAPI connection when the SCAPI prerequisites
   * are met, and the legacy API-key auth when configured. Emits per-prerequisite
   * `-D` debug and validates that at least one usable backend exists for the
   * resolved preference, erroring early with an actionable message otherwise.
   */
  protected getMrtBackendContext(): {
    preference: MrtBackendPreference;
    scapiConnection?: ScapiMrtConnection;
    legacyAuth?: AuthStrategy;
  } {
    const preference = this.mrtBackendPreference;
    const scapiConnection = this.getScapiMrtConfig();
    const legacyAuth = this.hasMrtCredentials() ? this.getMrtAuth() : undefined;

    this.debugMrtBackendPrereqs(preference, scapiConnection, legacyAuth);

    if (preference === 'scapi' && !scapiConnection) {
      this.error(mrtScapiUnavailableMessage());
    }
    if (preference === 'legacy' && !legacyAuth) {
      this.requireMrtCredentials();
    }
    if (preference === 'auto' && !scapiConnection && !legacyAuth) {
      this.error(
        'No MRT backend is configured. Provide legacy credentials (--api-key / MRT_API_KEY / ~/.mobify) or configure ' +
          'the SCAPI MRT backend (client-credentials or JWT Bearer with --short-code and --tenant-id).',
      );
    }

    // Warn only for explicit `--mrt-backend scapi`, where legacy provably never
    // runs, so the legacy MRT Cloud API flags the user typed are unequivocally
    // ignored. `auto` is deliberately excluded: even with a SCAPI connection it
    // can fall back to legacy on a safe error, and the legacy branch *honors*
    // these flags — warning up front would be misleading in that case. (A
    // present connection is guaranteed here: the guard above errors otherwise.)
    if (preference === 'scapi') {
      const ignored = this.detectIgnoredLegacyFlags();
      if (ignored.length > 0) {
        this.warn(
          `Ignoring legacy MRT Cloud API flag(s) ${ignored.join(', ')}: the SCAPI MRT backend was ` +
            'selected (--mrt-backend scapi). Pass --mrt-backend legacy to use them.',
        );
      }
    }

    return {preference, scapiConnection, legacyAuth};
  }

  /**
   * Guardrail for MRT operations the SCAPI backend does not implement yet (e.g.
   * pushing a local build). Explicit `--mrt-backend scapi` errors; `auto` warns
   * only when SCAPI is actually configured (a meaningful notice, not noise for
   * legacy-only users). Callers proceed on the legacy path afterward.
   */
  protected guardUnsupportedByScapiMrt(operationDescription: string): void {
    const preference = this.mrtBackendPreference;
    if (preference === 'scapi') {
      this.error(
        `The SCAPI MRT backend does not support ${operationDescription} yet. ` +
          'Re-run with --mrt-backend legacy or auto to use the legacy MRT Cloud API.',
      );
    }
    if (preference === 'auto' && this.getScapiMrtConfig()) {
      this.warn(`The SCAPI MRT backend does not support ${operationDescription} yet; using the legacy MRT Cloud API.`);
    }
  }

  /** Logs each MRT backend prerequisite as satisfied/missing under `-D`/`--debug`. */
  private debugMrtBackendPrereqs(
    preference: MrtBackendPreference,
    scapiConnection: ScapiMrtConnection | undefined,
    legacyAuth: AuthStrategy | undefined,
  ): void {
    const {shortCode, tenantId} = this.resolvedConfig.values;
    this.logger.debug(
      {
        preference,
        scapi: {
          shortCode: shortCode ? 'set' : 'missing',
          tenantId: tenantId ? 'set' : 'missing',
          organizationId: tenantId ? toOrganizationId(tenantId) : undefined,
          scapiAuth: scapiConnection ? 'available' : 'missing',
          // Operation-dependent (deployments today; more sfcc.storefront.* as the
          // SCAPI MRT surface grows). The per-operation scope cascade requests the
          // exact scope at call time.
          requiredScopes: 'sfcc.storefront.*',
          eligible: Boolean(scapiConnection),
        },
        legacy: {credentials: legacyAuth ? 'available' : 'missing'},
      },
      '[MRT] Backend prerequisites',
    );
  }

  /**
   * Legacy-only flags that configure the MRT Cloud API and have no effect on the
   * SCAPI MRT backend. Detected from the raw argv (like
   * {@link OAuthCommand.detectExplicitAuthFlags}) so only flags the user actually
   * typed are reported — env vars and dw.json are intentionally not covered. Each
   * entry pairs the canonical long flag with any short char alias to match.
   *
   * @returns the long-flag names that were supplied, for a single grouped warning.
   */
  private detectIgnoredLegacyFlags(): string[] {
    const rawArgs = this._rawArgv;
    const legacyFlags: {name: string; tokens: string[]}[] = [
      {name: '--api-key', tokens: ['--api-key']},
      {name: '--cloud-origin', tokens: ['--cloud-origin', '-o']},
      {name: '--credentials-file', tokens: ['--credentials-file', '-c']},
    ];
    return legacyFlags
      .filter(({tokens}) => tokens.some((flag) => rawArgs.some((arg) => arg === flag || arg.startsWith(`${flag}=`))))
      .map(({name}) => name);
  }
}
