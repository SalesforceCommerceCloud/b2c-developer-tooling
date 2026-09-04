# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from pydantic import BaseModel, Field, RootModel


class Instance(RootModel[str]):
    root: str = Field(..., description="List of B2C Commerce instances.", max_length=8)


class APIB2COrgInfo(BaseModel):
    is_b2c_customer: bool = Field(
        ...,
        description="Specifies whether the organization is a B2C customer account. Returns true if the organization is a B2C customer account. Returns false if the organization isn't a B2C customer account.",
    )
    instances: list[Instance]


class Site(RootModel[str]):
    root: str = Field(
        ...,
        description="List of site IDs associated with the B2C Commerce instance",
        max_length=32,
    )


class APIB2CTargetInfo(BaseModel):
    instance_id: str = Field(
        ...,
        description="ID of the B2C Commerce instance associated with the target",
        max_length=8,
    )
    sites: list[Site] | None = None


class PatchedAPIB2CTargetInfo(BaseModel):
    instance_id: str | None = Field(
        None,
        description="ID of the B2C Commerce instance associated with the target",
        max_length=8,
    )
    sites: list[Site] | None = None
