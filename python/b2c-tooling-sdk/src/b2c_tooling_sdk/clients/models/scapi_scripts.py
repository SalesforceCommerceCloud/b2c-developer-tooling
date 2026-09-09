# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(..., max_length=32, min_length=1)


class ResultBase(BaseModel):
    limit: int
    total: int = Field(..., ge=0)


class Cartridge(RootModel[str]):
    root: str = Field(..., max_length=256)


class CodeVersion(BaseModel):
    id: str | None = Field(None, max_length=256, min_length=1)
    active: bool | None = None
    cartridges: list[Cartridge] | None = None
    compatibilityMode: str | None = Field(None, max_length=100)
    activationTime: AwareDatetime | None = None
    lastModificationTime: AwareDatetime | None = None
    rollback: bool | None = None
    totalSize: int | None = None
    webDavUrl: str | None = Field(None, max_length=4000)


class Datum(BaseModel):
    id: str | None = Field(None, max_length=256, min_length=1)
    active: bool | None = None
    cartridges: list[Cartridge] | None = None
    compatibilityMode: str | None = Field(None, max_length=100)
    activationTime: AwareDatetime | None = None
    lastModificationTime: AwareDatetime | None = None
    rollback: bool | None = None
    totalSize: int | None = None
    webDavUrl: str | None = Field(None, max_length=4000)


class CodeVersionResult(ResultBase):
    data: list[Datum] | None = None


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(..., max_length=256)
    type: str = Field(..., max_length=2048)
    detail: str
    instance: str | None = Field(None, max_length=2048)
