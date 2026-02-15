/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import protobuf from 'protobufjs';
import type {AuthStrategy, FetchInit} from '../auth/types.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {getLogger} from '../logging/logger.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry, type UnifiedMiddleware} from './middleware-registry.js';

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'));

/** Default CIP Avatica host. */
export const DEFAULT_CIP_HOST = 'jdbc.analytics.commercecloud.salesforce.com';

const CIP_CLIENT_VERSION = '2.11.0';
const PROTOBUF_PREVIEW_BYTES = 48;

const CIP_PROTO_FILES = [
  path.join(packageRoot, 'data/cip-proto/common.proto'),
  path.join(packageRoot, 'data/cip-proto/requests.proto'),
  path.join(packageRoot, 'data/cip-proto/responses.proto'),
];

const REP = {
  PRIMITIVE_BOOLEAN: 0,
  BOOLEAN: 8,
  STRING: 21,
  LONG: 13,
  INTEGER: 12,
  PRIMITIVE_INT: 4,
  PRIMITIVE_LONG: 5,
  NUMBER: 22,
  BIG_INTEGER: 25,
  FLOAT: 14,
  DOUBLE: 15,
  PRIMITIVE_FLOAT: 6,
  PRIMITIVE_DOUBLE: 7,
  BIG_DECIMAL: 26,
  BYTE_STRING: 20,
  JAVA_SQL_DATE: 18,
  JAVA_SQL_TIME: 16,
  JAVA_SQL_TIMESTAMP: 17,
  JAVA_UTIL_DATE: 19,
  ARRAY: 27,
} as const;

