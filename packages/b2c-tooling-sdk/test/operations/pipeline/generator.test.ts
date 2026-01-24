/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  parsePipeline,
  analyzePipeline,
  generateController,
  convertPipelineContent,
} from '@salesforce/b2c-tooling-sdk/operations/pipeline';

describe('operations/pipeline/generator', () => {
  describe('generateController', () => {
    it('generates a simple controller with one function', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Show">
            <segment>
              <node><start-node name="Show" secure="false"/></node>
              <simple-transition/>
              <node>
                <interaction-node transaction-required="false">
                  <template name="content/homepage"/>
                </interaction-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Home');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include("'use strict';");
      expect(code).to.include("var ISML = require('dw/template/ISML');");
      expect(code).to.include('function Show()');
      expect(code).to.include('var pdict = {};');
      expect(code).to.include("ISML.renderTemplate('content/homepage', pdict);");
      expect(code).to.include('exports.Show = Show;');
      expect(code).to.include('exports.Show.public = true;');
    });

    it('generates private functions without .public = true', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Helper">
            <segment>
              <node><start-node name="Helper" call-mode="private"/></node>
              <simple-transition/>
              <node><end-node/></node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Account');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include('function Helper()');
      expect(code).to.include('exports.Helper = Helper;');
      expect(code).not.to.include('exports.Helper.public');
    });

    it('generates end node with named return', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node><end-node name="success"/></node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Test');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include("return 'success';");
    });

    it('generates Assign pipelet as variable assignments', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <pipelet-node pipelet-name="Assign" pipelet-set-identifier="bc_api">
                  <key-binding alias="&quot;hello&quot;" key="From_0"/>
                  <key-binding alias="greeting" key="To_0"/>
                  <key-binding alias="null" key="From_1"/>
                  <key-binding alias="null" key="To_1"/>
                </pipelet-node>
              </node>
              <simple-transition/>
              <node><end-node/></node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Test');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include('pdict.greeting = "hello";');
    });

    it('transforms CurrentForms to session.forms', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <pipelet-node pipelet-name="Assign" pipelet-set-identifier="bc_api">
                  <key-binding alias="CurrentForms.billing.address" key="From_0"/>
                  <key-binding alias="address" key="To_0"/>
                </pipelet-node>
              </node>
              <simple-transition/>
              <node><end-node/></node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Test');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include('session.forms.billing.address');
    });

    it('transforms CurrentSession to session', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <pipelet-node pipelet-name="Assign" pipelet-set-identifier="bc_api">
                  <key-binding alias="CurrentSession.customer" key="From_0"/>
                  <key-binding alias="cust" key="To_0"/>
                </pipelet-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Test');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include('session.customer');
    });

    it('generates Script pipelet as require().execute()', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <pipelet-node pipelet-name="Script" pipelet-set-identifier="bc_api">
                  <config-property key="ScriptFile" value="app_storefront:checkout/Helper.ds"/>
                  <key-binding alias="CurrentForms.billing" key="Form"/>
                  <key-binding alias="Customer" key="Customer"/>
                </pipelet-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Test');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include("require('app_storefront/cartridge/scripts/checkout/Helper').execute({");
      expect(code).to.include('Form: session.forms.billing');
      expect(code).to.include('Customer: pdict.Customer');
    });

    it('generates jump node as redirect', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <jump-node start-name-ref="Home-Show"/>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Test');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include("var URLUtils = require('dw/web/URLUtils');");
      expect(code).to.include("response.redirect(URLUtils.url('Home-Show'));");
    });

    it('generates call node within same pipeline as direct call', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Show">
            <segment>
              <node><start-node name="Show"/></node>
              <simple-transition/>
              <node><call-node start-name-ref="Test-Helper"/></node>
              <simple-transition/>
              <node><end-node/></node>
            </segment>
          </branch>
          <branch basename="Helper">
            <segment>
              <node><start-node name="Helper" call-mode="private"/></node>
              <simple-transition/>
              <node><end-node/></node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Test');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include('Helper();');
    });

    it('generates call node to different pipeline as require', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Show">
            <segment>
              <node><start-node name="Show"/></node>
              <simple-transition/>
              <node><call-node start-name-ref="Account-RequireLogin"/></node>
            </segment>
          </branch>
        </pipeline>`;

      const pipeline = await parsePipeline(xml, 'Cart');
      const analysis = analyzePipeline(pipeline);
      const code = generateController(pipeline, analysis);

      expect(code).to.include("require('./Account').RequireLogin();");
    });
  });

  describe('convertPipelineContent', () => {
    it('provides high-level API for conversion', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline group="Catalog">
          <branch basename="Show">
            <segment>
              <node><start-node name="Show" secure="false"/></node>
              <simple-transition/>
              <node>
                <interaction-node>
                  <template name="catalog/product"/>
                </interaction-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await convertPipelineContent(xml, 'Product');

      expect(result.pipelineName).to.equal('Product');
      expect(result.code).to.include('function Show()');
      expect(result.code).to.include("ISML.renderTemplate('catalog/product', pdict);");
      expect(result.warnings).to.be.an('array');
    });

    it('generates multiple functions for multiple start nodes', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Show">
            <segment>
              <node><start-node name="Show"/></node>
              <simple-transition/>
              <node>
                <interaction-node><template name="home"/></interaction-node>
              </node>
            </segment>
          </branch>
          <branch basename="Edit">
            <segment>
              <node><start-node name="Edit" secure="true"/></node>
              <simple-transition/>
              <node>
                <interaction-node><template name="edit"/></interaction-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await convertPipelineContent(xml, 'Page');

      expect(result.code).to.include('function Show()');
      expect(result.code).to.include('function Edit()');
      expect(result.code).to.include('exports.Show.public = true;');
      expect(result.code).to.include('exports.Edit.public = true;');
    });
  });
});
