# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(
        ...,
        description="An identifier for the organization the request is being made by",
        examples=["f_ecom_zzxy_prd"],
        max_length=32,
        min_length=1,
    )


class SchemaStatus(Enum):
    current = "current"
    deprecated = "deprecated"


class ResultBase(BaseModel):
    """
    Schema defining generic list result. Each response schema of a resource requiring a list response should extend this schema.
    """

    limit: int = Field(
        ...,
        description="Maximum records to retrieve per request, not to exceed the maximum defined. A limit must be at least 1 so at least one record is returned (if any match the criteria).",
        examples=[10],
        ge=1,
    )
    total: int = Field(
        ...,
        description="The total number of hits that match the search's criteria. This can be greater than the number of results returned as search results are paginated.",
        examples=[10],
        ge=0,
    )


class SchemaListFilter(BaseModel):
    apiFamily: str | None = Field(None, examples=["shopper"])
    apiName: str | None = Field(None, examples=["products"])
    apiVersion: str | None = Field(None, examples=["v1"])
    status: SchemaStatus | None = None


class SchemaListItem(BaseModel):
    schemaVersion: str | None = Field(
        None, description='Semantic version of the schema (e.g., "1.0.0")', examples=["1.0.0"]
    )
    apiFamily: str | None = Field(None, description="The API family (e.g., shopper, admin)", examples=["shopper"])
    apiName: str | None = Field(None, description="The API name (e.g., products, orders)", examples=["products"])
    apiVersion: str | None = Field(None, description="The API version (e.g., v1)", examples=["v1"])
    status: SchemaStatus | None = None
    link: str | None = Field(
        None,
        description="URL to the schema detail endpoint",
        examples=["/organizations/f_ecom_zzxy_prd/schemas/shopper/products/v1"],
    )


class SchemaListResult(ResultBase):
    filter: SchemaListFilter | None = None
    data: list[SchemaListItem] | None = None


class Info(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str | None = None
    version: str | None = None
    description: str | None = None


class OpenApiSchema(BaseModel):
    """
    An OpenAPI 3.0 schema specification
    """

    model_config = ConfigDict(
        extra="allow",
    )
    openapi: str | None = Field(None, description="OpenAPI version", examples=["3.0.3"])
    info: Info | None = None
    paths: dict[str, Any] | None = None
    components: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(
        ...,
        description="A short, human-readable summary of the problem type.",
        examples=["Bad Request"],
        max_length=256,
    )
    type: str = Field(
        ...,
        description="A URI reference that identifies the problem type.",
        examples=["https://api.commercecloud.salesforce.com/documentation/error/v1/errors/bad-request"],
        max_length=2048,
    )
    detail: str = Field(
        ...,
        description="A human-readable explanation specific to this occurrence of the problem.",
        examples=["Invalid value for filter parameter."],
    )
    instance: str | None = Field(
        None, description="A URI reference that identifies the specific occurrence of the problem.", max_length=2048
    )
