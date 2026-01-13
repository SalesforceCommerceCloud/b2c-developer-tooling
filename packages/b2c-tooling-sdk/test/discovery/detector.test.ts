/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  WorkspaceTypeDetector,
  detectWorkspaceType,
  type DetectionPattern,
  type ProjectType,
} from '@salesforce/b2c-tooling-sdk/discovery';

/**
 * Creates a mock detection pattern for testing.
 */
function createMockPattern(name: string, projectType: ProjectType, matches: boolean | Error = true): DetectionPattern {
  return {
    name,
    projectType,
    detect: async () => {
      if (matches instanceof Error) {
        throw matches;
      }
      return matches;
    },
  };
}

describe('discovery/detector', () => {
  describe('WorkspaceTypeDetector', () => {
    describe('detect', () => {
      it('returns empty arrays when no patterns match', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [createMockPattern('no-match-1', 'pwa-kit', false), createMockPattern('no-match-2', 'sfra', false)],
        });

        const result = await detector.detect();

        expect(result.projectTypes).to.deep.equal([]);
        expect(result.matchedPatterns).to.deep.equal([]);
        expect(result.autoDiscovered).to.equal(true);
      });

      it('returns matched project types and pattern names', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [createMockPattern('pwa-kit', 'pwa-kit', true), createMockPattern('sfra-cartridge', 'sfra', false)],
        });

        const result = await detector.detect();

        expect(result.projectTypes).to.deep.equal(['pwa-kit']);
        expect(result.matchedPatterns).to.deep.equal(['pwa-kit']);
      });

      it('returns multiple project types when multiple patterns match', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [createMockPattern('pwa-kit', 'pwa-kit', true), createMockPattern('dw-json', 'headless', true)],
        });

        const result = await detector.detect();

        expect(result.projectTypes).to.deep.equal(['pwa-kit', 'headless']);
        expect(result.matchedPatterns).to.deep.equal(['pwa-kit', 'dw-json']);
      });

      it('deduplicates project types when multiple patterns match same type', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [createMockPattern('pattern-1', 'sfra', true), createMockPattern('pattern-2', 'sfra', true)],
        });

        const result = await detector.detect();

        expect(result.projectTypes).to.deep.equal(['sfra']);
        expect(result.matchedPatterns).to.deep.equal(['pattern-1', 'pattern-2']);
      });

      it('skips patterns that throw errors', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [
            createMockPattern('error-pattern', 'pwa-kit', new Error('Test error')),
            createMockPattern('good-pattern', 'sfra', true),
          ],
        });

        const result = await detector.detect();

        expect(result.projectTypes).to.deep.equal(['sfra']);
        expect(result.matchedPatterns).to.deep.equal(['good-pattern']);
      });

      it('preserves pattern order in results', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [
            createMockPattern('first', 'pwa-kit', true),
            createMockPattern('second', 'sfra', true),
            createMockPattern('third', 'custom-api', true),
          ],
        });

        const result = await detector.detect();

        expect(result.projectTypes).to.deep.equal(['pwa-kit', 'sfra', 'custom-api']);
        expect(result.matchedPatterns).to.deep.equal(['first', 'second', 'third']);
      });
    });

    describe('pattern resolution', () => {
      it('uses custom patterns when provided', async () => {
        const customPattern = createMockPattern('custom', 'pwa-kit', true);
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [customPattern],
        });

        const result = await detector.detect();

        expect(result.matchedPatterns).to.deep.equal(['custom']);
      });

      it('adds additional patterns to defaults', async () => {
        const additionalPattern = createMockPattern('additional', 'custom-api', true);
        const detector = new WorkspaceTypeDetector('/nonexistent/path', {
          additionalPatterns: [additionalPattern],
        });

        const result = await detector.detect();

        // Additional pattern should match
        expect(result.matchedPatterns).to.include('additional');
      });

      it('excludes patterns by name', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [createMockPattern('keep-me', 'pwa-kit', true), createMockPattern('exclude-me', 'sfra', true)],
          excludePatterns: ['exclude-me'],
        });

        const result = await detector.detect();

        expect(result.matchedPatterns).to.deep.equal(['keep-me']);
        expect(result.matchedPatterns).to.not.include('exclude-me');
      });

      it('combines additionalPatterns and excludePatterns', async () => {
        const detector = new WorkspaceTypeDetector('/test/path', {
          patterns: [createMockPattern('base-1', 'pwa-kit', true), createMockPattern('base-2', 'sfra', true)],
          additionalPatterns: [createMockPattern('added', 'custom-api', true)],
          excludePatterns: ['base-2'],
        });

        const result = await detector.detect();

        expect(result.matchedPatterns).to.include('base-1');
        expect(result.matchedPatterns).to.include('added');
        expect(result.matchedPatterns).to.not.include('base-2');
      });
    });
  });

  describe('detectWorkspaceType', () => {
    it('is a convenience function that returns detection result', async () => {
      const result = await detectWorkspaceType('/nonexistent/path', {
        patterns: [createMockPattern('test', 'pwa-kit', true)],
      });

      expect(result.projectTypes).to.deep.equal(['pwa-kit']);
      expect(result.matchedPatterns).to.deep.equal(['test']);
      expect(result.autoDiscovered).to.equal(true);
    });

    it('works without options', async () => {
      // This will use default patterns against a non-existent path
      // Default patterns should not match
      const result = await detectWorkspaceType('/nonexistent/path/that/does/not/exist');

      expect(result.projectTypes).to.be.an('array');
      expect(result.matchedPatterns).to.be.an('array');
      expect(result.autoDiscovered).to.equal(true);
    });
  });
});
