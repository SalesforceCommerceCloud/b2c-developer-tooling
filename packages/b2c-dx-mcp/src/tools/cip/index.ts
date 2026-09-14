/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {
  listCipReports,
  getCipReportByName,
  buildCipReportSql,
  listCipTables,
  describeCipTable,
} from '@salesforce/b2c-tooling-sdk/operations/cip';
import type {McpTool, ToolResult} from '../../utils/types.js';
import {jsonResult, attachResolution, type ServicesLoader} from '../adapter.js';
import {createProjectContextInputSchema, type ToolResolution, type ProjectContextInput} from '../project-context.js';
import {MCP_SKILL_REFERENCES} from '../../skill-references.js';
import {resolveCipClient} from './client.js';

const MAX_OUTPUT_BYTES = 24_000;
const params = z
  .record(z.string(), z.string())
  .optional()
  .describe('Report parameters from discovery; string values, dates YYYY-MM-DD.');
const connection = {
  ...createProjectContextInputSchema('configuration'),
  staging: z
    .boolean()
    .optional()
    .describe('Force staging analytics host; otherwise infer from tenant. cipHost configuration takes precedence.'),
};

function result(data: object, resolution?: ToolResolution): ToolResult {
  const value = resolution ? attachResolution(jsonResult(data, 0), resolution, 0) : jsonResult(data, 0);
  delete value.structuredContent;
  return value;
}

type CipTarget = ReturnType<typeof resolveCipClient>['target'];

function failure(error: unknown, resolution?: ToolResolution, target?: CipTarget): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    ...result(
      {
        error: message.slice(0, 6000),
        ...(target ? {target} : {}),
        ...(/CIP_(CONFIG|AUTH)|\b(401|403)\b|invalid_(scope|client)|unauthorized|forbidden/i.test(message)
          ? {skillReferences: [MCP_SKILL_REFERENCES.cipAccess]}
          : {}),
      },
      resolution,
    ),
    isError: true,
  };
}

function size(value: ToolResult): number {
  return Buffer.byteLength(JSON.stringify(value));
}

function reportSql(name: string, values: Record<string, string>) {
  const built = buildCipReportSql(name, values);
  if (values.from && values.to && values.from > values.to) throw new Error('from must be on or before to.');
  return built.sql;
}

