/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  buildObjectTypeExtensionsXml,
  parseObjectTypeExtensions,
  valueTypeToXmlType,
  xmlTypeToValueType,
} from '../../../src/operations/object-types/index.js';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Product">
        <system-attribute-definitions>
            <attribute-definition attribute-id="brand">
                <display-name xml:lang="x-default">Label</display-name>
                <visible-flag>true</visible-flag>
            </attribute-definition>
        </system-attribute-definitions>
        <custom-attribute-definitions>
            <attribute-definition attribute-id="fabric">
                <display-name xml:lang="x-default">Fabric</display-name>
                <display-name xml:lang="fr">Tissu</display-name>
                <type>set-of-string</type>
                <localizable-flag>false</localizable-flag>
                <site-specific-flag>true</site-specific-flag>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <min-length>0</min-length>
                <field-length>40</field-length>
            </attribute-definition>
            <attribute-definition attribute-id="careLevel">
                <type>enum-of-int</type>
                <select-multiple-flag>false</select-multiple-flag>
                <value-definitions>
                    <value-definition default="true">
                        <display xml:lang="x-default">Low</display>
                        <value>1</value>
                    </value-definition>
                    <value-definition>
                        <value>2</value>
                    </value-definition>
                </value-definitions>
                <default-value>1</default-value>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="materials">
                <display-name xml:lang="x-default">Materials</display-name>
                <attribute attribute-id="fabric"/>
                <attribute attribute-id="brand" system="true"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
    <custom-type type-id="MyCustomType"/>
</metadata>`;

describe('operations/object-types/meta-xml', () => {
  it('converts between XML and API value types', () => {
    expect(xmlTypeToValueType('set-of-string')).to.equal('set_of_string');
    expect(valueTypeToXmlType('enum_of_int')).to.equal('enum-of-int');
  });

  it('parses custom and system attributes, groups, and skipped custom types', async () => {
    const {extensions, skippedCustomTypes} = await parseObjectTypeExtensions(XML);
    expect(skippedCustomTypes).to.deep.equal(['MyCustomType']);
    expect(extensions).to.have.length(1);
    const [product] = extensions;
    expect(product.objectType).to.equal('Product');
    expect(product.systemAttributes).to.deep.equal([{id: 'brand', displayName: {default: 'Label'}, visible: true}]);
    expect(product.attributes[0]).to.deep.equal({
      id: 'fabric',
      displayName: {default: 'Fabric', fr: 'Tissu'},
      valueType: 'set_of_string',
      localizable: false,
      siteSpecific: true,
      mandatory: false,
      externallyManaged: false,
      minLength: 0,
      fieldLength: 40,
    });
    expect(product.attributes[1]).to.deep.include({
      id: 'careLevel',
      valueType: 'enum_of_int',
      multiValueType: false,
      defaultValue: {value: '1'},
    });
    expect(product.attributes[1].valueDefinitions).to.deep.equal([
      {value: '1', displayValue: {default: 'Low'}},
      {value: '2'},
    ]);
    expect(product.groups).to.deep.equal([
      {
        id: 'materials',
        displayName: {default: 'Materials'},
        attributes: [{id: 'fabric'}, {id: 'brand', system: true}],
      },
    ]);
  });

  it('rejects files without a metadata root', async () => {
    try {
      await parseObjectTypeExtensions('<site-archive/>');
      expect.fail('expected error');
    } catch (error) {
      expect((error as Error).message).to.include('<metadata>');
    }
  });

  it('round-trips through the builder in schema element order', async () => {
    const {extensions} = await parseObjectTypeExtensions(XML);
    const xml = buildObjectTypeExtensionsXml(extensions);
    expect(xml).to.match(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).to.include('xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31"');
    expect(xml).to.include('<display-name xml:lang="x-default">Fabric</display-name>');
    expect(xml).to.include('<type>set-of-string</type>');
    expect(xml).to.include('<attribute attribute-id="brand" system="true"/>');
    expect(xml.indexOf('system-attribute-definitions')).to.be.lessThan(xml.indexOf('custom-attribute-definitions'));
    expect(xml.indexOf('<type>set-of-string')).to.be.lessThan(xml.indexOf('<field-length>'));
    const reparsed = await parseObjectTypeExtensions(xml);
    expect(reparsed.extensions).to.deep.equal(extensions);
  });
});
