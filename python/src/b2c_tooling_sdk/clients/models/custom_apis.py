# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(
        ...,
        description="An identifier for the organization the request is being made by",
        examples=["f_ecom_zzxy_prd"],
        max_length=32,
        min_length=1,
    )


class EndpointStatus(Enum):
    active = "active"
    not_registered = "not_registered"


class ResultBase(BaseModel):
    """
    Schema defining generic list result. Each response schema of a resource requiring a list response should extend this schema.
    Additionally it needs to be defined what data is returned.
    """

    limit: int = Field(
        ...,
        description="Maximum records to retrieve per request, not to exceed the maximum defined. A limit must be at least 1 so at least one record is returned (if any match the criteria).",
        examples=[10],
        ge=1,
    )
    total: int = Field(
        ...,
        description="The total number of hits that match the search's criteria. This can be greater than the number of results returned as search results are pagenated.",
        examples=[10],
        ge=0,
    )


class Status(Enum):
    active = "active"
    not_registered = "not_registered"


class CustomApiEndpointFilter(BaseModel):
    status: Status | None = Field(None, examples=["not_registered"])


class HttpMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    OPTIONS = "OPTIONS"
    HEAD = "HEAD"


class SecurityScheme(Enum):
    ShopperToken = "ShopperToken"
    AmOAuth2 = "AmOAuth2"


class CustomApiEndpoint(BaseModel):
    apiName: str | None = Field(None, examples=["loyalty-info"], pattern="^[a-z0-9-]+$")
    apiVersion: str | None = Field(None, examples=["v1"], max_length=100)
    cartridgeName: str | None = Field(None, examples=["test_bc_wapi"], pattern="^[a-zA-Z][a-zA-Z0-9_]*$")
    endpointPath: str | None = Field(None, examples=["/customers"], max_length=4000)
    errorReason: str | None = Field(None, examples=["API schema not found."], max_length=4000)
    httpMethod: HttpMethod | None = Field(None, examples=["GET"])
    id: str | None = Field(None, examples=["10bd7f2dc40ab7aede7f0d60e5c3a783"], max_length=36, min_length=36)
    implementationScript: str | None = Field(None, examples=["script.js"], max_length=100)
    operationId: str | None = Field(None, examples=["getLoyaltyInfo"], max_length=100)
    securityScheme: SecurityScheme | None = Field(None, examples=["ShopperToken"])
    schemaFile: str | None = Field(None, examples=["schema.yaml"], max_length=100)
    siteId: str | None = Field(
        None,
        description="The identifier of the site that a request is being made in the context of. Attributes might have site specific values, and some objects may only be assigned to specific sites",
        examples=["RefArch"],
        max_length=32,
        min_length=1,
    )
    status: EndpointStatus | None = None


class CustomApiEndpointResult(ResultBase):
    filter: CustomApiEndpointFilter | None = None
    data: list[CustomApiEndpoint] | None = None
    activeCodeVersion: str | None = Field(None, examples=["version1"], max_length=100, min_length=1)


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(
        ...,
        description="A short, human-readable summary of the problem\ntype.  It will not change from occurrence to occurrence of the \nproblem, except for purposes of localization\n",
        examples=["You do not have enough credit"],
        max_length=256,
    )
    type: str = Field(
        ...,
        description='A URI reference [RFC3986] that identifies the\nproblem type.  This specification encourages that, when\ndereferenced, it provide human-readable documentation for the\nproblem type (e.g., using HTML [W3C.REC-html5-20141028]).  When\nthis member is not present, its value is assumed to be\n"about:blank". It accepts relative URIs; this means\nthat they must be resolved relative to the document\'s base URI, as\nper [RFC3986], Section 5.\n',
        examples=["NotEnoughMoney"],
        max_length=2048,
    )
    detail: str = Field(
        ...,
        description="A human-readable explanation specific to this occurrence of the problem.",
        examples=["Your current balance is 30, but that costs 50"],
    )
    instance: str | None = Field(
        None,
        description="A URI reference that identifies the specific\noccurrence of the problem.  It may or may not yield further\ninformation if dereferenced.  It accepts relative URIs; this means\nthat they must be resolved relative to the document's base URI, as\nper [RFC3986], Section 5.\n",
        examples=["/account/12345/msgs/abc"],
        max_length=2048,
    )
