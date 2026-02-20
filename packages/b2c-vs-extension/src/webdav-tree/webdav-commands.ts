/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type {WebDavConfigProvider} from './webdav-config.js';
import type {WebDavTreeDataProvider, WebDavTreeItem} from './webdav-tree-provider.js';

export function registerWebDavCommands(
  context: vscode.ExtensionContext,
  configProvider: WebDavConfigProvider,
  treeProvider: WebDavTreeDataProvider,
): vscode.Disposable[] {
  const refresh = vscode.commands.registerCommand('b2c-dx.webdav.refresh', () => {
    configProvider.reset();
    treeProvider.refresh();
  });

  const newFolder = vscode.commands.registerCommand('b2c-dx.webdav.newFolder', async (node: WebDavTreeItem) => {
    if (!node) return;
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('WebDAV: No B2C instance configured.');
      return;
    }

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
          await instance.webdav.mkcol(fullPath);
          treeProvider.refreshNode(node);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Failed to create folder: ${message}`);
        }
      },
    );
  });

  const uploadFile = vscode.commands.registerCommand('b2c-dx.webdav.uploadFile', async (node: WebDavTreeItem) => {
    if (!node) return;
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('WebDAV: No B2C instance configured.');
      return;
    }

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
          const ext = path.extname(fileName).toLowerCase();
          const mime: Record<string, string> = {
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.zip': 'application/zip',
            '.js': 'application/javascript',
            '.ts': 'application/typescript',
            '.html': 'text/html',
            '.css': 'text/css',
            '.txt': 'text/plain',
          };
          await instance.webdav.put(fullPath, content, mime[ext]);
          treeProvider.refreshNode(node);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Upload failed: ${message}`);
        }
      },
    );
  });

  const deleteItem = vscode.commands.registerCommand('b2c-dx.webdav.delete', async (node: WebDavTreeItem) => {
    if (!node) return;
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('WebDAV: No B2C instance configured.');
      return;
    }

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
          await instance.webdav.delete(node.webdavPath);
          // Refresh parent by refreshing the whole tree — the parent node
          // is not directly available from the child.
          treeProvider.refresh();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Delete failed: ${message}`);
        }
      },
    );
  });

  const download = vscode.commands.registerCommand('b2c-dx.webdav.download', async (node: WebDavTreeItem) => {
    if (!node) return;
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('WebDAV: No B2C instance configured.');
      return;
    }

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
          const buffer = await instance.webdav.get(node.webdavPath);
          await vscode.workspace.fs.writeFile(saveUri, new Uint8Array(buffer));
          vscode.window.showInformationMessage(`Downloaded to ${saveUri.fsPath}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Download failed: ${message}`);
        }
      },
    );
  });

  const openFile = vscode.commands.registerCommand('b2c-dx.webdav.openFile', async (node: WebDavTreeItem) => {
    if (!node) return;
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('WebDAV: No B2C instance configured.');
      return;
    }

    const previewDir = vscode.Uri.joinPath(context.globalStorageUri, 'webdav-preview');
    const tempFileUri = vscode.Uri.joinPath(previewDir, node.webdavPath);

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Opening ${node.fileName}...`},
      async () => {
        try {
          const buffer = await instance.webdav.get(node.webdavPath);
          // Ensure parent directories exist
          const parentDir = vscode.Uri.joinPath(tempFileUri, '..');
          await vscode.workspace.fs.createDirectory(parentDir);
          await vscode.workspace.fs.writeFile(tempFileUri, new Uint8Array(buffer));
          await vscode.commands.executeCommand('vscode.open', tempFileUri);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`WebDAV: Failed to open file: ${message}`);
        }
      },
    );
  });

  return [refresh, newFolder, uploadFile, deleteItem, download, openFile];
}
