/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * WebDAV client for B2C Commerce file operations.
 *
 * Provides typed methods for common WebDAV operations like file upload,
 * download, directory creation, and listing.
 *
 * @module clients/webdav
 */
import {parseStringPromise} from 'xml2js';
import type {AuthStrategy} from '../auth/types.js';
import {HTTPError} from '../errors/http-error.js';
import {getLogger} from '../logging/logger.js';

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
 * **Note:** This client is typically accessed via `B2CInstance.webdav` rather
 * than instantiated directly. The `B2CInstance` class handles authentication setup.
 *
 * @example
 * // Via B2CInstance (recommended)
 * const instance = B2CInstance.fromDwJson();
 * await instance.webdav.mkcol('Cartridges/v1');
 * await instance.webdav.put('Cartridges/v1/app.zip', zipBuffer);
 *
 * @example
 * // Direct instantiation (advanced)
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
   *
   * @param path - Path relative to /webdav/Sites/
   * @returns Full URL
   */
  buildUrl(path: string): string {
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
    const logger = getLogger();
    const url = this.buildUrl(path);
    const method = init?.method ?? 'GET';

    // Debug: Log request start
    logger.debug({method, url}, `[WebDAV REQ] ${method} ${url}`);

    // Trace: Log request details
    logger.trace(
      {headers: this.headersToObject(init?.headers), body: this.formatBody(init?.body)},
      `[WebDAV REQ BODY] ${method} ${url}`,
    );

    const startTime = Date.now();
    const response = await this.auth.fetch(url, init);
    const duration = Date.now() - startTime;

    // Debug: Log response summary
    logger.debug(
      {method, url, status: response.status, duration},
      `[WebDAV RESP] ${method} ${url} ${response.status} ${duration}ms`,
    );

    // Trace: Log response details
    const responseHeaders = this.headersToObject(response.headers);
    let responseBody: string | undefined;
    if (response.headers.get('content-type')?.includes('xml')) {
      const clonedResponse = response.clone();
      responseBody = await clonedResponse.text();
    }
    logger.trace({headers: responseHeaders, body: responseBody}, `[WebDAV RESP BODY] ${method} ${url}`);

    return response;
  }

  /**
   * Converts Headers to a plain object for logging.
   */
  private headersToObject(headers?: RequestInit['headers'] | Headers): Record<string, string> | undefined {
    if (!headers) return undefined;

    const result: Record<string, string> = {};
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        result[key] = value;
      }
    } else {
      Object.assign(result, headers);
    }
    return result;
  }

  /**
   * Formats body for logging, describing binary data.
   */
  private formatBody(body?: RequestInit['body']): string | undefined {
    if (!body) return undefined;
    if (typeof body === 'string') {
      return body;
    }
    if (body instanceof Buffer || body instanceof ArrayBuffer) {
      return `[Binary: ${body instanceof Buffer ? body.length : body.byteLength} bytes]`;
    }
    if (body instanceof Blob) {
      return `[Blob: ${body.size} bytes]`;
    }
    return '[Body]';
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
      throw new HTTPError(`MKCOL failed: ${response.status} ${response.statusText}`, response, 'MKCOL');
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

    const response = await this.request(path, {method: 'PUT', headers, body: content});

    if (!response.ok) {
      throw new HTTPError(`PUT failed: ${response.status} ${response.statusText}`, response, 'PUT');
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
      throw new HTTPError(`GET failed: ${response.status} ${response.statusText}`, response, 'GET');
    }

    return response.arrayBuffer();
  }

  /**
   * Deletes a file or directory.
   *
   * @param path - Path to delete
   * @throws Error if the path doesn't exist (404) or deletion fails
   *
   * @example
   * await client.delete('Cartridges/v1/old-cartridge');
   */
  async delete(path: string): Promise<void> {
    const response = await this.request(path, {method: 'DELETE'});

    if (!response.ok) {
      throw new HTTPError(`DELETE failed: ${response.status} ${response.statusText}`, response, 'DELETE');
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
      throw new HTTPError(`PROPFIND failed: ${response.status} ${response.statusText}`, response, 'PROPFIND');
    }

    const xml = await response.text();
    return await this.parsePropfindResponse(xml);
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
   * Parses PROPFIND XML response into structured entries using xml2js.
   */
  private async parsePropfindResponse(xml: string): Promise<PropfindEntry[]> {
    const entries: PropfindEntry[] = [];

    // Parse with xml2js, stripping namespace prefixes for easier access
    const result = await parseStringPromise(xml, {
      tagNameProcessors: [(name: string) => name.replace(/^[^:]+:/, '')], // Strip namespace prefix
      explicitArray: false,
    });

    // Get the multistatus root - may be 'multistatus' or 'D:multistatus' after processing
    const multistatus = result.multistatus;
    if (!multistatus) {
      return entries;
    }

    // Get response array - may be single object or array
    const responses = Array.isArray(multistatus.response) ? multistatus.response : [multistatus.response];

    for (const response of responses) {
      if (!response) continue;

      const href = this.getXmlText(response.href) || '';
      const propstat = response.propstat;
      const prop = propstat?.prop;

      if (!prop) continue;

      const displayName = this.getXmlText(prop.displayname);
      const isCollection = prop.resourcetype?.collection !== undefined;
      const contentLength = this.getXmlText(prop.getcontentlength);
      const lastModified = this.getXmlText(prop.getlastmodified);
      const contentType = this.getXmlText(prop.getcontenttype);

      entries.push({
        href,
        displayName,
        isCollection,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        lastModified: lastModified ? new Date(lastModified) : undefined,
        contentType: contentType && contentType !== 'null' ? contentType : undefined,
      });
    }

    return entries;
  }

  /**
   * Extracts text content from an xml2js parsed value.
   * Handles both string values and objects with '_' text content.
   */
  private getXmlText(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') return value || undefined;
    if (typeof value === 'object' && '_' in (value as Record<string, unknown>)) {
      return (value as Record<string, string>)._ || undefined;
    }
    return undefined;
  }
}
