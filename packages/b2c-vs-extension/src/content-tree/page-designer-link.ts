/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/** The parts of a library node needed to find its page. */
export interface PageLookupNode {
  id: string;
  type: string;
  parent: PageLookupNode | null;
}

/**
 * Business Manager URL that opens a page in the Page Designer editor.
 *
 * `;app=__bm_merchant;site=<site>` (sent URL-encoded, the form BM emits
 * itself) selects the merchant application and the site whose cartridge path
 * renders the page; the fragment selects the page in the editor.
 */
export function pageDesignerUrl(hostname: string, siteId: string, pageId: string): string {
  const base = (/^https?:\/\//.test(hostname) ? hostname : `https://${hostname}`).replace(/\/+$/, '');
  const app = `default%3bapp%3d__bm_merchant%3bsite%3d${encodeURIComponent(siteId)}`;
  return (
    `${base}/on/demandware.store/Sites-Site/${app}/ViewLdsBusinessManagerScreen-PageDesigner` +
    '?SelectedMenuItem=content_pages&ModulePipeline=ViewLdsBusinessManagerScreen&ModulePipelineStart=PageDesigner' +
    `#/edit/page/${encodeURIComponent(pageId)}`
  );
}

/** The page a page or component node belongs to (a component's nearest page ancestor). */
export function owningPageId(node: PageLookupNode | undefined): string | undefined {
  let current: PageLookupNode | null | undefined = node;
  while (current?.type === 'COMPONENT') current = current.parent;
  return current?.type === 'PAGE' ? current.id : undefined;
}
