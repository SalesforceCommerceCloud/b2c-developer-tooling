/**
 * Table rendering utilities for CLI output.
 *
 * Provides a consistent, flexible way to render tabular data in CLI commands
 * with dynamic column widths based on content.
 *
 * @module cli/table
 *
 * @example
 * ```typescript
 * import { TableRenderer, type ColumnDef } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * interface User {
 *   name: string;
 *   email: string;
 *   role: string;
 * }
 *
 * const columns: Record<string, ColumnDef<User>> = {
 *   name: { header: 'Name', get: (u) => u.name },
 *   email: { header: 'Email', get: (u) => u.email },
 *   role: { header: 'Role', get: (u) => u.role },
 * };
 *
 * const table = new TableRenderer(columns);
 * table.render(users, ['name', 'email', 'role']);
 * ```
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';

/**
 * Column definition for table output.
 *
 * @typeParam T - The type of data items being rendered
 */
export interface ColumnDef<T> {
  /** Column header label */
  header: string;
  /** Function to extract display value from a data item */
  get: (item: T) => string;
  /** Minimum width in characters (optional) */
  minWidth?: number;
  /** Whether this column is only shown in extended mode (optional) */
  extended?: boolean;
}

/**
 * Options for table rendering.
 */
export interface TableRenderOptions {
  /** Terminal width override (defaults to process.stdout.columns or 120) */
  termWidth?: number;
  /** Column padding (defaults to 2) */
  padding?: number;
}

/**
 * A reusable table renderer for CLI output.
 *
 * Handles dynamic column width calculation based on content and provides
 * consistent table formatting across all CLI commands.
 *
 * @typeParam T - The type of data items being rendered
 *
 * @example
 * ```typescript
 * // Define columns for your data type
 * const columns: Record<string, ColumnDef<MyData>> = {
 *   id: { header: 'ID', get: (d) => d.id },
 *   name: { header: 'Name', get: (d) => d.name },
 *   status: { header: 'Status', get: (d) => d.status },
 * };
 *
 * // Create renderer and render data
 * const table = new TableRenderer(columns);
 * table.render(items, ['id', 'name', 'status']);
 *
 * // Or with custom options
 * table.render(items, ['id', 'name'], { padding: 3 });
 * ```
 */
export class TableRenderer<T> {
  /**
   * Creates a new TableRenderer.
   *
   * @param columns - Column definitions keyed by column identifier
   */
  constructor(private columns: Record<string, ColumnDef<T>>) {}

  /**
   * Renders data as a formatted table to stdout.
   *
   * @param data - Array of data items to render
   * @param columnKeys - Array of column keys to display (in order)
   * @param options - Optional rendering options
   */
  render(data: T[], columnKeys: string[], options: TableRenderOptions = {}): void {
    const termWidth = options.termWidth ?? process.stdout.columns ?? 120;
    const padding = options.padding ?? 2;

    const ui = cliui({width: termWidth});
    const widths = this.calculateColumnWidths(data, columnKeys, padding);

    // Header row
    const headerCols = columnKeys.map((key) => ({
      text: this.columns[key].header,
      width: widths.get(key),
      padding: [0, 1, 0, 0] as [number, number, number, number],
    }));
    ui.div(...headerCols);

    // Separator
    const totalWidth = [...widths.values()].reduce((sum, w) => sum + w, 0);
    ui.div({text: '─'.repeat(Math.min(totalWidth, termWidth)), padding: [0, 0, 0, 0]});

    // Data rows
    for (const item of data) {
      const rowCols = columnKeys.map((key) => ({
        text: this.columns[key].get(item),
        width: widths.get(key),
        padding: [0, 1, 0, 0] as [number, number, number, number],
      }));
      ui.div(...rowCols);
    }

    ux.stdout(ui.toString());
  }

  /**
   * Gets the list of available column keys.
   *
   * @returns Array of all column keys
   */
  getColumnKeys(): string[] {
    return Object.keys(this.columns);
  }

  /**
   * Gets column keys excluding extended columns.
   *
   * @returns Array of non-extended column keys
   */
  getDefaultColumnKeys(): string[] {
    return Object.entries(this.columns)
      .filter(([, col]) => !col.extended)
      .map(([key]) => key);
  }

  /**
   * Validates and filters column keys.
   *
   * @param requested - Requested column keys
   * @returns Valid column keys that exist in the columns definition
   */
  validateColumnKeys(requested: string[]): string[] {
    return requested.filter((key) => key in this.columns);
  }

  /**
   * Calculates dynamic column widths based on content.
   *
   * @param data - Data items to measure
   * @param columnKeys - Columns to calculate widths for
   * @param padding - Padding to add to each column
   * @returns Map of column key to calculated width
   */
  private calculateColumnWidths(data: T[], columnKeys: string[], padding: number): Map<string, number> {
    const widths = new Map<string, number>();

    for (const key of columnKeys) {
      const col = this.columns[key];
      let maxWidth = col.header.length;

      for (const item of data) {
        const value = col.get(item);
        maxWidth = Math.max(maxWidth, value.length);
      }

      const minWidth = col.minWidth ?? 0;
      widths.set(key, Math.max(maxWidth, minWidth) + padding);
    }

    return widths;
  }
}

/**
 * Creates a TableRenderer instance.
 *
 * Convenience function for creating a table renderer.
 *
 * @typeParam T - The type of data items being rendered
 * @param columns - Column definitions
 * @returns A new TableRenderer instance
 *
 * @example
 * ```typescript
 * const table = createTable<User>({
 *   name: { header: 'Name', get: (u) => u.name },
 *   email: { header: 'Email', get: (u) => u.email },
 * });
 * table.render(users, ['name', 'email']);
 * ```
 */
export function createTable<T>(columns: Record<string, ColumnDef<T>>): TableRenderer<T> {
  return new TableRenderer(columns);
}