function hasOwn(value: unknown, key: string): boolean {
  return typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeCipHost(host?: string): string {
  if (!host) {
    return DEFAULT_CIP_HOST;
  }

  const withoutProtocol = host.replace(/^https?:\/\//u, '');
  return withoutProtocol.replace(/\/.*$/u, '');
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return Number((value as {toNumber: () => number}).toNumber());
  }

  return Number(value ?? 0);
}

/** CIP client configuration. */
export interface CipClientConfig {
  /** CIP instance identifier (for example `zzxy_prd`). */
  instance: string;
  /** Optional CIP host override. */
  host?: string;
  /** Middleware registry to use for this client. Defaults to global registry. */
  middlewareRegistry?: MiddlewareRegistry;
}

/** Column metadata for a CIP result set. */
export interface CipColumn {
  /** Preferred output label for the column. */
  label: string;
  /** Original column name, when provided by CIP. */
  name?: string;
  /** Avatica type name (for example `VARCHAR`, `DATE`). */
  typeName?: string;
}

/** Decoded CIP frame. */
export interface CipFrame {
  /** Row offset in the full result set. */
  offset: number;
  /** Whether this is the terminal frame. */
  done: boolean;
  /** Column metadata for row decoding. */
  columns: CipColumn[];
  /** Decoded row objects. */
  rows: Array<Record<string, unknown>>;
}

/** Execute response with decoded first frame. */
export interface CipExecuteResponse {
  /** Statement id used for this execution. */
  statementId: number;
  /** Decoded first frame when present. */
  frame?: CipFrame;
}

/** Fetch response with decoded frame. */
export interface CipFetchResponse {
  /** Decoded fetched frame when present. */
  frame?: CipFrame;
}

/** Convenience result for full query execution. */
export interface CipQueryResult {
  /** Ordered columns for output formatting. */
  columns: string[];
  /** Decoded result rows. */
  rows: Array<Record<string, unknown>>;
  /** Total number of rows returned. */
  rowCount: number;
}

/** Options for high-level query execution. */
export interface CipQueryOptions {
  /** Initial and subsequent frame fetch size. */
  fetchSize?: number;
  /** Optional Avatica connection properties. */
  connectionProperties?: Record<string, string>;
}

interface WireMessage {
  name?: string;
  wrappedMessage?: Uint8Array;
}

interface SignatureLike {
  columns?: Array<Record<string, unknown>>;
}

interface FrameLike {
  offset?: unknown;
  done?: boolean;
  rows?: Array<Record<string, unknown>>;
}

/**
 * CIP Avatica client with protobuf transport.
 */
export class CipClient {
  private readonly baseUrl: string;
  private readonly middlewareRegistry: MiddlewareRegistry;
  private protoRoot?: protobuf.Root;
  private connectionId?: string;
  private sessionId?: string;
  private readonly signatureByStatementId = new Map<number, SignatureLike>();

  constructor(
    private readonly config: CipClientConfig,
    private readonly auth: AuthStrategy,
  ) {
    this.baseUrl = `https://${normalizeCipHost(config.host)}/${config.instance}`;
    this.middlewareRegistry = config.middlewareRegistry ?? globalMiddlewareRegistry;
  }

  /**
   * Opens a new Avatica connection.
   */
  async openConnection(info: Record<string, string> = {}): Promise<void> {
    if (this.connectionId) {
      throw new Error('CIP connection is already open');
    }

    const connectionId = randomUUID();
    await this.sendRequest('OpenConnectionRequest', {connectionId, info});
    this.connectionId = connectionId;
  }

  /**
   * Closes the current Avatica connection (no-op if not open).
   */
  async closeConnection(): Promise<void> {
    if (!this.connectionId) {
      return;
    }

    const connectionId = this.connectionId;

    try {
      await this.sendRequest('CloseConnectionRequest', {connectionId});
    } finally {
      this.connectionId = undefined;
      this.sessionId = undefined;
      this.signatureByStatementId.clear();
    }
  }

  /**
   * Creates a statement in the currently open connection.
   */
  async createStatement(): Promise<number> {
    this.requireConnection();

    const response = (await this.sendRequest('CreateStatementRequest', {
      connectionId: this.connectionId,
    })) as {statementId?: number};

    if (typeof response.statementId !== 'number') {
      throw new Error('CIP create statement failed: missing statement id');
    }

    return response.statementId;
  }

  /**
   * Closes a statement.
   */
  async closeStatement(statementId: number): Promise<void> {
    this.requireConnection();

    try {
      await this.sendRequest('CloseStatementRequest', {
        connectionId: this.connectionId,
        statementId,
      });
    } finally {
      this.signatureByStatementId.delete(statementId);
    }
  }

  /**
   * Executes SQL and returns the first decoded frame.
   */
  async execute(statementId: number, sql: string, firstFrameMaxSize: number = 1000): Promise<CipExecuteResponse> {
    this.requireConnection();
    getLogger().debug({statementId, sql}, `[CIP SQL] statement=${statementId}`);

    const response = (await this.sendRequest('PrepareAndExecuteRequest', {
      connectionId: this.connectionId,
      statementId,
      sql,
      maxRowCount: firstFrameMaxSize,
      firstFrameMaxSize,
    })) as {
      results?: Array<{
        statementId?: number;
        signature?: SignatureLike;
        firstFrame?: FrameLike;
      }>;
    };

    const result = response.results?.[0];
    if (!result) {
      return {statementId};
    }

    const resolvedStatementId = result.statementId ?? statementId;
    if (result.signature) {
      this.signatureByStatementId.set(resolvedStatementId, result.signature);
    }

    return {
      statementId: resolvedStatementId,
      frame: this.decodeFrame(
        result.signature ?? this.signatureByStatementId.get(resolvedStatementId),
        result.firstFrame,
      ),
    };
  }

  /**
   * Fetches an additional frame for an existing statement.
   */
  async fetch(statementId: number, offset: number, fetchMaxRowCount: number = 1000): Promise<CipFetchResponse> {
    this.requireConnection();

    const response = (await this.sendRequest('FetchRequest', {
      connectionId: this.connectionId,
      statementId,
      offset,
      fetchMaxRowCount,
    })) as {
      frame?: FrameLike;
    };

    return {
      frame: this.decodeFrame(this.signatureByStatementId.get(statementId), response.frame),
    };
  }

  /**
   * Executes SQL and returns the full decoded row set.
   *
   * This helper opens and closes the connection automatically.
   */
  async query(sql: string, options: CipQueryOptions = {}): Promise<CipQueryResult> {
    const fetchSize = options.fetchSize ?? 1000;
    const rows: Array<Record<string, unknown>> = [];
    let columns: string[] = [];

    await this.openConnection(options.connectionProperties);
    const statementId = await this.createStatement();

    try {
      const executeResponse = await this.execute(statementId, sql, fetchSize);
      let frame = executeResponse.frame;

      if (frame) {
        rows.push(...frame.rows);
        columns = frame.columns.map((column) => column.label);
      }

      while (frame && !frame.done) {
        const nextOffset = frame.offset + frame.rows.length;
        const fetchResponse = await this.fetch(executeResponse.statementId, nextOffset, fetchSize);
        frame = fetchResponse.frame;

        if (frame) {
          rows.push(...frame.rows);
          if (columns.length === 0) {
            columns = frame.columns.map((column) => column.label);
          }
        }
      }

      return {
        columns,
        rows,
        rowCount: rows.length,
      };
    } finally {
      await this.closeStatement(statementId).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        getLogger().debug({error: message}, 'Failed to close CIP statement during cleanup');
      });

      await this.closeConnection().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        getLogger().debug({error: message}, 'Failed to close CIP connection during cleanup');
      });
    }
  }

  private requireConnection(): void {
    if (!this.connectionId) {
      throw new Error('No CIP connection is open. Call openConnection() first.');
    }
  }

  private getMiddleware(): UnifiedMiddleware[] {
    return this.middlewareRegistry.getMiddleware('cip');
  }

  private async getProtoRoot(): Promise<protobuf.Root> {
    if (!this.protoRoot) {
      this.protoRoot = await protobuf.load(CIP_PROTO_FILES);
    }

    return this.protoRoot;
  }

  private async sendRequest(requestTypeName: string, payload: object): Promise<unknown> {
    const logger = getLogger();
    const root = await this.getProtoRoot();

    const requestType = root.lookupType(requestTypeName);
    const requestMessage = requestType.create(payload);
    const serializedRequest = requestType.encode(requestMessage).finish();

    const wireType = root.lookupType('WireMessage');
    const wireRequest = wireType.create({
      name: `org.apache.calcite.avatica.proto.Requests$${requestTypeName}`,
      wrappedMessage: serializedRequest,
    });
    const serializedWireRequest = wireType.encode(wireRequest).finish();

    let request = new Request(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-protobuf',
        'X-Client-Version': CIP_CLIENT_VERSION,
        InstanceId: this.config.instance,
        ...(this.sessionId ? {'x-session-id': this.sessionId} : {}),
      },
      body: serializedWireRequest,
    });

    const middleware = this.getMiddleware();
    const middlewareParams = {
      request,
      schemaPath: '/cip',
      options: {baseUrl: this.baseUrl},
      params: {},
      id: 'cip',
    };

    for (const middlewareItem of middleware) {
      if (!middlewareItem.onRequest) continue;
      const nextRequest = await middlewareItem.onRequest(
        middlewareParams as Parameters<NonNullable<typeof middlewareItem.onRequest>>[0],
      );
      if (nextRequest instanceof Request) {
        request = nextRequest;
        middlewareParams.request = nextRequest;
      }
    }

    let body: Uint8Array | ArrayBuffer | undefined = serializedWireRequest;
    if (request.body) {
      body = await request.clone().arrayBuffer();
    }

    const requestStartTime = Date.now();

    logger.debug({type: requestTypeName, url: request.url}, `[CIP REQ] ${requestTypeName}`);
    logger.trace(
      {
        method: request.method,
        url: request.url,
        headers: this.headersToObject(request.headers),
        body: this.formatProtobufBody(body, {
          requestTypeName,
          wireMessageName: `org.apache.calcite.avatica.proto.Requests$${requestTypeName}`,
          payload,
        }),
      },
      `[CIP REQ BODY] ${request.method} ${request.url}`,
    );

    let response = await this.auth.fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    } as FetchInit);
    const duration = Date.now() - requestStartTime;

    const responseParams = {
      ...middlewareParams,
      request,
      response,
    };

    for (const middlewareItem of middleware) {
      if (!middlewareItem.onResponse) continue;
      const nextResponse = await middlewareItem.onResponse(
        responseParams as Parameters<NonNullable<typeof middlewareItem.onResponse>>[0],
      );
      if (nextResponse instanceof Response) {
        response = nextResponse;
        responseParams.response = nextResponse;
      }
    }

    const sessionId = response.headers.get('x-session-id');
    if (sessionId) {
      this.sessionId = sessionId;
    }

    if (!response.ok) {
      const bodyText = await response.text();
      logger.debug(
        {method: request.method, url: request.url, status: response.status, duration},
        `[CIP RESP] ${requestTypeName} ${response.status} ${duration}ms`,
      );
      logger.trace(
        {
          method: request.method,
          url: request.url,
          status: response.status,
          headers: this.headersToObject(response.headers),
          body: bodyText,
        },
        `[CIP RESP BODY] ${request.method} ${request.url}`,
      );
      throw new Error(`CIP Avatica request failed (${response.status} ${response.statusText}): ${bodyText}`);
    }

    const responseBytes = new Uint8Array(await response.arrayBuffer());
    const wireResponse = wireType.decode(responseBytes) as WireMessage;

    const responseClassName = wireResponse.name ?? '';
    const responseTypeName = responseClassName.split('$').pop() ?? '';
    const wrappedResponse = wireResponse.wrappedMessage;

    logger.debug(
      {method: request.method, url: request.url, status: response.status, duration, responseTypeName},
      `[CIP RESP] ${requestTypeName} ${response.status} ${duration}ms`,
    );
    logger.trace(
      {
        method: request.method,
        url: request.url,
        status: response.status,
        headers: this.headersToObject(response.headers),
        body: this.formatProtobufBody(responseBytes, {
          wireMessageName: wireResponse.name,
          responseTypeName,
        }),
      },
      `[CIP RESP BODY] ${request.method} ${request.url}`,
    );

    if (!wrappedResponse) {
      throw new Error('CIP Avatica response did not contain a wrapped protobuf message');
    }

    if (responseTypeName === 'ErrorResponse') {
      const errorType = root.lookupType('ErrorResponse');
      const decodedError = errorType.decode(wrappedResponse) as {
        errorMessage?: string;
        sqlState?: string;
        errorCode?: number;
      };

      const errorMessage = decodedError.errorMessage ?? 'Unknown Avatica error';
      const sqlState = decodedError.sqlState ? ` SQLState=${decodedError.sqlState}` : '';
      const errorCode = decodedError.errorCode !== undefined ? ` ErrorCode=${decodedError.errorCode}` : '';
      throw new Error(`CIP Avatica error: ${errorMessage}${sqlState}${errorCode}`);
    }

    const responseType = root.lookupType(responseTypeName);
    return responseType.decode(wrappedResponse);
  }

  private decodeFrame(signature: SignatureLike | undefined, frame: FrameLike | undefined): CipFrame | undefined {
    if (!frame) {
      return undefined;
    }

    const columns = this.getColumnsFromSignature(signature);
    const rows = (frame.rows ?? []).map((row) => {
      const values = Array.isArray(row.value) ? row.value : [];
      const decoded: Record<string, unknown> = {};

      for (let index = 0; index < columns.length; index++) {
        const column = columns[index];
        const value = values[index] as Record<string, unknown> | undefined;
        const columnMeta = signature?.columns?.[index];
        decoded[column.label] = this.decodeColumnValue(value, columnMeta);
      }

      return decoded;
    });

    return {
      offset: toNumber(frame.offset),
      done: Boolean(frame.done),
      columns,
      rows,
    };
  }

  private getColumnsFromSignature(signature: SignatureLike | undefined): CipColumn[] {
    const columns = signature?.columns;
    if (!columns || columns.length === 0) {
      return [];
    }

    return columns.map((column, index) => {
      const label = typeof column.label === 'string' && column.label.length > 0 ? column.label : undefined;
      const columnName =
        typeof column.columnName === 'string' && column.columnName.length > 0 ? column.columnName : undefined;

      return {
        label: label ?? columnName ?? `column_${index + 1}`,
        name: columnName,
        typeName: this.getColumnTypeName(column),
      };
    });
  }

  private getColumnTypeName(column: Record<string, unknown>): string | undefined {
    if (
      typeof column.type === 'object' &&
      column.type !== null &&
      typeof (column.type as {name?: unknown}).name === 'string'
    ) {
      return (column.type as {name: string}).name;
    }

    return undefined;
  }

  private decodeColumnValue(columnValue: Record<string, unknown> | undefined, columnMetadata?: unknown): unknown {
    if (!columnValue) {
      return null;
    }

    if (columnValue.hasArrayValue === true && Array.isArray(columnValue.arrayValue)) {
      return columnValue.arrayValue.map((value) => this.decodeTypedValue(value, columnMetadata));
    }

    if (typeof columnValue.scalarValue === 'object' && columnValue.scalarValue !== null) {
      return this.decodeTypedValue(columnValue.scalarValue, columnMetadata);
    }

    if (Array.isArray(columnValue.value) && columnValue.value.length > 0) {
      return this.decodeTypedValue(columnValue.value[0], columnMetadata);
    }

    return null;
  }

  private decodeTypedValue(typedValue: unknown, columnMetadata?: unknown): unknown {
    if (typeof typedValue !== 'object' || typedValue === null) {
      return null;
    }

    const typed = typedValue as Record<string, unknown>;
    const rep = hasOwn(typed, 'type') ? toNumber(typed.type) : undefined;

    if (typed.null === true || typed.implicitlyNull === true) {
      return null;
    }

    if (rep === REP.ARRAY && Array.isArray(typed.arrayValue)) {
      return typed.arrayValue.map((value) => this.decodeTypedValue(value, undefined));
    }

    if (rep === REP.BOOLEAN || rep === REP.PRIMITIVE_BOOLEAN) {
      return Boolean(typed.boolValue);
    }

    if (rep === REP.STRING) {
      return hasOwn(typed, 'stringValue') ? typed.stringValue : '';
    }

    if (
      rep === REP.LONG ||
      rep === REP.INTEGER ||
      rep === REP.PRIMITIVE_INT ||
      rep === REP.PRIMITIVE_LONG ||
      rep === REP.NUMBER ||
      rep === REP.BIG_INTEGER
    ) {
      return this.decodeNumericValue(typed.numberValue, columnMetadata);
    }

    if (rep === REP.FLOAT || rep === REP.DOUBLE || rep === REP.PRIMITIVE_FLOAT || rep === REP.PRIMITIVE_DOUBLE) {
      return hasOwn(typed, 'doubleValue') ? Number(typed.doubleValue) : Number(typed.numberValue ?? 0);
    }

    if (rep === REP.BIG_DECIMAL) {
      if (hasOwn(typed, 'stringValue') && typeof typed.stringValue === 'string') {
        return Number.parseFloat(typed.stringValue);
      }

      return Number(typed.doubleValue ?? typed.numberValue ?? 0);
    }

    if (rep === REP.BYTE_STRING && typed.bytesValue instanceof Uint8Array) {
      return Buffer.from(typed.bytesValue).toString('base64');
    }

    if (rep === REP.JAVA_SQL_DATE || rep === REP.JAVA_UTIL_DATE || rep === REP.JAVA_SQL_TIMESTAMP) {
      return new Date(toNumber(typed.numberValue));
    }

    if (rep === REP.JAVA_SQL_TIME) {
      return toNumber(typed.numberValue);
    }

    if (hasOwn(typed, 'stringValue')) {
      return typed.stringValue;
    }

    if (hasOwn(typed, 'doubleValue')) {
      return Number(typed.doubleValue);
    }

    if (hasOwn(typed, 'numberValue')) {
      return Number(typed.numberValue);
    }

    if (hasOwn(typed, 'boolValue')) {
      return Boolean(typed.boolValue);
    }

    return null;
  }

  private decodeNumericValue(value: unknown, columnMetadata?: unknown): unknown {
    const numeric = toNumber(value);

    if (typeof columnMetadata === 'object' && columnMetadata !== null) {
      const column = columnMetadata as {type?: {name?: unknown; id?: unknown}};
      const typeName = typeof column.type?.name === 'string' ? column.type.name.toUpperCase() : undefined;
      const typeId = column.type?.id !== undefined ? toNumber(column.type.id) : undefined;

      if (typeName === 'DATE' || typeId === 91) {
        return new Date(numeric * 24 * 60 * 60 * 1000);
      }

      if (typeName === 'TIMESTAMP' || typeId === 93) {
        return new Date(numeric);
      }
    }

    return numeric;
  }

  private formatProtobufBody(
    body: Uint8Array | ArrayBuffer | undefined,
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!body) {
      return undefined;
    }

    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    const preview = bytes.subarray(0, PROTOBUF_PREVIEW_BYTES);

    return {
      kind: 'protobuf',
      sizeBytes: bytes.byteLength,
      previewHex: Buffer.from(preview).toString('hex'),
      previewBase64: Buffer.from(preview).toString('base64'),
      previewSize: preview.byteLength,
      truncated: bytes.byteLength > preview.byteLength,
      ...metadata,
    };
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

/**
 * Creates a CIP client and ensures the required CIP scope on OAuth strategies.
 */
export function createCipClient(config: CipClientConfig, auth: AuthStrategy): CipClient {
  const cipScope = `SALESFORCE_COMMERCE_API:${config.instance}`;
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes([cipScope]) : auth;
  return new CipClient(config, scopedAuth);
}
