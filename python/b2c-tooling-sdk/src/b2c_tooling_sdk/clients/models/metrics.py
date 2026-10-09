# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class DataPoint(BaseModel):
    timestamp: int = Field(..., ge=0)
    value: float


class DataSeries(BaseModel):
    id: str = Field(..., max_length=200, min_length=1)
    name: str = Field(..., max_length=200, min_length=1)
    data: list[DataPoint]


class Metric(BaseModel):
    metricId: str = Field(..., max_length=100, min_length=1, pattern="^[a-zA-Z0-9_-]+$")
    title: str = Field(..., max_length=200, min_length=1)
    description: str = Field(..., max_length=500, min_length=1)
    unit: str | None = Field(None, max_length=50, min_length=0)
    dataSeries: list[DataSeries]


class MetricsDataResponse(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    data: list[Metric]


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(..., max_length=256)
    type: str = Field(..., max_length=2048)
    detail: str
    instance: str | None = Field(None, max_length=2048)


class InvalidTimeParameterErrorResponse(ErrorResponse):
    parameter: str = Field(..., max_length=100)


class InvalidTimeRangeErrorResponse(ErrorResponse):
    fromValue: int
    toValue: int


class CategoryNotFoundErrorResponse(ErrorResponse):
    category: str | None = Field(None, max_length=50)
    organizationId: str | None = Field(None, pattern="^f_ecom_[a-z]{4}_(prd|stg|dev|s[0-9]{2}|[0-9]{3})$")


class MetricsNotAvailableErrorResponse(ErrorResponse):
    organizationId: str | None = Field(None, pattern="^f_ecom_[a-z]{4}_(prd|stg|dev|s[0-9]{2}|[0-9]{3})$")


class InvalidThirdPartyServiceErrorResponse(ErrorResponse):
    thirdPartyServiceId: str = Field(..., max_length=255, min_length=1)
    organizationId: str = Field(..., pattern="^f_ecom_[a-z]{4}_(prd|stg|dev|s[0-9]{2}|[0-9]{3})$")


class InvalidApiFilterErrorResponse(ErrorResponse):
    filterName: str = Field(..., max_length=100)
    filterValue: str = Field(..., max_length=100)
