// Client-side redirects for pages that have moved or been merged.
// Keys and values are site-relative paths WITHOUT the VitePress base prefix.
// Add an entry here and a matching stub page (see docs/mcp/tools/_redirect-stub
// pattern) whenever a page is renamed, merged, or deleted so old URLs keep working.
export const redirects: Record<string, string> = {
  // MRT log tools merged into the combined Logs page.
  '/mcp/tools/mrt-logs': '/mcp/tools/logs#mrt-logs',
  // The two custom-API tools were combined onto one page.
  '/mcp/tools/scapi-custom-api-generate-scaffold': '/mcp/tools/scapi-custom-apis#scapi-custom-api-generate-scaffold',
  '/mcp/tools/scapi-custom-apis-get-status': '/mcp/tools/scapi-custom-apis#scapi-custom-apis-get-status',
};

/** Normalize a router path to the key form used in the map (strip base, `.html`, trailing slash). */
export function lookupRedirect(pathname: string, base: string): string | undefined {
  let p = pathname;
  if (base && base !== '/' && p.startsWith(base)) {
    p = p.slice(base.length - 1); // keep leading slash
  }
  p = p.replace(/\.html$/, '').replace(/\/$/, '');
  return redirects[p];
}
