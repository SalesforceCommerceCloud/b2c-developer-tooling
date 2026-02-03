/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import ejs from 'ejs';
import type {TemplateHelpers} from './types.js';

/**
 * Convert a string to kebab-case
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to camelCase
 */
export function camelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^[A-Z]/, (c) => c.toLowerCase());
}

/**
 * Convert a string to PascalCase
 */
export function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert a string to snake_case
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Create template helpers with current date/time
 */
export function createTemplateHelpers(): TemplateHelpers {
  const now = new Date();
  return {
    kebabCase,
    camelCase,
    pascalCase,
    snakeCase,
    year: now.getFullYear(),
    date: now.toISOString().split('T')[0],
    uuid: () => randomUUID(),
  };
}

/**
 * Template rendering context combining variables and helpers
 */
export interface TemplateContext extends TemplateHelpers {
  [key: string]: string | boolean | string[] | number | ((str: string) => string) | (() => string);
}

/**
 * Create a full template context with variables and helpers
 */
export function createTemplateContext(variables: Record<string, string | boolean | string[]>): TemplateContext {
  const helpers = createTemplateHelpers();
  return {
    ...helpers,
    ...variables,
  };
}

/**
 * Render an EJS template string
 * @param template - The EJS template string
 * @param context - Template context with variables and helpers
 * @returns Rendered string
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  return ejs.render(template, context, {
    // Allow includes with relative paths
    root: '.',
  });
}

/**
 * Render a file path template (using double-brace variable syntax)
 * @param pathTemplate - The path template string with double-brace placeholders
 * @param context - Template context with variables and helpers
 * @returns Rendered path string
 */
export function renderPathTemplate(pathTemplate: string, context: TemplateContext): string {
  // Convert {{variable}} syntax to values
  return pathTemplate.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const trimmed = expr.trim();

    // Handle function calls like {{kebabCase moduleName}}
    const funcMatch = trimmed.match(/^(\w+)\s+(.+)$/);
    if (funcMatch) {
      const [, funcName, argName] = funcMatch;
      const func = context[funcName];
      const arg = context[argName];
      if (typeof func === 'function' && typeof arg === 'string') {
        return func(arg);
      }
    }

    // Handle direct variable reference
    const value = context[trimmed];
    if (typeof value === 'function') {
      // Only call 0-argument functions (like uuid)
      if (value.length === 0) {
        return (value as () => string)();
      }
      // Functions with arguments require the {{func arg}} syntax
      return `{{${trimmed}}}`;
    }
    if (value !== undefined) {
      return String(value);
    }

    // Return original if not found (will likely cause an error later)
    return `{{${trimmed}}}`;
  });
}

/**
 * Scaffold template engine
 */
export class ScaffoldEngine {
  private context: TemplateContext;

  constructor(variables: Record<string, string | boolean | string[]>) {
    this.context = createTemplateContext(variables);
  }

  /**
   * Get the current template context
   */
  getContext(): TemplateContext {
    return this.context;
  }

  /**
   * Render an EJS template string
   */
  render(template: string): string {
    return renderTemplate(template, this.context);
  }

  /**
   * Render a file path template
   */
  renderPath(pathTemplate: string): string {
    return renderPathTemplate(pathTemplate, this.context);
  }

  /**
   * Render an EJS template file
   */
  async renderFile(filePath: string): Promise<string> {
    const result = await ejs.renderFile(filePath, this.context, {
      async: true,
    });
    return result;
  }
}
