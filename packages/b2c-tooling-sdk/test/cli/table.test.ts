/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {TableRenderer, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';

interface TestItem {
  id: string;
  name: string;
  status: string;
  description?: string;
}

describe('cli/table', () => {
  describe('TableRenderer', () => {
    const columns: Record<string, ColumnDef<TestItem>> = {
      id: {header: 'ID', get: (item) => item.id},
      name: {header: 'Name', get: (item) => item.name},
      status: {header: 'Status', get: (item) => item.status},
      description: {header: 'Description', get: (item) => item.description ?? '', extended: true},
    };

    const testData: TestItem[] = [
      {id: '1', name: 'Item One', status: 'active', description: 'First item'},
      {id: '2', name: 'Item Two', status: 'inactive', description: 'Second item'},
      {id: '3', name: 'Item Three', status: 'pending'},
    ];

    describe('constructor', () => {
      it('creates a renderer with columns', () => {
        const renderer = new TableRenderer(columns);
        expect(renderer).to.be.instanceOf(TableRenderer);
      });
    });

    describe('render', () => {
      it('renders table with all columns', () => {
        const renderer = new TableRenderer(columns);
        // Capture stdout
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render(testData, ['id', 'name', 'status']);
          expect(output).to.include('ID');
          expect(output).to.include('Name');
          expect(output).to.include('Status');
          expect(output).to.include('Item One');
          expect(output).to.include('Item Two');
        } finally {
          process.stdout.write = originalWrite;
        }
      });

      it('renders table with subset of columns', () => {
        const renderer = new TableRenderer(columns);
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render(testData, ['id', 'name']);
          expect(output).to.include('ID');
          expect(output).to.include('Name');
          expect(output).to.not.include('Status');
        } finally {
          process.stdout.write = originalWrite;
        }
      });

      it('handles empty data array', () => {
        const renderer = new TableRenderer(columns);
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render([], ['id', 'name']);
          expect(output).to.include('ID');
          expect(output).to.include('Name');
        } finally {
          process.stdout.write = originalWrite;
        }
      });

      it('respects custom term width', () => {
        const renderer = new TableRenderer(columns);
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render(testData, ['id', 'name'], {termWidth: 200});
          // Should not throw
          expect(output).to.be.a('string');
        } finally {
          process.stdout.write = originalWrite;
        }
      });

      it('respects custom padding', () => {
        const renderer = new TableRenderer(columns);
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render(testData, ['id', 'name'], {padding: 4});
          // Should not throw
          expect(output).to.be.a('string');
        } finally {
          process.stdout.write = originalWrite;
        }
      });
    });

    describe('getColumnKeys', () => {
      it('returns all column keys', () => {
        const renderer = new TableRenderer(columns);
        const keys = renderer.getColumnKeys();
        expect(keys).to.have.members(['id', 'name', 'status', 'description']);
      });
    });

    describe('getDefaultColumnKeys', () => {
      it('returns only non-extended column keys', () => {
        const renderer = new TableRenderer(columns);
        const keys = renderer.getDefaultColumnKeys();
        expect(keys).to.have.members(['id', 'name', 'status']);
        expect(keys).to.not.include('description');
      });

      it('returns all keys when no extended columns', () => {
        const simpleColumns: Record<string, ColumnDef<TestItem>> = {
          id: {header: 'ID', get: (item) => item.id},
          name: {header: 'Name', get: (item) => item.name},
        };
        const renderer = new TableRenderer(simpleColumns);
        const keys = renderer.getDefaultColumnKeys();
        expect(keys).to.have.members(['id', 'name']);
      });
    });

    describe('validateColumnKeys', () => {
      it('returns valid column keys', () => {
        const renderer = new TableRenderer(columns);
        const valid = renderer.validateColumnKeys(['id', 'name', 'status']);
        expect(valid).to.have.members(['id', 'name', 'status']);
      });

      it('filters out invalid column keys', () => {
        const renderer = new TableRenderer(columns);
        const valid = renderer.validateColumnKeys(['id', 'invalid', 'name', 'also-invalid']);
        expect(valid).to.have.members(['id', 'name']);
      });

      it('returns empty array when all keys are invalid', () => {
        const renderer = new TableRenderer(columns);
        const valid = renderer.validateColumnKeys(['invalid1', 'invalid2']);
        expect(valid).to.be.empty;
      });
    });

    describe('column width calculation', () => {
      it('calculates width based on header length', () => {
        const wideHeaderColumns: Record<string, ColumnDef<TestItem>> = {
          id: {header: 'Very Long Header Name', get: (item) => item.id},
        };
        const renderer = new TableRenderer(wideHeaderColumns);
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render([{id: '1', name: 'test', status: 'active'}], ['id']);
          expect(output).to.include('Very Long Header Name');
        } finally {
          process.stdout.write = originalWrite;
        }
      });

      it('calculates width based on content length', () => {
        const columns: Record<string, ColumnDef<TestItem>> = {
          name: {header: 'Name', get: (item) => item.name},
        };
        const renderer = new TableRenderer(columns);
        const longData: TestItem[] = [{id: '1', name: 'Very Long Item Name That Exceeds Header', status: 'active'}];
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render(longData, ['name']);
          expect(output).to.include('Very Long Item Name That Exceeds Header');
        } finally {
          process.stdout.write = originalWrite;
        }
      });

      it('respects minWidth option', () => {
        const columns: Record<string, ColumnDef<TestItem>> = {
          id: {header: 'ID', get: (item) => item.id, minWidth: 20},
        };
        const renderer = new TableRenderer(columns);
        const originalWrite = process.stdout.write;
        let output = '';
        process.stdout.write = ((chunk: string) => {
          output += chunk;
          return true;
        }) as typeof process.stdout.write;

        try {
          renderer.render([{id: '1', name: 'test', status: 'active'}], ['id']);
          // Should render with at least minWidth
          expect(output).to.be.a('string');
        } finally {
          process.stdout.write = originalWrite;
        }
      });
    });
  });

  describe('createTable', () => {
    it('creates a TableRenderer instance', () => {
      const columns: Record<string, ColumnDef<TestItem>> = {
        id: {header: 'ID', get: (item) => item.id},
        name: {header: 'Name', get: (item) => item.name},
      };
      const renderer = createTable(columns);
      expect(renderer).to.be.instanceOf(TableRenderer);
      expect(renderer.getColumnKeys()).to.have.members(['id', 'name']);
    });
  });
});
