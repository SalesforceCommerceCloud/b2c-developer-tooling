# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, Field


class PreferredLocale(Enum):
    """
    Preferred locale for the user.
    """

    none = "none"
    de = "de"
    de_DE = "de_DE"
    en = "en"
    en_CA = "en_CA"
    en_US = "en_US"
    es = "es"
    fr = "fr"
    fr_CA = "fr_CA"
    nl = "nl"


class UserState(Enum):
    """
    Current state of the user account.
    """

    INITIAL = "INITIAL"
    ENABLED = "ENABLED"
    DELETED = "DELETED"


class Verifier(BaseModel):
    """
    A verifier represents a two-factor authentication device or method associated with a user account.
    """

    id: str = Field(..., description="Unique identifier of the verifier.")
    type: str = Field(..., description="Type of verifier (e.g., SMS, TOTP, WebAuthn).")
    displayName: str = Field(..., description="Human-readable name for the verifier.")
    status: str = Field(..., description="Current status of the verifier.")


class UserResetResource(BaseModel):
    """
    Request body for resetting a user to INITIAL state.
    """

    supportTicketId: str | None = Field(None, description="Only required for users of the Salesforce organization.")


class UserDeactivationResource(BaseModel):
    """
    Request body for disabling a user.
    """

    supportTicketId: str | None = Field(None, description="Only required for users of the Salesforce organization.")


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
    field: str | None = Field(None, description="The field that contained the erroneous value.")
    rejectedValue: Any | None = Field(None, description="The value that was rejected.")
    bindingFailure: bool | None = Field(
        None, description="Whether this error was caused by failed binding (e.g. type mismatch)."
    )
    code: str | None = Field(None, description="Error code.")


class Error(BaseModel):
    message: str | None = Field(None, description="Error message.")
    code: str | None = Field(None, description="Error code.")
    fieldErrors: list[FieldError] | None = Field(None, description="Field-specific errors.")


class ErrorResponse(BaseModel):
    """
    Standard error response format returned when API requests fail.
    """

    errors: list[Error] | None = Field(None, description="The list of errors.")


class UserCreate(BaseModel):
    """
    Request body for creating a new user.
    """

    mail: str = Field(..., description="Email address of the user.")
    firstName: str = Field(..., description="First name of the user.", max_length=40, min_length=1)
    lastName: str = Field(..., description="Last name of the user.", max_length=40, min_length=1)
    displayName: str | None = Field(None, description="Display name of the user.", max_length=100, min_length=1)
    businessPhone: str | None = Field(None, description="Business phone number.")
    homePhone: str | None = Field(None, description="Home phone number.")
    mobilePhone: str | None = Field(None, description="Mobile phone number.")
    preferredLocale: PreferredLocale | None = Field(None, description="Preferred locale for the user.")
    roles: list[str] | None = Field(None, description="List of IDs of the roles this user possesses.")
    organizations: list[str] = Field(..., description="List of organization IDs this user belongs to.")
    primaryOrganization: str = Field(..., description="Primary organization ID for the user.")
    roleTenantFilter: str | None = Field(
        None,
        description="Filter for role tenant assignments. Format: ROLE_ENUM_NAME:instance_id,instance_id;ROLE_ENUM_NAME:instance_id\n- Role enum names are separated by semicolons (;)\n- Each role enum name is followed by a colon (:) and its tenant filters\n- Tenant filters are comma-separated (,)\n- Each tenant filter consists of a 4-character realm and 3-character instance_id separated by underscore (_)\n- A special case is an instance_id ending in _sbx, as it gives access to all sandboxes of a realm\n\nExample: CC_USER:aabc_prd,aabc_t12;LOGCENTER_USER:aamn_sbx\n",
        pattern="(\\w+:\\w{4,}_\\w{3,}(,\\w{4,}_\\w{3,})*(;)?)*",
    )
    supportTicketId: str | None = Field(None, description="Only required for users of the Salesforce organization.")


