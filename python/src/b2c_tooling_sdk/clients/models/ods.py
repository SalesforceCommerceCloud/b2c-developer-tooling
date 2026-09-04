# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, Field, RootModel


class Kind(Enum):
    """
    Type of response object.
    """

    ApiVersion = "ApiVersion"
    UserInfo = "UserInfo"
    SystemInfo = "SystemInfo"
    Realm = "Realm"
    RealmConfiguration = "RealmConfiguration"
    RealmUsage = "RealmUsage"
    MultiRealmUsage = "MultiRealmUsage"
    Sandbox = "Sandbox"
    SandboxList = "SandboxList"
    SandboxAlias = "SandboxAlias"
    SandboxAliasList = "SandboxAliasList"
    SandboxSettings = "SandboxSettings"
    SandboxUsage = "SandboxUsage"
    SandboxStorage = "SandboxStorage"
    SandboxOperationList = "SandboxOperationList"
    SandboxCloneList = "SandboxCloneList"
    SandboxClone = "SandboxClone"
    Status = "Status"


class Response(BaseModel):
    kind: Kind = Field(..., description="Type of response object.")
    code: int = Field(..., description="Response code sent along with the status.")


class Status(Enum):
    """
    String with value 'Success' or 'Failure' to indicate request outcome.
    """

    Success = "Success"
    Failure = "Failure"


class StatusResponse(Response):
    status: Status = Field(
        ...,
        description="String with value 'Success' or 'Failure' to indicate request outcome.",
    )


class PagingLinks(BaseModel):
    self: str | None = Field(None, description="Relative link to this page.")
    first: str | None = Field(None, description="Relative link to the first page.")
    previous: str | None = Field(
        None,
        description="Relative link to the previous page. 'null' if the current page is the first page.",
    )
    next: str | None = Field(
        None,
        description="Relative link to the next page. 'null' if the current page is the last page.",
    )
    last: str | None = Field(None, description="Relative link to the last page.")


class RealmUsageSummaryModel(BaseModel):
    activeSandboxes: int = Field(
        ...,
        description="Number of currently active sandboxes for a realm.",
        examples=[42],
    )


class ConfigurationIntegerValue(BaseModel):
    """
    Object that holds an integer-based configuration property. A zero value means "unlimited".
    """

    fixedValue: int | None = Field(
        None,
        description="Fixed value for this configuration property. You can't use this along with a maximum or default value.",
    )
    maximum: int | None = Field(None, description="Maximum value for this property.")
    defaultValue: int | None = Field(
        None, description="Default value for this property."
    )


