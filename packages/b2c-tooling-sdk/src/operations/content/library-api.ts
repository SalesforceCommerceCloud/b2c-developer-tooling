/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Library content assets, folders and folder assignments through the SCAPI
 * Admin Experiences API (`experience/experiences/v1`), without a site
 * archive export or import.
 *
 * `libraryId` is a shared library ID or, for a site-private library, the
 * site ID. Platform behavior verified against a live instance:
 *
 * - These operations cover classic content assets only. Page Designer pages
 *   and components return 404 here; use `pushPage` or an archive export.
 * - There is no library-wide list or search. Walk from the `root` folder
 *   with {@link walkContentFolder}. Assets with no folder are not reachable.
 * - Localized fields (`name`, `description`, asset `online`/`searchable`) are
 *   locale maps such as `{"default": "Summer"}`. Folder `online` is a boolean.
 * - The folder GET needs `sfcc.experiences.rw`; read-only tokens get 403.
 * - PATCH merges the given fields. DELETE returns 204 even when the ID does
 *   not exist.
 * - An assignment with `default: true` sets the asset's
 *   `classificationFolderId`.
 *
 * @module operations/content/library-api
 */
import type {B2CInstance} from '../../instance/index.js';
import type {
  ExperienceContentAsset,
  ExperienceContentFolder,
  ExperienceContentFolderAssignment,
} from '../../clients/scapi-experiences.js';
import {
  experiencesContext,
  experiencesRequestFailure,
  experiencesUnavailable,
  READ_HEADERS,
  WRITE_HEADERS,
} from './experiences.js';

/** Page size for folder walks (spec maximum). */
const PAGE_SIZE = 200;

/** Sibling folders visited in parallel during a walk. */
const WALK_CONCURRENCY = 4;

/** Result of a create-or-replace (PUT). */
export interface LibraryPutResult<T> {
  /** `created` (201) or `updated` (200). */
  status: 'created' | 'updated';
  item: T;
}

/** A content asset or folder body. Custom attributes use `c_` keys. */
export type LibraryItemInput = Record<string, unknown>;

type Method = 'DELETE' | 'GET' | 'PATCH' | 'PUT';

interface CallOptions {
  method: Method;
  path: string;
  params: Record<string, string>;
  query?: Record<string, number>;
  body?: unknown;
  what: string;
}

/**
 * Runs one Experiences API library request. The openapi-fetch path generics
 * don't survive a shared helper, so the path is typed loosely here and each
 * public function documents its own response shape.
 */
async function call<T>(instance: B2CInstance, opts: CallOptions): Promise<{data: T; status: number}> {
  const {client, organizationId} = experiencesContext(instance);
  const request = {
    params: {path: {organizationId, ...opts.params}, ...(opts.query ? {query: opts.query} : {})},
    headers: opts.method === 'GET' ? READ_HEADERS : WRITE_HEADERS,
    ...(opts.body === undefined ? {} : {body: opts.body}),
  };
  const send = client[opts.method] as unknown as (
    path: string,
    init: typeof request,
  ) => Promise<{data?: T; error?: unknown; response: Response}>;
  let result;
  try {
    result = await send(opts.path, request);
  } catch (error) {
    throw experiencesUnavailable(error, undefined, opts.what);
  }
  if (!result.response.ok) throw experiencesRequestFailure(result.error, result.response, opts.what);
  return {data: result.data as T, status: result.response.status};
}

async function walk<T>(instance: B2CInstance, path: string, params: Record<string, string>, what: string) {
  const all: T[] = [];
  let offset = 0;
  for (;;) {
    const {data} = await call<{hits?: T[]; total?: number}>(instance, {
      method: 'GET',
      path,
      params,
      query: {limit: PAGE_SIZE, offset},
      what,
    });
    const hits = data?.hits ?? [];
    all.push(...hits);
    offset += hits.length;
    if (hits.length === 0 || offset >= (data?.total ?? 0)) break;
  }
  return all;
}

const CONTENT = '/organizations/{organizationId}/libraries/{libraryId}/content/{contentId}';
const FOLDER = '/organizations/{organizationId}/libraries/{libraryId}/folders/{folderId}';
const ASSIGNMENT = '/organizations/{organizationId}/libraries/{libraryId}/folder-assignments/{contentId}/{folderId}';

// ---------------------------------------------------------------------------
// Content assets
// ---------------------------------------------------------------------------

