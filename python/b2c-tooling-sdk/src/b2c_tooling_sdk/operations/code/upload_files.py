# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Batch file upload/delete pipeline used by cartridge watching.

Mirrors ``src/operations/code/upload-files.ts``. This is the core batch-upload
pipeline used by both :func:`~b2c_tooling_sdk.operations.code.watch.watch_cartridges`
and (in the TypeScript SDK) the VS Code extension.
"""

from __future__ import annotations

import io
import os
import time
import zipfile
from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING
from urllib.parse import urlencode

from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.code.cartridges import CartridgeMapping

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

_UNZIP_BODY = urlencode({"method": "UNZIP"})


@dataclass
class FileChange:
    """A file to upload or delete, with source and destination paths."""

    #: Absolute path to the file on disk.
    src: str
    #: Cartridge-relative destination path (e.g. ``"cartridgeName/path/to/file.js"``).
    dest: str


@dataclass
class UploadFilesOptions:
    """Callbacks for file upload/delete operations."""

    #: Called after files are successfully uploaded.
    on_upload: Callable[[list[str]], None] | None = None
    #: Called after files are successfully deleted.
    on_delete: Callable[[list[str]], None] | None = None
    #: Called when an error occurs.
    on_error: Callable[[Exception], None] | None = None


def file_to_cartridge_path(absolute_path: str, cartridges: list[CartridgeMapping]) -> FileChange | None:
    """Map an absolute file path to its cartridge-relative destination.

    :param absolute_path: The absolute path to a file.
    :param cartridges: The list of discovered cartridge mappings.
    :returns: The file change with ``src``/``dest``, or ``None`` if the path is
        not inside any cartridge.
    """
    cartridge = next((c for c in cartridges if absolute_path.startswith(c.src)), None)
    if cartridge is None:
        return None

    relative_path = absolute_path[len(cartridge.src) :]
    # Node's path.join tolerates a leading separator on the second segment;
    # os.path.join does not (it would discard cartridge.dest entirely), so
    # strip it first.
    dest_path = os.path.join(cartridge.dest, relative_path.lstrip(os.sep))

    return FileChange(src=absolute_path, dest=dest_path)


async def upload_files(
    instance: B2CInstance,
    code_version: str,
    uploads: list[FileChange],
    deletes: list[FileChange],
    options: UploadFilesOptions | None = None,
) -> None:
    """Upload and delete files on an instance via WebDAV.

    1. Filters out non-existent upload files.
    2. Creates a ZIP archive of upload files.
    3. Uploads via WebDAV PUT and unzips on the server.
    4. Deletes files (skipping any that were also uploaded in the same batch).
    """
    logger = get_logger("operations.code")
    webdav = instance.webdav
    webdav_location = f"Cartridges/{code_version}"
    opts = options or UploadFilesOptions()

    valid_upload_files: list[FileChange] = []
    for f in uploads:
        if not os.path.exists(f.src):
            logger.debug("Skipping missing file %s", f.src)
            continue
        valid_upload_files.append(f)

    if valid_upload_files:
        upload_path = f"{webdav_location}/_upload-{round(time.time() * 1000)}.zip"

        try:
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=5) as zip_file:
                for f in valid_upload_files:
                    try:
                        with open(f.src, "rb") as fh:
                            content = fh.read()
                        zip_file.writestr(f.dest, content)
                    except OSError as error:
                        logger.warning("Failed to add file %s to archive: %s", f.src, error)

            await webdav.put(upload_path, buffer.getvalue(), "application/zip")
            logger.debug("Archive uploaded to %s", upload_path)

            response = await webdav.request(
                upload_path,
                method="POST",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                content=_UNZIP_BODY,
            )

            if not response.is_success:
                raise RuntimeError(f"Unzip failed: {response.status_code}")

            await webdav.delete(upload_path)

            logger.debug("Uploaded %d file(s) to %s", len(valid_upload_files), instance.config.hostname)

            if opts.on_upload:
                opts.on_upload([f.dest for f in valid_upload_files])
        except Exception as error:  # noqa: BLE001 - re-raised after notifying on_error
            err = error if isinstance(error, Exception) else RuntimeError(str(error))
            logger.error("Upload error: %s", err)
            if opts.on_error:
                opts.on_error(err)
            raise

    # Skip deletes for any file that was also uploaded in this batch (disk state wins).
    uploaded_paths = {f.dest for f in valid_upload_files}
    files_to_delete_filtered = [f for f in deletes if f.dest not in uploaded_paths]

    if files_to_delete_filtered:
        logger.debug("Deleting %d file(s)", len(files_to_delete_filtered))

        for f in files_to_delete_filtered:
            delete_path = f"{webdav_location}/{f.dest}"
            try:
                await webdav.delete(delete_path)
                logger.info("Deleted: %s", delete_path)
            except Exception as error:  # noqa: BLE001 - best-effort; file may not exist
                logger.debug("Failed to delete %s: %s", delete_path, error)

        if opts.on_delete:
            opts.on_delete([f.dest for f in files_to_delete_filtered])


__all__ = ["FileChange", "UploadFilesOptions", "file_to_cartridge_path", "upload_files"]