class Weekday(Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"


class WeekdaySchedule(BaseModel):
    """
    A schedule definition for a dedicated time on specific weekdays.
    """

    weekdays: list[Weekday] | None = Field(
        None, description="List of weekdays, where the action should take place"
    )
    time: str | None = Field(
        None,
        description="Time (with timezone) where the action should take place on the specified weekdays. Time format is [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Times). If no time zone is given, the timezone defaults to GMT.",
        examples=["20:10:00Z"],
    )


class RealmSandboxConfigurationModel(BaseModel):
    """
    Configuration object related to sandboxes of a realm.
    """

    limitsEnabled: bool = Field(
        ...,
        description="Flag indicating whether sandbox specific limits are enforced for the realm.",
    )
    totalNumberOfSandboxes: int = Field(
        ...,
        description="Total number of sandboxes (regardless of state) that the realm can hold.",
    )
    sandboxTTL: ConfigurationIntegerValue
    localUsersAllowed: bool = Field(
        ...,
        description="Flag indicating whether users outside the Account Manager are allowed.",
    )


class RealmSandboxConfigurationUpdateModel(BaseModel):
    """
    Update data for configuration data related to sandboxes of a realm. The time formats within the weekday schedules have to be passed in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Times) format.
    """

    sandboxTTL: ConfigurationIntegerValue | None = None
    startScheduler: Any | None = None
    stopScheduler: Any | None = None


class RealmRequestConfigurationModel(BaseModel):
    """
    Configuration object related to requests targeting the sandboxes of a realm.
    """

    enforced: bool = Field(..., description="If enabled, rate limiting is active.")
    maxRate: int | None = Field(
        None, description="Maximum requests allowed per time period."
    )
    timePeriod: int | None = Field(
        None, description="Number of seconds during which to count requests."
    )


class Email(RootModel[str]):
    root: str = Field(..., pattern="(.+)@(.+)")


class RealmConfigurationModel(BaseModel):
    emails: list[Email] | None = Field(
        None, examples=[["email1@example.com", "email2@example.com"]]
    )
    sandbox: RealmSandboxConfigurationModel | None = None
    requests: RealmRequestConfigurationModel | None = None
    startScheduler: WeekdaySchedule | None = None
    stopScheduler: WeekdaySchedule | None = None


class RealmConfigurationUpdateRequestModel(BaseModel):
    emails: list[Email] | None = Field(
        None, examples=[["email1@example.com", "email2@example.com"]]
    )
    sandbox: RealmSandboxConfigurationUpdateModel | None = None


class AccountDetailsModel(BaseModel):
    accountName: str | None = Field(
        None, description="Account name.", examples=["Disney"]
    )
    creditBalance: float | None = Field(
        None, description="Total Credit Balance left.", examples=[93.234]
    )


class DetailedReport(Enum):
    """
    Field to check whether detailed report is to be retrieved, by default detailed report will not be pulled.
    """

    boolean_False = False
    boolean_True = True


class MultiRealmUsageRequest(BaseModel):
    from_: date | None = Field(
        None, alias="from", description="Time the sandbox was started."
    )
    to: date | None = Field(
        None,
        description="Time the sandbox was stopped. If the sandbox is still running, this value will not exist for the last block.",
    )
    realms: list[str] | None = None
    detailedReport: DetailedReport | None = Field(
        False,
        description="Field to check whether detailed report is to be retrieved, by default detailed report will not be pulled.",
    )


class SandboxCloneCreateModel(BaseModel):
    cloneId: str | None = Field(None, examples=["zyom-002-017-180620251331"])
    batchId: str | None = Field(
        None,
        description="Shared batch identifier when this create fanned out to multiple clones (1 to many). Absent for single (1:1) clones.",
    )
    siblingCloneIds: list[str] | None = Field(
        None,
        description="cloneIds of all clones created by this 1 to many request. Absent for single (1:1) clones.",
    )


class SandboxCloneState(Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class StorageUsageModel(BaseModel):
    """
    Represents a single filesystem storage unit with its available space.
    """

    spaceTotal: int | None = Field(None, description="Total available space in MB.")
    spaceUsed: int | None = Field(None, description="Used space in MB.")
    percentageUsed: int | None = Field(
        None, description="Used space in percent, compared to total space."
    )


class Versions(BaseModel):
    """
    Versions of the components that make up the sandbox.
    """

    app: str | None = Field(
        None, description="Version of the commerce application.", pattern="\\d(\\.\\d)*"
    )
    web: str | None = Field(
        None, description="Version of the web proxy.", pattern="\\d(\\.\\d)*"
    )


class Links(BaseModel):
    """
    Set of named links for accessing the sandbox.
    """

    bm: str | None = Field(
        None, description="Fully qualified URL of the sandbox Business Manager web app."
    )
    ocapi: str | None = Field(
        None,
        description="Fully qualified URL of OCAPI data API (excluding version selector).",
    )
    impex: str | None = Field(
        None,
        description="Fully qualified WebDAV URL for accessing import and export files.",
    )
    code: str | None = Field(
        None, description="Fully qualified WebDAV URL for accessing code."
    )
    logs: str | None = Field(
        None, description="Fully qualified WebDAV URL for accessing log files."
    )


class GranularUsage(BaseModel):
    usageDate: str | None = Field(None, description="start of the usage being returned")
    creditsUp: float | None = Field(
        None,
        description="Credits consumed when sandboxes were up during the requested timeframe.",
        examples=[3600.001],
    )
    creditsDown: float | None = Field(
        None,
        description="Credits consumed when sandboxes were down during the requested timeframe.",
        examples=[1440.001],
    )
    minutesUp: int | None = Field(
        None,
        description="Minutes sandboxes were up during the requested timeframe.",
        examples=[360000],
    )
    minutesDown: int | None = Field(
        None,
        description="Minutes sandboxes were down during the requested timeframe.",
        examples=[180000],
    )


class SandboxState(Enum):
    new = "new"
    creating = "creating"
    starting = "starting"
    started = "started"
    stopping = "stopping"
    stopped = "stopped"
    deleting = "deleting"
    deleted = "deleted"
    resetting = "resetting"
    failed = "failed"
    unknown = "unknown"
    upgrading = "upgrading"


class SandboxResourceProfile(Enum):
    """
    Determines the resource allocation for the sandbox, "medium" is the default. Be careful, more powerful profiles consume more credits.
    """

    medium = "medium"
    large = "large"
    xlarge = "xlarge"
    xxlarge = "xxlarge"


class Operation(Enum):
    start = "start"
    stop = "stop"
    restart = "restart"
    reset = "reset"


class SandboxOperationRequestModel(BaseModel):
    operation: Operation


class Cookie(BaseModel):
    """
    The cookie required for each request to this alias.
    """

    name: str
    value: str
    path: str | None = None
    domain: str | None = None


class Status1(Enum):
    """
    The status of the alias creation process
    """

    pending = "pending"
    verified = "verified"


class SandboxAliasModel(BaseModel):
    id: UUID | None = Field(None, description="The sandbox alias UUID.")
    name: str = Field(..., description="The alias name.", examples=["www.example.com"])
    unique: bool | None = Field(
        None, description="Define if it's a unique configuration", examples=[False]
    )
    requestLetsEncryptCertificate: bool | None = Field(
        None,
        description="Request a valid certificate to be generated on the fly through Lets Encrypt. This action consumes certificate requests from the domain quota imposed by Let's Encrypt, please read the Alias documentation carefully.",
        examples=[False],
    )
    sandboxId: UUID | None = Field(
        None, description="The UUID of the sandbox the sandbox alias is pointing to."
    )
    cookie: Cookie | None = Field(
        None, description="The cookie required for each request to this alias."
    )
    registration: str | None = Field(
        None,
        description="The link that can be used to save the required cookie for this alias in the browser.",
    )
    domainVerificationRecord: str | None = Field(
        None, description="The verification code to be added as TXT record in the DNS"
    )
    status: Status1 | None = Field(
        None, description="The status of the alias creation process"
    )


class MinutesUpByProfileItem(BaseModel):
    profile: SandboxResourceProfile | None = None
    minutes: int | None = Field(
        None,
        description="How many minutes sandboxes of this profile type were running during the report timeframe.",
    )


class HistoryItem(BaseModel):
    from_: AwareDatetime = Field(
        ..., alias="from", description="Time the sandbox was started."
    )
    to: AwareDatetime | None = Field(
        None,
        description="Time the sandbox was stopped. If the sandbox is still running, this value will not exist for the last block.",
    )
    sandboxSeconds: int | None = Field(
        None,
        description="Number of seconds that the sandbox was running for this block.",
    )
    resourceProfile: SandboxResourceProfile | None = None
    exceedsTimeframe: bool | None = Field(
        None,
        description="This property is set to true if the block exceeds the given timeframe and was therefore trimmed.",
    )
    clusterName: str | None = Field(None, description="Cluster where sandbox resides.")


class SandboxUsageModel(BaseModel):
    id: str
    sandboxSeconds: int | None = Field(
        None, description="Total number of seconds during which the sandbox ran."
    )
    minutesUpByProfile: list[MinutesUpByProfileItem] | None = None
    minutesUp: int | None = Field(
        None,
        description="Sum of minutes sandboxes in this realm were running during the requested timeframe (by default, the previous 30 days).",
        examples=[360000],
    )
    minutesDown: int | None = Field(
        None,
        description="Sum of minutes sandboxes in this realm were not running during the requested timeframe (by default, the previous 30 days).",
        examples=[180000],
    )
    granularUsage: list[GranularUsage] | None = None
    history: list[HistoryItem] | None = Field(
        None,
        description="List of blocks, which describe the separate uptimes of a sandbox",
    )


class Operation1(Enum):
    start = "start"
    stop = "stop"
    restart = "restart"
    reset = "reset"
    create = "create"
    delete = "delete"
    upgrade = "upgrade"


class OperationState(Enum):
    pending = "pending"
    running = "running"
    finished = "finished"


class Status2(Enum):
    """
    Indicates whether the operation finished successfully ('Success') or not ('Failure').
    """

    success = "success"
    failure = "failure"


class SandboxOperationModel(BaseModel):
    id: str
    operation: Operation1
    createdAt: AwareDatetime | None = None
    operationBy: str | None = None
    operationState: OperationState
    sandboxState: SandboxState | None = None
    status: Status2 | None = Field(
        None,
        description="Indicates whether the operation finished successfully ('Success') or not ('Failure').",
    )


class SandboxUpdateRequestModel(BaseModel):
    emails: list[Email] | None = None
    ttl: int | None = Field(
        None,
        description="Number of hours added to the sandbox lifetime (must, together with previous extensions, adhere to the maximum TTL configuration). If set to 0 or less, the sandbox will have an infinite lifetime.",
    )
    resourceProfile: SandboxResourceProfile | None = None
    autoScheduled: bool | None = Field(
        None,
        description="If set to true, this sandbox will be captured by automated start-/stop -management.",
    )
    tags: list[str] | None = None
    startScheduler: Any | None = None
    stopScheduler: Any | None = None


class Method(Enum):
    get = "get"
    delete = "delete"
    patch = "patch"
    post = "post"
    put = "put"


class VersionRangeItem(BaseModel):
    """
    Use this document to grant resource permissions only to a subset of Open Commerce API versions. You can use the properties from and until to define the range. At least one of both must be specified.

    """

    from_: str | None = Field(
        None,
        alias="from",
        description="From version (for example, 18.1). If you don't specify the from version, all versions including the oldest are accessible.",
    )
    until: str | None = Field(
        None,
        description="Until version (for example, 18.1). The until version is exclusive, which means that it is not part of the range. If you don't specify the until version, all versions including the most recent one are accessible.\n",
    )


class Resource(BaseModel):
    """
    Configures resource specific permissions and settings.
    """

    methods: list[Method] = Field(
        ...,
        description='Open Commerce API HTTP method filter. For example, the filter ["get","patch"] allows access to the GET and PATCH methods for the specified resource path. You can specify methods that are supported for a resource. You can list all available resources and methods for the Shop API, version 18.1, with the following meta data call: http://{your-domain}/dw/meta/rest/shop/v18_1?client_id={your-client-id}\n',
    )
    read_attributes: str | None = Field(
        None,
        description="String that controls which properties are included in the response document. The configuration value must be specified using property selection syntax.\n",
    )
    write_attributes: str | None = Field(
        None,
        description="String that controls which properties can be included in the request document. The configuration value must be specified using property selection syntax.\n",
    )
    resource_id: str = Field(
        ...,
        description="OCAPI resource identifier. For example: /products/*/images or /products/specific_id/images. This property supports Ant path style to describe resource IDs. You can specify wildcards or specific product IDs; you can also specify the pattern /products/** to access to all available sub-resources. You can list all resource identifiers for the Shop API, version 18.1, with the following meta data call: http://{your-domain}/dw/meta/rest/shop/v18_1?client_id={your-client-id}\n",
    )
    version_range: list[VersionRangeItem] | None = Field(
        None,
        description="Version range documents granting permissions only to a subset of OCAPI versions.",
    )


class OcapiSetting(BaseModel):
    """
    Describes Open Commerce API permissions for a client application.
    """

    client_id: UUID = Field(..., description="Client application ID.")
    resources: list[Resource] | None = Field(
        None, description="Array of resource-specific permission documents."
    )


class Operation2(Enum):
    read = "read"
    read_write = "read_write"


class Permission(BaseModel):
    """
    Use this document to configure WebDAV permissions.
    """

    path: str = Field(
        ...,
        description="Directory for which the WebDAV permission is granted, including all subdirectories. File-specific permissions are not permitted.\n",
    )
    operations: list[Operation2] = Field(
        ...,
        description="Array of operations granted on this directory. Possible values are read and read_write.\n",
        min_length=1,
    )


class WebDavSetting(BaseModel):
    """
    An array of client-specific permission documents.
    """

    client_id: UUID = Field(
        ...,
        description="Client ID indicating the API client for which the permissions are configured.",
    )
    permissions: list[Permission] = Field(
        ...,
        description="Array of directory-based permissions documents. Multiple permissions paths cannot intersect each other; for example, the following two paths intersect and are therefore invalid: /impex/src and /impex/src/foo.\n",
    )


class Version(Enum):
    v1 = "v1"


class Git(BaseModel):
    commit: str | None = None
    time: AwareDatetime | None = None


class Build(BaseModel):
    version: str | None = None
    time: AwareDatetime | None = None


class ApiVersion(BaseModel):
    version: Version | None = None
    git: Git | None = None
    build: Build | None = None


class User(BaseModel):
    id: str | None = Field(None, description="User's unique ID on Account Manager.")
    email: str | None = Field(None, description="User's email address.")
    name: str | None = Field(None, description="User's human-readable, full name.")


class Client(BaseModel):
    id: str | None = Field(
        None, description="OAuth client ID used to retrieve the access token."
    )


class UserInfoSpec(BaseModel):
    user: User | None = None
    client: Client | None = None
    roles: list[str] | None = Field(
        None, description="User's roles as returned by Account Manager."
    )
    realms: list[str] | None = Field(
        None,
        description="Realms that the user is allowed to access. All sandboxes within these realms are accessible.",
    )
    sandboxes: list[str] | None = Field(
        None, description="Sandboxes that the user is allowed to access."
    )


class SystemInfoSpec(BaseModel):
    region: str | None = Field(
        None, description="The region, the system is deployed on."
    )
    systemIps: list[str] | None = Field(
        None, description="Public IP addresses of internal services like API server"
    )
    sandboxIps: list[str] | None = Field(
        None, description="Public IP addresses of all sandboxes"
    )
    inboundIps: list[str] | None = Field(
        None, description="IP addresses for incoming traffic."
    )
    outboundIps: list[str] | None = Field(
        None, description="IP addresses for outgoing traffic."
    )


class Status3(Enum):
    """
    String with value 'Success' or 'Failure' to indicate request outcome.
    """

    Success = "Success"
    Failure = "Failure"


class ErrorModel(BaseModel):
    status: Status3 = Field(
        ...,
        description="String with value 'Success' or 'Failure' to indicate request outcome.",
    )
    message: str | None = Field(
        None, description="Human-readable description of the error."
    )
    reason: str | None = Field(
        None,
        description="Machine-readable, one-word, CamelCase description of why the operation failed. If this value is empty, there is no information available. The reason clarifies an HTTP status code but does not override it.",
    )
    details: dict[str, str] | None = Field(
        None,
        description="Extended data associated with the reason. Each reason can define its own extended details. This field is optional, and the data returned is not guaranteed to conform to any schema except that defined by the reason type.",
    )


class PagingMetadata(BaseModel):
    page: int | None = Field(None, description="Index of the current page.")
    perPage: int | None = Field(None, description="Maximum count of elements per page.")
    pageCount: int | None = Field(None, description="Total count of pages.")
    totalCount: int | None = Field(None, description="Total count of elements.")
    links: PagingLinks | None = None


class RealmModel(BaseModel):
    id: str = Field(..., description="GUID of the realm in the system.")
    name: str | None = Field(
        None, description="Human-readable four-letter ID of the realm."
    )
    enabled: bool | None = Field(
        None,
        description="Flag indicating whether the realm is enabled for any operations.",
    )
    usage: RealmUsageSummaryModel | None = None
    configuration: RealmConfigurationModel | None = None
    accountdetails: AccountDetailsModel | None = None


class RealmConfigurationResponse(StatusResponse):
    data: RealmConfigurationModel | None = None


class SandboxCloneCreateResponse(StatusResponse):
    data: SandboxCloneCreateModel | None = None


class SandboxCloneGetModel(BaseModel):
    cloneId: str | None = None
    realm: str | None = None
    sourceInstance: str | None = None
    targetInstance: str | None = None
    sourceInstanceId: str | None = None
    targetInstanceId: str | None = None
    targetProfile: SandboxResourceProfile | None = None
    createdAt: AwareDatetime | None = None
    createdBy: str | None = None
    lastUpdated: AwareDatetime | None = None
    status: SandboxCloneState | None = None
    elapsedTimeInSec: int | None = None
    progressPercentage: int | None = None
    lastKnownState: str | None = Field(
        None,
        description="The last known clone processing state before completion or failure",
    )
    customCodeVersion: str | None = None
    storefrontCount: int | None = None
    filesystemUsageSize: int | None = None
    databaseTransferSize: int | None = None
    batchId: str | None = Field(
        None,
        description="Shared batch identifier for clones created together via 1 to many cloning. Absent for single (1:1) clones.",
    )
    siblingCloneIds: list[str] | None = Field(
        None,
        description="cloneIds of all clones in the same 1 to many batch, in target-index order (element i = cloneId of target index i). Includes this clone. Absent for single (1:1) clones.",
    )


class SandboxCloneProvisioningRequestModel(BaseModel):
    targetProfile: SandboxResourceProfile | None = None
    targetCount: int | None = Field(
        1,
        description="Number of sandbox clones to create from this source (1 to many cloning). Valid values are 1 to 5. Defaults to 1 (a single 1:1 clone). When greater than 1, the clones fan out as a batch sharing a batchId.",
        ge=1,
        le=5,
    )
    emails: list[Email] | None = Field(
        None, examples=[["email1@example.com", "email2@example.com"]]
    )
    ttl: int | None = Field(
        24,
        description="Number of hours for the sandbox clone lifetime. Valid values are: 0 or negative (infinite lifetime), or 24 hours and above. Values between 1 and 23 are not allowed. The TTL must also adhere to the maximum TTL configuration for the realm.",
    )


class SandboxModel(BaseModel):
    id: str | None = None
    realm: str | None = None
    emails: list[Email] | None = None
    enabled: bool | None = Field(
        None,
        description="Flag indicating whether the sandbox is enabled for any operations.",
    )
    instance: str | None = None
    versions: Versions | None = Field(
        None,
        description="Versions of the components that make up the sandbox.",
        title="SandboxModelVersions",
    )
    autoScheduled: bool | None = Field(
        None,
        description="Defaults to false. If set to true, the sandbox is covered by automatic start/stop actions, which can be set to a dedicated time via realm- configuration API.",
    )
    analyticsEnabled: bool | None = Field(
        None,
        description="Defaults to false. If set to true, analytics will be enabled in ODS.",
    )
    resourceProfile: SandboxResourceProfile | None = None
    state: SandboxState | None = None
    createdAt: AwareDatetime | None = None
    createdBy: str | None = None
    deletedAt: AwareDatetime | None = Field(
        None, description="Time when the delete operation was created."
    )
    deletedBy: str | None = Field(
        None, description="User who requested the sandbox deletion."
    )
    eol: AwareDatetime | None = None
    tags: list[str] | None = None
    hostName: str | None = None
    links: Links | None = Field(
        None, description="Set of named links for accessing the sandbox."
    )
    startScheduler: WeekdaySchedule | None = None
    stopScheduler: WeekdaySchedule | None = None
    clonedFrom: str | None = Field(
        None,
        description="The realm-instance identifier of the source sandbox from which this sandbox was cloned.",
    )
    sourceInstanceIdentifier: str | None = Field(
        None,
        description="The UUID of the source sandbox from which this sandbox was cloned.",
    )
    cloneDetails: SandboxCloneGetModel | None = Field(
        None,
        description="Detailed clone information if this sandbox was created by cloning another sandbox. Only present when expand=clonedetails is requested and the sandbox is a clone.",
    )


class SandboxInfo(BaseModel):
    realm: str | None = None
    resourceProfile: SandboxResourceProfile | None = None
    createdAt: AwareDatetime | None = None
    deletedAt: AwareDatetime | None = Field(
        None, description="Time when the delete operation was created."
    )
    name: str | None = Field(None, description="Name of the sandbox")
    instanceId: str | None = Field(None, description="instanceId of the sandbox")
    minutesUpByProfile: list[MinutesUpByProfileItem] | None = None
    minutesUp: int | None = Field(
        None,
        description="Minutes sandbox in this realm was running during the requested timeframe (by default, the previous 30 days).",
        examples=[360000],
    )
    minutesDown: int | None = Field(
        None,
        description="Minutes sandbox in this realm was not running during the requested timeframe (by default, the previous 30 days).",
        examples=[180000],
    )
    autoScheduled: bool | None = Field(
        None,
        description="Defaults to false. If set to true, the sandbox is covered by automatic start/stop actions, which can be set to a dedicated time via realm- configuration API.:",
    )
    startScheduler: WeekdaySchedule | None = None
    stopScheduler: WeekdaySchedule | None = None
    clusterName: str | None = Field(None, description="Cluster where sandbox resides.")


class SandboxAliasResponse(StatusResponse):
    data: SandboxAliasModel | None = None


class SandboxAliasListResponse(StatusResponse):
    data: list[SandboxAliasModel] | None = None


class SandboxOperationResponse(StatusResponse):
    data: SandboxOperationModel | None = None


class SandboxStorageResponse(StatusResponse):
    data: dict[str, StorageUsageModel] | None = None


class SandboxUsageResponse(StatusResponse):
    data: SandboxUsageModel | None = None


class SandboxSettings(BaseModel):
    """
    Map of additional settings evaluated when the sandbox is provisioned and initialized.
    """

    ocapi: list[OcapiSetting] | None = Field(
        None,
        description="Use this document to configure Open Commerce API permissions for multiple client applications in the context of a single site.",
        min_length=1,
    )
    webdav: list[WebDavSetting] | None = Field(
        None,
        description="WebDAV settings contain WebDAV client permissions for multiple client applications in the context of your organization. WebDAV client permissions enable you to configure which API clients can access your WebDAV files. These permissions also give you fine-grained control over which directories each client can access.\n",
        min_length=1,
    )


class ApiVersionResponse(StatusResponse):
    data: ApiVersion | None = None


class UserInfoResponse(StatusResponse):
    data: UserInfoSpec | None = None


class SystemInfoResponse(StatusResponse):
    data: SystemInfoSpec | None = None


class ErrorResponse(StatusResponse):
    error: ErrorModel | None = None


class PagedResponse(StatusResponse):
    metadata: PagingMetadata | None = None


class RealmResponse(StatusResponse):
    data: RealmModel | None = None


class RealmUsageModel(BaseModel):
    id: str = Field(..., description="GUID of the realm in the system.")
    accountId: str | None = Field(
        None,
        description="account/SFID of the realm in clusterstate table or org62 Tenant table",
    )
    createdSandboxes: int | None = Field(
        None,
        description="Total number of sandboxes created during the requested timeframe (by default, the previous 30 days).",
        examples=[93],
    )
    activeSandboxes: int | None = Field(
        None,
        description="Total number of sandboxes active during the requested timeframe (by default, the previous 30 days).",
        examples=[128],
    )
    deletedSandboxes: int | None = Field(
        None,
        description="Total number of sandboxes deleted during the requested timeframe (by default, the previous 30 days).",
        examples=[86],
    )
    sandboxSeconds: int | None = Field(
        None,
        description="Total number of seconds sandboxes ran during the requested timeframe (by default, the previous 30 days).",
        examples=[360000],
    )
    minutesUpByProfile: list[MinutesUpByProfileItem] | None = None
    minutesUp: int | None = Field(
        None,
        description="Sum of minutes sandboxes in this realm were running during the requested timeframe (by default, the previous 30 days).",
        examples=[360000],
    )
    minutesDown: int | None = Field(
        None,
        description="Sum of minutes sandboxes in this realm were not running during the requested timeframe (by default, the previous 30 days).",
        examples=[180000],
    )
    sandboxDetails: list[SandboxInfo] | None = None
    granularUsage: list[GranularUsage] | None = None


class SandboxListResponse(StatusResponse):
    data: list[SandboxModel] | None = None


class SandboxResponse(StatusResponse):
    data: SandboxModel | None = None


class SandboxCloneListResponse(StatusResponse):
    data: list[SandboxCloneGetModel] | None = None


class SandboxCloneResponse(StatusResponse):
    data: SandboxCloneGetModel | None = None


class SandboxOperationListResponse(PagedResponse):
    data: list[SandboxOperationModel] | None = None


class SandboxSettingsResponse(StatusResponse):
    data: SandboxSettings | None = None


class SandboxProvisioningRequestModel(BaseModel):
    realm: str
    emails: list[Email] | None = None
    ttl: int | None = Field(
        None,
        description="Number of hours the sandbox will live (must adhere to the maximum TTL quotas). If set to 0 or less, the sandbox will have an infinite lifetime.",
    )
    autoScheduled: bool | None = Field(
        None,
        description="Defaults to false. If set to true, the sandbox is covered by automatic start/stop actions, which can be set to a dedicated time via realm- configuration API.",
    )
    analyticsEnabled: bool | None = Field(
        False,
        description="Defaults to false. If set to true, analytics will be enabled in ODS.",
    )
    tags: list[str] | None = None
    startScheduler: Any | None = None
    stopScheduler: Any | None = None
    resourceProfile: SandboxResourceProfile | None = None
    settings: SandboxSettings | None = None


class RealmUsageResponse(StatusResponse):
    data: RealmUsageModel | None = None


class MultiRealmUsageModel(BaseModel):
    realmName: str = Field(..., description="GUID of the realm in the system.")
    realmUsage: RealmUsageModel | None = None
    error: str | None = Field(None, description="Error while getting usage.")


class MultiRealmUsageResponse(StatusResponse):
    data: list[MultiRealmUsageModel] | None = None