/**
 * Gets a content asset.
 *
 * @throws ExperiencesRequestError with status 404 when it does not exist (also for Page Designer pages)
 */
export async function getContentAsset(
  instance: B2CInstance,
  libraryId: string,
  contentId: string,
): Promise<ExperienceContentAsset> {
  const {data} = await call<ExperienceContentAsset>(instance, {
    method: 'GET',
    path: CONTENT,
    params: {libraryId, contentId},
    what: `Failed to get content asset ${contentId} in library ${libraryId}`,
  });
  return data;
}

/** Creates or replaces a content asset. */
export async function putContentAsset(
  instance: B2CInstance,
  libraryId: string,
  contentId: string,
  asset: LibraryItemInput,
): Promise<LibraryPutResult<ExperienceContentAsset>> {
  const {data, status} = await call<ExperienceContentAsset>(instance, {
    method: 'PUT',
    path: CONTENT,
    params: {libraryId, contentId},
    body: {...asset, id: contentId},
    what: `Failed to save content asset ${contentId} in library ${libraryId}`,
  });
  return {status: status === 201 ? 'created' : 'updated', item: data};
}

/** Changes the given fields of a content asset and keeps the rest. */
export async function patchContentAsset(
  instance: B2CInstance,
  libraryId: string,
  contentId: string,
  changes: LibraryItemInput,
): Promise<ExperienceContentAsset> {
  const {data} = await call<ExperienceContentAsset>(instance, {
    method: 'PATCH',
    path: CONTENT,
    params: {libraryId, contentId},
    body: changes,
    what: `Failed to update content asset ${contentId} in library ${libraryId}`,
  });
  return data;
}

/** Deletes a content asset. Succeeds even when it does not exist. */
export async function deleteContentAsset(instance: B2CInstance, libraryId: string, contentId: string): Promise<void> {
  await call(instance, {
    method: 'DELETE',
    path: CONTENT,
    params: {libraryId, contentId},
    what: `Failed to delete content asset ${contentId} in library ${libraryId}`,
  });
}

