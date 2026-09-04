# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Scope(Enum):
    """
    Scope level of the role (global or instance-specific).
    """

    GLOBAL = "GLOBAL"
    INSTANCE = "INSTANCE"


class TargetType(Enum):
    """
    Type of entity the role can be assigned to.
    """

    ApiClient = "ApiClient"
    User = "User"


class Role(BaseModel):
    """
    A role defines permissions and access levels that can be assigned to Users and API Clients.
    """

    description: str | None = Field(None, description="Description of the role.")
    roleEnumName: str | None = Field(
        None, description="Enumeration name of the role.", max_length=50, min_length=0
    )
    permissions: list[str] | None = Field(
        None, description="List of permissions granted by this role."
    )
    scope: Scope | None = Field(
        None, description="Scope level of the role (global or instance-specific)."
    )
    targetType: TargetType | None = Field(
        None, description="Type of entity the role can be assigned to."
    )
    twoFAEnabled: bool | None = Field(
        None,
        description="Indicates if two-factor authentication is required for the role.",
    )
    id: str | None = Field(None, description="Unique identifier of the role.")


class RoleCollection(BaseModel):
    """
    A paginated collection of roles.
    """

    content: list[Role] | None = None


class Pageable(BaseModel):
    """
    Pagination parameters for list operations.
    """

    page: int | None = Field(None, description="Zero-based page index.", ge=0)
    size: int | None = Field(
        20, description="Number of items to return per page.", ge=1, le=4000
    )


class FieldError(BaseModel):
    field: str | None = Field(
        None, description="The field that contained the erroneous value"
    )
    rejectedValue: dict[str, Any] | None = Field(
        None, description="The value that was rejected"
    )
    bindingFailure: bool | None = Field(
        None,
        description="Whether this error was caused by failed binding (e.g. type mismatch)",
    )


class Error(BaseModel):
    message: str | None = Field(None, description="Error message")
    code: str | None = Field(None, description="Error code")
    fieldErrors: list[FieldError] | None = Field(
        None, description="Field-specific errors"
    )


class ErrorResponse(BaseModel):
    """
    Standard error response format returned when API requests fail.
    """

    errors: list[Error] | None = Field(None, description="The list of errors")
