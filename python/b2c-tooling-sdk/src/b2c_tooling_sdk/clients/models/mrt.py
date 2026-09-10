# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum, IntEnum
from typing import Any
from uuid import UUID

from pydantic import AnyUrl, AwareDatetime, BaseModel, EmailStr, Field, RootModel


class Permissions(BaseModel):
    create_project: bool | None = None


class Value(IntEnum):
    integer_0 = 0
    integer_1 = 1
    integer_2 = 2
    integer_3 = 3


class Role(BaseModel):
    name: str | None = None
    value: Value | None = None


class APIProjectMember(BaseModel):
    user: EmailStr = Field(..., title="Email address")
    role: Role


class Permissions1(BaseModel):
    browse: bool | None = None
    deploy: bool | None = None
    delete_bundle: bool | None = None
    delete_project: bool | None = None
    edit_redirect: bool | None = None
    edit_roles: bool | None = None
    edit_settings: bool | None = None
    validate_tag: bool | None = None
    edit_environment: bool | None = None
    create_environment: bool | None = None
    delete_environment: bool | None = None
    create_notification: bool | None = None
    list_notifications: bool | None = None
    retrieve_notification: bool | None = None
    edit_notification: bool | None = None
    delete_notification: bool | None = None
    create_jwt: bool | None = None
    upload_bundle: bool | None = None
    edit_environment_variable: bool | None = None
    edit_access_control_header: bool | None = None
    edit_data_access_layer_entry: bool | None = None


class APIRedirectV2Clone(BaseModel):
    from_target_slug: str = Field(..., pattern="^[-a-zA-Z0-9_]+$")


class APITargetV2Clone(BaseModel):
    """
    Serializer for target cloning request.
    Inherits from APITargetV2BaseSerializer to reuse validation helper methods.
    """

    from_target_slug: str = Field(..., description="The slug of the target to clone from.", pattern="^[-a-zA-Z0-9_]+$")
    ssr_external_hostname: str | None = Field(
        None,
        description="Full hostname to be used by the cloned environment. Required when using non-MRT managed certificate.",
        max_length=128,
    )
    ssr_external_domain: str | None = Field(
        None,
        description="The domain to be used for a Universal PWA SSR deployment (e.g. customer.com). If not provided and hostname is provided, will be extracted from hostname.",
        max_length=128,
    )
    certificate_id: int | None = Field(
        None,
        description="The ID of the certificate to associate with the cloned target's custom domain. Required for custom domains.",
        ge=0,
    )
    clone_redirects: bool | None = Field(False, description="Whether to clone redirects from the source target.")
    clone_environment_variables: bool | None = Field(
        False, description="Whether to clone environment variables from the source target."
    )
    clone_b2c_target_info: bool | None = Field(
        False, description="Whether to clone B2C target info from the source target."
    )


class SsrProxyConfig(BaseModel):
    host: str
    protocol: str | None = None


class APITargetV2CreateInvalidation(BaseModel):
    """
    This is the serializer for cache invalidation API endpoint.
    """

    pattern: str = Field(
        ..., description="Path pattern to invalidate on the CDN. This must start with a forward slash (`/`)."
    )
    items: list[str] | None = Field(
        [], deprecated=True, description="[Deprecated] Items to invalidate in the application cache.", max_length=50000
    )
    namespace: str | None = Field(
        None, deprecated=True, description="[Deprecated] Namespace of items to invalidate in the application cache."
    )


class APIUserProfile(BaseModel):
    first_name: str | None = Field(None, max_length=255)
    last_name: str | None = Field(None, max_length=255)
    email: EmailStr | None = Field(None, title="Email address")
    is_staff: bool | None = Field(
        None, description="Designates whether the user can log into this admin site.", title="Staff status"
    )
    date_joined: AwareDatetime | None = None
    uuid: UUID | None = None
    highest_account_manager_role: str | None = None


class BlankEnum(Enum):
    field_ = ""


class BundleBulkDelete(BaseModel):
    bundle_ids: list[int]


class BundleBulkDeleteFailedRequest(BaseModel):
    bundle_id: int = Field(..., description="The ID of the bundle that failed validation.")
    errors: str = Field(..., description="Error message that explains why the bundle can't be queued for deletion.")


class BundleBulkDeleteResponse(BaseModel):
    rejected_bundles: list[BundleBulkDeleteFailedRequest] | None = Field(
        None, description="Bundles that failed validation and couldn't be queued for deletion."
    )
    bundles_queued_for_cleanup: list[int] | None = Field(
        None, description="Bundle IDs for bundles that were queued for deletion."
    )


class BundleDownload(BaseModel):
    download_url: AnyUrl


class ConfiguredCdnEnum(Enum):
    """
    * `unknown` - unknown
    * `mrt_cdn` - mrt_cdn
    * `ecdn` - ecdn
    * `stacked_cdn` - stacked_cdn
    """

    unknown = "unknown"
    mrt_cdn = "mrt_cdn"
    ecdn = "ecdn"
    stacked_cdn = "stacked_cdn"


class DeletionStatusEnum(Enum):
    """
    * `ACTIVE` - Active
    * `CLEANUP_REQUESTED` - Cleanup Requested
    * `CLEANUP_IN_PROGRESS` - Cleanup in Progress
    * `CLEANUP_COMPLETE` - Cleanup Complete
    * `CLEANUP_FAILED` - Cleanup Failed
    """

    ACTIVE = "ACTIVE"
    CLEANUP_REQUESTED = "CLEANUP_REQUESTED"
    CLEANUP_IN_PROGRESS = "CLEANUP_IN_PROGRESS"
    CLEANUP_COMPLETE = "CLEANUP_COMPLETE"
    CLEANUP_FAILED = "CLEANUP_FAILED"


class DeployCreate(BaseModel):
    """
    This is the serializer for create deploy API endpoint.
    """

    bundle_id: Any = Field(
        ...,
        description="Integer ID of the bundle to deploy or the string `current`, which re-deploys the currently deployed bundle",
    )


class DeployListStatusEnum(Enum):
    """
    * `Queued` - Queued
    * `In Progress` - In Progress
    * `Failed` - Failed
    * `Finished` - Finished
    """

    Queued = "Queued"
    In_Progress = "In Progress"
    Failed = "Failed"
    Finished = "Finished"


class DeployTypeEnum(Enum):
    """
    * `Publish` - Publish
    * `Reset Bundle` - Reset Bundle
    * `Push` - Push
    * `Deploy Settings` - Deploy Settings
    * `Redeploy` - Redeploy
    """

    Publish = "Publish"
    Reset_Bundle = "Reset Bundle"
    Push = "Push"
    Deploy_Settings = "Deploy Settings"
    Redeploy = "Redeploy"


