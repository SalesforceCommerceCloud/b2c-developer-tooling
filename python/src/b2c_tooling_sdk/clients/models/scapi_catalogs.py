# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class Catalog(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    id: str
    name: dict[str, str] | None = None
    description: dict[str, str] | None = None
    online: bool | None = None


class Catalogs(BaseModel):
    data: list[Catalog]
    limit: int
    offset: int
    total: int


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str
    type: str
    detail: str
    instance: str | None = None
