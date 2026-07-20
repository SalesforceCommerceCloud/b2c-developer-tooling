/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as path from 'path';
import {fileURLToPath} from 'url';
import * as vscode from 'vscode';

const EXTENSION_ID = 'Salesforce.b2c-vs-extension';

// Resolves the fixture path from the compiled test location
// (out/test/integration/<file>.js -> src/test/fixtures/... under the source tree).
function fixtureFile(...segments: string[]): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', '..', 'src', 'test', 'fixtures', 'infer-usage-workspace', ...segments);
}

// Cartridge discovery + pushing config to the TypeScript Server plugin happens
// asynchronously after activation, and the plugin itself needs a moment to
// process it before hover/completion requests reflect the pushed cartridges.
// Poll instead of a single fixed sleep, which is both faster on a healthy run
// and more tolerant of a slow one.
async function waitFor<T>(check: () => Promise<T | undefined>, timeoutMs = 15000, intervalMs = 250): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result !== undefined) return result;
    } catch (e) {
      lastError = e;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`waitFor() timed out after ${timeoutMs}ms${lastError ? `; last error: ${String(lastError)}` : ''}`);
}

suite('scriptTypesInferUsage — real hover/completion via the VS Code language feature APIs', () => {
  let doc: vscode.TextDocument;
  let paramPosition: vscode.Position;
  let dotPosition: vscode.Position;

  suiteSetup(async function () {
    this.timeout(30000);

    // Cartridge discovery walks the open workspace root, not wherever this
    // file happens to live on disk — this suite needs the dedicated
    // infer-usage-workspace fixture open, not e.g. empty-workspace, for
    // isCartridgeFile() to ever let scriptTypesInferUsage run. Skip
    // gracefully rather than fail if some other .vscode-test.mjs label's
    // broad file glob picks this test up against the wrong workspace.
    const expectedRoot = fixtureFile();
    const openRoots = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
    if (!openRoots.includes(expectedRoot)) {
      this.skip();
    }

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} must be discoverable in the test host`);
    await ext!.activate();

    const uri = vscode.Uri.file(
      fixtureFile('cartridges', 'test_cartridge', 'cartridge', 'scripts', 'helpers', 'priceHelper.js'),
    );
    doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);

    const text = doc.getText();
    const paramOffset = text.indexOf('product)'); // `function getDisplayName(product)`
    assert.ok(paramOffset > -1, 'fixture must declare an undocumented `product` parameter');
    paramPosition = doc.positionAt(paramOffset);

    const probeOffset = text.indexOf('return product.getID()');
    assert.ok(probeOffset > -1, 'fixture must have a completionProbe with a `product.` trigger position');
    dotPosition = doc.positionAt(probeOffset + 'return product.'.length);
  });

  test('hover on the undocumented parameter shows an "Inferred from usage" note with the real dw.catalog.Product type', async () => {
    const hovers = await waitFor(async () => {
      const result = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        doc.uri,
        paramPosition,
      );
      const text = result?.flatMap((h) => h.contents.map((c) => (typeof c === 'string' ? c : c.value))).join('\n');
      return text?.includes('Inferred from usage') ? result : undefined;
    });

    const text = hovers.flatMap((h) => h.contents.map((c) => (typeof c === 'string' ? c : c.value))).join('\n');
    assert.ok(text.includes('Inferred from usage'), `expected an "Inferred from usage" hover note, got: ${text}`);
    assert.ok(/Product/.test(text), `expected the inferred type to mention Product, got: ${text}`);
  });

  test('completion after `product.` offers real dw.catalog.Product members', async () => {
    // Completions can settle on VS Code's own generic word-based suggestions
    // (every identifier token already in the document) before the plugin's
    // inferred entries are merged in — that response is non-empty too, so a
    // bare `items.length > 0` wait condition would resolve on it immediately
    // and never see the real completions. Wait for the actual members we
    // expect instead — and since `getID`/`getName` appear as words in the
    // fixture text (word-based suggestions could offer them on their own),
    // the condition also requires a Product member that appears nowhere in
    // any fixture document, which only inference can produce.
    const labels = await waitFor(async () => {
      const result = await vscode.commands.executeCommand<vscode.CompletionList>(
        'vscode.executeCompletionItemProvider',
        doc.uri,
        dotPosition,
      );
      const items = result?.items.map((i) => (typeof i.label === 'string' ? i.label : i.label.label)) ?? [];
      return items.includes('getID') && items.includes('getName') && items.includes('getLongDescription')
        ? items
        : undefined;
    }, 25000);

    // eslint-disable-next-line no-console
    console.log(`[diagnostic] ${labels.length} completion label(s): ${labels.join(', ')}`);
    assert.ok(labels.includes('getID'), `expected getID among completions, got: ${labels.join(', ')}`);
    assert.ok(labels.includes('getName'), `expected getName among completions, got: ${labels.join(', ')}`);
    assert.ok(
      labels.includes('getLongDescription'),
      `expected getLongDescription (absent from fixture text, so only inference can offer it), got: ${labels.join(', ')}`,
    );
  });
});

suite('scriptTypesInferUsage — SFRA-style cross-file and chain patterns', () => {
  let helpersDoc: vscode.TextDocument;

  suiteSetup(async function () {
    this.timeout(30000);

    const expectedRoot = fixtureFile();
    const openRoots = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
    if (!openRoots.includes(expectedRoot)) {
      this.skip();
    }

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} must be discoverable in the test host`);
    await ext!.activate();

    // Open the consumer first so its call sites are loaded into the project,
    // then the helpers module the tests hover/complete in. The fixture's
    // jsconfig.json puts both in one configured project either way — this
    // mirrors a developer with the controller and its helper open.
    const consumerUri = vscode.Uri.file(
      fixtureFile('cartridges', 'test_cartridge', 'cartridge', 'scripts', 'cartService.js'),
    );
    await vscode.workspace.openTextDocument(consumerUri);
    const helpersUri = vscode.Uri.file(
      fixtureFile('cartridges', 'test_cartridge', 'cartridge', 'scripts', 'helpers', 'productHelpers.js'),
    );
    helpersDoc = await vscode.workspace.openTextDocument(helpersUri);
    await vscode.window.showTextDocument(helpersDoc);
  });

  function positionOf(substring: string, offsetWithin = 0): vscode.Position {
    const idx = helpersDoc.getText().indexOf(substring);
    assert.ok(idx > -1, `fixture must contain: ${substring}`);
    return helpersDoc.positionAt(idx + offsetWithin);
  }

  async function waitForHoverMatching(position: vscode.Position, expected: RegExp): Promise<string> {
    return waitFor(async () => {
      const result = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        helpersDoc.uri,
        position,
      );
      const text = result?.flatMap((h) => h.contents.map((c) => (typeof c === 'string' ? c : c.value))).join('\n');
      return text && text.includes('Inferred from usage') && expected.test(text) ? text : undefined;
    }, 25000);
  }

  async function waitForCompletionsIncluding(position: vscode.Position, required: string[]): Promise<string[]> {
    return waitFor(async () => {
      const result = await vscode.commands.executeCommand<vscode.CompletionList>(
        'vscode.executeCompletionItemProvider',
        helpersDoc.uri,
        position,
      );
      const items = result?.items.map((i) => (typeof i.label === 'string' ? i.label : i.label.label)) ?? [];
      return required.every((name) => items.includes(name)) ? items : undefined;
    }, 25000);
  }

  test('infers a parameter type when the only call sites live in another file, reached via a ~/ cartridge require', async () => {
    // getSalePrice() is never called inside productHelpers.js — its call
    // sites are in cartService.js, linked through the plugin's own
    // `~/cartridge/...` module resolution and the SFRA-canonical
    // `module.exports = {name: name}` alias map. This exercises module
    // resolution, project-wide reference search, and inference together.
    const text = await waitForHoverMatching(positionOf('getSalePrice(product', 'getSalePrice('.length), /Product/);
    assert.ok(/Product/.test(text), `expected the inferred type to mention Product, got: ${text}`);
  });

  test('infers the chained type of an intermediate local variable (var priceModel = product.getPriceModel())', async () => {
    const text = await waitForHoverMatching(positionOf('priceModel.getPrice()'), /ProductPriceModel/);
    assert.ok(/ProductPriceModel/.test(text), `expected ProductPriceModel, got: ${text}`);
  });

  test('offers inferred completions after a chained receiver (product.getPriceModel().)', async () => {
    // Neither getMinPrice nor getMaxPrice appears as a word anywhere in the
    // fixture, so word-based suggestions cannot satisfy this — only the
    // plugin's synthesized ProductPriceModel members can.
    const labels = await waitForCompletionsIncluding(positionOf('.getPrice().getValue()', 1), [
      'getMinPrice',
      'getMaxPrice',
    ]);
    assert.ok(labels.includes('getMinPrice'), `expected getMinPrice among completions, got: ${labels.join(', ')}`);
    assert.ok(labels.includes('getMaxPrice'), `expected getMaxPrice among completions, got: ${labels.join(', ')}`);
  });

  test('infers through a deep property chain with a nullable middle step (availabilityModel.inventoryRecord)', async () => {
    // Product.availabilityModel -> ProductAvailabilityModel.inventoryRecord
    // is `ProductInventoryRecord | null` in the real dw types — the exact
    // shape that silently broke member lookup before nullability stripping.
    const text = await waitForHoverMatching(positionOf('inventoryRecord.ATS'), /ProductInventoryRecord/);
    assert.ok(/ProductInventoryRecord/.test(text), `expected ProductInventoryRecord, got: ${text}`);
  });

  test('offers inferred completions on the nullable chain variable (inventoryRecord.)', async () => {
    // getATS and perpetual appear nowhere in the fixture text.
    const labels = await waitForCompletionsIncluding(positionOf('inventoryRecord.ATS', 'inventoryRecord.'.length), [
      'getATS',
      'perpetual',
    ]);
    assert.ok(labels.includes('getATS'), `expected getATS among completions, got: ${labels.join(', ')}`);
    assert.ok(labels.includes('perpetual'), `expected perpetual among completions, got: ${labels.join(', ')}`);
  });
});