class Recipient(RootModel[EmailStr]):
    root: EmailStr = Field(..., max_length=254)


class EmailNotification(BaseModel):
    id: UUID | None = None
    targets: list[str]
    recipients: list[Recipient]
    deployment_start: bool | None = Field(
        None, description="Trigger this notification when a deployment starts for a target"
    )
    deployment_success: bool | None = Field(
        None, description="Trigger this notification when a deployment succeeds for a target"
    )
    deployment_failed: bool | None = Field(
        None, description="Trigger this notification when a deployment fails for a target"
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    updated_by: EmailStr | None = Field(None, title="Email address")


class EmailNotificationTyped(EmailNotification):
    resourcetype: str


class EncodingEnum(Enum):
    """
    * `base64` - base64
    """

    base64 = "base64"


class HttpStatusCodeEnum(IntEnum):
    """
    * `301` - Permanent 301
    * `302` - Temporary 302
    """

    integer_301 = 301
    integer_302 = 302


class LogLevelEnum(Enum):
    """
    * `TRACE` - TRACE
    * `DEBUG` - DEBUG
    * `INFO` - INFO
    * `WARN` - WARN
    * `ERROR` - ERROR
    * `FATAL` - FATAL
    """

    TRACE = "TRACE"
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    FATAL = "FATAL"


class NullEnum(Enum):
    NoneType_None = None


class OrganizationAutoDelete(BaseModel):
    enabled: bool
    threshold: int


class PaginatedAPIProjectMemberList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[APIProjectMember]


class Role1(BaseModel):
    name: str | None = None
    value: Value | None = None


class PatchedAPIProjectMember(BaseModel):
    user: EmailStr | None = Field(None, title="Email address")
    role: Role1 | None = None


class PatchedAPIRedirectV2CreateUpdate(BaseModel):
    from_path: str | None = Field(
        None,
        description="A relative URL. For example, the `from_path` value `/spring` redirects shoppers from the URL `www.example.com/spring`. An asterisk (`*`) at the end of the `from_path` indicates a wildcard. For example, a redirect from `/a/*` matches `/a/`, `/a/b`, and `/a/b/c`.",
        max_length=2000,
    )
    to_url: str | None = Field(
        None,
        description="A relative or absolute URL. For example, the `to_url` value `/summer` redirects shoppers to the URL `www.example.com/summer`.",
        max_length=2000,
    )
    forward_querystring: bool | None = Field(
        None,
        description="Some requests contain query string parameters to include in the redirected request. For example, the relative path `/spring-landing-page` can be appended with a query string for analytics tracking, such as `/spring-landing-page?gclid=123`. The `true` value includes query string parameters in the redirect. The `false` value excludes query string parameters from the redirect. The default value is `false`.",
    )
    forward_wildcard: bool | None = Field(
        None,
        description="The `true` value automatically includes any path that comes after the wildcard portion of the `from_path` in the `to_url`. For example: if `/a/*` matches `/a/b/c` in the `from_path` and the `to_url` is `/z/`, the redirect URL is `/z/b/c`. The `false` value excludes the wildcard portion. The default value is `false`. ",
    )
    http_status_code: HttpStatusCodeEnum | None = Field(
        None,
        description="The HTTP status code to be returned in the response. 301 (Moved Permanently) is the recommended and default value. 302 (Found or Moved Temporarily) is another allowable value. For more information about HTTP status codes, see this [status code explainer](https://moz.com/learn/seo/redirection).\n\n* `301` - Permanent 301\n* `302` - Temporary 302",
    )
    publishing_status: str | None = Field(
        None,
        description="The status of the redeployment that happens after you call this API. Allowable values: Pending, Completed, Failed. If the request failed, you can [redeploy the environment](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html) specified in your request.",
    )
    user_email: EmailStr | None = Field(
        None, description="Email of the user who created the redirect.", title="Email address"
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    updated_by: EmailStr | None = Field(
        None, description="Email of the user who last updated the redirect.", title="Email address"
    )


class PatchedEmailNotification(BaseModel):
    id: UUID | None = None
    targets: list[str] | None = None
    recipients: list[Recipient] | None = None
    deployment_start: bool | None = Field(
        None, description="Trigger this notification when a deployment starts for a target"
    )
    deployment_success: bool | None = Field(
        None, description="Trigger this notification when a deployment succeeds for a target"
    )
    deployment_failed: bool | None = Field(
        None, description="Trigger this notification when a deployment fails for a target"
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    updated_by: EmailStr | None = Field(None, title="Email address")


class PatchedEmailNotificationTyped(PatchedEmailNotification):
    resourcetype: str | None = None


class PatchedPolymorphicNotification(RootModel[PatchedEmailNotificationTyped]):
    root: PatchedEmailNotificationTyped = Field(...)


class PatchedUserEmailPreferences(BaseModel):
    node_deprecation_notifications: bool | None = Field(
        None, description="Receive email notifications about Node.js runtime deprecations"
    )
    custom_domain_certificate_notifications: bool | None = Field(
        None, description="Receive email notifications about custom domain certificate changes"
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )


class PolymorphicNotification(RootModel[EmailNotificationTyped]):
    root: EmailNotificationTyped = Field(...)


class ProjectTypeEnum(Enum):
    """
    * `MOBIFY_STUDIO` - MOBIFY_STUDIO
    * `MOBIFYJS_CLIENT` - MOBIFYJS_CLIENT
    * `MOBIFY_ADAPTIVEJS` - MOBIFY_ADAPTIVEJS
    * `MOBIFY_TAG_BASED_PWA` - MOBIFY_TAG_BASED_PWA
    * `SSR` - SSR
    """

    MOBIFY_STUDIO = "MOBIFY_STUDIO"
    MOBIFYJS_CLIENT = "MOBIFYJS_CLIENT"
    MOBIFY_ADAPTIVEJS = "MOBIFY_ADAPTIVEJS"
    MOBIFY_TAG_BASED_PWA = "MOBIFY_TAG_BASED_PWA"
    SSR = "SSR"


class RenewalEligibilityEnum(Enum):
    """
    * `ELIGIBLE` - Eligible
    * `INELIGIBLE` - Ineligible
    """

    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"


class RenewalStatusEnum(Enum):
    """
    * `PENDING_AUTO_RENEWAL` - Pending Auto Renewal
    * `FAILED` - Failed
    """

    PENDING_AUTO_RENEWAL = "PENDING_AUTO_RENEWAL"
    FAILED = "FAILED"


class ResourceLimit(BaseModel):
    limit: int
    used: int


class RoleEnum(IntEnum):
    """
    * `0` - Owner
    * `1` - Member
    """

    integer_0 = 0
    integer_1 = 1


class SourceEnum(Enum):
    """
    * `ecom` - ecom
    * `core` - core
    * `direct` - direct
    """

    ecom = "ecom"
    core = "core"
    direct = "direct"


class SsrArchitectureEnum(Enum):
    """
    * `x86` - x86
    * `arm64` - ARM64
    """

    x86 = "x86"
    arm64 = "arm64"


class SsrRegionEnum(Enum):
    """
    * `us-east-1` - US East (N. Virginia)
    * `us-east-2` - US East (Ohio)
    * `us-west-1` - US West (N. California)
    * `us-west-2` - US West (Oregon)
    * `ap-south-1` - Asia Pacific (Mumbai)
    * `ap-south-2` - Asia Pacific (Hyderabad)
    * `ap-northeast-2` - Asia Pacific (Seoul)
    * `ap-southeast-1` - Asia Pacific (Singapore)
    * `ap-southeast-2` - Asia Pacific (Sydney)
    * `ap-southeast-3` - Asia Pacific (Jakarta)
    * `ap-northeast-1` - Asia Pacific (Tokyo)
    * `ap-northeast-3` - Asia Pacific (Osaka)
    * `ca-central-1` - Canada (Central)
    * `eu-central-1` - EU (Frankfurt)
    * `eu-central-2` - EU (Zurich)
    * `eu-west-1` - EU (Ireland)
    * `eu-west-2` - EU (London)
    * `eu-west-3` - EU (Paris)
    * `eu-north-1` - EU (Stockholm)
    * `eu-south-1` - EU (Milan)
    * `il-central-1` - Israel (Tel Aviv)
    * `me-central-1` - Middle East (UAE)
    * `sa-east-1` - South America (Sao Paulo)
    """

    us_east_1 = "us-east-1"
    us_east_2 = "us-east-2"
    us_west_1 = "us-west-1"
    us_west_2 = "us-west-2"
    ap_south_1 = "ap-south-1"
    ap_south_2 = "ap-south-2"
    ap_northeast_2 = "ap-northeast-2"
    ap_southeast_1 = "ap-southeast-1"
    ap_southeast_2 = "ap-southeast-2"
    ap_southeast_3 = "ap-southeast-3"
    ap_northeast_1 = "ap-northeast-1"
    ap_northeast_3 = "ap-northeast-3"
    ca_central_1 = "ca-central-1"
    eu_central_1 = "eu-central-1"
    eu_central_2 = "eu-central-2"
    eu_west_1 = "eu-west-1"
    eu_west_2 = "eu-west-2"
    eu_west_3 = "eu-west-3"
    eu_north_1 = "eu-north-1"
    eu_south_1 = "eu-south-1"
    il_central_1 = "il-central-1"
    me_central_1 = "me-central-1"
    sa_east_1 = "sa-east-1"


class StateEnum(Enum):
    """
    * `CREATE_IN_PROGRESS` - Create in Progress
    * `PUBLISH_IN_PROGRESS` - Publish in Progress
    * `ACTIVE` - Active
    * `CREATE_FAILED` - Create Failed
    * `PUBLISH_FAILED` - Publish Failed
    """

    CREATE_IN_PROGRESS = "CREATE_IN_PROGRESS"
    PUBLISH_IN_PROGRESS = "PUBLISH_IN_PROGRESS"
    ACTIVE = "ACTIVE"
    CREATE_FAILED = "CREATE_FAILED"
    PUBLISH_FAILED = "PUBLISH_FAILED"


class Status1d2Enum(IntEnum):
    """
    * `0` - Pending
    * `1` - Completed
    * `2` - Failed
    """

    integer_0 = 0
    integer_1 = 1
    integer_2 = 2


class UserEmailPreferences(BaseModel):
    node_deprecation_notifications: bool | None = Field(
        None, description="Receive email notifications about Node.js runtime deprecations"
    )
    custom_domain_certificate_notifications: bool | None = Field(
        None, description="Receive email notifications about custom domain certificate changes"
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )


class ValidationStatusEnum(Enum):
    """
    * `pending_validation` - Pending Validation
    * `validation_succeeded` - Validation Succeeded
    * `validation_failed` - Validation Failed
    """

    pending_validation = "pending_validation"
    validation_succeeded = "validation_succeeded"
    validation_failed = "validation_failed"


class APIAccessControlHeaderV2Create(BaseModel):
    id: UUID | None = Field(None, description="Id for this Access Control Header.")
    value: str = Field(
        ...,
        description="Value to be encrypted. A header value is made up of your chosen set of characters. For the constraints that apply to the value, see [Access Control Headers](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/managed-runtime-administration.html?q=access%20control%20header#access-control-headers).",
    )
    user_email: EmailStr | None = Field(None, title="Email address")
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    publishing_status: Status1d2Enum | None = None
    publishing_status_description: str | None = None


class APIOrganizationMember(BaseModel):
    user: EmailStr | None = Field(None, title="Email address")
    email: str | None = None
    role: RoleEnum
    first_name: str | None = None
    last_name: str | None = None
    can_view_all_projects: bool | None = None
    custom_domain_cert_permission: Status1d2Enum | None = None


class APIOrganizationMemberCreate(BaseModel):
    """
    Serializer for creating organization members.
    """

    user: EmailStr = Field(..., title="Email address")
    role: RoleEnum
    can_view_all_projects: bool | None = None
    custom_domain_cert_permission: Status1d2Enum | None = None


class APIOrganizationMemberUpdate(BaseModel):
    """
    Serializer for updating organization role permissions.
    Allows updating can_view_all_projects and custom_domain_cert_permission.
    """

    user: EmailStr | None = Field(None, title="Email address")
    role: RoleEnum | None = None
    first_name: str | None = None
    last_name: str | None = None
    can_view_all_projects: bool | None = None
    custom_domain_cert_permission: Status1d2Enum | None = None


class APIProjectV2Create(BaseModel):
    name: str = Field(..., description="User-friendly name for this project", max_length=64)
    url: AnyUrl | None = None
    slug: str | None = Field(None, max_length=20, pattern="^[a-z0-9]+(?:-+[a-z0-9]+)*$")
    organization: str
    deletion_status: DeletionStatusEnum | None = None
    project_type: ProjectTypeEnum | None = None
    permissions: Permissions1 | None = None
    ssr_region: SsrRegionEnum | None = Field(
        None,
        description="The default AWS region for newly created targets\n\n* `us-east-1` - US East (N. Virginia)\n* `us-east-2` - US East (Ohio)\n* `us-west-1` - US West (N. California)\n* `us-west-2` - US West (Oregon)\n* `ap-south-1` - Asia Pacific (Mumbai)\n* `ap-south-2` - Asia Pacific (Hyderabad)\n* `ap-northeast-2` - Asia Pacific (Seoul)\n* `ap-southeast-1` - Asia Pacific (Singapore)\n* `ap-southeast-2` - Asia Pacific (Sydney)\n* `ap-southeast-3` - Asia Pacific (Jakarta)\n* `ap-northeast-1` - Asia Pacific (Tokyo)\n* `ap-northeast-3` - Asia Pacific (Osaka)\n* `ca-central-1` - Canada (Central)\n* `eu-central-1` - EU (Frankfurt)\n* `eu-central-2` - EU (Zurich)\n* `eu-west-1` - EU (Ireland)\n* `eu-west-2` - EU (London)\n* `eu-west-3` - EU (Paris)\n* `eu-north-1` - EU (Stockholm)\n* `eu-south-1` - EU (Milan)\n* `il-central-1` - Israel (Tel Aviv)\n* `me-central-1` - Middle East (UAE)\n* `sa-east-1` - South America (Sao Paulo)",
        title="SSR AWS Region",
    )
    ssr_architecture: SsrArchitectureEnum | NullEnum | None = Field(
        None,
        description="Default Server-Side Rendering architecture (x86 or arm64) for targets under this project.\n\n* `x86` - x86\n* `arm64` - ARM64",
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    source: SourceEnum | NullEnum | None = Field(
        None,
        description="Source of the project. One of: ecom, core, direct.\n\n* `ecom` - ecom\n* `core` - core\n* `direct` - direct",
    )


class APIProjectV2Update(BaseModel):
    name: str = Field(..., description="User-friendly name for this project", max_length=64)
    url: AnyUrl | None = None
    slug: str | None = Field(None, pattern="^[-a-zA-Z0-9_]+$")
    organization: str | None = Field(None, description="User-friendly identifier for this instance.")
    deletion_status: DeletionStatusEnum | None = None
    project_type: ProjectTypeEnum | None = None
    permissions: Permissions1 | None = None
    ssr_region: SsrRegionEnum | None = Field(
        None,
        description="The default AWS region for newly created targets\n\n* `us-east-1` - US East (N. Virginia)\n* `us-east-2` - US East (Ohio)\n* `us-west-1` - US West (N. California)\n* `us-west-2` - US West (Oregon)\n* `ap-south-1` - Asia Pacific (Mumbai)\n* `ap-south-2` - Asia Pacific (Hyderabad)\n* `ap-northeast-2` - Asia Pacific (Seoul)\n* `ap-southeast-1` - Asia Pacific (Singapore)\n* `ap-southeast-2` - Asia Pacific (Sydney)\n* `ap-southeast-3` - Asia Pacific (Jakarta)\n* `ap-northeast-1` - Asia Pacific (Tokyo)\n* `ap-northeast-3` - Asia Pacific (Osaka)\n* `ca-central-1` - Canada (Central)\n* `eu-central-1` - EU (Frankfurt)\n* `eu-central-2` - EU (Zurich)\n* `eu-west-1` - EU (Ireland)\n* `eu-west-2` - EU (London)\n* `eu-west-3` - EU (Paris)\n* `eu-north-1` - EU (Stockholm)\n* `eu-south-1` - EU (Milan)\n* `il-central-1` - Israel (Tel Aviv)\n* `me-central-1` - Middle East (UAE)\n* `sa-east-1` - South America (Sao Paulo)",
        title="SSR AWS Region",
    )
    ssr_architecture: SsrArchitectureEnum | NullEnum | None = Field(
        None,
        description="Default Server-Side Rendering architecture (x86 or arm64) for targets under this project.\n\n* `x86` - x86\n* `arm64` - ARM64",
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    source: SourceEnum | NullEnum | None = Field(
        None,
        description="Source of the project. One of: ecom, core, direct.\n\n* `ecom` - ecom\n* `core` - core\n* `direct` - direct",
    )


class APIRedirectV2CreateUpdate(BaseModel):
    from_path: str = Field(
        ...,
        description="A relative URL. For example, the `from_path` value `/spring` redirects shoppers from the URL `www.example.com/spring`. An asterisk (`*`) at the end of the `from_path` indicates a wildcard. For example, a redirect from `/a/*` matches `/a/`, `/a/b`, and `/a/b/c`.",
        max_length=2000,
    )
    to_url: str = Field(
        ...,
        description="A relative or absolute URL. For example, the `to_url` value `/summer` redirects shoppers to the URL `www.example.com/summer`.",
        max_length=2000,
    )
    forward_querystring: bool | None = Field(
        None,
        description="Some requests contain query string parameters to include in the redirected request. For example, the relative path `/spring-landing-page` can be appended with a query string for analytics tracking, such as `/spring-landing-page?gclid=123`. The `true` value includes query string parameters in the redirect. The `false` value excludes query string parameters from the redirect. The default value is `false`.",
    )
    forward_wildcard: bool | None = Field(
        None,
        description="The `true` value automatically includes any path that comes after the wildcard portion of the `from_path` in the `to_url`. For example: if `/a/*` matches `/a/b/c` in the `from_path` and the `to_url` is `/z/`, the redirect URL is `/z/b/c`. The `false` value excludes the wildcard portion. The default value is `false`. ",
    )
    http_status_code: HttpStatusCodeEnum | None = Field(
        None,
        description="The HTTP status code to be returned in the response. 301 (Moved Permanently) is the recommended and default value. 302 (Found or Moved Temporarily) is another allowable value. For more information about HTTP status codes, see this [status code explainer](https://moz.com/learn/seo/redirection).\n\n* `301` - Permanent 301\n* `302` - Temporary 302",
    )
    publishing_status: str | None = Field(
        None,
        description="The status of the redeployment that happens after you call this API. Allowable values: Pending, Completed, Failed. If the request failed, you can [redeploy the environment](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html) specified in your request.",
    )
    user_email: EmailStr | None = Field(
        None, description="Email of the user who created the redirect.", title="Email address"
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    updated_by: EmailStr | None = Field(
        None, description="Email of the user who last updated the redirect.", title="Email address"
    )


class APITargetV2Create(BaseModel):
    """
    This is the serializer for target create/list APIs.
    """

    slug: str | None = Field(None, max_length=64, pattern="^[a-z0-9]+(?:-+[a-z0-9]+)*$")
    name: str = Field(..., description="User-friendly name for this target", max_length=64)
    state: StateEnum | None = Field(
        None,
        description="Target State\n\n* `CREATE_IN_PROGRESS` - Create in Progress\n* `PUBLISH_IN_PROGRESS` - Publish in Progress\n* `ACTIVE` - Active\n* `CREATE_FAILED` - Create Failed\n* `PUBLISH_FAILED` - Publish Failed",
    )
    deletion_status: DeletionStatusEnum | None = None
    hostname: str | None = Field(
        None,
        description="Hostname (literal or JavaScript regular expression between / characters) on which this target should be loaded by the V8 Tag",
        max_length=128,
    )
    current_deploy: dict[str, Any] | None = None
    ssr_external_hostname: str | None = Field(
        None, description="Full hostname to be used by the environment eg. www.customer.com.", max_length=128
    )
    ssr_external_domain: str | None = Field(
        None, description="The domain to be used for a Universal PWA SSR deployment (e.g. customer.com)", max_length=128
    )
    ssr_region: SsrRegionEnum | BlankEnum | None = Field(
        None,
        description="The AWS region to which a Universal PWA SSR should be deployed (e.g. us-east-1)\n\n* `us-east-1` - US East (N. Virginia)\n* `us-east-2` - US East (Ohio)\n* `us-west-1` - US West (N. California)\n* `us-west-2` - US West (Oregon)\n* `ap-south-1` - Asia Pacific (Mumbai)\n* `ap-south-2` - Asia Pacific (Hyderabad)\n* `ap-northeast-2` - Asia Pacific (Seoul)\n* `ap-southeast-1` - Asia Pacific (Singapore)\n* `ap-southeast-2` - Asia Pacific (Sydney)\n* `ap-southeast-3` - Asia Pacific (Jakarta)\n* `ap-northeast-1` - Asia Pacific (Tokyo)\n* `ap-northeast-3` - Asia Pacific (Osaka)\n* `ca-central-1` - Canada (Central)\n* `eu-central-1` - EU (Frankfurt)\n* `eu-central-2` - EU (Zurich)\n* `eu-west-1` - EU (Ireland)\n* `eu-west-2` - EU (London)\n* `eu-west-3` - EU (Paris)\n* `eu-north-1` - EU (Stockholm)\n* `eu-south-1` - EU (Milan)\n* `il-central-1` - Israel (Tel Aviv)\n* `me-central-1` - Middle East (UAE)\n* `sa-east-1` - South America (Sao Paulo)",
        title="SSR AWS Region",
    )
    ssr_architecture: SsrArchitectureEnum | NullEnum | None = Field(
        None,
        description="The architecture for the Server-Side Rendering function (x86 or ARM64). If not specified, the ssr_architecture that's set in the project is used.\n\n* `x86` - x86\n* `arm64` - ARM64",
    )
    ssr_whitelisted_ips: str | None = Field(
        None,
        description="Optional space-separated list of IP addresses (CIDR blocks) that can access this target. Leave blank to allow all IPs.",
    )
    ssr_proxy_configs: list[SsrProxyConfig] | None = None
    cdn_domain_name: str | None = Field(None, description="The Managed Runtime CDN origin domain name.")
    is_production: bool | None = Field(
        None, description="Treat this target as a production environment.", title="Production"
    )
    allow_cookies: bool | None = Field(
        None,
        description="Set true to forward the HTTP cookie header sent by clients to your origin and ensure the Set-Cookie header sent by your app is respected and not stripped.",
    )
    enable_source_maps: bool | None = Field(
        None,
        description='Set true to enable source map support. This will set the NODE_OPTIONS environment variable to "--enable-source-maps" in your MRT environment.',
    )
    log_level: LogLevelEnum | NullEnum | None = Field(
        None,
        description="The minimum log level that will be emitted for this target\n\n* `TRACE` - TRACE\n* `DEBUG` - DEBUG\n* `INFO` - INFO\n* `WARN` - WARN\n* `ERROR` - ERROR\n* `FATAL` - FATAL",
    )
    certificate_id: int | None = Field(
        None,
        description="The ID of the certificate to associate with this target's custom domain. Must be an integer unique within the organization.",
        ge=0,
    )
    certificate_domain: str | None = Field(
        None,
        description="The certificate domain used by this target. For MRT default domains, returns wildcard format (e.g., *.mobify-storefront-staging.com). For custom domains, returns the certificate domain name.",
    )
    configured_cdn: ConfiguredCdnEnum | NullEnum | None = Field(
        None,
        description="The content delivery network used for content, traffic, and security. A B2C instance must be connected to this environment to select eCDN.\n\n* `unknown` - unknown\n* `mrt_cdn` - mrt_cdn\n* `ecdn` - ecdn\n* `stacked_cdn` - stacked_cdn",
    )
    cdn_public_hostname: str | None = Field(
        None,
        description="Add a publicly visible hostname. Enter a subdomain if one is not already provided with your organization’s certified domain.",
    )
    source: SourceEnum | NullEnum | None = Field(
        None,
        description="Source of the environment. One of: ecom, core, direct.\n\n* `ecom` - ecom\n* `core` - core\n* `direct` - direct",
    )


class APITargetV2Update(BaseModel):
    """
    This is the base Target serializer.
    """

    slug: str | None = Field(None, pattern="^[-a-zA-Z0-9_]+$")
    name: str = Field(..., description="User-friendly name for this target", max_length=64)
    state: StateEnum | None = Field(
        None,
        description="Target State\n\n* `CREATE_IN_PROGRESS` - Create in Progress\n* `PUBLISH_IN_PROGRESS` - Publish in Progress\n* `ACTIVE` - Active\n* `CREATE_FAILED` - Create Failed\n* `PUBLISH_FAILED` - Publish Failed",
    )
    deletion_status: DeletionStatusEnum | None = None
    hostname: str | None = Field(
        None,
        description="Hostname (literal or JavaScript regular expression between / characters) on which this target should be loaded by the V8 Tag",
        max_length=128,
    )
    current_deploy: dict[str, Any] | None = None
    ssr_external_hostname: str | None = Field(
        None, description="Full hostname to be used by the environment eg. www.customer.com.", max_length=128
    )
    ssr_external_domain: str | None = Field(
        None, description="The domain to be used for a Universal PWA SSR deployment (e.g. customer.com)", max_length=128
    )
    ssr_region: SsrRegionEnum | BlankEnum | None = Field(
        None,
        description="The AWS region to which a Universal PWA SSR should be deployed (e.g. us-east-1)\n\n* `us-east-1` - US East (N. Virginia)\n* `us-east-2` - US East (Ohio)\n* `us-west-1` - US West (N. California)\n* `us-west-2` - US West (Oregon)\n* `ap-south-1` - Asia Pacific (Mumbai)\n* `ap-south-2` - Asia Pacific (Hyderabad)\n* `ap-northeast-2` - Asia Pacific (Seoul)\n* `ap-southeast-1` - Asia Pacific (Singapore)\n* `ap-southeast-2` - Asia Pacific (Sydney)\n* `ap-southeast-3` - Asia Pacific (Jakarta)\n* `ap-northeast-1` - Asia Pacific (Tokyo)\n* `ap-northeast-3` - Asia Pacific (Osaka)\n* `ca-central-1` - Canada (Central)\n* `eu-central-1` - EU (Frankfurt)\n* `eu-central-2` - EU (Zurich)\n* `eu-west-1` - EU (Ireland)\n* `eu-west-2` - EU (London)\n* `eu-west-3` - EU (Paris)\n* `eu-north-1` - EU (Stockholm)\n* `eu-south-1` - EU (Milan)\n* `il-central-1` - Israel (Tel Aviv)\n* `me-central-1` - Middle East (UAE)\n* `sa-east-1` - South America (Sao Paulo)",
        title="SSR AWS Region",
    )
    ssr_architecture: SsrArchitectureEnum | NullEnum | None = Field(
        None,
        description="The architecture for the Server-Side Rendering function (x86 or ARM64). If not specified, the ssr_architecture that's set in the project is used.\n\n* `x86` - x86\n* `arm64` - ARM64",
    )
    ssr_whitelisted_ips: str | None = Field(
        None,
        description="Optional space-separated list of IP addresses (CIDR blocks) that can access this target. Leave blank to allow all IPs.",
    )
    ssr_proxy_configs: list[SsrProxyConfig] | None = None
    cdn_domain_name: str | None = Field(None, description="The Managed Runtime CDN origin domain name.")
    is_production: bool | None = Field(
        None, description="Treat this target as a production environment.", title="Production"
    )
    allow_cookies: bool | None = Field(
        None,
        description="Set true to forward the HTTP cookie header sent by clients to your origin and ensure the Set-Cookie header sent by your app is respected and not stripped.",
    )
    enable_source_maps: bool | None = Field(
        None,
        description='Set true to enable source map support. This will set the NODE_OPTIONS environment variable to "--enable-source-maps" in your MRT environment.',
    )
    log_level: LogLevelEnum | NullEnum | None = Field(
        None,
        description="The minimum log level that will be emitted for this target\n\n* `TRACE` - TRACE\n* `DEBUG` - DEBUG\n* `INFO` - INFO\n* `WARN` - WARN\n* `ERROR` - ERROR\n* `FATAL` - FATAL",
    )
    certificate_id: int | None = Field(
        None,
        description="The ID of the certificate to associate with this target's custom domain. Must be an integer unique within the organization. Set to null to remove the certificate association.",
        ge=0,
    )
    certificate_domain: str | None = Field(
        None,
        description="The certificate domain used by this target. For MRT default domains, returns wildcard format (e.g., *.mobify-storefront-staging.com). For custom domains, returns the certificate domain name.",
    )
    configured_cdn: ConfiguredCdnEnum | NullEnum | None = Field(
        None,
        description="The content delivery network used for content, traffic, and security. A B2C instance must be connected to this environment to select eCDN.\n\n* `unknown` - unknown\n* `mrt_cdn` - mrt_cdn\n* `ecdn` - ecdn\n* `stacked_cdn` - stacked_cdn",
    )
    cdn_public_hostname: str | None = Field(
        None,
        description="Add a publicly visible hostname. Enter a subdomain if one is not already provided with your organization’s certified domain.",
    )
    source: SourceEnum | NullEnum | None = Field(
        None,
        description="Source of the environment. One of: ecom, core, direct.\n\n* `ecom` - ecom\n* `core` - core\n* `direct` - direct",
    )


class Bundle(BaseModel):
    """
    Serializer to validate a bundle upload payload.
    """

    message: str = Field(..., max_length=2048)
    data: str
    encoding: EncodingEnum
    ssr_only: list[str] | None = None
    ssr_shared: list[str] | None = None
    ssr_parameters: dict[str, Any] | None = None
    bundle_metadata: dict[str, Any] | None = None


class BundleList(BaseModel):
    id: int = Field(..., description="A ID unique within a project.", ge=0, le=2147483647)
    message: str = Field(..., max_length=2048)
    status: Status1d2Enum | None = None
    deletion_status: DeletionStatusEnum | None = None
    user: EmailStr | None = Field(None, title="Email address")
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )


class CertificateBase(BaseModel):
    """
    Base serializer for certificate serializers with common fields and methods.
    """

    id: int | None = Field(None, description="An ID unique within a business.")
    domain_name: str = Field(
        ...,
        description="The domain for the certificate either wildcard (e.g. *.example.com) or single domain (e.g. sub.example.com)",
        max_length=255,
        title="Certificate domain",
    )
    validation_requested_at: str | None = None
    validation_status: ValidationStatusEnum | None = Field(
        None,
        description="Current validation status of the certificate\n\n* `pending_validation` - Pending Validation\n* `validation_succeeded` - Validation Succeeded\n* `validation_failed` - Validation Failed",
    )
    validation_record: str | None = None
    expires_at: AwareDatetime | None = Field(
        None, description="Expiry date of the certificate from ACM.", title="Certificate Expiry Date"
    )
    renewal_status: RenewalStatusEnum | NullEnum | None = Field(
        None,
        description="Current status of certificate renewal.\n\n* `PENDING_AUTO_RENEWAL` - Pending Auto Renewal\n* `FAILED` - Failed",
    )
    renewal_eligibility: RenewalEligibilityEnum | NullEnum | None = Field(
        None,
        description="Whether the certificate is eligible for renewal.\n\n* `ELIGIBLE` - Eligible\n* `INELIGIBLE` - Ineligible",
    )
    targets: str | None = None
    created_by: str | None = None
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    is_mrt_managed: str | None = None
    deletion_status: DeletionStatusEnum | None = None


class CertificateListCreate(BaseModel):
    """
    Base serializer for certificate serializers with common fields and methods.
    """

    id: int | None = Field(None, description="An ID unique within a business.")
    domain_name: str = Field(..., description="The domain for the certificate (e.g. shop.example.com)", max_length=255)
    validation_requested_at: str | None = None
    validation_status: ValidationStatusEnum | None = Field(
        None,
        description="Current validation status of the certificate\n\n* `pending_validation` - Pending Validation\n* `validation_succeeded` - Validation Succeeded\n* `validation_failed` - Validation Failed",
    )
    validation_record: str | None = None
    expires_at: AwareDatetime | None = Field(
        None, description="Expiry date of the certificate from ACM.", title="Certificate Expiry Date"
    )
    renewal_status: RenewalStatusEnum | NullEnum | None = Field(
        None,
        description="Current status of certificate renewal.\n\n* `PENDING_AUTO_RENEWAL` - Pending Auto Renewal\n* `FAILED` - Failed",
    )
    renewal_eligibility: RenewalEligibilityEnum | NullEnum | None = Field(
        None,
        description="Whether the certificate is eligible for renewal.\n\n* `ELIGIBLE` - Eligible\n* `INELIGIBLE` - Ineligible",
    )
    targets: str | None = None
    created_by: str | None = None
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    is_mrt_managed: str | None = None
    deletion_status: DeletionStatusEnum | None = None


class DeployList(BaseModel):
    user: EmailStr | None = Field(None, title="Email address")
    bundle: BundleList
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    status: DeployListStatusEnum | None = None
    deploy_type: DeployTypeEnum | None = None
    external_publish_id: UUID | None = Field(
        None, description="Id for an external publishing operation for this Deploy"
    )
    deploy_settings: int | None = None
    duration: str


class EnvironmentVariableList(BaseModel):
    name: str = Field(..., max_length=512)
    value: str = Field(..., description="Value to be encrypted.")
    created_by: EmailStr | None = Field(None, title="Email address")
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    updated_by: EmailStr | None = Field(None, title="Email address")
    publishing_status: Status1d2Enum | None = None
    publishing_status_description: str | None = None


class OrganizationLimits(BaseModel):
    max_environments: ResourceLimit
    max_production_environments: ResourceLimit


class PaginatedAPIAccessControlHeaderV2CreateList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[APIAccessControlHeaderV2Create]


class PaginatedAPIOrganizationMemberList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[APIOrganizationMember]


class PaginatedAPIProjectV2CreateList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[APIProjectV2Create]


class PaginatedAPIRedirectV2CreateUpdateList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[APIRedirectV2CreateUpdate]


class PaginatedAPITargetV2CreateList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[APITargetV2Create]


class PaginatedBundleListList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[BundleList]


class PaginatedCertificateListCreateList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[CertificateListCreate]


class PaginatedDeployListList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[DeployList]


class PaginatedEnvironmentVariableListList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[EnvironmentVariableList]


class PaginatedPolymorphicNotificationList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[PolymorphicNotification]


class PatchedAPIOrganizationMemberUpdate(BaseModel):
    """
    Serializer for updating organization role permissions.
    Allows updating can_view_all_projects and custom_domain_cert_permission.
    """

    user: EmailStr | None = Field(None, title="Email address")
    role: RoleEnum | None = None
    first_name: str | None = None
    last_name: str | None = None
    can_view_all_projects: bool | None = None
    custom_domain_cert_permission: Status1d2Enum | None = None


class PatchedAPIProjectV2Update(BaseModel):
    name: str | None = Field(None, description="User-friendly name for this project", max_length=64)
    url: AnyUrl | None = None
    slug: str | None = Field(None, pattern="^[-a-zA-Z0-9_]+$")
    organization: str | None = Field(None, description="User-friendly identifier for this instance.")
    deletion_status: DeletionStatusEnum | None = None
    project_type: ProjectTypeEnum | None = None
    permissions: Permissions1 | None = None
    ssr_region: SsrRegionEnum | None = Field(
        None,
        description="The default AWS region for newly created targets\n\n* `us-east-1` - US East (N. Virginia)\n* `us-east-2` - US East (Ohio)\n* `us-west-1` - US West (N. California)\n* `us-west-2` - US West (Oregon)\n* `ap-south-1` - Asia Pacific (Mumbai)\n* `ap-south-2` - Asia Pacific (Hyderabad)\n* `ap-northeast-2` - Asia Pacific (Seoul)\n* `ap-southeast-1` - Asia Pacific (Singapore)\n* `ap-southeast-2` - Asia Pacific (Sydney)\n* `ap-southeast-3` - Asia Pacific (Jakarta)\n* `ap-northeast-1` - Asia Pacific (Tokyo)\n* `ap-northeast-3` - Asia Pacific (Osaka)\n* `ca-central-1` - Canada (Central)\n* `eu-central-1` - EU (Frankfurt)\n* `eu-central-2` - EU (Zurich)\n* `eu-west-1` - EU (Ireland)\n* `eu-west-2` - EU (London)\n* `eu-west-3` - EU (Paris)\n* `eu-north-1` - EU (Stockholm)\n* `eu-south-1` - EU (Milan)\n* `il-central-1` - Israel (Tel Aviv)\n* `me-central-1` - Middle East (UAE)\n* `sa-east-1` - South America (Sao Paulo)",
        title="SSR AWS Region",
    )
    ssr_architecture: SsrArchitectureEnum | NullEnum | None = Field(
        None,
        description="Default Server-Side Rendering architecture (x86 or arm64) for targets under this project.\n\n* `x86` - x86\n* `arm64` - ARM64",
    )
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    source: SourceEnum | NullEnum | None = Field(
        None,
        description="Source of the project. One of: ecom, core, direct.\n\n* `ecom` - ecom\n* `core` - core\n* `direct` - direct",
    )


class PatchedAPITargetV2Update(BaseModel):
    """
    This is the base Target serializer.
    """

    slug: str | None = Field(None, pattern="^[-a-zA-Z0-9_]+$")
    name: str | None = Field(None, description="User-friendly name for this target", max_length=64)
    state: StateEnum | None = Field(
        None,
        description="Target State\n\n* `CREATE_IN_PROGRESS` - Create in Progress\n* `PUBLISH_IN_PROGRESS` - Publish in Progress\n* `ACTIVE` - Active\n* `CREATE_FAILED` - Create Failed\n* `PUBLISH_FAILED` - Publish Failed",
    )
    deletion_status: DeletionStatusEnum | None = None
    hostname: str | None = Field(
        None,
        description="Hostname (literal or JavaScript regular expression between / characters) on which this target should be loaded by the V8 Tag",
        max_length=128,
    )
    current_deploy: dict[str, Any] | None = None
    ssr_external_hostname: str | None = Field(
        None, description="Full hostname to be used by the environment eg. www.customer.com.", max_length=128
    )
    ssr_external_domain: str | None = Field(
        None, description="The domain to be used for a Universal PWA SSR deployment (e.g. customer.com)", max_length=128
    )
    ssr_region: SsrRegionEnum | BlankEnum | None = Field(
        None,
        description="The AWS region to which a Universal PWA SSR should be deployed (e.g. us-east-1)\n\n* `us-east-1` - US East (N. Virginia)\n* `us-east-2` - US East (Ohio)\n* `us-west-1` - US West (N. California)\n* `us-west-2` - US West (Oregon)\n* `ap-south-1` - Asia Pacific (Mumbai)\n* `ap-south-2` - Asia Pacific (Hyderabad)\n* `ap-northeast-2` - Asia Pacific (Seoul)\n* `ap-southeast-1` - Asia Pacific (Singapore)\n* `ap-southeast-2` - Asia Pacific (Sydney)\n* `ap-southeast-3` - Asia Pacific (Jakarta)\n* `ap-northeast-1` - Asia Pacific (Tokyo)\n* `ap-northeast-3` - Asia Pacific (Osaka)\n* `ca-central-1` - Canada (Central)\n* `eu-central-1` - EU (Frankfurt)\n* `eu-central-2` - EU (Zurich)\n* `eu-west-1` - EU (Ireland)\n* `eu-west-2` - EU (London)\n* `eu-west-3` - EU (Paris)\n* `eu-north-1` - EU (Stockholm)\n* `eu-south-1` - EU (Milan)\n* `il-central-1` - Israel (Tel Aviv)\n* `me-central-1` - Middle East (UAE)\n* `sa-east-1` - South America (Sao Paulo)",
        title="SSR AWS Region",
    )
    ssr_architecture: SsrArchitectureEnum | NullEnum | None = Field(
        None,
        description="The architecture for the Server-Side Rendering function (x86 or ARM64). If not specified, the ssr_architecture that's set in the project is used.\n\n* `x86` - x86\n* `arm64` - ARM64",
    )
    ssr_whitelisted_ips: str | None = Field(
        None,
        description="Optional space-separated list of IP addresses (CIDR blocks) that can access this target. Leave blank to allow all IPs.",
    )
    ssr_proxy_configs: list[SsrProxyConfig] | None = None
    cdn_domain_name: str | None = Field(None, description="The Managed Runtime CDN origin domain name.")
    is_production: bool | None = Field(
        None, description="Treat this target as a production environment.", title="Production"
    )
    allow_cookies: bool | None = Field(
        None,
        description="Set true to forward the HTTP cookie header sent by clients to your origin and ensure the Set-Cookie header sent by your app is respected and not stripped.",
    )
    enable_source_maps: bool | None = Field(
        None,
        description='Set true to enable source map support. This will set the NODE_OPTIONS environment variable to "--enable-source-maps" in your MRT environment.',
    )
    log_level: LogLevelEnum | NullEnum | None = Field(
        None,
        description="The minimum log level that will be emitted for this target\n\n* `TRACE` - TRACE\n* `DEBUG` - DEBUG\n* `INFO` - INFO\n* `WARN` - WARN\n* `ERROR` - ERROR\n* `FATAL` - FATAL",
    )
    certificate_id: int | None = Field(
        None,
        description="The ID of the certificate to associate with this target's custom domain. Must be an integer unique within the organization. Set to null to remove the certificate association.",
        ge=0,
    )
    certificate_domain: str | None = Field(
        None,
        description="The certificate domain used by this target. For MRT default domains, returns wildcard format (e.g., *.mobify-storefront-staging.com). For custom domains, returns the certificate domain name.",
    )
    configured_cdn: ConfiguredCdnEnum | NullEnum | None = Field(
        None,
        description="The content delivery network used for content, traffic, and security. A B2C instance must be connected to this environment to select eCDN.\n\n* `unknown` - unknown\n* `mrt_cdn` - mrt_cdn\n* `ecdn` - ecdn\n* `stacked_cdn` - stacked_cdn",
    )
    cdn_public_hostname: str | None = Field(
        None,
        description="Add a publicly visible hostname. Enter a subdomain if one is not already provided with your organization’s certified domain.",
    )
    source: SourceEnum | NullEnum | None = Field(
        None,
        description="Source of the environment. One of: ecom, core, direct.\n\n* `ecom` - ecom\n* `core` - core\n* `direct` - direct",
    )


class PatchedCertificateBase(BaseModel):
    """
    Base serializer for certificate serializers with common fields and methods.
    """

    id: int | None = Field(None, description="An ID unique within a business.")
    domain_name: str | None = Field(
        None,
        description="The domain for the certificate either wildcard (e.g. *.example.com) or single domain (e.g. sub.example.com)",
        max_length=255,
        title="Certificate domain",
    )
    validation_requested_at: str | None = None
    validation_status: ValidationStatusEnum | None = Field(
        None,
        description="Current validation status of the certificate\n\n* `pending_validation` - Pending Validation\n* `validation_succeeded` - Validation Succeeded\n* `validation_failed` - Validation Failed",
    )
    validation_record: str | None = None
    expires_at: AwareDatetime | None = Field(
        None, description="Expiry date of the certificate from ACM.", title="Certificate Expiry Date"
    )
    renewal_status: RenewalStatusEnum | NullEnum | None = Field(
        None,
        description="Current status of certificate renewal.\n\n* `PENDING_AUTO_RENEWAL` - Pending Auto Renewal\n* `FAILED` - Failed",
    )
    renewal_eligibility: RenewalEligibilityEnum | NullEnum | None = Field(
        None,
        description="Whether the certificate is eligible for renewal.\n\n* `ELIGIBLE` - Eligible\n* `INELIGIBLE` - Ineligible",
    )
    targets: str | None = None
    created_by: str | None = None
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    is_mrt_managed: str | None = None
    deletion_status: DeletionStatusEnum | None = None


class APIOrganization(BaseModel):
    uuid: UUID | None = None
    name: str = Field(..., max_length=128)
    slug: str = Field(..., max_length=64, pattern="^[a-z0-9]+(?:-+[a-z0-9]+)*$")
    deletion_status: DeletionStatusEnum | None = None
    created_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was created."
    )
    updated_at: AwareDatetime | None = Field(
        None, description="Timestamp in the extended ISO 8601 format for when the object was last updated."
    )
    permissions: Permissions | None = None
    has_mobify_tag_project: bool | None = None
    limits: OrganizationLimits | None = None
    auto_delete: OrganizationAutoDelete | None = None
    can_configure_ssr_architecture: bool | None = Field(
        None, description="Enable SSR architecture selection (x86 or arm64) for this organization"
    )


class PaginatedAPIOrganizationList(BaseModel):
    count: int = Field(..., examples=[123])
    next: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=400&limit=100"])
    previous: AnyUrl | None = Field(None, examples=["http://api.example.org/accounts/?offset=200&limit=100"])
    results: list[APIOrganization]
