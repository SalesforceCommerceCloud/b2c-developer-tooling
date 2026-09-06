# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any

from pydantic import AwareDatetime, BaseModel, Field


class TokenEndpointAuthMethod(Enum):
    """
    Enforced for OIDC flows.
    """

    private_key_jwt = "private_key_jwt"
    client_secret_post = "client_secret_post"
    client_secret_basic = "client_secret_basic"
    none = "none"


class Pageable(BaseModel):
    """
    Pagination parameters for list operations.
    """

    page: int | None = Field(None, description="Zero-based page index.", ge=0)
    size: int | None = Field(20, description="Number of items to return per page.", ge=1, le=4000)


class Scope(Enum):
    """
    Scope level of the role (global or instance-specific).
    """

    GLOBAL = "GLOBAL"
    INSTANCE = "INSTANCE"


class TargetType(Enum):
    """
    Type of entity this role can be assigned to.
    """

    ApiClient = "ApiClient"
    User = "User"


class Role(BaseModel):
    """
    A role defines permissions and access levels that can be assigned to Users and API Clients.
    """

    description: str | None = Field(None, description="Description of the role.")
    roleEnumName: str | None = Field(None, description="Enumeration name of the role.", max_length=50, min_length=0)
    permissions: list[str] | None = Field(None, description="List of permissions granted by this role.")
    scope: Scope | None = Field(None, description="Scope level of the role (global or instance-specific).")
    targetType: TargetType | None = Field(None, description="Type of entity this role can be assigned to.")
    twoFAEnabled: bool | None = Field(
        None, description="Indicates if two-factor authentication is required for this role."
    )
    id: str | None = Field(None, description="Unique identifier of the role.")


class Type(Enum):
    """
    Type of organization.
    """

    CUSTOMER = "CUSTOMER"
    PARTNER = "PARTNER"
    INTERNAL = "INTERNAL"


class SfIdentityFederation(Enum):
    """
    Salesforce identity federation status.
    """

    DISABLED = "DISABLED"
    ENABLED = "ENABLED"


class Organization(BaseModel):
    """
    An organization represents a customer, partner, or internal entity within the Account Manager system.
    """

    name: str | None = Field(None, description="Name of the organization.")
    contactUsers: list[str] | None = Field(None, description="List of contact user IDs.")
    realms: list[str] | None = Field(None, description="List of realm identifiers.")
    passwordMinEntropy: int | None = Field(None, description="Minimum password entropy requirement.")
    passwordHistorySize: int | None = Field(None, description="Number of previous passwords to remember.")
    passwordDaysExpiration: int | None = Field(None, description="Number of days until password expires.")
    sfAccountIds: list[str] | None = Field(None, description="Salesforce account identifiers.")
    type: Type | None = Field(None, description="Type of organization.")
    twoFARoles: list[str] | None = Field(None, description="List of role IDs that require two-factor authentication.")
    twoFAEnabled: bool | None = Field(
        None, description="Indicates if two-factor authentication is enabled for the organization."
    )
    sfMyDomain: str | None = Field(None, description="Salesforce My Domain name.")
    sfMyDomainSuffix: str | None = Field(None, description="Salesforce My Domain suffix.")
    sfMyDomainVerified: bool | None = Field(None, description="Indicates if Salesforce My Domain is verified.")
    sfMyDomainVerificationTimestamp: AwareDatetime | None = Field(
        None, description="Timestamp when Salesforce My Domain was verified."
    )
    sfIdentityFederation: SfIdentityFederation | None = Field(
        None, description="Salesforce identity federation status."
    )
    justInTimeUserProvisioningEnabled: bool | None = Field(
        None, description="Indicates if just-in-time user provisioning is enabled."
    )
    allowedVerifierTypes: list[str] | None = Field(
        None, description="List of allowed verifier types for authentication."
    )
    disableInactiveUsers: bool | None = Field(
        None, description="Indicates if inactive users should be automatically disabled."
    )
    inactiveUserDays: int | None = Field(None, description="Number of days before a user is considered inactive.")
    id: str | None = Field(None, description="Unique identifier of the organization.")


