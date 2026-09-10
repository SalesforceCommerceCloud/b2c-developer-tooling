# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any

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


class Values(RootModel[str]):
    root: str = Field(..., max_length=256)


class RoleModulePermission(BaseModel):
    name: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    application: str = Field(..., max_length=256, min_length=1)
    system: bool | None = None
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class OrganizationItem(BaseModel):
    name: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    application: str = Field(..., max_length=256, min_length=1)
    system: bool | None = None
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class SiteItem(BaseModel):
    name: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    application: str = Field(..., max_length=256, min_length=1)
    system: bool | None = None
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class RoleModulePermissions(BaseModel):
    organization: list[OrganizationItem] | None = None
    site: list[SiteItem] | None = None


class RoleFunctionalPermission(BaseModel):
    name: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class OrganizationItem1(BaseModel):
    name: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class SiteItem1(BaseModel):
    name: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class RoleFunctionalPermissions(BaseModel):
    organization: list[OrganizationItem1] | None = None
    site: list[SiteItem1] | None = None


class LanguageCountry(RootModel[str]):
    root: str = Field(..., pattern="^[a-z][a-z]-[A-Z][A-Z]$")


class LanguageCode(RootModel[str]):
    root: str = Field(..., pattern="^[a-z][a-z]$")


class DefaultFallback(RootModel[str]):
    root: str = Field("default", pattern="^default$")


class RoleLocalePermission(BaseModel):
    localeId: LanguageCountry | LanguageCode | DefaultFallback
    type: str = Field(..., max_length=256, min_length=1)
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class UnscopedItem(BaseModel):
    localeId: LanguageCountry | LanguageCode | DefaultFallback
    type: str = Field(..., max_length=256, min_length=1)
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class RoleLocalePermissions(BaseModel):
    unscoped: list[UnscopedItem] | None = None


class RoleWebdavPermission(BaseModel):
    folder: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class UnscopedItem1(BaseModel):
    folder: str = Field(..., max_length=256, min_length=1)
    type: str = Field(..., max_length=256, min_length=1)
    value: str | None = Field(None, max_length=256)
    values: dict[str, Values] | None = None


class RoleWebdavPermissions(BaseModel):
    unscoped: list[UnscopedItem1] | None = None


class RolePermissions(BaseModel):
    module: RoleModulePermissions | None = None
    functional: RoleFunctionalPermissions | None = None
    locale: RoleLocalePermissions | None = None
    webdav: RoleWebdavPermissions | None = None


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


class User1(BaseModel):
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


class Role1(BaseModel):
    id: str | None = Field(None, max_length=256, min_length=1)
    description: str | None = Field(None, max_length=4000)
    userCount: int | None = None
    userManager: bool | None = None
    permissions: RolePermissions | None = None
    users: list[User1] | None = None


class Role3(RootModel[str]):
    root: str = Field(..., max_length=256)


class User2(BaseModel):
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
    roles: list[Role3] | None = None


class Datum(BaseModel):
    id: str | None = Field(None, max_length=256, min_length=1)
    description: str | None = Field(None, max_length=4000)
    userCount: int | None = None
    userManager: bool | None = None
    permissions: RolePermissions | None = None
    users: list[User2] | None = None


class RoleSearch(PaginatedResultBase):
    data: list[Datum]


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(..., max_length=256)
    type: str = Field(..., max_length=2048)
    detail: str
    instance: str | None = Field(None, max_length=2048)


class Operator(Enum):
    and_ = "and"
    or_ = "or"
    not_ = "not"


class FieldModel(RootModel[str]):
    root: str = Field(..., max_length=260)


class FilterMode(Enum):
    overlap = "overlap"
    containing = "containing"
    contained = "contained"


class Range2Filter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    filterMode: FilterMode | None = "overlap"
    fromField: str = Field(..., max_length=260)
    fromInclusive: bool | None = True
    fromValue: Any | None = None
    toField: str = Field(..., max_length=260)
    toInclusive: bool | None = True
    toValue: Any | None = None


class RangeFilter(BaseModel):
    field: str = Field(..., max_length=260)
    from_: AwareDatetime | int | float | None = Field(None, alias="from")
    fromInclusive: bool | None = True
    to: AwareDatetime | int | float | None = None
    toInclusive: bool | None = True


class Operator1(Enum):
    is_ = "is"
    one_of = "one_of"
    is_null = "is_null"
    is_not_null = "is_not_null"
    less = "less"
    greater = "greater"
    not_in = "not_in"
    neq = "neq"


class TermFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=260)
    operator: Operator1
    values: list[str] | None = None


class MatchAllQuery(BaseModel):
    pass


class ScoreMode(Enum):
    avg = "avg"
    total = "total"
    max = "max"
    none = "none"


class TermQuery(BaseModel):
    fields: list[FieldModel] = Field(..., min_length=1)
    operator: Operator1
    values: list[str | float | bool | int] | None = None


class TextQuery(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    fields: list[FieldModel] = Field(..., min_length=1)
    searchPhrase: str


class SortOrder(Enum):
    asc = "asc"
    desc = "desc"


class Sort(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=256)
    sortOrder: SortOrder | None = "asc"


class Sort1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=256)
    sortOrder: SortOrder | None = "asc"


class Sort2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=256)
    sortOrder: SortOrder | None = "asc"


class Hit(BaseModel):
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
    roles: list[Role3] | None = None


class Datum1(BaseModel):
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
    roles: list[Role3] | None = None


class UserSearch(PaginatedResultBase):
    data: list[Datum1]


class Query(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    boolQuery: BoolQuery | None = None
    filteredQuery: FilteredQuery | None = None
    matchAllQuery: MatchAllQuery | None = None
    nestedQuery: NestedQuery | None = None
    termQuery: TermQuery | None = None
    textQuery: TextQuery | None = None


class BoolQuery(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    must: list[Query] | None = None
    mustNot: list[Query] | None = None
    should: list[Query] | None = None


class Filter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    boolFilter: BoolFilter | None = None
    queryFilter: QueryFilter | None = None
    range2Filter: Range2Filter | None = None
    rangeFilter: RangeFilter | None = None
    termFilter: TermFilter | None = None


class BoolFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    filters: list[Filter] | None = None
    operator: Operator


class QueryFilter(BaseModel):
    query: Query


class FilteredQuery(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    filter: Filter
    query: Query


class NestedQuery(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    path: str = Field(..., max_length=2048)
    query: Query
    scoreMode: ScoreMode | None = None


class SearchRequest(BaseModel):
    limit: int | None = Field(None, ge=1, le=200)
    query: Query
    sorts: list[Sort1] | None = None
    offset: int | None = Field(0, ge=0)


class PaginatedSearchResult(PaginatedResultBase):
    model_config = ConfigDict(
        extra="forbid",
    )
    query: Query
    sorts: list[Sort2] | None = None
    hits: list[dict[str, Any]] | None = None


class RoleUserSearchRequest(SearchRequest):
    pass


class RoleUserSearchResult(PaginatedSearchResult):
    hits: list[Hit]
    query: Query


Query.model_rebuild()
Filter.model_rebuild()
