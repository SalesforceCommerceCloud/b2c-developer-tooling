/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {parsePipeline} from '@salesforce/b2c-tooling-sdk/operations/pipeline';
import type {
  StartNodeIR,
  EndNodeIR,
  DecisionNodeIR,
  PipeletNodeIR,
  InteractionNodeIR,
  CallNodeIR,
  JumpNodeIR,
  LoopNodeIR,
} from '@salesforce/b2c-tooling-sdk/operations/pipeline';

describe('operations/pipeline/parser', () => {
  describe('parsePipeline', () => {
    it('parses a minimal pipeline with a start node', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline group="Test">
          <branch basename="Show">
            <segment>
              <node>
                <start-node name="Show" secure="false"/>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      expect(result.name).to.equal('Test');
      expect(result.group).to.equal('Test');
      expect(result.startNodes).to.have.lengthOf(1);

      const startNode = result.nodes.get(result.startNodes[0]) as StartNodeIR;
      expect(startNode.type).to.equal('start');
      expect(startNode.name).to.equal('Show');
      expect(startNode.secure).to.equal(false);
      expect(startNode.isPrivate).to.equal(false);
    });

    it('parses a private start node', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline group="Test">
          <branch basename="CreateAccount">
            <segment>
              <node>
                <start-node name="CreateAccount" secure="true" call-mode="private"/>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const startNode = result.nodes.get(result.startNodes[0]) as StartNodeIR;
      expect(startNode.isPrivate).to.equal(true);
      expect(startNode.secure).to.equal(true);
    });

    it('parses end node with name', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="b1">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node><end-node name="error"/></node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const endNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'end') as EndNodeIR[];
      expect(endNodes).to.have.lengthOf(1);
      expect(endNodes[0].name).to.equal('error');
    });

    it('parses end node without name', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="b1">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node><end-node/></node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const endNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'end') as EndNodeIR[];
      expect(endNodes).to.have.lengthOf(1);
      expect(endNodes[0].name).to.be.undefined;
    });

    it('parses decision nodes with conditions', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <decision-node condition-key="x == y" condition-operator="expr"/>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const decisionNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'decision') as DecisionNodeIR[];
      expect(decisionNodes).to.have.lengthOf(1);

      const decision = decisionNodes[0];
      expect(decision.condition).to.equal('x == y');
      expect(decision.operator).to.equal('expr');
    });

    it('parses Assign pipelet with key bindings', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <pipelet-node pipelet-name="Assign" pipelet-set-identifier="bc_api">
                  <config-property key="Transactional" value="false"/>
                  <key-binding alias="&quot;value&quot;" key="From_0"/>
                  <key-binding alias="myVar" key="To_0"/>
                  <key-binding alias="null" key="From_1"/>
                  <key-binding alias="null" key="To_1"/>
                </pipelet-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const pipeletNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'pipelet') as PipeletNodeIR[];
      expect(pipeletNodes).to.have.lengthOf(1);

      const pipelet = pipeletNodes[0];
      expect(pipelet.pipeletName).to.equal('Assign');
      expect(pipelet.pipeletSet).to.equal('bc_api');

      // Should only have non-null bindings
      const from0 = pipelet.keyBindings.find((kb) => kb.key === 'From_0');
      expect(from0?.value).to.equal('"value"');

      const to0 = pipelet.keyBindings.find((kb) => kb.key === 'To_0');
      expect(to0?.value).to.equal('myVar');

      // Config properties
      const transactional = pipelet.configProperties.find((cp) => cp.key === 'Transactional');
      expect(transactional?.value).to.equal('false');
    });

    it('parses Script pipelet with script file path', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <pipelet-node pipelet-name="Script" pipelet-set-identifier="bc_api" custom-name="DoSomething">
                  <config-property key="ScriptFile" value="app_storefront:scripts/helpers.ds"/>
                  <key-binding alias="CurrentForms.billing" key="Form"/>
                </pipelet-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const pipeletNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'pipelet') as PipeletNodeIR[];
      const script = pipeletNodes[0];

      expect(script.pipeletName).to.equal('Script');
      expect(script.customName).to.equal('DoSomething');

      const scriptFile = script.configProperties.find((cp) => cp.key === 'ScriptFile');
      expect(scriptFile?.value).to.equal('app_storefront:scripts/helpers.ds');
    });

    it('parses interaction node with template', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <interaction-node transaction-required="false">
                  <template buffered="true" dynamic="false" name="content/home/homepage"/>
                </interaction-node>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const interactionNodes = Array.from(result.nodes.values()).filter(
        (n) => n.type === 'interaction',
      ) as InteractionNodeIR[];
      expect(interactionNodes).to.have.lengthOf(1);

      const interaction = interactionNodes[0];
      expect(interaction.templateName).to.equal('content/home/homepage');
      expect(interaction.buffered).to.equal(true);
      expect(interaction.transactionRequired).to.equal(false);
    });

    it('parses call node with target reference', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <call-node start-name-ref="Account-RequireLogin"/>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const callNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'call') as CallNodeIR[];
      expect(callNodes).to.have.lengthOf(1);

      const callNode = callNodes[0];
      expect(callNode.targetRef).to.equal('Account-RequireLogin');
      expect(callNode.pipelineName).to.equal('Account');
      expect(callNode.startName).to.equal('RequireLogin');
    });

    it('parses jump node with target reference', async () => {
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

      const result = await parsePipeline(xml, 'Test');

      const jumpNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'jump') as JumpNodeIR[];
      expect(jumpNodes).to.have.lengthOf(1);

      const jumpNode = jumpNodes[0];
      expect(jumpNode.targetRef).to.equal('Home-Show');
      expect(jumpNode.pipelineName).to.equal('Home');
      expect(jumpNode.startName).to.equal('Show');
    });

    it('parses loop node with element and iterator keys', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Test">
            <segment>
              <node><start-node name="Test"/></node>
              <simple-transition/>
              <node>
                <loop-node element-key="item" iterator-key="items"/>
              </node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      const loopNodes = Array.from(result.nodes.values()).filter((n) => n.type === 'loop') as LoopNodeIR[];
      expect(loopNodes).to.have.lengthOf(1);

      const loopNode = loopNodes[0];
      expect(loopNode.elementKey).to.equal('item');
      expect(loopNode.iteratorKey).to.equal('items');
    });

    it('parses multiple start nodes', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="Show">
            <segment>
              <node><start-node name="Show" secure="false"/></node>
            </segment>
          </branch>
          <branch basename="Edit">
            <segment>
              <node><start-node name="Edit" secure="true"/></node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      expect(result.startNodes).to.have.lengthOf(2);

      const startNodeNames = result.startNodes.map((id) => (result.nodes.get(id) as StartNodeIR).name);
      expect(startNodeNames).to.include('Show');
      expect(startNodeNames).to.include('Edit');
    });

    it('ignores text nodes (documentation)', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <pipeline>
          <branch basename="_ANONYMOUS">
            <segment>
              <node>
                <text-node>
                  <description>This is documentation</description>
                </text-node>
              </node>
            </segment>
          </branch>
          <branch basename="Show">
            <segment>
              <node><start-node name="Show"/></node>
            </segment>
          </branch>
        </pipeline>`;

      const result = await parsePipeline(xml, 'Test');

      // Should only have the start node, not text node
      expect(result.nodes.size).to.equal(1);
      expect(result.startNodes).to.have.lengthOf(1);
    });
  });
});