export function createCipTools(
  loadServices: ServicesLoader,
  dependencies?: {resolveClient: typeof resolveCipClient},
): McpTool[] {
  const resolveClient = dependencies?.resolveClient ?? resolveCipClient;
  const discovery = {
    ...connection,
    action: z.enum(['reports', 'report', 'tables', 'table']).default('reports'),
    query: z.string().max(200).optional().describe('Report search text or SQL LIKE table-name pattern.'),
    name: z.string().min(1).max(200).optional().describe('Report or table name for detail actions.'),
    params,
    schema: z.string().min(1).max(200).default('warehouse'),
    offset: z.number().int().min(0).max(1000).default(0),
    limit: z.number().int().min(1).max(100).default(20),
  };
  const execution = {
    ...connection,
    skillRead: z.boolean().optional().describe('True after reading the linked CIP skill.'),
    report: z.string().min(1).max(100).optional().describe('Curated report name; supply report or sql.'),
    params,
    sql: z
      .string()
      .min(1)
      .max(32_768)
      .optional()
      .describe('Analytics SELECT query; filter dates/sites and aggregate in SQL.'),
    maxRows: z.number().int().min(1).max(500).default(50),
    timeoutSeconds: z.number().int().min(1).max(120).default(60),
  };
  return [
    {
      name: 'cip_discover',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      toolsets: ['CIP'],
      description:
        'Find CIP analytics reports and inspect parameters/SQL offline; list live warehouse tables or inspect columns. Narrow results before querying.',
      inputSchema: discovery,
      async handler(args, context) {
        let resolution: ToolResolution | undefined;
        let target: CipTarget | undefined;
        try {
          const input = z.object(discovery).strict().parse(args) as ProjectContextInput &
            z.infer<z.ZodObject<typeof discovery>>;
          if ((input.action === 'report' || input.action === 'table') && !input.name)
            throw new Error('name is required for report/table details.');
          if (input.params && input.action !== 'report') throw new Error('params applies only to report SQL previews.');
          if (input.action === 'report') {
            const report = getCipReportByName(input.name!);
            if (!report) throw new Error('Unknown report. Search reports with cip_discover.');
            const {buildSql: _buildSql, ...metadata} = report;
            return result({...metadata, ...(input.params ? {sql: reportSql(report.name, input.params)} : {})});
          }
          if (input.action === 'reports') {
            const terms = (input.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
            const reports = listCipReports().filter((r) =>
              terms.every((term) => `${r.name} ${r.category} ${r.description}`.toLowerCase().includes(term)),
            );
            const selected = reports.slice(input.offset, input.offset + input.limit);
            return result({
              total: reports.length,
              reports: selected.map(({name, description, category}) => ({name, description, category})),
              nextOffset: input.offset + selected.length < reports.length ? input.offset + selected.length : null,
            });
          }
          const services = await loadServices(input);
          resolution = services.getResolution();
          const timeout = AbortSignal.timeout(60_000);
          const resolved = resolveClient(
            services,
            context?.signal ? AbortSignal.any([context.signal, timeout]) : timeout,
            input.staging,
          );
          const {client} = resolved;
          target = resolved.target;
          const options = {schema: input.schema, maxRows: input.offset + input.limit};
          const data =
            input.action === 'tables'
              ? await listCipTables(client, {...options, tableType: 'TABLE', tableNamePattern: input.query})
              : await describeCipTable(client, input.name!, options);
          const rows = 'tables' in data ? data.tables : data.columns;
          const selected = rows.slice(input.offset);
          const response = result(
            {
              target,
              [input.action === 'tables' ? 'tables' : 'columns']: selected,
              returned: selected.length,
              truncated: data.truncated ?? false,
              nextOffset:
                data.truncated && input.offset + selected.length <= 1000 ? input.offset + selected.length : null,
              ...(data.truncated && input.offset + selected.length > 1000
                ? {warning: 'Metadata paging limit reached. Narrow the table pattern or schema.'}
                : {}),
            },
            resolution,
          );
          if (size(response) > MAX_OUTPUT_BYTES)
            throw new Error('Metadata exceeds the output limit. Reduce limit or narrow query.');
          return response;
        } catch (error) {
          return failure(error, resolution, target);
        }
      },
    },
    {
      name: 'cip_query',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      toolsets: ['CIP'],
      description:
        'Query CIP analytics using a curated report or SQL. Read skill://mcp/cip/SKILL.md first. Returns bounded rows; filter/group in SQL. Warehouse data is not live SCAPI state.',
      inputSchema: execution,
      async handler(args, context) {
        let resolution: ToolResolution | undefined;
        let target: CipTarget | undefined;
        try {
          const input = z.object(execution).strict().parse(args) as ProjectContextInput &
            z.infer<z.ZodObject<typeof execution>>;
          if (input.skillRead !== true)
            throw new Error(
              'CIP_SKILL_REQUIRED: Read skill://mcp/cip/SKILL.md through resources or skills_read, then retry with skillRead: true.',
            );
          if (Number(Boolean(input.report)) + Number(Boolean(input.sql)) !== 1)
            throw new Error('Supply exactly one of report or sql.');
          if (input.sql && input.params)
            throw new Error('params applies only to curated reports. Put custom query values in sql.');
          const sql = input.report ? reportSql(input.report, input.params ?? {}) : input.sql!;
          const services = await loadServices(input);
          resolution = services.getResolution();
          const timeout = AbortSignal.timeout(input.timeoutSeconds * 1000);
          const resolved = resolveClient(
            services,
            context?.signal ? AbortSignal.any([context.signal, timeout]) : timeout,
            input.staging,
          );
          const {client} = resolved;
          target = resolved.target;
          const data = await client.query(sql, {maxRows: input.maxRows});
          const output = {
            target,
            ...(input.report ? {report: input.report} : {}),
            columns: data.columns,
            rows: [...data.rows],
            rowCount: data.rowCount,
            truncated: data.truncated ?? false,
            truncationReason: data.truncated ? 'rows' : undefined,
          };
          let response = result(output, resolution);
          while (size(response) > MAX_OUTPUT_BYTES && output.rows.length > 0) {
            output.rows.pop();
            output.rowCount = output.rows.length;
            output.truncated = true;
            output.truncationReason = 'bytes';
            response = result(output, resolution);
          }
          if (size(response) > MAX_OUTPUT_BYTES || (data.rowCount > 0 && output.rowCount === 0))
            throw new Error('CIP result is too wide. Select fewer columns or aggregate in SQL.');
          return response;
        } catch (error) {
          return failure(error, resolution, target);
        }
      },
    },
  ];
}
