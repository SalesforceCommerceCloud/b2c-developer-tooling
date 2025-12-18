#!/usr/bin/env node
/**
 * Fixes OCAPI OpenAPI spec for proper openapi-fetch typing:
 * 1. Converts 'default' responses to '200' for success typing
 * 2. Adds fault schema for error responses
 * 3. Adds 'default' error response referencing fault schema
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specFile = path.join(__dirname, '..', 'specs', 'data-api.json');

console.log(`Reading ${specFile}...`);
const spec = JSON.parse(fs.readFileSync(specFile, 'utf-8'));

// Add fault schema based on OCAPI documentation
const faultSchema = {
  type: 'object',
  description: 'OCAPI error/fault response returned for 4xx/5xx status codes',
  properties: {
    _v: {
      type: 'string',
      description: 'API version',
    },
    fault: {
      type: 'object',
      required: ['type', 'message'],
      properties: {
        type: {
          type: 'string',
          description: 'Error type identifier (e.g., NotFoundException, CodeVersionIdNotFoundException)',
        },
        message: {
          type: 'string',
          description: 'Human-readable error message',
        },
        arguments: {
          type: 'object',
          description: 'Map of argument values integrated into the message',
          additionalProperties: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['boolean', 'date', 'datetime', 'decimal', 'integer', 'string', 'time'],
              },
              value: {},
            },
          },
        },
      },
    },
  },
};

// Add fault schema to components
if (!spec.components) spec.components = {};
if (!spec.components.schemas) spec.components.schemas = {};
spec.components.schemas.fault = faultSchema;

let transformedCount = 0;

// Transform all paths
for (const pathItem of Object.values(spec.paths || {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (method === 'parameters') continue;
    if (!operation.responses) continue;

    // Convert 'default' to '200' if no 200 exists
    if (operation.responses.default && !operation.responses['200']) {
      operation.responses['200'] = operation.responses.default;
      delete operation.responses.default;
    }

    // Add default error response if not present
    if (!operation.responses.default) {
      operation.responses.default = {
        description: 'Error response',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/fault',
            },
          },
        },
      };
      transformedCount++;
    }
  }
}

console.log(`Added fault schema and ${transformedCount} default error responses`);

fs.writeFileSync(specFile, JSON.stringify(spec, null, 2));
console.log(`Updated ${specFile}`);
