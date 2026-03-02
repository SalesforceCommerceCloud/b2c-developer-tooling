/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateWorkflowResponse} from '../../../../../src/tools/storefrontnext/figma/figma-to-component/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('Figma To Component Workflow (figma/)', () => {
  it('when provided valid Figma URL, it should return workflow guide with parsed parameters and workflow steps', () => {
    const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

    expect(response).to.include('Figma to StorefrontNext Workflow Guide');
    expect(response).to.include('Figma Design Parameters');
    expect(response).to.include('WORKFLOW_STEPS');
    expect(response).to.include('abc123');
    expect(response).to.include('1:2');
    expect(response).to.include('mcp__figma__get_metadata');
    expect(response).to.include('mcp__figma__get_design_context');
    expect(response).to.include('mcp__figma__get_screenshot');
  });

  it('when provided valid Figma URL, response should include consolidated development guidelines', () => {
    const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

    expect(response).to.include('General Development Guidelines');
    expect(response).to.include('Analyze Requirements');
  });

  it('when provided invalid Figma URL, it should return error message with guidance', () => {
    const response = generateWorkflowResponse('not-a-valid-url');

    expect(response).to.include('Error: Invalid Figma URL');
    expect(response).to.include('Please provide a valid Figma URL');
  });

  it('when provided Figma URL without node-id parameter, it should return error message mentioning node-id', () => {
    const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign');

    expect(response).to.include('Error: Invalid Figma URL');
    expect(response).to.include('node-id');
  });

  it('when provided Figma URL with dash-formatted node-id, it should convert to colon format', () => {
    const response = generateWorkflowResponse('https://figma.com/design/test123/Design?node-id=42-99');

    expect(response).to.include('42:99');
    expect(response).to.include('test123');
  });

  describe('Custom Workflow Files', () => {
    it('when user provides valid custom workflow file, it should use that workflow content', () => {
      const customPath = join(__dirname, '../test-fixtures/workflow-custom.md');
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2', customPath);

      expect(response).to.include('Custom Test Workflow');
      expect(response).to.include('Custom step one');
      expect(response).to.include('Custom step two');
    });

    it('when user provides nonexistent workflow file path, it should return error message', () => {
      const response = generateWorkflowResponse(
        'https://figma.com/design/abc123/MyDesign?node-id=1-2',
        '/nonexistent/path/workflow.md',
      );

      expect(response).to.include('Error');
      expect(response).to.include('Workflow file not found');
    });

    it('when workflow file has no metadata section, it should still process workflow content', () => {
      const noMetadataPath = join(__dirname, '../test-fixtures/workflow-no-metadata.md');
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2', noMetadataPath);

      expect(response).to.include('Test Workflow Without Metadata');
      expect(response).to.include('Step one');
    });
  });

  describe('Output Structure', () => {
    it('when generating workflow guide, it should output sections in correct order', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      const titlePos = response.indexOf('# Figma to StorefrontNext Workflow Guide');
      const paramsPos = response.indexOf('## Figma Design Parameters');

      expect(titlePos).to.be.greaterThan(-1);
      expect(paramsPos).to.be.greaterThan(-1);
      expect(titlePos).to.be.lessThan(paramsPos);
    });

    it('when generating workflow guide, it should include Figma MCP parameter hints', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('clientLanguages');
      expect(response).to.include('clientFrameworks');
      expect(response).to.include('typescript');
      expect(response).to.include('react');
    });
  });

  describe('Next Steps Reminder', () => {
    it('should include the critical next steps section', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('## CRITICAL: Next Steps Required');
    });

    it('should include all required workflow steps', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('Step 1: Fetch Figma Design Data');
      expect(response).to.include('Step 2: Discover Similar Components');
      expect(response).to.include('Step 3: Analyze Component Strategy');
      expect(response).to.include('Step 4: Map Design Tokens');
      expect(response).to.include('Step 5: Implement');
    });

    it('should reference required MCP tool names in the reminder', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('`mcp__figma__get_design_context`');
      expect(response).to.include('`mcp__figma__get_screenshot`');
      expect(response).to.include('`generate_component`');
      expect(response).to.include('`map_tokens_to_theme`');
    });

    it('should include the do-not-stop instruction', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('DO NOT STOP until you have called generate_component AND map_tokens_to_theme');
    });

    it('should include image export approval instruction (user must confirm before exporting)', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('wait for approval');
      expect(response).to.include('present the list to the user');
      expect(response).to.include('Should I export these');
    });

    it('should include logo and brand asset detection in image identification criteria', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('logo');
      expect(response).to.include('brand');
      expect(response).to.include('icon');
    });

    it('should instruct to NOT pass dirForAssetWrites on the initial get_design_context call', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('dirForAssetWrites');
      expect(response).to.include('Do NOT pass dirForAssetWrites on the initial call');
    });

    it('should instruct single prompt per batch (ask once, not per image)', () => {
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2');

      expect(response).to.include('ask ONCE');
      expect(response).to.include('entire batch');
    });
  });

  describe('Error Response Format', () => {
    it('should include URL format guidance in error response', () => {
      const response = generateWorkflowResponse('not-a-valid-url');

      expect(response).to.include('https://figma.com/design/:fileKey/:fileName?node-id=1-2');
    });

    it('should include an example URL in error response', () => {
      const response = generateWorkflowResponse('not-a-valid-url');

      expect(response).to.include('Example:');
      expect(response).to.include('https://figma.com/design/abc123/MyDesign?node-id=1-2');
    });
  });

  describe('Metadata Parsing', () => {
    it('when custom workflow has metadata with colon in value, it should parse body correctly', () => {
      const customPath = join(__dirname, '../test-fixtures/workflow-custom.md');
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2', customPath);

      expect(response).to.include('Custom Test Workflow');
      expect(response).to.not.include('description:');
      expect(response).to.not.include('taskType:');
    });

    it('when workflow file has no metadata, it should use the entire content as body', () => {
      const noMetadataPath = join(__dirname, '../test-fixtures/workflow-no-metadata.md');
      const response = generateWorkflowResponse('https://figma.com/design/abc123/MyDesign?node-id=1-2', noMetadataPath);

      expect(response).to.include('Test Workflow Without Metadata');
      expect(response).to.include('Step two');
      expect(response).to.include('Step three');
    });
  });
});
