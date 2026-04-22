/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';

/**
 * Recursively adds directory contents to a JSZip folder.
 */
export async function addDirectoryToZip(zipFolder: JSZip, dirPath: string): Promise<void> {
  const entries = await fs.promises.readdir(dirPath, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subFolder = zipFolder.folder(entry.name)!;
      await addDirectoryToZip(subFolder, fullPath);
    } else if (entry.isFile()) {
      const content = await fs.promises.readFile(fullPath);
      zipFolder.file(entry.name, content);
    }
  }
}
