/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {
  collectXmlFiles,
  findBundledXmlSchema,
  getBundledXmlSchemas,
  readRootElement,
  resolveXmlSchema,
  validateXmlContent,
  validateXmlFile,
  validateXmlFiles,
  XmlSchemaLoadError,
} from '@salesforce/b2c-tooling-sdk/xml-validation';

const CATALOG_NS = 'http://www.demandware.com/xml/impex/catalog/2006-10-31';
const INVENTORY_NS = 'http://www.demandware.com/xml/impex/inventory/2007-05-31';
const CUSTOMER_NS = 'http://www.demandware.com/xml/impex/customer/2006-10-31';

const validCatalog = `<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns="${CATALOG_NS}" catalog-id="test-catalog">
  <header>
    <image-settings>
      <internal-location base-path="/"/>
      <view-types><view-type>large</view-type></view-types>
      <alt-pattern>\${productname}</alt-pattern>
      <title-pattern>\${productname}</title-pattern>
    </image-settings>
  </header>
  <product product-id="p1">
    <online-flag>true</online-flag>
  </product>
</catalog>
`;

const validInventory = `<?xml version="1.0" encoding="UTF-8"?>
<inventory xmlns="${INVENTORY_NS}">
  <inventory-list>
    <header list-id="inventory">
      <default-instock>false</default-instock>
    </header>
    <records>
      <record product-id="p1">
        <allocation>10</allocation>
      </record>
    </records>
  </inventory-list>
</inventory>
`;

function schemaWithPattern(pattern: string): string {
  return `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="code"><xs:simpleType><xs:restriction base="xs:string"><xs:pattern value="${pattern}"/></xs:restriction></xs:simpleType></xs:element>
</xs:schema>`;
}

