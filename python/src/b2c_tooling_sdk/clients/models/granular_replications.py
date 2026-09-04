# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(
        ...,
        description="An identifier for the organization the request is being made by",
        examples=["f_ecom_zzxy_prd"],
        max_length=32,
        min_length=1,
    )


class ResultBase(BaseModel):
    """
    Base type for results
    """

    total: int = Field(
        ...,
        description="The total number of hits that match the search's criteria. This can be greater than the number of results returned as search results are paginated.",
        examples=[10],
        ge=0,
    )
    limit: int


class ProductItem(BaseModel):
    """
    Details of the published product (only available if a product was published)
    """

    productId: str = Field(
        ...,
        description="The id (SKU) of the product.",
        examples=["apple-ipod-classic"],
        max_length=100,
        min_length=1,
    )


class PriceTableItem(BaseModel):
    """
    Details of the published price table (only available if a price table was published)
    """

    priceTableId: str = Field(
        ...,
        description="ID of the price table",
        examples=["usd-list-prices"],
        max_length=256,
    )


class Type(Enum):
    """
    The type of library (private) from which the content asset originates.
    """

    private = "private"


class ContentAssetItemPrivate(BaseModel):
    """
    Details of the published content asset from a private library
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    contentId: str = Field(
        ...,
        description="ID of the content asset",
        examples=["homepage-hero-banner"],
        max_length=256,
    )
    type: Type = Field(
        ...,
        description="The type of library (private) from which the content asset originates.",
        examples=["private"],
    )
    siteId: str = Field(
        ..., description="The site ID", examples=["RefArch"], max_length=256
    )


class Type1(Enum):
    """
    The type of library (shared) from which the content asset originates.
    """

    shared = "shared"


class ContentAssetItemShared(BaseModel):
    """
    Details of the published content asset from a shared library
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    contentId: str = Field(
        ...,
        description="ID of the content asset",
        examples=["homepage-hero-banner"],
        max_length=256,
    )
    type: Type1 = Field(
        ...,
        description="The type of library (shared) from which the content asset originates.",
        examples=["shared"],
    )
    libraryId: str = Field(
        ...,
        description="ID of the shared library",
        examples=["sharedLibrary"],
        max_length=256,
    )


class Status(Enum):
    """
    Status of the publish process
    """

    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


class ProductPublishRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    product: ProductItem


class PriceTablePublishRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    priceTable: PriceTableItem


class ContentAssetPublishRequest(BaseModel):
    contentAsset: ContentAssetItemPrivate | ContentAssetItemShared


class PublishItemRequest(
    RootModel[
        ProductPublishRequest | PriceTablePublishRequest | ContentAssetPublishRequest
    ]
):
    root: ProductPublishRequest | PriceTablePublishRequest | ContentAssetPublishRequest


class PublishIdResponse(BaseModel):
    """
    Item successfully queued for publishing
    """

    id: str = Field(
        ...,
        description="Publish process ID of the published item",
        examples=["xmRhi7394HymoeRkfwAAAZeg3WiM"],
        max_length=28,
    )


class ErrorResponse(BaseModel):
    """
    Standard error response following RFC 7807
    """

    type: str = Field(
        ...,
        description="A URI reference that identifies the problem type",
        examples=[
            "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/invalid-request-body"
        ],
        max_length=2048,
    )
    title: str = Field(
        ...,
        description="A short, human-readable summary of the problem type",
        examples=["NotEnoughMoney"],
    )
    detail: str | None = Field(
        None,
        description="A human-readable explanation specific to this occurrence of the problem.",
        examples=["Your current balance is 30, but that costs 50"],
    )
    instance: str | None = Field(
        None,
        description="A URI reference that identifies the specific occurrence of the problem",
        examples=["/account/12345/msgs/abc"],
        max_length=2048,
    )


class PublishProcessResponse(BaseModel):
    """
    Publish process details
    """

    id: str = Field(
        ...,
        description="Publish process ID of the published item",
        examples=["xmRhi7394HymoeRkfwAAAZeg3WiM"],
        max_length=28,
    )
    status: Status = Field(
        ..., description="Status of the publish process", examples=["completed"]
    )
    startTime: AwareDatetime = Field(
        ...,
        description="Timestamp at which the publish process was started",
        examples=["2024-03-15T10:30:00Z"],
        pattern="^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$",
    )
    endTime: AwareDatetime | None = Field(
        None,
        description='Timestamp at which the publish process was completed (only available if the status is "completed" or "failed")',
        examples=["2024-03-15T10:30:45Z"],
        pattern="^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$",
    )
    initiatedBy: str = Field(
        ...,
        description="User or ID of the client application that initiated the publish process",
        examples=["user@example.com"],
        max_length=256,
    )
    productItem: ProductItem | None = None
    priceTableItem: PriceTableItem | None = None
    contentAssetItem: ContentAssetItemPrivate | ContentAssetItemShared | None = None


class PublishProcessListResponse(ResultBase):
    """
    Paginated list of publish processes
    """

    data: list[PublishProcessResponse]
    offset: int = Field(
        ...,
        description="The offset for the search results (pagination).",
        examples=[0],
        ge=0,
    )