class FieldError(BaseModel):
    codes: list[str] | None = Field(None, description="List of error codes.")
    arguments: Any | None = Field(None, description="Arguments for the error message.")
    defaultMessage: str | None = Field(None, description="Default error message.")
    objectName: str | None = Field(None, description="Name of the object that failed validation.")
    field: str | None = Field(None, description="The field that contained the erroneous value")
    rejectedValue: Any | None = Field(None, description="The value that was rejected")
    bindingFailure: bool | None = Field(
        None, description="Whether this error was caused by failed binding (e.g. type mismatch)"
    )
    code: str | None = Field(None, description="Error code.")


class Error(BaseModel):
    message: str | None = Field(None, description="Error message")
    code: str | None = Field(None, description="Error code")
    fieldErrors: list[FieldError] | None = Field(None, description="Field-specific errors")


class ErrorResponse(BaseModel):
    """
    Standard error response format returned when API requests fail.
    """

    errors: list[Error] | None = Field(None, description="The list of errors")


class APIClientCreate(BaseModel):
    """
    Request body for creating a new API client.
    """

    name: str = Field(..., description="Name of the API client.", max_length=200, min_length=1)
    description: str | None = Field(None, description="Description of the API client.", max_length=256, min_length=0)
    jwtPublicKey: str | None = Field(
        None, description="Public key for JWT authentication.", max_length=8192, min_length=0
    )
    redirectUrls: list[str] | None = Field(None, description="List of allowed redirect URLs for OAuth flows.")
    scopes: list[str] | None = Field(None, description="OAuth scopes available to this API client.")
    defaultScopes: list[str] | None = Field(None, description="Default OAuth scopes granted to this API client.")
    organizations: list[str] = Field(..., description="List of organization IDs this API client belongs to.")
    active: bool | None = Field(
        False,
        description="Indicates whether the API client is active. New API clients are created as inactive (false) by default.",
    )
    versionControl: list[str] | None = Field(None, description="Version control system identifiers.")
    roles: list[str] | None = Field(None, description="List of IDs of the roles this API client possesses.")
    roleTenantFilter: str | None = Field(
        None,
        description="Filter for role tenant assignments. Format: ROLE_ENUM_NAME:instance_id,instance_id;ROLE_ENUM_NAME:instance_id\n- Role enum names are separated by semicolons (;)\n- Each role enum name is followed by a colon (:) and its tenant filters\n- Tenant filters are comma-separated (,)\n- Each tenant filter consists of a 4-character realm and 3-character instance_id separated by underscore (_)\n- A special case is an instance_id ending in _sbx, as it gives access to all sandboxes of a realm\n\nExample: CC_USER:aabc_prd,aabc_t12;LOGCENTER_USER:aamn_sbx\n",
        pattern="(\\w+:\\w{4,}_\\w{3,}(,\\w{4,}_\\w{3,})*(;)?)*",
    )
    tokenEndpointAuthMethod: TokenEndpointAuthMethod | None = Field(None, description="Enforced for OIDC flows.")
    password: str = Field(..., max_length=128, min_length=12)


