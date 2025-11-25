import {B2CInstance} from '../../instance/index.js';

export interface Site {
  id: string;
  displayName: string;
  status: 'online' | 'offline';
}

/**
 * Lists all sites on an instance.
 */
export async function listSites(instance: B2CInstance): Promise<Site[]> {
  console.log(`Listing sites on ${instance.config.hostname}...`);

  // TODO: Implement actual site listing via OCAPI
  // GET /s/-/dw/data/v21_10/sites

  return [];
}

/**
 * Gets details for a specific site.
 */
export async function getSite(instance: B2CInstance, siteId: string): Promise<Site | null> {
  console.log(`Getting site ${siteId} on ${instance.config.hostname}...`);

  // TODO: Implement actual site retrieval via OCAPI
  // GET /s/-/dw/data/v21_10/sites/{site_id}

  return null;
}
