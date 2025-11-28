/**
 * WebDAV client for B2C Commerce file operations.
 *
 * Provides typed methods for common WebDAV operations like file upload,
 * download, directory creation, and listing.
 *
 * @module clients/webdav
 */
import type {AuthStrategy} from '../auth/types.js';

/**
 * Result of a PROPFIND operation.
 */
export interface PropfindEntry {
  href: string;
  displayName?: string;
  isCollection: boolean;
  contentLength?: number;
  lastModified?: Date;
  contentType?: string;
}

/**
 * WebDAV client for B2C Commerce instance file operations.
 *
 * Handles WebDAV requests with proper authentication and provides
 * typed methods for common operations.
 *
 * @example
 * const client = new WebDavClient('sandbox.demandware.net', authStrategy);
 * await client.mkcol('Cartridges/v1');
 * await client.put('Cartridges/v1/app_storefront/cartridge.zip', zipBuffer);
 */
export class WebDavClient {
  private baseUrl: string;

  /**
   * Creates a new WebDAV client.
   *
   * @param hostname - WebDAV hostname (may differ from API hostname)
   * @param auth - Authentication strategy to use for requests
   */
  constructor(
    hostname: string,
    private auth: AuthStrategy,
  ) {
    this.baseUrl = `https://${hostname}/on/demandware.servlet/webdav/Sites`;
  }

  /**
   * Builds the full URL for a WebDAV path.
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  /**
   * Makes a raw WebDAV request.
   *
   * @param path - Path relative to /webdav/Sites/
   * @param init - Fetch init options
   * @returns Response from the server
   */
  async request(path: string, init?: RequestInit): Promise<Response> {
    return this.auth.fetch(this.buildUrl(path), init);
  }

  /**
   * Creates a directory (collection).
   *
   * @param path - Path to create
   * @throws Error if creation fails (except 405 which means already exists)
   *
   * @example
   * await client.mkcol('Cartridges/v1');
   */
  async mkcol(path: string): Promise<void> {
    const response = await this.request(path, {method: 'MKCOL'});

    // 201 = created, 405 = already exists (acceptable)
    if (!response.ok && response.status !== 405) {
      const text = await response.text();
      throw new Error(`MKCOL failed: ${response.status} ${response.statusText} - ${text}`);
    }
  }

  /**
   * Uploads a file.
   *
   * @param path - Destination path
   * @param content - File content as Buffer, Blob, or string
   * @param contentType - Optional content type header
   *
   * @example
   * await client.put('Cartridges/v1/app.zip', zipBuffer, 'application/zip');
   */
  async put(path: string, content: Buffer | Blob | string, contentType?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const response = await this.request(path, {
      method: 'PUT',
      headers,
      body: content,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PUT failed: ${response.status} ${response.statusText} - ${text}`);
    }
  }

  /**
   * Downloads a file.
   *
   * @param path - Path to download
   * @returns File content as ArrayBuffer
   *
   * @example
   * const content = await client.get('Cartridges/v1/app.zip');
   */
  async get(path: string): Promise<ArrayBuffer> {
    const response = await this.request(path, {method: 'GET'});

    if (!response.ok) {
      throw new Error(`GET failed: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Deletes a file or directory.
   *
   * @param path - Path to delete
   *
   * @example
   * await client.delete('Cartridges/v1/old-cartridge');
   */
  async delete(path: string): Promise<void> {
    const response = await this.request(path, {method: 'DELETE'});

    // 404 is acceptable (already deleted)
    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      throw new Error(`DELETE failed: ${response.status} ${response.statusText} - ${text}`);
    }
  }

  /**
   * Lists directory contents.
   *
   * @param path - Directory path
   * @param depth - PROPFIND depth (0, 1, or 'infinity')
   * @returns Array of entries in the directory
   *
   * @example
   * const entries = await client.propfind('Cartridges');
   * for (const entry of entries) {
   *   console.log(entry.displayName, entry.isCollection);
   * }
   */
  async propfind(path: string, depth: '0' | '1' | 'infinity' = '1'): Promise<PropfindEntry[]> {
    const response = await this.request(path, {
      method: 'PROPFIND',
      headers: {
        Depth: depth,
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <D:getcontentlength/>
    <D:getlastmodified/>
    <D:getcontenttype/>
  </D:prop>
</D:propfind>`,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PROPFIND failed: ${response.status} ${response.statusText} - ${text}`);
    }

    const xml = await response.text();
    return this.parsePropfindResponse(xml);
  }

  /**
   * Checks if a path exists.
   *
   * @param path - Path to check
   * @returns true if exists, false otherwise
   */
  async exists(path: string): Promise<boolean> {
    const response = await this.request(path, {method: 'HEAD'});
    return response.ok;
  }

  /**
   * Parses PROPFIND XML response into structured entries.
   */
  private parsePropfindResponse(xml: string): PropfindEntry[] {
    const entries: PropfindEntry[] = [];

    // Simple regex-based parsing for WebDAV response
    // Note: For production, consider using a proper XML parser
    const responsePattern = /<D:response>([\s\S]*?)<\/D:response>/gi;
    let match;

    while ((match = responsePattern.exec(xml)) !== null) {
      const responseXml = match[1];

      const href = this.extractXmlValue(responseXml, 'D:href') || '';
      const displayName = this.extractXmlValue(responseXml, 'D:displayname');
      const isCollection = responseXml.includes('<D:collection');
      const contentLength = this.extractXmlValue(responseXml, 'D:getcontentlength');
      const lastModified = this.extractXmlValue(responseXml, 'D:getlastmodified');
      const contentType = this.extractXmlValue(responseXml, 'D:getcontenttype');

      entries.push({
        href,
        displayName,
        isCollection,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        lastModified: lastModified ? new Date(lastModified) : undefined,
        contentType,
      });
    }

    return entries;
  }

  /**
   * Extracts a value from XML by tag name.
   */
  private extractXmlValue(xml: string, tagName: string): string | undefined {
    const pattern = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = pattern.exec(xml);
    return match ? match[1] : undefined;
  }
}
