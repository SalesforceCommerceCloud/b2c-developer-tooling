# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(..., max_length=32, min_length=1)


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


class ResultBase(BaseModel):
    limit: int
    total: int = Field(..., ge=0)


class PaginatedResultBase(ResultBase):
    offset: int = Field(..., ge=0)
    limit: int
    total: int = Field(..., ge=0)


class Sort2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=256)
    sortOrder: SortOrder | None = "asc"


class CustomerListLink(BaseModel):
    customerListId: str | None = Field(None, max_length=256, min_length=1)
    title: str | None = Field(None, max_length=256)


class DisplayName(RootModel[str]):
    root: str = Field(..., max_length=4000)


class Description(RootModel[str]):
    root: str = Field(..., max_length=4000)


class StorefrontStatus(Enum):
    online = "online"
    maintenance = "maintenance"
    to_be_deleted = "to_be_deleted"
    protected = "protected"


class Site(BaseModel):
    id: str = Field(..., max_length=32, min_length=1)
    displayName: dict[str, DisplayName] | None = None
    description: dict[str, Description] | None = None
    customerListLink: CustomerListLink | None = None
    inDeletion: bool | None = None
    storefrontStatus: StorefrontStatus | None = None
    siteCatalogId: str | None = Field(None, max_length=256, min_length=1)
    cartridges: str | None = Field(None, max_length=4000)
    customCartridges: str | None = Field(None, max_length=4000)
    creationDate: AwareDatetime | None = None
    lastModified: AwareDatetime | None = None


class Hit(BaseModel):
    id: str = Field(..., max_length=32, min_length=1)
    displayName: dict[str, DisplayName] | None = None
    description: dict[str, Description] | None = None
    customerListLink: CustomerListLink | None = None
    inDeletion: bool | None = None
    storefrontStatus: StorefrontStatus | None = None
    siteCatalogId: str | None = Field(None, max_length=256, min_length=1)
    cartridges: str | None = Field(None, max_length=4000)
    customCartridges: str | None = Field(None, max_length=4000)
    creationDate: AwareDatetime | None = None
    lastModified: AwareDatetime | None = None


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(..., max_length=256)
    type: str = Field(..., max_length=2048)
    detail: str
    instance: str | None = Field(None, max_length=2048)


class Select(RootModel[str]):
    root: str = Field(..., min_length=1, pattern="^[(].*[)]$")


class Datum(BaseModel):
    id: str = Field(..., max_length=32, min_length=1)
    displayName: dict[str, DisplayName] | None = None
    description: dict[str, Description] | None = None
    customerListLink: CustomerListLink | None = None
    inDeletion: bool | None = None
    storefrontStatus: StorefrontStatus | None = None
    siteCatalogId: str | None = Field(None, max_length=256, min_length=1)
    cartridges: str | None = Field(None, max_length=4000)
    customCartridges: str | None = Field(None, max_length=4000)
    creationDate: AwareDatetime | None = None
    lastModified: AwareDatetime | None = None


class Sites(PaginatedResultBase):
    data: list[Datum]


class SiteCustomCartridges(BaseModel):
    customCartridges: str = Field(..., max_length=4000)


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


class SiteSearchRequest(SearchRequest):
    pass


class SiteSearchResult(PaginatedSearchResult):
    hits: list[Hit]
    query: Query


Query.model_rebuild()
Filter.model_rebuild()