/** Lists the folders a content asset is assigned to. */
export async function getContentAssetFolders(
  instance: B2CInstance,
  libraryId: string,
  contentId: string,
): Promise<ExperienceContentFolder[]> {
  return walk<ExperienceContentFolder>(
    instance,
    `${CONTENT}/folders`,
    {libraryId, contentId},
    `Failed to list folders of content asset ${contentId}`,
  );
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

/**
 * Gets a content folder. Needs `sfcc.experiences.rw`, even though it is a read.
 *
 * @throws ExperiencesRequestError with status 404 when it does not exist
 */
export async function getContentFolder(
  instance: B2CInstance,
  libraryId: string,
  folderId: string,
): Promise<ExperienceContentFolder> {
  const {data} = await call<ExperienceContentFolder>(instance, {
    method: 'GET',
    path: FOLDER,
    params: {libraryId, folderId},
    what: `Failed to get folder ${folderId} in library ${libraryId}`,
  });
  return data;
}

/** Creates or replaces a content folder. Set `parentFolderId` (default `root`). */
export async function putContentFolder(
  instance: B2CInstance,
  libraryId: string,
  folderId: string,
  folder: LibraryItemInput,
): Promise<LibraryPutResult<ExperienceContentFolder>> {
  const {data, status} = await call<ExperienceContentFolder>(instance, {
    method: 'PUT',
    path: FOLDER,
    params: {libraryId, folderId},
    body: {parentFolderId: 'root', ...folder, id: folderId},
    what: `Failed to save folder ${folderId} in library ${libraryId}`,
  });
  return {status: status === 201 ? 'created' : 'updated', item: data};
}

/** Changes the given fields of a content folder and keeps the rest. */
export async function patchContentFolder(
  instance: B2CInstance,
  libraryId: string,
  folderId: string,
  changes: LibraryItemInput,
): Promise<ExperienceContentFolder> {
  const {data} = await call<ExperienceContentFolder>(instance, {
    method: 'PATCH',
    path: FOLDER,
    params: {libraryId, folderId},
    body: changes,
    what: `Failed to update folder ${folderId} in library ${libraryId}`,
  });
  return data;
}

/** Deletes a content folder. Succeeds even when it does not exist. */
export async function deleteContentFolder(instance: B2CInstance, libraryId: string, folderId: string): Promise<void> {
  await call(instance, {
    method: 'DELETE',
    path: FOLDER,
    params: {libraryId, folderId},
    what: `Failed to delete folder ${folderId} in library ${libraryId}`,
  });
}

/** Lists the direct sub-folders of a folder (`root` for top level). */
export async function listSubFolders(
  instance: B2CInstance,
  libraryId: string,
  folderId: string,
): Promise<ExperienceContentFolder[]> {
  return walk<ExperienceContentFolder>(
    instance,
    `${FOLDER}/sub-folders`,
    {libraryId, folderId},
    `Failed to list sub-folders of ${folderId}`,
  );
}

/** Lists the content assets assigned directly to a folder. */
export async function listFolderContent(
  instance: B2CInstance,
  libraryId: string,
  folderId: string,
): Promise<ExperienceContentAsset[]> {
  return walk<ExperienceContentAsset>(
    instance,
    `${FOLDER}/content`,
    {libraryId, folderId},
    `Failed to list content of folder ${folderId}`,
  );
}

/** A folder with its assets and sub-folders, from {@link walkContentFolder}. */
export interface ContentFolderNode {
  /** The folder. The starting folder is only `{id}`, because the walk does not fetch it (that needs the rw scope). */
  folder: ExperienceContentFolder | {id: string};
  content: ExperienceContentAsset[];
  folders: ContentFolderNode[];
}

/** Options for {@link walkContentFolder}. */
export interface WalkContentFolderOptions {
  /** Starting folder (default `root`). */
  folderId?: string;
  /** Maximum folder depth below the start (default unlimited). `0` lists only the start folder. */
  depth?: number;
  /** Include each folder's content assets (default `true`). */
  includeContent?: boolean;
}

/**
 * Walks a folder tree, listing sub-folders and (optionally) content assets of
 * each folder. The starting folder itself is not fetched, so the walk works
 * with the read-only scope.
 */
export async function walkContentFolder(
  instance: B2CInstance,
  libraryId: string,
  options: WalkContentFolderOptions = {},
): Promise<ContentFolderNode> {
  const includeContent = options.includeContent ?? true;
  const maxDepth = options.depth ?? Number.POSITIVE_INFINITY;

  const visit = async (folder: ContentFolderNode['folder'], depth: number): Promise<ContentFolderNode> => {
    const [content, subFolders] = await Promise.all([
      includeContent ? listFolderContent(instance, libraryId, folder.id) : Promise.resolve([]),
      depth < maxDepth ? listSubFolders(instance, libraryId, folder.id) : Promise.resolve([]),
    ]);
    const folders: ContentFolderNode[] = [];
    for (let i = 0; i < subFolders.length; i += WALK_CONCURRENCY) {
      const batch = subFolders.slice(i, i + WALK_CONCURRENCY);
      folders.push(...(await Promise.all(batch.map((sub) => visit(sub, depth + 1)))));
    }
    return {folder, content, folders};
  };

  return visit({id: options.folderId ?? 'root'}, 0);
}

// ---------------------------------------------------------------------------
// Folder assignments
// ---------------------------------------------------------------------------

/** Options for {@link assignContentToFolder}. */
export interface AssignContentOptions {
  /** Make this the asset's classification folder. */
  default?: boolean;
  /** Sort position within the folder. */
  position?: number;
}

/** Assigns a content asset to a folder (creates or replaces the assignment). */
export async function assignContentToFolder(
  instance: B2CInstance,
  libraryId: string,
  contentId: string,
  folderId: string,
  options: AssignContentOptions = {},
): Promise<ExperienceContentFolderAssignment> {
  const {data} = await call<ExperienceContentFolderAssignment>(instance, {
    method: 'PUT',
    path: ASSIGNMENT,
    params: {libraryId, contentId, folderId},
    body: {
      contentId,
      folderId,
      ...(options.default === undefined ? {} : {default: options.default}),
      ...(options.position === undefined ? {} : {position: options.position}),
    },
    what: `Failed to assign content asset ${contentId} to folder ${folderId}`,
  });
  return data;
}

/** Removes a content asset from a folder. Succeeds even when it was not assigned. */
export async function unassignContentFromFolder(
  instance: B2CInstance,
  libraryId: string,
  contentId: string,
  folderId: string,
): Promise<void> {
  await call(instance, {
    method: 'DELETE',
    path: ASSIGNMENT,
    params: {libraryId, contentId, folderId},
    what: `Failed to remove content asset ${contentId} from folder ${folderId}`,
  });
}
