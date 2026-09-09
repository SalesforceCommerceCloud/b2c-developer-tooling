# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from datetime import date

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(..., max_length=32, min_length=1)


class Select(RootModel[str]):
    root: str = Field(..., min_length=1, pattern="^[(].*[)]$")


class ResultBase(BaseModel):
    limit: int
    total: int = Field(..., ge=0)


class PaginatedResultBase(ResultBase):
    offset: int = Field(..., ge=0)
    limit: int
    total: int = Field(..., ge=0)


class LanguageCountry(RootModel[str]):
    root: str = Field(..., pattern="^[a-z][a-z]-[A-Z][A-Z]$")


class LanguageCode(RootModel[str]):
    root: str = Field(..., pattern="^[a-z][a-z]$")


class DefaultFallback(RootModel[str]):
    root: str = Field("default", pattern="^default$")


class Role(RootModel[str]):
    root: str = Field(..., max_length=256)


class User(BaseModel):
    login: str = Field(..., max_length=256, min_length=1)
    password: str | None = Field(None, max_length=256)
    email: str = Field(..., max_length=256)
    firstName: str | None = Field(None, max_length=256)
    lastName: str | None = Field(None, max_length=256)
    externalId: str | None = Field(None, max_length=256)
    disabled: bool | None = None
    locked: bool | None = None
    lastLoginDate: date | None = None
    passwordExpirationDate: AwareDatetime | None = None
    passwordModificationDate: AwareDatetime | None = None
    preferredDataLocale: LanguageCountry | LanguageCode | DefaultFallback | None = None
    preferredUiLocale: LanguageCountry | LanguageCode | DefaultFallback | None = None
    roles: list[Role] | None = None


class Datum(BaseModel):
    login: str = Field(..., max_length=256, min_length=1)
    password: str | None = Field(None, max_length=256)
    email: str = Field(..., max_length=256)
    firstName: str | None = Field(None, max_length=256)
    lastName: str | None = Field(None, max_length=256)
    externalId: str | None = Field(None, max_length=256)
    disabled: bool | None = None
    locked: bool | None = None
    lastLoginDate: date | None = None
    passwordExpirationDate: AwareDatetime | None = None
    passwordModificationDate: AwareDatetime | None = None
    preferredDataLocale: LanguageCountry | LanguageCode | DefaultFallback | None = None
    preferredUiLocale: LanguageCountry | LanguageCode | DefaultFallback | None = None
    roles: list[Role] | None = None


class UserSearch(PaginatedResultBase):
    data: list[Datum]


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(..., max_length=256)
    type: str = Field(..., max_length=2048)
    detail: str
    instance: str | None = Field(None, max_length=2048)


class UserUpdateRequest(BaseModel):
    email: str | None = Field(None, max_length=256)
    firstName: str | None = Field(None, max_length=256)
    lastName: str | None = Field(None, max_length=256)
    externalId: str | None = Field(None, max_length=256)
    preferredDataLocale: LanguageCountry | LanguageCode | DefaultFallback | None = None
    preferredUiLocale: LanguageCountry | LanguageCode | DefaultFallback | None = None