describe('xml-validation', () => {
  let tmp: string;

  function write(name: string, contents: string): string {
    const file = path.join(tmp, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, contents);
    return file;
  }

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-xml-validation-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  describe('schemas', () => {
    it('lists every bundled document schema with its namespace and global elements', () => {
      const schemas = getBundledXmlSchemas();
      const catalog = schemas.find((s) => s.id === 'catalog');
      expect(catalog?.targetNamespace).to.equal(CATALOG_NS);
      expect(catalog?.rootElements).to.include('catalog');
      expect(schemas.map((s) => s.id)).to.not.include('xml');
      expect(schemas.length).to.be.greaterThan(50);
    });

    it('picks between schemas that share a namespace by root element', () => {
      expect(findBundledXmlSchema(INVENTORY_NS, 'inventory')?.id).to.equal('inventory');
      expect(findBundledXmlSchema(CUSTOMER_NS, 'customers')?.id).to.equal('customer');
      expect(findBundledXmlSchema(CUSTOMER_NS, 'customer-list')?.id).to.equal('customerlist2');
      expect(findBundledXmlSchema('urn:none', 'x')).to.equal(undefined);
    });

    it('resolves a schema ID or an .xsd path', () => {
      expect(resolveXmlSchema('catalog').path).to.match(/catalog\.xsd$/);
      const xsd = write('custom.xsd', '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>');
      expect(resolveXmlSchema('custom.xsd', tmp)).to.deep.equal({label: 'custom.xsd', path: xsd});
      expect(() => resolveXmlSchema('no-such-schema', tmp)).to.throw(/Unknown schema "no-such-schema"/);
    });

    it('finds the root element after the declaration, comments, PIs, and a DOCTYPE', () => {
      const doc = `﻿<?xml version="1.0"?>
<!-- a comment with <catalog> inside -->
<?pi data?>
<!DOCTYPE x [ <!ENTITY a "b"> ]>
<ns:catalog xmlns="urn:default" xmlns:ns='${CATALOG_NS}' attr="a > b">`;
      expect(readRootElement(Buffer.from(doc))).to.deep.equal({localName: 'catalog', namespace: CATALOG_NS});
      expect(readRootElement(Buffer.from('<root/>'))).to.deep.equal({localName: 'root'});
      expect(readRootElement(Buffer.from('<!-- unterminated'))).to.equal(undefined);
    });
  });

  describe('validateXmlFile', () => {
    it('passes a valid file, choosing the schema from the namespace', async () => {
      const result = await validateXmlFile(write('catalog.xml', validCatalog));
      expect(result).to.include({status: 'pass', valid: true, schema: 'catalog', rootElement: 'catalog'});
      expect(result.namespace).to.equal(CATALOG_NS);
      expect(result.errors).to.deep.equal([]);
    });

    it('validates a customer list against customerlist2, which shares the customer namespace', async () => {
      const list = `<?xml version="1.0" encoding="UTF-8"?>
<customer-list xmlns="${CUSTOMER_NS}" list-id="shoppers"><header/></customer-list>
`;
      const result = await validateXmlFile(write('customer-list.xml', list));
      expect(result).to.include({status: 'pass', schema: 'customerlist2', rootElement: 'customer-list'});
    });

    it('reports schema errors with line numbers', async () => {
      const file = write(
        'inventory.xml',
        validInventory.replace('<allocation>10</allocation>', '<allocation>ten</allocation>'),
      );
      const result = await validateXmlFile(file);
      expect(result).to.include({status: 'fail', valid: false, schema: 'inventory'});
      expect(result.errors).to.have.length.greaterThan(0);
      expect(result.errors[0]).to.include({severity: 'error', line: 9});
      expect(result.errors[0].message).to.include("'ten'");
    });

    it('reports well-formedness errors as fatal', async () => {
      const result = await validateXmlFile(write('broken.xml', validCatalog.replace('</product>', '</produc>')));
      expect(result.status).to.equal('fail');
      expect(result.errors[0]).to.include({severity: 'fatal'});
      expect(result.errors[0].line).to.be.greaterThan(0);
      expect(result.errors[0].column).to.be.a('number');
    });

    it('skips a well-formed file with an unknown namespace unless it was named explicitly', async () => {
      const file = write('other.xml', '<root xmlns="urn:example"/>');
      const skipped = await validateXmlFile(file);
      expect(skipped).to.include({status: 'skip', valid: false});
      expect(skipped.reason).to.include('urn:example');

      const explicit = await validateXmlFile(file, {}, true);
      expect(explicit.status).to.equal('fail');
      expect(explicit.reason).to.include('schema option');
    });

    it('fails a malformed file even when no schema applies', async () => {
      const result = await validateXmlFile(write('bad.xml', '<root><a></root>'));
      expect(result.status).to.equal('fail');
      expect(result.errors[0].severity).to.equal('fatal');
    });

    it('validates inline content, failing when no schema applies', async () => {
      const result = await validateXmlContent(validInventory);
      expect(result).to.include({status: 'pass', schema: 'inventory', filePath: '<content>'});
      const unknown = await validateXmlContent('<root xmlns="urn:example"/>');
      expect(unknown.status).to.equal('fail');
      expect(unknown.reason).to.include('urn:example');
    });

    it('fails a file that cannot be read', async () => {
      const result = await validateXmlFile(path.join(tmp, 'missing.xml'));
      expect(result.status).to.equal('fail');
      expect(result.reason).to.match(/Could not read file/);
    });

    it('validates against an explicit schema ID or a custom XSD', async () => {
      const file = write('inventory.xml', validInventory);
      const wrong = await validateXmlFile(file, {schema: 'catalog'});
      expect(wrong).to.include({status: 'fail', schema: 'catalog'});

      write(
        'schemas/types.xsd',
        `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
          <xs:simpleType name="code"><xs:restriction base="xs:string"><xs:pattern value="[A-Z]+"/></xs:restriction></xs:simpleType>
        </xs:schema>`,
      );
      const xsd = write(
        'schemas/main.xsd',
        `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
          <xs:include schemaLocation="types.xsd"/>
          <xs:element name="code" type="code"/>
        </xs:schema>`,
      );
      expect(await validateXmlFile(write('ok.xml', '<code>ABC</code>'), {schema: xsd})).to.include({status: 'pass'});
      expect(await validateXmlFile(write('no.xml', '<code>abc</code>'), {schema: xsd})).to.include({status: 'fail'});
    });

    it('recompiles a custom XSD after it changes', async () => {
      const xsd = write('codes.xsd', schemaWithPattern('[A-Z]+'));
      const doc = write('code.xml', '<code>abc</code>');
      expect((await validateXmlFile(doc, {schema: xsd})).status).to.equal('fail');
      fs.writeFileSync(xsd, schemaWithPattern('[a-z]+'));
      fs.utimesSync(xsd, new Date(), new Date(Date.now() + 5000));
      expect((await validateXmlFile(doc, {schema: xsd})).status).to.equal('pass');
    });

    it('throws XmlSchemaLoadError for an XSD that does not compile', async () => {
      const xsd = write('bad.xsd', '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element/></xs:schema>');
      const file = write('doc.xml', '<a/>');
      let error: unknown;
      try {
        await validateXmlFile(file, {schema: xsd});
      } catch (error_) {
        error = error_;
      }
      expect(error).to.be.instanceOf(XmlSchemaLoadError);
      expect((error as XmlSchemaLoadError).diagnostics).to.have.length.greaterThan(0);
    });
  });

  describe('security', () => {
    it('does not load external entities', async () => {
      const secret = write('secret.txt', 'top-secret');
      const file = write(
        'xxe.xml',
        `<?xml version="1.0"?>
<!DOCTYPE inventory [ <!ENTITY xxe SYSTEM "file://${secret}"> ]>
<inventory xmlns="${INVENTORY_NS}"><inventory-list><header list-id="&xxe;"/></inventory-list></inventory>`,
      );
      const result = await validateXmlFile(file);
      expect(result.status).to.equal('fail');
      expect(JSON.stringify(result)).to.not.include('top-secret');
    });

    it('does not fetch external DTDs', async () => {
      const file = write(
        'dtd.xml',
        `<?xml version="1.0"?>
<!DOCTYPE root SYSTEM "http://127.0.0.1:9/never.dtd">
<root xmlns="urn:example"/>`,
      );
      const result = await validateXmlFile(file);
      expect(result.status).to.equal('skip');
    });

    it('rejects exponential entity expansion', async () => {
      const entities = ['<!ENTITY a0 "lol">'];
      for (let i = 1; i <= 12; i++) entities.push(`<!ENTITY a${i} "${`&a${i - 1};`.repeat(10)}">`);
      const file = write(
        'bomb.xml',
        `<?xml version="1.0"?>\n<!DOCTYPE root [${entities.join('')}]>\n<root>&a12;</root>`,
      );
      const result = await validateXmlFile(file);
      expect(result.status).to.equal('fail');
      expect(result.errors[0].severity).to.equal('fatal');
    });
  });

  describe('collectXmlFiles and validateXmlFiles', () => {
    it('expands directories and globs, applies excludes, and reports unmatched inputs', async () => {
      const catalog = write('site/catalogs/catalog.xml', validCatalog);
      const inventory = write('site/inventory.xml', validInventory);
      write('site/node_modules/pkg/ignored.xml', '<x/>');
      write('site/excluded/skip.xml', '<x/>');
      write('site/readme.txt', 'not xml');

      const collected = await collectXmlFiles(['site', 'missing', '*.nothing'], {
        cwd: tmp,
        exclude: ['**/excluded/**'],
      });
      expect(collected.files).to.deep.equal([catalog, inventory].sort());
      expect(collected.explicitFiles.size).to.equal(0);
      expect(collected.unmatched).to.deep.equal(['missing', '*.nothing']);

      const globbed = await collectXmlFiles(['site/**/catalog.xml', 'site/inventory.xml'], {cwd: tmp});
      expect(globbed.files).to.deep.equal([catalog, inventory].sort());
      expect([...globbed.explicitFiles]).to.deep.equal([inventory]);
    });

    it('summarizes results and stops early with failFast', async () => {
      const files = [
        write('a.xml', '<a><b></a>'),
        write('b.xml', validCatalog),
        write('c.xml', '<root xmlns="urn:example"/>'),
      ];
      const seen: string[] = [];
      const summary = await validateXmlFiles(files, {onResult: (r) => seen.push(r.status)});
      expect(seen).to.deep.equal(['fail', 'pass', 'skip']);
      expect(summary).to.include({totalFiles: 3, validFiles: 1, failedFiles: 1, skippedFiles: 1});
      expect(summary.totalErrors).to.be.greaterThan(0);

      const fast = await validateXmlFiles(files, {failFast: true});
      expect(fast.totalFiles).to.equal(1);
    });
  });
});