class APIClientUpdate(BaseModel):
    """
    Request body for updating an existing API client.
    """

    name: str | None = Field(None, description="Name of the API client.", max_length=200, min_length=1)
    description: str | None = Field(None, description="Description of the API client.", max_length=256, min_length=0)
    jwtPublicKey: str | None = Field(
        None, description="Public key for JWT authentication.", max_length=8192, min_length=0
    )
    redirectUrls: list[str] | None = Field(None, description="List of allowed redirect URLs for OAuth flows.")
    scopes: list[str] | None = Field(None, description="OAuth scopes available to this API client.")
    defaultScopes: list[str] | None = Field(None, description="Default OAuth scopes granted to this API client.")
    organizations: list[str] | None = Field(None, description="List of organization IDs this API client belongs to.")
    active: bool | None = Field(
        False,
        description="Indicates whether the API client is active. New API clients are created as inactive (false) by default.",
    )
    versionControl: list[str] | None = Field(None, description="Version control system identifiers.")
    roles: list[str] | None = Field(None, description="List of IDs of the roles this API client possesses.")
    roleTenantFilter: str | None = Field(
        None,
        description="Filter for role tenant assignments. Format: ROLE_ENUM_NAME:instance_id,instance_id;ROLE_ENUM_NAME:instance_id\n- Role enum names are separated by semicolons (;)\n- Each role enum name is followed by a colon (:) and its tenant filters\n- Tenant filters are comma-separated (,)\n- Each tenant filter consists of a 4-character realm and 3-character instance_id separated by underscore (_)\n- A special case is an instance_id ending in _sbx, as it gives access to all sandboxes of a realm\n\nExample: CC_USER:aabc_prd,aabc_t12;LOGCENTER_USER:aamn_sbx\n",
        pattern="(\\w+:\\w{4,}_\\w{3,}(,\\w{4,}_\\w{3,})*(;)?)*",
    )
    tokenEndpointAuthMethod: TokenEndpointAuthMethod | None = Field(None, description="Enforced for OIDC flows.")


class APIClientRead(BaseModel):
    """
    API client object returned in read operations.
    """

    passwordModificationTimestamp: int | None = Field(None, description="Timestamp of the last password modification.")
    name: str | None = Field(None, description="Name of the API client.", max_length=200, min_length=1)
    description: str | None = Field(None, description="Description of the API client.", max_length=256, min_length=0)
    jwtPublicKey: str | None = Field(
        None, description="Public key for JWT authentication.", max_length=8192, min_length=0
    )
    redirectUrls: list[str] | None = Field(None, description="List of allowed redirect URLs for OAuth flows.")
    scopes: list[str] | None = Field(None, description="OAuth scopes available to this API client.")
    defaultScopes: list[str] | None = Field(None, description="Default OAuth scopes granted to this API client.")
    organizations: list[str | Organization] | None = Field(
        None,
        description="List of organization IDs this API client belongs to, or organization objects in case the expand parameter was used.",
    )
    active: bool | None = Field(
        False,
        description="Indicates whether the API client is active. New API clients are created as inactive (false) by default.",
    )
    versionControl: list[str] | None = Field(None, description="Version control system identifiers.")
    roles: list[str | Role] | None = Field(
        None,
        description="List of role IDs assigned to this API client, or role objects in case the expand parameter was used.",
    )
    roleTenantFilter: str | None = Field(
        None,
        description="Filter for role tenant assignments. Format: ROLE_ENUM_NAME:instance_id,instance_id;ROLE_ENUM_NAME:instance_id\n- Role enum names are separated by semicolons (;)\n- Each role enum name is followed by a colon (:) and its tenant filters\n- Tenant filters are comma-separated (,)\n- Each tenant filter consists of a 4-character realm and 3-character instance_id separated by underscore (_)\n- A special case is an instance_id ending in _sbx, as it gives access to all sandboxes of a realm\n\nExample: CC_USER:aabc_prd,aabc_t12;LOGCENTER_USER:aamn_sbx\n",
        pattern="(\\w+:\\w{4,}_\\w{3,}(,\\w{4,}_\\w{3,})*(;)?)*",
    )
    tokenEndpointAuthMethod: TokenEndpointAuthMethod | None = Field(None, description="Enforced for OIDC flows.")
    lastAuthenticatedDate: date | None = Field(None, description="Date of the last successful authentication.")
    disabledTimestamp: AwareDatetime | None = Field(None, description="Timestamp when the API client was disabled.")
    createdAt: AwareDatetime | None = Field(None, description="Timestamp when the API client was created.")
    roleTenantFilterMap: dict[str, Any] | None = Field(None, description="Map of role tenant filter assignments.")
    id: str | None = Field(None, description="Unique identifier of the API client.")


class APIClientCollection(BaseModel):
    """
    A paginated collection of API clients.
    """

    content: list[APIClientRead] | None = None
