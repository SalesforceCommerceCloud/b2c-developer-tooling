/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {type WebDavFileSystemProvider, webdavPathToUri} from './webdav-fs-provider.js';
import type {WebDavMappingsProvider} from './webdav-mappings.js';
import type {WebDavTreeDataProvider, WebDavTreeItem} from './webdav-tree-provider.js';

export function registerWebDavCommands(
  _context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  treeProvider: WebDavTreeDataProvider,
  treeView: vscode.TreeView<WebDavTreeItem>,
  fsProvider: WebDavFileSystemProvider,
  mappingsProvider: WebDavMappingsProvider,
): vscode.Disposable[] {
  const refresh = registerSafeCommand('b2c-dx.webdav.refresh', () => {
    configProvider.reset();
  });

  const newFolder = registerSafeCommand('b2c-dx.webdav.newFolder', async (node: WebDavTreeItem) => {
    if (!node) return;

    const name = await vscode.window.showInputBox({
      title: 'New Folder',
      prompt: `Create directory under ${node.webdavPath}`,
      placeHolder: 'Folder name',
      validateInput: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return 'Enter a folder name';
        if (/[\\/:*?"<>|]/.test(trimmed)) return 'Name cannot contain \\ / : * ? " < > |';
        return null;
      },
    });
    if (!name) return;

    const fullPath = `${node.webdavPath}/${name.trim()}`;
    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Creating folder ${name.trim()}...`},
      async () => {
        try {
          await fsProvider.createDirectory(webdavPathToUri(fullPath));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Failed to create folder: ${message}`);
        }
      },
    );
  });

  const uploadFile = registerSafeCommand('b2c-dx.webdav.uploadFile', async (node: WebDavTreeItem) => {
    if (!node) return;

    const uris = await vscode.window.showOpenDialog({
      title: 'Select file to upload',
      canSelectFiles: true,
      canSelectMany: false,
      canSelectFolders: false,
    });
    if (!uris?.length) return;

    const uri = uris[0];
    const fileName = path.basename(uri.fsPath);
    const fullPath = `${node.webdavPath}/${fileName}`;

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Uploading ${fileName}...`},
      async () => {
        try {
          const content = fs.readFileSync(uri.fsPath);
          await fsProvider.writeFile(webdavPathToUri(fullPath), new Uint8Array(content), {
            create: true,
            overwrite: true,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Upload failed: ${message}`);
        }
      },
    );
  });

  const deleteItem = registerSafeCommand('b2c-dx.webdav.delete', async (node: WebDavTreeItem) => {
    if (!node) return;

    const detail = node.isCollection
      ? 'This directory and its contents will be deleted.'
      : 'This file will be deleted.';
    const choice = await vscode.window.showWarningMessage(
      `Delete "${node.fileName}"? ${detail}`,
      {modal: true},
      'Delete',
      'Cancel',
    );
    if (choice !== 'Delete') return;

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Deleting ${node.fileName}...`},
      async () => {
        try {
          await fsProvider.delete(webdavPathToUri(node.webdavPath));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Delete failed: ${message}`);
        }
      },
    );
  });

  const download = registerSafeCommand('b2c-dx.webdav.download', async (node: WebDavTreeItem) => {
    if (!node) return;

    const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri
      ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, node.fileName)
      : undefined;
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      saveLabel: 'Download',
    });
    if (!saveUri) return;

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Downloading ${node.fileName}...`},
      async () => {
        try {
          const content = await fsProvider.readFile(webdavPathToUri(node.webdavPath));
          await vscode.workspace.fs.writeFile(saveUri, content);
          vscode.window.showInformationMessage(`Downloaded to ${saveUri.fsPath}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Download failed: ${message}`);
        }
      },
    );
  });

  const openFile = registerSafeCommand('b2c-dx.webdav.openFile', async (node: WebDavTreeItem) => {
    if (!node) return;
    const uri = webdavPathToUri(node.webdavPath);
    await vscode.commands.executeCommand('vscode.open', uri);
  });

  const newFile = registerSafeCommand('b2c-dx.webdav.newFile', async (node: WebDavTreeItem) => {
    if (!node) return;

    const name = await vscode.window.showInputBox({
      title: 'New File',
      prompt: `Create file under ${node.webdavPath}`,
      placeHolder: 'File name',
      validateInput: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return 'Enter a file name';
        if (/[\\/:*?"<>|]/.test(trimmed)) return 'Name cannot contain \\ / : * ? " < > |';
        return null;
      },
    });
    if (!name) return;

    const fullPath = `${node.webdavPath}/${name.trim()}`;
    const uri = webdavPathToUri(fullPath);
    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Creating file ${name.trim()}...`},
      async () => {
        try {
          await fsProvider.writeFile(uri, new Uint8Array(0), {create: true, overwrite: false});
          await vscode.commands.executeCommand('vscode.open', uri);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Failed to create file: ${message}`);
        }
      },
    );
  });

  const mountWorkspace = registerSafeCommand('b2c-dx.webdav.mountWorkspace', (node: WebDavTreeItem) => {
    if (!node) return;
    const uri = webdavPathToUri(node.webdavPath);
    vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, {
      uri,
      name: `WebDAV: ${node.webdavPath}`,
    });
  });

  const addCatalog = registerSafeCommand('b2c-dx.webdav.addCatalog', async () => {
    const instance = configProvider.getInstance();

    // Try OCAPI discovery first
    let catalogChoices: string[] | undefined;
    if (instance) {
      try {
        const {data} = await instance.ocapi.GET('/catalogs', {
          params: {query: {select: '(**)', count: 200}},
        });
        catalogChoices = (data?.data?.map((c) => c.id).filter(Boolean) as string[]) ?? [];
      } catch {
        // OCAPI not available (no OAuth) — fall through to input box
      }
    }

    let id: string | undefined;
    if (catalogChoices?.length) {
      const existing = new Set(mappingsProvider.getCatalogIds());
      const available = catalogChoices.filter((c) => !existing.has(c));
      if (available.length) {
        id = await vscode.window.showQuickPick(available, {
          title: 'Add Catalog',
          placeHolder: 'Select a catalog to add',
        });
      }
    }

    // Fall back to manual entry if no quick pick or cancelled
    if (!id) {
      id = await vscode.window.showInputBox({
        title: 'Add Catalog',
        prompt: 'Enter the catalog ID',
        placeHolder: 'e.g., storefront-catalog-en',
        validateInput: (value: string) => {
          if (!value.trim()) return 'Enter a catalog ID';
          return null;
        },
      });
    }

    if (id) {
      mappingsProvider.addCatalog(id.trim());
    }
  });

  const removeCatalog = registerSafeCommand('b2c-dx.webdav.removeCatalog', (node: WebDavTreeItem) => {
    if (!node || node.nodeType !== 'catalog-mapping') return;
    mappingsProvider.removeCatalog(node.fileName);
  });

  const addLibrary = registerSafeCommand('b2c-dx.webdav.addLibrary', async () => {
    const id = await vscode.window.showInputBox({
      title: 'Add Library',
      prompt: 'Enter the library ID',
      placeHolder: 'e.g., SharedLibrary',
      validateInput: (value: string) => {
        if (!value.trim()) return 'Enter a library ID';
        return null;
      },
    });
    if (!id) return;

    mappingsProvider.addLibrary(id.trim());
  });

  const removeLibrary = registerSafeCommand('b2c-dx.webdav.removeLibrary', (node: WebDavTreeItem) => {
    if (!node || node.nodeType !== 'library-mapping') return;
    mappingsProvider.removeLibrary(node.fileName);
  });

  const revealLibrary = registerSafeCommand('b2c-dx.webdav.revealLibrary', async (libraryId: string) => {
    if (!libraryId) return;

    // Ensure library is in mappings
    if (!mappingsProvider.getLibraryIds().includes(libraryId)) {
      mappingsProvider.addLibrary(libraryId);
    }

    // Reveal the library-mapping node in the WebDAV tree
    const item = treeProvider.findItem('library-mapping', `Libraries/${libraryId}`);
    if (item) {
      try {
        await treeView.reveal(item, {focus: true, select: true, expand: true});
      } catch {
        // reveal can fail if the tree hasn't rendered yet; fall back to focus
        await vscode.commands.executeCommand('b2cWebdavExplorer.focus');
      }
    }
  });

  const revealPath = registerSafeCommand('b2c-dx.webdav.revealPath', async (webdavPath: string) => {
    if (!webdavPath) return;

    // Ensure the parent library is in mappings if this is a Libraries path
    const segments = webdavPath.split('/');
    if (segments[0] === 'Libraries' && segments.length >= 2) {
      const libraryId = segments[1];
      if (!mappingsProvider.getLibraryIds().includes(libraryId)) {
        mappingsProvider.addLibrary(libraryId);
      }
    }

    // Determine node type from the path
    const item = treeProvider.findItem('file', webdavPath);
    if (item) {
      try {
        await treeView.reveal(item, {focus: true, select: true});
      } catch {
        await vscode.commands.executeCommand('b2cWebdavExplorer.focus');
      }
    }
  });

  return [
    refresh,
    newFolder,
    newFile,
    uploadFile,
    deleteItem,
    download,
    openFile,
    mountWorkspace,
    addCatalog,
    removeCatalog,
    addLibrary,
    removeLibrary,
    revealLibrary,
    revealPath,
  ];
}
