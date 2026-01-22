/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import type {Zone} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnCommand, formatApiError} from './base-command.js';
import {t} from '../../i18n/index.js';

/**
 * Base command for operations that require a specific zone.
 * Adds --zone flag that accepts either zone ID or zone name.
 */
export abstract class EcdnZoneCommand<T extends typeof Command> extends EcdnCommand<T> {
  static baseFlags = {
    ...EcdnCommand.baseFlags,
    zone: Flags.string({
      char: 'z',
      description: t('flags.zone.description', 'Zone ID or zone name'),
      required: true,
    }),
  };

  private _resolvedZoneId?: string;
  private _zonesCache?: Zone[];

  /**
   * Fetch all zones for the organization.
   * Results are cached for the duration of the command.
   */
  protected async fetchZones(): Promise<Zone[]> {
    if (this._zonesCache) {
      return this._zonesCache;
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/info', {
      params: {path: {organizationId}},
    });

    if (error) {
      this.error(
        t('commands.ecdn.zones.fetchError', 'Failed to fetch zones: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    this._zonesCache = data?.data ?? [];
    return this._zonesCache;
  }

  /**
   * Resolve zone flag to zone ID.
   * If the flag looks like a zone ID (32-char hex string), use it directly.
   * Otherwise, fetch zones and find by name.
   */
  protected async resolveZoneId(): Promise<string> {
    if (this._resolvedZoneId) {
      return this._resolvedZoneId;
    }

    const zoneFlag = (this.flags as Record<string, string>).zone;

    // If it's a 32-char hex string, assume it's a zone ID
    if (/^[a-f0-9]{32}$/i.test(zoneFlag)) {
      this._resolvedZoneId = zoneFlag;
      return this._resolvedZoneId;
    }

    // Otherwise, look up by name
    const zones = await this.fetchZones();
    const matchedZone = zones.find(
      (z) => z.name?.toLowerCase() === zoneFlag.toLowerCase() || z.zoneId?.toLowerCase() === zoneFlag.toLowerCase(),
    );

    if (!matchedZone?.zoneId) {
      // List available zones to help the user
      const availableZones = zones.map((z) => z.name || z.zoneId).join(', ');
      this.error(
        t('commands.ecdn.zone.notFound', 'Zone not found: {{zone}}. Available zones: {{available}}', {
          zone: zoneFlag,
          available: availableZones || 'none',
        }),
      );
    }

    this._resolvedZoneId = matchedZone.zoneId;
    return this._resolvedZoneId;
  }
}
