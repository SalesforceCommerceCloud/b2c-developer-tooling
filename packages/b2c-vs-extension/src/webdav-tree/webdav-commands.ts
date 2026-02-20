/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type {WebDavConfigProvider} from './webdav-config.js';
import {type WebDavFileSystemProvider, WEBDAV_SCHEME, webdavPathToUri} from './webdav-fs-provider.js';
import type {WebDavTreeDataProvider, WebDavTreeItem} from './webdav-tree-provider.js';

export function registerWebDavCommands(
  _context: vscode.ExtensionContext,
  configProvider: WebDavConfigProvider,
  treeProvider: WebDavTreeDataProvider,
  fsProvider: WebDavFileSystemProvider,
): vscode.Disposable[] {
  const refresh = vscode.commands.registerCommand('b2c-dx.webdav.refresh', () => {
    fsProvider.clearCache();
    configProvider.reset();
    treeProvider.refresh();
  });

  const newFolder = vscode.commands.registerCommand('b2c-dx.webdav.newFolder', async (node: WebDavTreeItem) => {
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

  const uploadFile = vscode.commands.registerCommand('b2c-dx.webdav.uploadFile', async (node: WebDavTreeItem) => {
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

  const deleteItem = vscode.commands.registerCommand('b2c-dx.webdav.delete', async (node: WebDavTreeItem) => {
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

  const download = vscode.commands.registerCommand('b2c-dx.webdav.download', async (node: WebDavTreeItem) => {
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

  const openFile = vscode.commands.registerCommand('b2c-dx.webdav.openFile', async (node: WebDavTreeItem) => {
    if (!node) return;
    const uri = webdavPathToUri(node.webdavPath);
    await vscode.commands.executeCommand('vscode.open', uri);
  });

  const newFile = vscode.commands.registerCommand('b2c-dx.webdav.newFile', async (node: WebDavTreeItem) => {
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

  const mountWorkspace = vscode.commands.registerCommand('b2c-dx.webdav.mountWorkspace', () => {
    vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, {
      uri: vscode.Uri.parse(`${WEBDAV_SCHEME}:/`),
      name: 'B2C Commerce WebDAV',
    });
  });

  const unmountWorkspace = vscode.commands.registerCommand('b2c-dx.webdav.unmountWorkspace', () => {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const idx = folders.findIndex((f) => f.uri.scheme === WEBDAV_SCHEME);
    if (idx >= 0) {
      vscode.workspace.updateWorkspaceFolders(idx, 1);
    }
  });

  return [refresh, newFolder, newFile, uploadFile, deleteItem, download, openFile, mountWorkspace, unmountWorkspace];
}