class UserUpdate(BaseModel):
    """
    Request body for updating an existing user.
    """

    mail: str | None = Field(None, description="Email address of the user.")
    firstName: str | None = Field(None, description="First name of the user.", max_length=40, min_length=1)
    lastName: str | None = Field(None, description="Last name of the user.", max_length=40, min_length=1)
    displayName: str | None = Field(None, description="Display name of the user.", max_length=100, min_length=1)
    businessPhone: str | None = Field(None, description="Business phone number.")
    homePhone: str | None = Field(None, description="Home phone number.")
    mobilePhone: str | None = Field(None, description="Mobile phone number.")
    preferredLocale: PreferredLocale | None = Field(None, description="Preferred locale for the user.")
    roles: list[str] | None = Field(None, description="List of IDs of the roles this user possesses.")
    organizations: list[str] | None = Field(None, description="List of organization IDs this user belongs to.")
    primaryOrganization: str | None = Field(None, description="Primary organization ID for the user.")
    roleTenantFilter: str | None = Field(
        None,
        description="Filter for role tenant assignments. Format: ROLE_ENUM_NAME:instance_id,instance_id;ROLE_ENUM_NAME:instance_id\n- Role enum names are separated by semicolons (;)\n- Each role enum name is followed by a colon (:) and its tenant filters\n- Tenant filters are comma-separated (,)\n- Each tenant filter consists of a 4-character realm and 3-character instance_id separated by underscore (_)\n- A special case is an instance_id ending in _sbx, as it gives access to all sandboxes of a realm\n\nExample: CC_USER:aabc_prd,aabc_t12;LOGCENTER_USER:aamn_sbx\n",
        pattern="(\\w+:\\w{4,}_\\w{3,}(,\\w{4,}_\\w{3,})*(;)?)*",
    )
    supportTicketId: str | None = Field(None, description="Only required for users of the Salesforce organization.")


class UserRead(BaseModel):
    """
    User object returned in read operations.
    """

    mail: str | None = Field(None, description="Email address of the user.")
    firstName: str | None = Field(None, description="First name of the user.", max_length=40, min_length=1)
    lastName: str | None = Field(None, description="Last name of the user.", max_length=40, min_length=1)
    displayName: str | None = Field(None, description="Display name of the user.", max_length=100, min_length=1)
    businessPhone: str | None = Field(None, description="Business phone number.")
    homePhone: str | None = Field(None, description="Home phone number.")
    mobilePhone: str | None = Field(None, description="Mobile phone number.")
    preferredLocale: PreferredLocale | None = Field(None, description="Preferred locale for the user.")
    roles: list[str | Role] | None = Field(None, description="List of IDs of the roles this user possesses.")
    organizations: list[str | Organization] | None = Field(
        None, description="List of organization IDs this user belongs to."
    )
    primaryOrganization: str | None = Field(None, description="Primary organization ID for the user.")
    roleTenantFilter: str | None = Field(
        None,
        description="Filter for role tenant assignments. Format: ROLE_ENUM_NAME:instance_id,instance_id;ROLE_ENUM_NAME:instance_id\n- Role enum names are separated by semicolons (;)\n- Each role enum name is followed by a colon (:) and its tenant filters\n- Tenant filters are comma-separated (,)\n- Each tenant filter consists of a 4-character realm and 3-character instance_id separated by underscore (_)\n- A special case is an instance_id ending in _sbx, as it gives access to all sandboxes of a realm\n\nExample: CC_USER:aabc_prd,aabc_t12;LOGCENTER_USER:aamn_sbx\n",
        pattern="(\\w+:\\w{4,}_\\w{3,}(,\\w{4,}_\\w{3,})*(;)?)*",
    )
    passwordExpirationTimestamp: int | None = Field(None, description="Timestamp when the password expires.")
    passwordModificationTimestamp: int | None = Field(None, description="Timestamp of the last password modification.")
    createdAt: AwareDatetime | None = Field(None, description="Timestamp when the user was created.")
    lastModified: AwareDatetime | None = Field(None, description="Timestamp of the last modification.")
    lastLoginDate: date | None = Field(None, description="Date of the last successful login.")
    userState: UserState | None = Field(None, description="Current state of the user account.")
    activationCodeCreationTimestamp: int | None = Field(
        None, description="Timestamp when the activation code was created."
    )
    sfUserId: str | None = Field(None, description="Salesforce user identifier.")
    verifiers: list[Verifier] | None = Field(None, description="List of authentication verifiers (e.g., MFA devices).")
    deleteTimestamp: int | None = Field(None, description="Timestamp when the user was marked for deletion.")
    roleTenantFilterMap: dict[str, Any] | None = Field(None, description="Map of role tenant filter assignments.")
    linkedToSfIdentity: bool | None = Field(
        None, description="Indicates if the user is linked to a Salesforce identity."
    )
    id: UUID | None = Field(None, description="Unique identifier of the user.")
    supportTicketId: str | None = Field(None, description="Only required for users of the Salesforce organization.")


class UserCollection(BaseModel):
    """
    A paginated collection of users.
    """

    content: list[UserRead] | None = None
