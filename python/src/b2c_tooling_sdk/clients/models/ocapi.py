# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from datetime import date as date_aliased
from datetime import time as time_aliased
from enum import Enum, IntEnum
from typing import Any

from pydantic import AwareDatetime, BaseModel, EmailStr, Field, RootModel


class String(RootModel[str]):
    root: str


class ExpirationType(Enum):
    """
    The participant expiration type of the A/B Test. Defaults to 'never' if not specified on create
    """

    session = "session"
    never = "never"


class Status(Enum):
    """
    Status of A/B test. This is a computed attribute and cannot be modified
    """

    ended = "ended"
    planned = "planned"
    running = "running"


class AbTestGroup(BaseModel):
    """
    <p>Document representing an A/B Test Group</p>
    """

    allocation: int | None = Field(None, description="Test Group percentage allocation")
    custom_experience: bool | None = Field(
        None,
        description="Flag to determine if this Test Group is a customer experience",
    )
    description: str | None = Field(None, description="Test Group description")
    id: str | None = Field(None, description="Test group id")


class AbTestSegmentStats(BaseModel):
    adds_to_baskets: int | None = Field(None, description="")
    average_adds_per_basket: float | None = Field(None, description="")
    average_adds_per_basket_std_error: float | None = Field(None, description="")
    average_discount_amount: float | None = Field(None, description="")
    average_discount_amount_std_error: float | None = Field(None, description="")
    average_discount_amount_with_coupon: float | None = Field(None, description="")
    average_discount_amount_with_coupon_std_error: float | None = Field(
        None, description=""
    )
    average_discount_amount_without_coupon: float | None = Field(
        None,
        description="The standard error for the average amount discounted for orders without using a coupon",
    )
    average_discount_amount_without_coupon_std_error: float | None = Field(
        None, description="Units sold per hour"
    )
    average_order_value: float | None = Field(None, description="")
    average_order_value_std_error: float | None = Field(None, description="")
    average_revenue_per_visit: float | None = Field(None, description="")
    average_revenue_per_visit_std_error: float | None = Field(None, description="")
    average_units_added_per_basket: float | None = Field(None, description="")
    average_units_adder_per_basket_std_error: float | None = Field(None, description="")
    average_units_per_order_std_error: float | None = Field(None, description="")
    average_units_per_visit: float | None = Field(None, description="")
    average_units_per_visit_std_error: float | None = Field(None, description="")
    basket_rate: float | None = Field(None, description="")
    baskets: float | None = Field(None, description="")
    checkout_rate: float | None = Field(None, description="")
    checkouts: int | None = Field(None, description="")
    conversion_rate: float | None = Field(None, description="")
    discount_amount_with_coupon: float | None = Field(None, description="")
    discount_amount_without_coupon: float | None = Field(None, description="")
    orders: int | None = Field(None, description="")
    revenue: float | None = Field(None, description="")
    total_discount_amount: float | None = Field(None, description="")
    units: float | None = Field(None, description="")
    units_added_to_baskets: float | None = Field(None, description="")
    visitors: int | None = Field(None, description="")
    visits: int | None = Field(None, description="")


class TriggerType(Enum):
    """
    The type of the trigger. Defaults to 'immediately' if not specified on create
    """

    immediately = "immediately"
    category_page_view = "category_page_view"
    home_page_view = "home_page_view"
    pipeline_call = "pipeline_call"


class AbTestTrigger(BaseModel):
    """
    <p>Document representing an A/B Test trigger.</p>
    """

    categories: list[str] | None = Field(
        None,
        description="The list of categories. This is a modifiable attribute when trigger type is 'category_page_view' only",
    )
    is_pipeline_based: bool | None = Field(
        None,
        description="The flag indicating if the trigger is based on pipelines. This is a computed attribute and cannot be modified",
    )
    pipeline_calls: list[str] | None = Field(
        None,
        description="The list of pipeline name and start node combinations (for example, Account-Show). This is a modifiable attribute when trigger type is 'pipeline_calls' only",
    )
    trigger_type: TriggerType | None = Field(
        None,
        description="The type of the trigger. Defaults to 'immediately' if not specified on create",
    )


class AccessKeyDetails(BaseModel):
    """
    <p>Access key information</p>
    """

    access_key: str | None = Field(
        None,
        description="The newly created access key (only available upon access key creation, missing otherwise).",
    )
    enabled: bool | None = Field(
        None, description="True when the access key is enabled."
    )
    expiration_date: AwareDatetime | None = Field(
        None, description="The date when the access key expires."
    )


class AccessKeyUpdateRequest(BaseModel):
    """
    <p>Request body to enable / disable an access key.</p>
    """

    enabled: bool | None = Field(
        None, description="True when the access key should be enabled."
    )


class TypeCode(Enum):
    """
    The type code of the gift certificate
    """

    create = "create"
    redeem = "redeem"
    delete = "delete"
    enable = "enable"
    disable = "disable"


class DefaultPriority(Enum):
    """
    The default priority.
    """

    not_allowed = "not_allowed"
    hidden = "hidden"
    informational = "informational"
    warning = "warning"
    action_required = "action_required"


class AlertDescriptor(BaseModel):
    """
    <p>Document describing a single alert descriptor.</p>
    """

    application_context_path: str | None = Field(
        None, description="The application context path.", min_length=1
    )
    application_id: str | None = Field(
        None, description="The application ID.", min_length=1
    )
    context_object_type: str | None = Field(
        None, description="The context object type."
    )
    default_priority: DefaultPriority | None = Field(
        None, description="The default priority."
    )
    link: str | None = Field(None, description="URL for this resource.", min_length=1)
    message_id: str | None = Field(None, description="The message ID.", min_length=1)


class Priority(Enum):
    """
    The user priority.
    """

    hidden = "hidden"
    informational = "informational"
    warning = "warning"
    action_required = "action_required"


class AlertDescriptorSettings(BaseModel):
    """
    <p>Document describing settings for a single alert descriptor.</p>
    """

    application_context_path: str = Field(
        ..., description="The application context path.", min_length=1
    )
    application_id: str = Field(..., description="The application ID.", min_length=1)
    is_user_override: bool = Field(
        ...,
        description="<p>Flag that indicates whether the settings for this descriptor have been changed by the user.</p> <p>In a PATCH request, this flag must be set to <code>true</code> to override the default settings. If this flag to <code>false</code> in a PATCH request, the default user settings for this descriptor are restored (and all other fields are ignored).</p>",
    )
    message_id: str = Field(..., description="The message ID.", min_length=1)
    priority: Priority = Field(..., description="The user priority.")
    show_in_header: bool = Field(
        ...,
        description="Flag that indicates whether the alert is shown in the Business Manager header.",
    )
    show_on_banner: bool | None = Field(
        None,
        description="Flag that indicates whether the alert is shown on the Business Manager banner (on every page).",
    )
    show_on_homepage: bool = Field(
        ...,
        description="Flag that indicates whether the alert is shown on the Business Manager homepage.",
    )


class AlertDescriptors(BaseModel):
    """
    <p>Document containing a collection of alert descriptors.</p>
    """

    data: list[AlertDescriptor] | None = Field(
        None, description="Collection of alert descriptors"
    )


class AlertDescriptorsRevalidationRequest(BaseModel):
    """
    <p>Contains parameters for a alert descriptor revalidation request.</p>
    """

    context_object_id: str | None = Field(
        None,
        description="ID of the object in which context messages should be revalidated.",
    )


class AlertSettings(BaseModel):
    """
    <p>Document containing the alert settings of a user.</p>
    """

    settings: list[AlertDescriptorSettings] | None = Field(
        None, description="Alert settings."
    )


class Operator(Enum):
    """
    The logical operator the filters are combined with.
    """

    and_ = "and"
    or_ = "or"
    not_ = "not"


class Campaign(BaseModel):
    """
    <p>Document representing a campaign.</p>
    """

    campaign_id: str | None = Field(
        None, description="The ID of the campaign.", max_length=256, min_length=1
    )
    coupons: list[str] | None = Field(
        None, description="The array of assigned coupon IDs, not sorted"
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    customer_groups: list[str] | None = Field(
        None, description="The array of assigned customer groups, not sorted"
    )
    description: str | None = Field(
        None, description="The description of the campaign.", max_length=4000
    )
    enabled: bool | None = Field(None, description="The enabled flag for campaign.")
    end_date: AwareDatetime | None = Field(
        None, description="The date that the Scenario ends"
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(None, description="link for convenience")
    source_code_groups: list[str] | None = Field(
        None, description="The array of assigned source code groups, not sorted"
    )
    start_date: AwareDatetime | None = Field(
        None, description="The date that the Scenario begins"
    )


class Campaigns(BaseModel):
    """
    <p>Document representing an unfiltered list of campaigns.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Campaign] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class Position(Enum):
    """
    Position of the cartridge.
    """

    first = "first"
    last = "last"
    before = "before"
    after = "after"


class CartridgePathAddRequest(BaseModel):
    """
    <p>Request body for post operation</p>
    """

    name: str = Field(..., description="Name of the cartridge.")
    position: Position = Field(..., description="Position of the cartridge.")
    target: str | None = Field(
        None,
        description="When position is 'before' or 'after', need to specify the target cartridge",
    )


class CartridgePathApiResponse(BaseModel):
    """
    <p>Response of cartridge path related operation</p>
    """

    cartridges: str | None = Field(None, description="Updated cartridge path")
    site_id: str | None = Field(None, description="Site id")


class CartridgePathCreateRequest(BaseModel):
    """
    <p>Request Body for put operation</p>
    """

    cartridges: str = Field(..., description="New cartridge path")


class CatalogCategoryId(BaseModel):
    """
    <p>Document representing a catalog category id.</p>
    """

    catalog_id: str | None = Field(
        None,
        description="The id of the catalog that owns the category.",
        max_length=256,
        min_length=1,
    )
    category_id: str | None = Field(
        None, description="The id of the category.", max_length=256, min_length=1
    )


class CHeaderMenuOrientation(Enum):
    """
    Which way to orient the menu and optional header menu HTML. Vertical will list all in one line. Horizontal will list in columns.
    """

    Horizontal = "Horizontal"
    Vertical = "Vertical"


class Type(Enum):
    """
    The link type
    """

    other = "other"
    accessories = "accessories"
    cross_selling = "cross_selling"
    up_selling = "up_selling"
    spare_parts = "spare_parts"


class CategoryLink(BaseModel):
    """
    <p>Document representing a category link</p>
    """

    last_modified: AwareDatetime | None = Field(
        None, description="The date the link was last modified"
    )
    link: str | None = Field(None, description="URL that is used to get this instance")
    position: float | None = Field(
        None,
        description="The position in the source catalog / category for this link relative to the other links in the same category.",
        ge=0.0,
    )
    source_catalog_id: str | None = Field(
        None, description="The source catalog for the link"
    )
    source_catalog_name: dict[str, str] | None = Field(
        None, description="The name of the source catalog"
    )
    source_category_id: str | None = Field(
        None, description="The source category for the link"
    )
    source_category_name: dict[str, str] | None = Field(
        None, description="The name of the source category"
    )
    target_catalog_id: str | None = Field(
        None, description="The target category for the link"
    )
    target_catalog_name: dict[str, str] | None = Field(
        None, description="The name of the target catalog"
    )
    target_category_id: str | None = Field(
        None, description="The target category for the link"
    )
    target_category_name: dict[str, str] | None = Field(
        None, description="The name of the target category"
    )
    type: Type | None = Field(None, description="The link type")


class CategoryLinks(BaseModel):
    """
    <p>Document representing an unfiltered list of category links.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[CategoryLink] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class CodeVersion(BaseModel):
    """
    <p>Document representing a code version</p>
    """

    activation_time: AwareDatetime | None = Field(
        None, description="The code version activation time."
    )
    active: bool | None = Field(
        None,
        description="Use this method to determine, if this code version is currently active.",
    )
    cartridges: list[str] | None = Field(
        None,
        description="A list containing the names of all cartridges participating in this code version.",
    )
    compatibility_mode: str | None = Field(
        None, description="The code version compatibility mode."
    )
    id: str | None = Field(None, description="The code version id.")
    last_modification_time: AwareDatetime | None = Field(
        None, description="The last time, when the code version was changed."
    )
    rollback: bool | None = Field(
        None,
        description="Use this method to determine, if this code version is the current rollback version.",
    )
    total_size: int | None = Field(
        None,
        description="Returns the total size of the file system content of this code version in bytes.",
    )
    web_dav_url: str | None = Field(
        None,
        description="Returns the HTTPS based WebDAV URL that can be used to access the code version resources.",
    )


class CodeVersionResult(BaseModel):
    """
    <p>Result document containing an array of code versions.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[CodeVersion] | None = Field(
        None, description="The array of code versions"
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class SiteMapChangeFrequency(Enum):
    always = "always"
    daily = "daily"
    hourly = "hourly"
    monthly = "monthly"
    never = "never"
    weekly = "weekly"
    yearly = "yearly"


class SiteMapIncluded(IntEnum):
    integer_0 = 0
    integer_1 = 1


class SiteMapPriority(RootModel[float]):
    root: float = Field(..., le=1.0)


class ContentFolderAssignment(BaseModel):
    """
    <p>Document representing a content folder assignment.</p>
    """

    field_200: bool | None = Field(
        None,
        alias="200",
        description="A flag indicating whether the assignment is the default one.",
    )
    content_id: str | None = Field(None, description="The content id.", max_length=256)
    content_link: str | None = Field(None, description="The content link.")
    folder_id: str | None = Field(None, description="The folder id.", max_length=256)
    folder_link: str | None = Field(None, description="The folder link.")
    position: float | None = Field(
        None, description="The position of the content asset in the folder.", ge=0.0
    )


class Type1(Enum):
    """
    The type of the coupon code.
    """

    single_code = "single_code"
    multiple_codes = "multiple_codes"
    system_codes = "system_codes"


class CouponCode(BaseModel):
    """
    <p>A coupon code with accompanying stats for redemptions and issued.</p>
    """

    code: str | None = Field(None, description="The code used to redeem the coupon")
    issued: bool | None = Field(
        None, description="Flag indicating if the coupon code has been issued"
    )
    redemption_count: int | None = Field(
        None,
        description="The count of the number of redemptions associated with the code",
    )


class CouponCodes(BaseModel):
    """
    <p>Document representing a set of coupon codes.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[CouponCode] | None = Field(
        None, description="The collection of coupon codes"
    )
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class CouponMultiCodesRequest(BaseModel):
    """
    <p>A request object to add and remove coupon codes from a document</p>
    """

    codes: list[str] = Field(
        ..., description="The list of coupon codes to add or delete"
    )


class CouponRedemption(BaseModel):
    """
    <p>A redemption record returned from the coupon redemption resources</p>
    """

    code: str | None = Field(None, description="The coupon code that was redeemed")
    coupon_id: str | None = Field(None, description="The coupon id that was redeemed")
    creation_date: AwareDatetime | None = None
    customer_email: str | None = Field(
        None, description="The customer email that was used to redeem it"
    )
    last_modified: AwareDatetime | None = None
    order_no: str | None = Field(
        None, description="The order number where the redemption occurred"
    )
    view_order_url: str | None = Field(
        None, description="A URL able to access the order"
    )


class CouponSystemCodeConfig(BaseModel):
    code_prefix: str | None = Field(
        None, description="The code prefix for system-generated coupon codes."
    )
    number_of_codes: int | None = Field(
        None, description="The number of system coupon codes that can be issued."
    )


class Credentials(BaseModel):
    """
    <p>Document representing the credentials of a customer.</p>
    """

    enabled: bool | None = Field(
        None,
        description="A flag indicating whether the customer is enabled and can log.",
    )
    locked: bool | None = Field(
        None, description="A flag indicating whether the customer account is locked."
    )
    login: str = Field(..., description="The login of the customer.", max_length=256)
    password_question: str | None = Field(
        None, description="The password question.", max_length=256
    )


class CustomObject(BaseModel):
    """
    <p>Document representing a custom object that contains all defined custom attributes for its object type.</p>
    """

    key_property: str | None = Field(
        None,
        description="The name of the key property for the custom object. This is ignored in input documents.",
    )
    key_value_integer: int | None = Field(
        None,
        description="The id of the custom object when the type of the key is Integer. This is ignored in input documents.",
    )
    key_value_string: str | None = Field(
        None,
        description="The id of the custom object when the type of the key is String. This is ignored in input documents.",
    )
    object_type: str | None = Field(
        None,
        description="The id of the object type. This is ignored in input documents.",
    )


class Gender(IntEnum):
    """
    The customer's gender.
    """

    integer_1 = 1
    integer_2 = 2


class CountryCode(Enum):
    """
    The customer's two-character country code per ISO 3166-1 alpha-2.
    """

    CN = "CN"
    FR = "FR"
    GB = "GB"
    IT = "IT"
    JP = "JP"
    US = "US"


class CustomerAddress(BaseModel):
    """
    <p>Document representing a customer address.</p>
    """

    address1: str | None = Field(
        None, description="The customer's first address.", max_length=256
    )
    address2: str | None = Field(
        None, description="The customer's second address value.", max_length=256
    )
    address_id: str = Field(..., description="The customer address id.", max_length=256)
    city: str | None = Field(None, description="The customer's city.", max_length=256)
    company_name: str | None = Field(
        None, description="The customer's company name.", max_length=256
    )
    country_code: CountryCode = Field(
        ...,
        description="The customer's two-character country code per ISO 3166-1 alpha-2.",
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    etag: str | None = None
    first_name: str | None = Field(
        None, description="The customer's first name.", max_length=256
    )
    full_name: str | None = Field(
        None,
        description="The concatenation of the customer's first, middle, and last names and its suffix.",
    )
    job_title: str | None = Field(
        None, description="The customer's job title.", max_length=256
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    last_name: str = Field(..., description="The customer's last name.", max_length=256)
    phone: str | None = Field(
        None, description="The customer's phone number.", max_length=32
    )
    post_box: str | None = Field(
        None, description="The customer's post box.", max_length=256
    )
    postal_code: str | None = Field(
        None, description="The customer's postal code.", max_length=256
    )
    salutation: str | None = Field(
        None, description="The customer's salutation.", max_length=256
    )
    second_name: str | None = Field(
        None, description="The customer's second name.", max_length=256
    )
    state_code: str | None = Field(
        None, description="The customer's state.", max_length=256
    )
    suffix: str | None = Field(
        None, description="The customer's suffix.", max_length=256
    )
    suite: str | None = Field(None, description="The customer's suite.", max_length=32)
    title: str | None = Field(None, description="The customer's title.", max_length=256)


class CustomerAddressResult(BaseModel):
    """
    <p>Result document containing an array of customer addresses.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[CustomerAddress] | None = Field(
        None, description="The array of customer address documents."
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class Type2(Enum):
    """
    The type of the customer group.  This property is read-only.
    """

    system = "system"
    dynamic = "dynamic"
    static = "static"


class CustomerGroupMember(BaseModel):
    """
    <p>Document representing a customer group member</p>
    """

    active: bool | None = Field(
        None,
        description="A flag indicating whether the customer is enabled and can log in.",
    )
    c_familyStatus: str | None = None
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    customer_link: str | None = Field(
        None, description="The link to the customer resource.", max_length=256
    )
    customer_no: str | None = Field(
        None, description="The customers number (id).", max_length=100
    )
    email: EmailStr | None = Field(
        None, description="The customer's email address.", max_length=256
    )
    first_name: str | None = Field(
        None, description="The customer's first name.", max_length=256
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    last_name: str | None = Field(
        None, description="The customer's last name.", max_length=256
    )
    link: str | None = Field(
        None,
        description="The link to the customer group member resource.",
        max_length=256,
    )
    login: str | None = Field(
        None, description="The login of the customer.", max_length=256
    )


class CustomerGroupMembers(BaseModel):
    """
    <p>Document representing an unfiltered list of customer groups.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[CustomerGroupMember] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class CustomerListLink(BaseModel):
    """
    <p>Document representing a link to a customer list.</p>
    """

    customer_list_id: str | None = Field(None, description="The customerlist id.")
    link: str | None = Field(None, description="The target of the link.")
    title: dict[str, str] | None = Field(None, description="The link title.")


class CustomerListPreferences(BaseModel):
    """
    <p>Document representing customer list preferences:
      <ul>
      <li> data-retention-age </li>
      <li> customerno-sequence-enabled </li>
      <li> lockout-enabled </li>
      <li> max-failed-logins </li>
      <li> lockout-effective-period </li>
      <li> login-attempt-reset-time </li>
      <li> min-password-length </li>
      <li> min-password-special-chars </li>
      <li> force-password-contains-alpha </li>
      <li> force-password-contains-numeric </li>
      <li> force-password-mixed-case </li>
      <li> max-password-age </li>
      <li> max-password-reset-token-age </li>
      </ul></p>
    """

    customer_no_sequence_enabled: bool = Field(
        ...,
        description="Used to determine if the customer number sequence is separated by customer list.",
    )
    data_retention_age: int = Field(
        ...,
        description="The number days to retain customer data (null or 0 <= x <= 99999).",
    )
    force_password_contains_alpha: bool = Field(
        ...,
        description="Used to determine if the password must contain an alphabetic character.",
    )
    force_password_contains_numeric: bool = Field(
        ...,
        description="Used to determine if the password must contain a numeric character.",
    )
    force_password_mixed_case: bool = Field(
        ..., description="Used to determine if the password must be mixed case."
    )
    lockout_effective_period: int = Field(
        ...,
        description="The customer lockout period in minutes (one of 1, 30, 60, 120, 1440, 14400).",
    )
    lockout_enabled: bool = Field(
        ..., description="Used to determine if customers can be locked out."
    )
    login_attempt_reset_time: int = Field(
        ...,
        description="The period after which the customer login attempt count resets in minutes (one of 0, 5, 30, 60, 120, 1440).\n\n         1440)",
    )
    max_failed_logins: int = Field(
        ...,
        description="The maximum number of failed logins before a customer lockout can occur (1 <= x <= 200).",
    )
    max_password_age: int = Field(
        ...,
        description="The maximum age of the customer password in days (one of 7, 10, 14, 30, 60, 90, 365000).",
    )
    max_password_reset_token_age: int = Field(
        ...,
        description="The maximum age of the customer password reset token in minutes (one of 30, 60, 120, 360, 720, 1440).",
    )
    min_password_length: int = Field(
        ...,
        description="The minimum number of characters required for a customer password (one of 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,\n 13, 14, 15, 20).\n\n         12, 13, 14, 15, 20)",
    )
    min_password_special_chars: int = Field(
        ...,
        description="The minimum number of special characters required within a customer password (one of 0, 1, 2, 3, 4, 5).",
    )


class EcdnLogFetchRequest(BaseModel):
    """
    <p>Input-Document for requesting a Log-Fetch process.</p>
    """

    end_time: AwareDatetime | None = Field(
        None,
        description="Optional end time for log file entries, in Unix time stamp format. Must not be more than 1 hour after the start time. If not passed, a one hour time frame is assumed for the log file.",
    )
    start_time: AwareDatetime = Field(
        ...,
        description="Start time for log file entries, in Unix time stamp format. Must not be more than 7 days in the past",
    )
    zone_id: str | None = Field(
        None,
        description="zone id is optional but if it is provided then zone_name is not considered",
    )
    zone_name: str = Field(
        ...,
        description="The internationalized domain name representation (from RFC 3490) of the zone name",
    )


class Status1(Enum):
    """
    Current status of the log fetch request
    """

    pending = "pending"
    running = "running"
    finished = "finished"


class EcdnLogFetchResponse(BaseModel):
    """
    <p>Response object, providing the status of the current log fetch request.</p>
    """

    id: str | None = Field(None, description="ID of the log fetch request")
    link: str | None = Field(
        None,
        description="HTTPS Download link to the fetched log file, which has a lifetime of 30 minutes. This link will only appear, if the current status of the log fetching is 'finished'.",
    )
    message: str | None = Field(None, description="message for the log fetch request")
    status: Status1 | None = Field(
        None, description="Current status of the log fetch request"
    )


class EmptyBody(RootModel[Any]):
    root: Any


class FunctionalPermission(BaseModel):
    """
    <p>Document representing a functional permission.</p>
    """

    description: dict[str, str] | None = Field(
        None, description="The description of the functional permission."
    )
    display_name: dict[str, str] | None = Field(
        None, description="The display name of the functional permission."
    )
    name: str | None = Field(None, description="The name of the functional permission.")
    type: str | None = Field(None, description="The permission type.")
    values: list[str] | None = Field(
        None,
        description="The list of possible values for the functional permission, e.g. ACCESS or READONLY.",
    )


class FunctionalPermissions(BaseModel):
    """
    <p>Document representing the available functional permissions.</p>
    """

    organization: list[FunctionalPermission] | None = Field(
        None,
        description="The collection of available organization functional permissions.",
    )
    scopes: list[str] | None = Field(
        None,
        description="The available functional permission scopes (e.g. organization, site).",
    )
    site: list[FunctionalPermission] | None = Field(
        None, description="The list of available site functional permissions."
    )


class Status2(Enum):
    """
    The status of the gift certificate.
     While creating a gift certificate, user can set the status
     to either "pending" or "issued" only.
    """

    issued = "issued"
    partially_redeemed = "partially_redeemed"
    pending = "pending"
    redeemed = "redeemed"


class InventoryList(BaseModel):
    """
    <p>Document representing a inventorylist</p>
    """

    assigned_sites: list[str] | None = Field(
        None,
        description="The list of sites this inventory list is assigned to. The assigned sites is a computed attribute, and cannot be\n directly modified.",
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    default_in_stock: bool | None = Field(
        None,
        description="True if the default for the inventory list is to be in stock. THe default value is false if not specified.",
    )
    description: str | None = Field(
        None, description="The user supplied description of this instance."
    )
    id: str | None = Field(
        None,
        description="The id for the inventory list, which is required and must be unique.",
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None,
        description="URL that is used to get this instance. The URL is a computed attribute, and cannot be modified.",
    )
    on_order_inventory_enabled: bool | None = Field(
        None,
        description="True if the on order flag is enabled. The default value is false if not specified.",
    )
    use_bundle_inventory_only: bool | None = Field(
        None,
        description="True if the inventory list is used in bundle inventory only. The default value is false if not specified.",
    )


class InventoryLists(BaseModel):
    """
    <p>Document representing an unfiltered list of inventory lists.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[InventoryList] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class ExecutionStatus(Enum):
    """
    The current execution status.
    """

    pending = "pending"
    running = "running"
    pausing = "pausing"
    paused = "paused"
    resuming = "resuming"
    resumed = "resumed"
    restarting = "restarting"
    restarted = "restarted"
    retrying = "retrying"
    retried = "retried"
    aborting = "aborting"
    aborted = "aborted"
    finished = "finished"
    unknown = "unknown"


class ContinueStatus(Enum):
    """
    Returns the status, this job execution will get on continuation if continuation is pending.
    """

    pending = "pending"
    running = "running"
    pausing = "pausing"
    paused = "paused"
    resuming = "resuming"
    resumed = "resumed"
    restarting = "restarting"
    restarted = "restarted"
    retrying = "retrying"
    retried = "retried"
    aborting = "aborting"
    aborted = "aborted"
    aborting_for_restart = "aborting_for_restart"
    aborted_for_restart = "aborted_for_restart"
    finished = "finished"
    unknown = "unknown"


class JobExecutionContinueInformation(BaseModel):
    """
    <p>Information for a job execution continuation.</p>
    """

    continue_status: ContinueStatus | None = Field(
        None,
        description="Returns the status, this job execution will get on continuation if continuation is pending.",
    )
    is_pending: bool | None = Field(
        None,
        description="Returns <code>true</code> if the continuation of this job execution is pending and will be started soon,\n <code>false</code> otherwise.",
    )


class JobExecutionParameter(BaseModel):
    """
    <p>Specification of a parameter for a job execution. <br/>
      <br/>
     Request example to execute the job in all storefront sites:
      <pre>
     POST /dw/data/v19_10/jobs/CustomerImportJob/executions
     Host: example.com
     Authorization: Bearer af7f5c90-ffc1-4ea4-9613-f5b375b7dc19
     Content-Type: application/json; charset=UTF-8
     {
        "parameters": [
           {
               "name": "SiteScope",
               "value": "{\\"all_storefront_sites\\":true}"
           }
        ]
     }
      </pre> <br/>
     Request example to execute the job in specified sites only:
      <pre>
     POST /dw/data/v19_10/jobs/CustomerImportJob/executions
     Host: example.com
     Authorization: Bearer af7f5c90-ffc1-4ea4-9613-f5b375b7dc19
     Content-Type: application/json; charset=UTF-8
     {
        "parameters": [
           {
               "name": "SiteScope",
               "value": "{\\"named_sites\\":[\\"SiteGenesis\\", \\"SiteGenesisGlobal\\"]}"
           }
        ]
     }
      </pre></p>
    """

    name: str = Field(
        ...,
        description="The name of the parameter.",
        max_length=256,
        min_length=1,
        pattern="\\S|(\\S(.*)\\S)",
    )
    value: str = Field(
        ...,
        description="The value of the parameter.",
        max_length=1000,
        pattern="\\S|(\\S(.*)\\S)",
    )


class JobExecutionRetryInformation(BaseModel):
    """
    <p>Retry information for a previous  <b> failed </b>  job execution.</p>
    """

    current_retry_attempt: int | None = Field(
        None,
        description="The current attempt to retry the previous <b>failed</b> job execution.",
    )
    max_retries: int | None = Field(None, description="The maximum number of retries.")


class ExecutionStatus1(Enum):
    """
    Current execution status of the step.
     <ul>
     <li>'pending': Execution of the step been initiated but the step is not executing yet. Possible next status:
     'running'.</li>
     <li>'running': The step is currently actively executed. Possible next status: 'finished', 'pausing' or
     'aborted'.</li>
     <li>'finished': The step execution is finished and is not actively executed currently. Possible next status:
     none.</li>
     <li>'pausing': Pausing of a running step execution has been initiated but the step is not paused yet. Possible
     next status: 'paused' or 'aborted'.</li>
     <li>'paused': The step execution is paused and is not actively executed currently. Possible next status:
     'pending'.</li>
     <li>'aborted': A running step execution has been aborted and is not actively executed currently. Possible next
     status: none.</li>
     </ul>
    """

    pending = "pending"
    running = "running"
    pausing = "pausing"
    paused = "paused"
    resuming = "resuming"
    resumed = "resumed"
    restarting = "restarting"
    restarted = "restarted"
    retrying = "retrying"
    retried = "retried"
    aborting = "aborting"
    aborted = "aborted"
    finished = "finished"
    unknown = "unknown"


class Locale(BaseModel):
    """
    <p>Document that describes a single locale.</p>
    """

    field_200: bool | None = Field(
        None,
        alias="200",
        description="Flag that is true if the locale is the default one to use if an explicit locale is not specified.",
    )
    active: bool | None = Field(
        None,
        description="Flag that is true if the locale is currently active in the system.",
    )
    country: str | None = Field(
        None,
        description="The uppercase ISO 3166 2-letter country/region code for this Locale.\n If no country has been specified for this Locale, this value is an empty string.",
    )
    display_country: str | None = Field(
        None,
        description="The display name of this Locale's country, in this Locale's language,\n not in the session locale's language.\n If no country has been specified for this Locale, this value is an empty string.",
    )
    display_language: str | None = Field(
        None,
        description="The display name of this Locale's language, in this Locale's language,\n not in the session locale's language.\n If no country has been specified for this Locale, this value is an empty string.",
    )
    display_name: str | None = Field(
        None,
        description="The display name of this Locale, in this Locale's language,\n not in the session locale's language.\n If no display name has been specified for this Locale, this value is an empty string.",
    )
    id: str | None = Field(
        None,
        description='Returns the String representation of the localeID.\n \n <p>Combines the language and the country key, concatenated with "-". \n For example: "en-US". This attribute is the primary key of the class.</p>',
    )
    iso3_country: str | None = Field(
        None,
        description="The uppercase ISO 3166 3-letter country/region code for this Locale.\n If no country has been specified for this Locale, this value is an empty string.",
    )
    iso3_language: str | None = Field(
        None,
        description="The 3-letter ISO 639 language code for this Locale.\n If no language has been specified for this Locale, this value is an empty string.",
    )
    language: str | None = Field(
        None,
        description="The lowercase ISO 639 language code for this Locale.\n If no language has been specified for this Locale, this value is an empty string.",
    )
    name: str | None = Field(
        None,
        description="The display name of the Locale. Uses the current\n request locale to localize the value.",
    )


class LocalePermission(BaseModel):
    """
    <p>Document representing a locale permission.</p>
    """

    display_name: dict[str, str] | None = Field(
        None, description="The display name of the locale."
    )
    locale_id: str | None = Field(None, description="The id of the locale.")
    type: str | None = Field(None, description="The permission type.")
    values: list[str] | None = Field(
        None,
        description="The list of possible values for the locale permission, e.g. ACCESS or READONLY.",
    )


class LocalePermissions(BaseModel):
    """
    <p>Document representing the available locale permissions.</p>
    """

    scopes: list[str] | None = Field(
        None, description="The available Locale permission scopes (e.g. unscoped)."
    )
    unscoped: list[LocalePermission] | None = Field(
        None, description="The collection of available unscoped Locale permissions."
    )


class LocaleResult(BaseModel):
    """
    <p>Contains the result of getting the system locales.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[dict[str, Any]] | None = None
    hits: list[Locale] | None = Field(
        None, description="The locales found by the request"
    )
    id: str | None = Field(
        None, description="The input locale (none specifies get all locales)"
    )
    include_all: bool | None = Field(
        None,
        description="True to get the all the hits for all the locales, not just the active allowed ones",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(
        None,
        description="The string describing the set of fields to return in the result.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class LogCategory(BaseModel):
    """
    <p>Document representing log category settings.</p>
    """

    enabled: bool | None = Field(
        None, description="Returns true if the log category is enabled."
    )
    level: str | None = Field(None, description="Level of the log category.")
    name: str | None = Field(None, description="Log category name.")


class MarkupText(BaseModel):
    markup: str | None = Field(None, description="The rendered HTML (read only)")
    source: str | None = Field(
        None,
        description="The raw markup text\n (only this needs to be provided in update request)",
    )


class Master(BaseModel):
    """
    <p>Document representing a variation master.</p>
    """

    link: str | None = Field(None, description="The URL addressing the master product.")
    master_id: str = Field(
        ...,
        description="The id (SKU) of the master product.",
        max_length=100,
        min_length=1,
    )
    orderable: bool | None = Field(
        None,
        description="A flag indicating whether at least one of the variants is orderable.",
    )
    price: float | None = Field(
        None, description="The minimum sales price of the related variants."
    )
    price_max: float | None = Field(
        None, description="The maximum sales of related variants."
    )
    price_per_unit: float | None = Field(
        None, description="The minimum sales price per unit of the related variants."
    )
    price_per_unit_max: float | None = Field(
        None, description="The maximum sales price per unit of the related variants."
    )
    prices: dict[str, float] | None = None


class MatchAllQuery(RootModel[Any]):
    root: Any = Field(
        ...,
        description="<p>A match all query simply matches all documents (namespace and document type). This query comes in\n handy if you just want to filter a search result or really do not have any constraints.\n\n  <b> Example: </b> \n  <pre> \n    query: {\n        match_all_query: {}\n    }\n  </pre></p>",
    )


class MediaFile(BaseModel):
    abs_url: str | None = Field(
        None, description="The absolute URL with request protocol (read only)"
    )
    alt: dict[str, str] | None = Field(None, description="The alternative image text")
    dis_base_url: str | None = Field(
        None, description="The DIS base URL only for product images"
    )
    path: str | None = Field(
        None,
        description="The raw media file path\n (only this needs to be provided in update request)",
    )
    title: dict[str, str] | None = Field(None, description="The image title")


class MenuAction(BaseModel):
    """
    <p>Document representing a menu action.</p>
    """

    description: dict[str, str] | None = Field(
        None, description="The description of the menu action."
    )
    display_name: dict[str, str] | None = Field(
        None, description="The display name of the menu action."
    )
    module_type: str | None = Field(
        None, description="The module type of the menu action (BM or CC)."
    )
    name: str | None = Field(None, description="The name of the menu action.")
    system: bool | None = Field(None, description="{\n action.")
    type: str | None = Field(None, description="The permission type.")
    values: list[str] | None = Field(
        None,
        description="The list of possible values for the menu action, e.g. ACCESS or READONLY.",
    )


class MenuItem(BaseModel):
    """
    <p>Document representing a menu item.</p>
    """

    display_name: dict[str, str] | None = Field(
        None, description="The display name of the menu item."
    )
    menu_actions: list[MenuAction] | None = Field(
        None, description="The collection of available menu actions."
    )
    module_type: str | None = Field(
        None, description="The module type of the menu item (BM or CC)."
    )
    name: str | None = Field(None, description="The name of the menu item.")
    type: str | None = Field(None, description="The permission type.")


class MetricResponse(BaseModel):
    """
    <p>Metrics in Prometheus Exposition Format wrapped as Json array of strings.</p>
    """

    limit: int | None = Field(None, description="Page size of result page")
    metrics: list[str] | None = Field(
        None,
        description='Metrics in Prometheus Exposition Format. <p/> A single metric is represented by a single line. They have a name, labels (dimensions), a value and a time-stamp. <p/> Example:<p/> OCAPI request: <code>GET /v21.10/products/{Id}/prices</code><p/> total time metric: <code>products_Id_prices{method=\\"GET\\",version=\\"v21.10\\",path1=\\"products\\",path2=\\"prices\\",status=\\"2xx\\"} 112.718755 1620735785000</code> <p/> The individual elements of a metric line are the metric name, metric dimensions (denoted by label / value pairs in curly braces), the actual metric value (in milliseconds or in operations / second for metrics ending in <code>_m1rate</code>) and a time-stamp in milliseconds since 01/01/1970 UTC.<p/>    <p><b>name</b></p>   <p>The metric name will have both path segments and parameters separated by \'&#x60;_&#x60;\'.       Path segments in the metric name are in lower-case whereas path parameters are formatted in camel-case.<p/>   </p>    <p><b>method</b></p>   <p>the HTTP method of the OCAPI request, one of <code>GET, PUT, POST, DELETE</code><p/></p>    <p><b>version</b></p>   <p>the version of the OCAPI request, e.g. v20.8<p/></p>    <p><b>path1</b> .. <b>pathN</b></p>   <p>The path segments (not including the path-parameters) of the OCAPI request, from the example above, the path       segments will be mapped to labels as: <code>path1=\\"products\\", path2=\\"prices\\"</code><p/>   </p>    <p><b>breakdown</b></p>   <p>Sub-timings of the request, in particular:<p/>     <ul>       <li><b>total</b> (implicit): total timings of the request (sum of the three breakdowns below). This dimension is denoted with no label.</li>       <li><b>platform</b>: amount of time spent in platform code (including database-tier)</li>       <li><b>custom</b>: amount of time spent in custom code (including database-tier)</li>       <li><b>thirdParty</b>: amount of time spent invoking third party services through the service framework</li>     </ul>   </p>    <p><b>status</b></p>   <p>     <ul>       <li><b>2xx</b>: metrics for all requests with a status code between 200 and 299</li>       <li><b>3xx</b>: metrics for all requests with a status code between 300 and 399</li>       <li><b>4xx</b>: metrics for all requests with a status code between 400 and 499</li>       <li><b>5xx</b>: metrics for all requests with a status code between 500 and 599</li>     </ul>   </p>    <p><b>quantile</b></p>   <p>     <ul>       <li><b>p50</b>: median timings</li>       <li><b>p95</b>: timings for the 95th percentile of all requests</li>     </ul>   </p>    <p><b>serviceId</b> (only for metrics where breakdown = thirdParty)</p>   <p>the <code>id</code> of the third party service that was invoked during the request. If multiple services were invoked,       timings for each individual service are available<p/>   </p>',
    )
    offset: int | None = Field(None, description="Offset of result page")
    total: int | None = Field(None, description="Total number of metrics")


class ModulePermissions(BaseModel):
    """
    <p>Document representing the available module permissions in shape of menu items and menu actions.</p>
    """

    organization: list[MenuItem] | None = Field(
        None, description="The collection of available organization menu items."
    )
    scopes: list[str] | None = Field(
        None, description="The available menu item scopes (e.g. organization, site)."
    )
    site: list[MenuItem] | None = Field(
        None, description="The list of available site menu items."
    )


class Money(BaseModel):
    currency_mnemonic: str | None = Field(
        None, description="The mnemonic for the money."
    )
    value: float | None = Field(None, description="The value for the money.")


class ScoreMode(Enum):
    avg = "avg"
    total = "total"
    max = "max"
    none = "none"


class ValueType(Enum):
    """
    The type of this attribute.
    """

    string = "string"
    int = "int"
    double = "double"
    text = "text"
    html = "html"
    date = "date"
    image = "image"
    boolean = "boolean"
    money = "money"
    quantity = "quantity"
    datetime = "datetime"
    email = "email"
    password = "password"
    set_of_string = "set_of_string"
    set_of_int = "set_of_int"
    set_of_double = "set_of_double"
    enum_of_string = "enum_of_string"
    enum_of_int = "enum_of_int"
    unknown = "unknown"


class ObjectAttributeValueDefinition(BaseModel):
    """
    <p>Document representing a attribute definition</p>
    """

    description: dict[str, str] | None = Field(
        None, description="A description of the attribute value."
    )
    display_value: dict[str, str] | None = Field(
        None,
        description="A display name that can be used to present this value in\n the user interface. For example, the value might be '1' but the display\n name might be 'Order Exported'.",
    )
    id: str | None = Field(None, description="The ID of the attribute value.")
    position: float | None = Field(
        None,
        description="The position of the attribute value within the set of attribute values.",
    )
    value: dict[str, Any] | None = Field(
        None, description="The value of the attribute."
    )


class ObjectTypeDefinition(BaseModel):
    """
    <p>Document representing a object type definition</p>
    """

    attribute_definition_count: int | None = Field(
        None,
        description="Returns the number of attribute definitions contained by the type.  This is a computed attribute and cannot be changed.",
    )
    attribute_group_count: int | None = Field(
        None,
        description="Returns the number of attribute groups contained by the type.  This is a computed attribute and cannot be changed.",
    )
    content_object: bool | None = Field(
        None,
        description="True if the object type definition is marked as a content object",
    )
    creation_date: AwareDatetime | None = None
    description: dict[str, str] | None = Field(
        None, description="The user entered description for the type (localizable)"
    )
    display_name: dict[str, str] | None = Field(
        None, description="The user entered display name (localizable)"
    )
    last_modified: AwareDatetime | None = None
    link: str | None = Field(
        None,
        description="URL that is used to get this instance.  This is a computed attribute and cannot be changed.",
    )
    object_type: str | None = Field(None, description="The object type identifier")
    queryable: bool | None = Field(
        None,
        description="True if the system object type is queryable, false otherwise.  Default is true.",
    )
    read_only: bool | None = Field(
        None,
        description="True if the system object is read-only, false otherwise.  This is a computed attribute and cannot be changed.",
    )


class ObjectTypeDefinitions(BaseModel):
    """
    <p>Document representing an unfiltered list of system object types.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[ObjectTypeDefinition] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class Status3(Enum):
    """
    The new confirmation status for an order.
    """

    confirmed = "confirmed"
    not_confirmed = "not_confirmed"


class OrderConfirmationStatusUpdateRequest(BaseModel):
    """
    <p>Request body to update the order confirmation status.</p>
    """

    status: Status3 = Field(
        ..., description="The new confirmation status for an order."
    )


class Status4(Enum):
    """
    The new export status for an order.
    """

    exported = "exported"
    not_exported = "not_exported"
    ready = "ready"
    failed = "failed"


class OrderExportStatusUpdateRequest(BaseModel):
    """
    <p>Request body to update the order export status.</p>
    """

    status: Status4 = Field(..., description="The new export status for an order.")


class OrderExternalStatusUpdateRequest(BaseModel):
    """
    <p>Request body to update the order external status.</p>
    """

    status: str = Field(
        ...,
        description="The new external status for an order.",
        max_length=256,
        min_length=1,
    )


class Status5(Enum):
    """
    The new payment status for an order.
    """

    paid = "paid"
    part_paid = "part_paid"
    not_paid = "not_paid"


class OrderPaymentStatusUpdateRequest(BaseModel):
    """
    <p>Request body to update the order payment status.</p>
    """

    status: Status5 = Field(..., description="The new payment status for an order.")


class Status6(Enum):
    """
    The new shipping status for an order.
    """

    shipped = "shipped"
    part_shipped = "part_shipped"
    not_shipped = "not_shipped"


class OrderShippingStatusUpdateRequest(BaseModel):
    """
    <p>Request body to update the order shipping status.</p>
    """

    status: Status6 = Field(..., description="The new shipping status for an order.")


class Status7(Enum):
    """
    The new status for an order.
    """

    created = "created"
    new = "new"
    open = "open"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"
    failed_with_reopen = "failed_with_reopen"


class OrderStatusUpdateRequest(BaseModel):
    """
    <p>Request body to update the order status.</p>
    """

    status: Status7 = Field(..., description="The new status for an order.")


class OrderUpdateRequest(RootModel[Any]):
    root: Any = Field(..., description="<p>Request body to update an order.</p>")


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(
        ..., description="The current user password", min_length=1
    )
    password: str = Field(..., description="The new user password", min_length=1)


class PathRecord(BaseModel):
    """
    <p>Document representing most basic info (id and name) of a category or catalog.</p>
    """

    id: str | None = Field(None, description="The id of the category path.")
    name: dict[str, str] | None = Field(
        None, description="The name of the category path."
    )


class PaymentInstrumentUpdateRequest(RootModel[Any]):
    root: Any = Field(
        ..., description="<p>Request body to update an order payment instrument.</p>"
    )


class PaymentTransactionUpdateRequest(RootModel[Any]):
    root: Any = Field(
        ..., description="<p>Request body to update an order payment transaction.</p>"
    )


class CBootTypeEnum(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"


class CBottomTypeEnum(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"
    field_0080 = "0080"


class CDigitalCameraFeature(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"
    field_0080 = "0080"
    field_0090 = "0090"
    field_0100 = "0100"
    field_0110 = "0110"
    field_0120 = "0120"
    field_0130 = "0130"
    field_0140 = "0140"
    field_0150 = "0150"
    field_0160 = "0160"
    field_0170 = "0170"
    field_0180 = "0180"
    field_0190 = "0190"
    field_0200 = "0200"
    field_0210 = "0210"
    field_0220 = "0220"
    field_0230 = "0230"
    field_0240 = "0240"
    field_0250 = "0250"
    field_0260 = "0260"
    field_0270 = "0270"
    field_0280 = "0280"


class CGameGenreEnum(Enum):
    Action = "Action"
    Educational = "Educational"
    Kids = "Kids"
    Racing = "Racing"
    Role_Playing = "Role-Playing"
    Sports = "Sports"
    Strategy = "Strategy"


class CGpsFeature(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"
    field_0080 = "0080"
    field_0090 = "0090"
    field_0100 = "0100"
    field_0110 = "0110"
    field_0120 = "0120"
    field_0130 = "0130"
    field_0140 = "0140"
    field_0150 = "0150"
    field_0160 = "0160"
    field_0170 = "0170"
    field_0180 = "0180"
    field_0190 = "0190"
    field_0200 = "0200"
    field_0210 = "0210"
    field_0230 = "0230"


class CGpsTypeEnum(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"


class CKidsAge(Enum):
    """
    Kids Age used for search refinements
    """

    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"


class CMaterialTestEnum(Enum):
    cotton = "cotton"
    polyester = "polyester"
    wool = "wool"


class CMediaFormatEnum(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"
    field_0080 = "0080"
    field_0090 = "0090"
    field_0100 = "0100"


class CMemoryTypeEnum(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"
    field_0080 = "0080"
    field_0090 = "0090"


class COuterwearType(Enum):
    """
    Type of Outerwear for search refinement
    """

    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"
    field_0080 = "0080"


class CPortableAudioTypeEnum(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"


class CRefinementColor(Enum):
    beige = "beige"
    black = "black"
    blue = "blue"
    brown = "brown"
    green = "green"
    grey = "grey"
    miscellaneous = "miscellaneous"
    navy = "navy"
    orange = "orange"
    pink = "pink"
    purple = "purple"
    red = "red"
    white = "white"
    yellow = "yellow"


class CSandalType(Enum):
    """
    Type of Sandal for search refinement
    """

    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"


class CSheet(Enum):
    value1 = "value1"
    value2 = "value2"
    value3 = "value3"


class CShoeType(Enum):
    """
    Type of Shoe for search refinements
    """

    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"
    field_0050 = "0050"
    field_0060 = "0060"
    field_0070 = "0070"
    field_0080 = "0080"
    field_0090 = "0090"
    field_0100 = "0100"
    field_0110 = "0110"


class CSkinConcernEnum(Enum):
    comprehensive = "comprehensive"
    dryTight = "dryTight"
    liftingLossFirm = "liftingLossFirm"


class CTvType(Enum):
    field_0010 = "0010"
    field_0020 = "0020"
    field_0030 = "0030"
    field_0040 = "0040"


class PreOrderBackOrderHandling(Enum):
    """
    The enum holding the records pre-backorder-handling configuration. Possible values are NONE, PREORDER and
     BACKORDER. Method returns NONE in case the record pre-backorder-handling-code is null or unknown.
    """

    none = "none"
    preorder = "preorder"
    backorder = "backorder"


class ProductInventoryRecordAllocation(BaseModel):
    """
    <p>Document representing a product inventory record allocation.</p>
    """

    amount: float | None = Field(
        None,
        description="The allocation quantity that is currently set. The quantity unit is the same unit as the product itself.",
        ge=0.0,
    )
    reset_date: AwareDatetime | None = Field(
        None, description="The date the allocation quantity was initialized or reset."
    )


class SortingMode(Enum):
    """
    The sorting mode for the product option values.
    """

    byexplicitorder = "byexplicitorder"
    byoptionprice = "byoptionprice"


class ProductOptionValue(BaseModel):
    """
    <p>Document representing a product option Value</p>
    """

    default_product_option_value: bool | None = Field(
        None,
        description="Flag indicating if the product option value is the default value for the product option.",
    )
    id: str | None = Field(
        None, description="The id of the product option value.", min_length=1
    )
    link: str | None = Field(
        None, description="The URL link to the product option value."
    )
    option_prices: list[Money] | None = Field(
        None, description="The list of prices in the product option value."
    )
    sku_extension: str | None = Field(
        None, description="The sku extension of the product option value."
    )
    value: dict[str, str] | None = Field(
        None, description="The localized value of the product option."
    )


class ProductOptionValues(BaseModel):
    """
    <p>Document representing an unfiltered list of product option values.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[ProductOptionValue] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class ProductType(BaseModel):
    """
    <p>Document representing a product type.</p>
    """

    bundle: bool | None = Field(
        None, description="A flag indicating whether the product is a bundle."
    )
    bundled: bool | None = Field(
        None, description="A flag indicating whether the product is bundled."
    )
    item: bool | None = Field(
        None, description="A flag indicating whether the product is a standard item."
    )
    master: bool | None = Field(
        None, description="A flag indicating whether the product is a master."
    )
    option: bool | None = Field(
        None, description="A flag indicating whether the product is an option."
    )
    part_of_product_set: bool | None = Field(
        None,
        description="A flag indicating whether the product is part of product set.",
    )
    part_of_retail_set: bool | None = Field(
        None, description="A flag indicating whether the product is part of retail set."
    )
    retail_set: bool | None = Field(
        None, description="A flag indicating whether the product is a retail set."
    )
    set: bool | None = Field(
        None, description="A flag indicating whether the product is a set."
    )
    variant: bool | None = Field(
        None, description="A flag indicating whether the product is a variant."
    )
    variation_group: bool | None = Field(
        None, description="A flag indicating whether the product is a variation group."
    )


class Exclusivity(Enum):
    """
    Determines if the promotion can be combined with other promotions of the same promotion class or if it cannot be
     combined with any other promotions. This attribute is allowed to be updated when using the Open Commerce API to
     update multiple promotions at once.
    """

    no = "no"
    class_ = "class"
    global_ = "global"


class PromotionClass(Enum):
    """
    The class of the promotion. If the promotion class is modified, then the promotion rule and all of its values,
     such as whether or not to disable global product exclusions, will be reset.
    """

    product = "product"
    shipping = "shipping"
    order = "order"


class ScheduleType(Enum):
    """
    If there is only one active assignment, or no active assignments and one upcoming assignment, this is that type
     of assignment (schedule_type : "campaign" or schedule_type : "abtest"). If there are no
     assignments, it will be schedule_type : "none", otherwise, schedule_type : "multiple".
    """

    none = "none"
    campaign = "campaign"
    abtest = "abtest"
    multiple = "multiple"


class RequiredQualifier(Enum):
    """
    A constant indicating that one or all qualifier conditions must be
     met in order for the promotion to apply for a given customer.
     Valid values are "any" and "all".
    """

    any = "any"
    all = "all"


class QueryFilter(BaseModel):
    """
    <p>Document representing a query filter. A query filter wraps any query and allows it to be used as a filter.

      <b> Example: </b>  (coupon_id contains "disabled" AND (enabled=false OR active=false))
      <pre>
     query : {
        filtered_query: {
            query: { text_query: { fields: ["coupon_id"], search_phrase: "disabled" } },
            filter: {
                query_filter: {
                    query: {
                        term_query: { fields: ["enabled","active"], operator: "is", values: [ false ] }
                    }
                }
            }
        }
     }
      </pre></p>
    """

    query: Any = Field(
        ...,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )


class FilterMode(Enum):
    """
    Compare mode: overlap, containing, or contained. If not specified, the default is overlap.
    """

    overlap = "overlap"
    containing = "containing"
    contained = "contained"


class Range2Filter(BaseModel):
    """
    <p> Document representing a range comparison with a range filter, named Range2Filter. </p>

      <p> A Range2Filter allows you to restrict a search result to hits where a range defined by specified attributes has a certain relationship to a specified range. </p>
      <p> The first range (R1) is defined by a pair of attributes ("from_field" and "to_field") that specify the extent of a range, such as the attributes "valid_from" and "valid_to". </p>
      <p> The second range (R2) is defined by "from_value" and "to_value". </p>
      <p> The filter mode specifies the method used to compare the two ranges: </p>
      <ul>
        <li>  overlap: R1 overlaps fully or partially with R2 </li>
        <li>  containing: R1 contains R2 </li>
        <li>  contained: R1 is contained in R2 </li>
      </ul>
      <p> The range filter supports several value types, and relies on the natural sorting of the value type
     for range interpretation. Value ranges can be open-ended (at one end only). You can configure whether the
     lower and upper bounds are inclusive or exclusive. </p>
      <p> A range 2 filter is useful for general restrictions that can be shared between searches (like a static date range) because
     the filter result is cached in memory. Range filters are not appropriate if the range is expected to be different for
     every query (for example, if the user controls the date range down to the hour via a UI control).  Range filters
     are inclusive by default. </p>

      <p> <b> Example: </b>  (valid dates overlap with the range January 1, 2007 through January 1, 2017)
      <pre>
     "query" : {
            "filtered_query": {
               "filter": {
                    "range2_filter": {
                        "from_field": "valid_from",
                        "to_field": "valid_to",
                        "filter_mode":"overlap",
                        "from_value": "2007-01-01T00:00:00.000Z",
                        "to_value": "2017-01-01T00:00:00.000Z"
                    }
               },
               "query": { "match_all_query": {} }
           }
       }
      </pre> </p>
    """

    filter_mode: FilterMode | None = Field(
        None,
        description="Compare mode: overlap, containing, or contained. If not specified, the default is overlap.",
    )
    from_field: str = Field(
        ..., description="The field name of the field that starts the first range."
    )
    from_inclusive: bool | None = Field(
        None,
        description="Indicates whether the lower bound of the second range is inclusive. If not specified, the default is true. Set to false to make the lower bound exclusive.",
    )
    from_value: dict[str, Any] | None = Field(
        None,
        description="The lower bound of the second range. If not specified, the range is  open-ended with respect to the lower bound. You can't leave both the lower and upper bounds open-ended.",
    )
    to_field: str = Field(
        ..., description="The field name of the field that ends the first range."
    )
    to_inclusive: bool | None = Field(
        None,
        description="Indicates whether the upper bound of the second range is inclusive. If not specified, the default is true. Set to false to make the lower bound exclusive.",
    )
    to_value: dict[str, Any] | None = Field(
        None,
        description="The upper bound of the second range. If not specified, the range is  open-ended with respect to the upper bound. You can't leave both the upper and lower bounds open-ended.",
    )


class RangeFilter(BaseModel):
    """
    <p>Document representing a range filter.

     A range filter allows you to restrict a search result to hits that have values for a given attribute that fall into a
     given value range. The range filter supports several value types, and relies on the natural sorting of the value type
     for range interpretation. Value ranges can be open-ended (at one end only). You can configure whether the
     lower and upper bounds are inclusive or exclusive.

     A range filter is useful for general restrictions that can be shared between searches (like a static date range) because
     the filter result is cached in memory. Range filters are not appropriate if the range is expected to be different for
     every query (for example, if the user controls the date range down to the hour via a UI control).  Range filters
     are inclusive by default.

      <b> Example: </b>  ( redemption_count BETWEEN (0,10] )
      <pre>
        query: {
            filtered_query: {
                query: { match_all_query: {} },
                filter: {
                    range_filter: {
                        field: "redemption_count",
                        from: 0,
                        to: 10,
                        from_inclusive: false
                    }
                }
            }
        }
      </pre></p>
    """

    field: str = Field(..., description="The search field.")
    from_: dict[str, Any] | None = Field(
        None,
        alias="from",
        description="The lower bound of the filter range. If not specified, the range is  open-ended with respect to the lower bound. You can't leave both the lower and upper bounds open-ended.",
    )
    from_inclusive: bool | None = Field(
        None,
        description="Indicates whether the lower bound of the range is inclusive. If not specified, the default is true. Set to false to make the lower bound exclusive.",
    )
    to: dict[str, Any] | None = Field(
        None,
        description="The upper bound of the filter range. If not specified, the range is  open-ended with respect to the upper bound. You can't leave both the upper and lower bounds open-ended.",
    )
    to_inclusive: bool | None = Field(
        None,
        description="Indicates whether the upper bound of the range is inclusive. If not specified, the default is true. Set to false to made the upper bound  exclusive.",
    )


class Recommender(BaseModel):
    """
    <p>The recommender object</p>
    """

    description: str | None = Field(
        None, description="The description of the recommender"
    )
    name: str | None = Field(None, description="The name of the recommender")


class RecommendersResult(BaseModel):
    """
    <p>A list of recommenders available for use in recommendation requests.</p>
    """

    recommenders: list[Recommender] | None = Field(
        None, description="The recommender objects"
    )


class DayOfWeekEnum(Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


class DayOfWeek(Enum):
    """
    The days of week for recurrence.
    """

    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


class RedemptionLimitPerPeriod(BaseModel):
    """
    <p>Document representing a coupon redemption limit.</p>
    """

    limit: int | None = Field(
        None,
        description="The limit on the number of times a coupon can be redeemed for a specified redemption time period.",
        ge=0,
    )
    redemption_time_frame: int | None = Field(
        None, description="The redemption time period.", ge=0, le=999
    )


class RedemptionLimits(BaseModel):
    """
    <p>Document representing a coupon.</p>
    """

    limit_per_code: int | None = Field(
        None, description="The redemption limit per code", ge=0
    )
    limit_per_customer: int | None = Field(
        None, description="The redemption limit per customer", ge=0
    )
    limit_per_time_frame: RedemptionLimitPerPeriod | None = None


class ApiType(Enum):
    """
    API Type
    """

    data = "data"
    shop = "shop"


class ResultPage(BaseModel):
    """
    <p>Data that can be used to get the next and previous page of a Data API results object.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
    )


class RoleFunctionalPermission(BaseModel):
    """
    <p>Document representing a functional permission.</p>
    """

    name: str = Field(
        ..., description="The name of the functional permission.", min_length=1
    )
    type: str = Field(
        ..., description='The permission type ("functional").', min_length=1
    )
    value: str | None = Field(
        None,
        description="The non domain specific value for the functional permission, e.g. ACCESS or READONLY.",
    )
    values: dict[str, str] | None = Field(
        None,
        description="The map of value per domain for the functional permission, e.g. ACCESS or READONLY per domain name.",
    )


class RoleFunctionalPermissions(BaseModel):
    """
    <p>Document listing the functional permissions assigned to a certain role.</p>
    """

    organization: list[RoleFunctionalPermission] | None = Field(
        None, description="The list of organization functional permissions."
    )
    site: list[RoleFunctionalPermission] | None = Field(
        None, description="The list of site functional permissions."
    )


class RoleLocalePermission(BaseModel):
    """
    <p>Document representing a locale permission.</p>
    """

    locale_id: str = Field(
        ..., description="The related locale id of the locale permission.", min_length=1
    )
    type: str = Field(..., description='The permission type ("locale").', min_length=1)
    value: str | None = Field(
        None,
        description="The non domain specific value for the locale permission, e.g. ACCESS or READONLY.",
    )
    values: dict[str, str] | None = Field(
        None,
        description="The map of value per domain for the locale permission, e.g. ACCESS or READONLY per domain name.",
    )


class RoleLocalePermissions(BaseModel):
    """
    <p>Document listing the locale permissions assigned to a certain role.</p>
    """

    unscoped: list[RoleLocalePermission] | None = Field(
        None, description="The list of unscoped locale permissions."
    )


class RoleModulePermission(BaseModel):
    """
    <p>Document representing a module permission.</p>
    """

    application: str = Field(
        ..., description='The permission application (e.g. "bm", "csc").', min_length=1
    )
    name: str = Field(
        ...,
        description="The related menu action name of the module permission.",
        min_length=1,
    )
    system: bool | None = Field(
        None,
        description="Flag to indicate a system menu action. This is <code>false</code> for custom menu actions.",
    )
    type: str = Field(..., description='The permission type ("module").', min_length=1)
    value: str | None = Field(
        None,
        description="The non domain specific value for the module permission, e.g. ACCESS or READONLY.",
    )
    values: dict[str, str] | None = Field(
        None,
        description="The map of value per domain for the module permission, e.g. ACCESS or READONLY per domain name.",
    )


class RoleModulePermissions(BaseModel):
    """
    <p>Document listing the module permissions assigned to a certain role.</p>
    """

    organization: list[RoleModulePermission] | None = Field(
        None, description="The list of organization module permissions."
    )
    site: list[RoleModulePermission] | None = Field(
        None, description="The list of site module permissions."
    )


class RoleWebdavPermission(BaseModel):
    """
    <p>Document representing a WebDAV permission.</p>
    """

    folder: str = Field(
        ..., description="The related folder of the WebDAV permission.", min_length=1
    )
    type: str = Field(..., description='The permission type ("webdav").', min_length=1)
    value: str | None = Field(
        None,
        description="The non domain specific value for the WebDAV permission, e.g. ACCESS or READONLY.",
    )
    values: dict[str, str] | None = Field(
        None,
        description="The map of value per domain for the WebDAV permission, e.g. ACCESS or READONLY per domain name.",
    )


class RoleWebdavPermissions(BaseModel):
    """
    <p>Document listing the WebDAV permissions assigned to a certain role.</p>
    """

    unscoped: list[RoleWebdavPermission] | None = Field(
        None, description="The list of unscoped WebDAV permissions."
    )


class Rule(BaseModel):
    """
    <p>Document representing a customer group rule</p>
    """

    description: str | None = Field(
        None,
        description="The description of the rule, describing its conditions in natural language. Property is read-only.",
    )


class ShippingAddressUpdateRequest(BaseModel):
    """
    <p>Request body to update the order shipping address.</p>
    """

    address1: str | None = None
    address2: str | None = None
    city: str | None = None
    company_name: str | None = None
    country_code: str | None = None
    first_name: str | None = None
    full_name: str | None = None
    id: str | None = None
    job_title: str | None = None
    last_name: str | None = None
    phone: str | None = None
    post_box: str | None = None
    postal_code: str | None = None
    salutation: str | None = None
    second_name: str | None = None
    state_code: str | None = None
    suffix: str | None = None
    suite: str | None = None
    title: str | None = None


class StorefrontStatus(Enum):
    online = "online"
    maintenance = "maintenance"
    to_be_deleted = "to_be_deleted"
    protected = "protected"


class Site(BaseModel):
    """
    <p>Document representing a site.</p>
    """

    cartridges: str | None = Field(None, description="The cartridge Path of the site")
    creation_date: AwareDatetime | None = None
    customer_list_link: CustomerListLink | None = None
    description: dict[str, str] | None = Field(
        None, description="The description of this site."
    )
    display_name: dict[str, str] | None = Field(
        None, description="The display name entered by the user."
    )
    id: str = Field(..., description="The id of this site.", min_length=1)
    in_deletion: bool | None = Field(
        None, description="The deletion status of this site, true if in deletion"
    )
    last_modified: AwareDatetime | None = None
    link: str | None = Field(None, description="A link directly to the site")
    storefront_status: StorefrontStatus | None = None


class SitePreferences(BaseModel):
    """
    <p>Represents a set of preferences attached at the organization level.</p>
    """

    link: str | None = Field(
        None, description="A URL that returns the full details for a custom preference"
    )
    site: Site | None = None


class Sites(BaseModel):
    """
    <p>Document representing an unfiltered list of sites.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Site] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class ContextType(Enum):
    """
    A slot context
    """

    global_ = "global"
    category = "category"
    folder = "folder"


class Context(Enum):
    """
    The context of the slot. Ignored in input documents.
    """

    global_ = "global"
    category = "category"
    folder = "folder"


class Rank(IntEnum):
    """
    The rank of the slot configuration on its slot. This rank has nothing to do with the rank
     on any campaign-assignment, because these are completely different objects. These must be
     updated separately.
    """

    integer_10 = 10
    integer_20 = 20
    integer_30 = 30
    integer_40 = 40
    integer_50 = 50
    integer_60 = 60
    integer_70 = 70
    integer_80 = 80
    integer_90 = 90
    integer_100 = 100


class Context1(Enum):
    """
    The slot context.
    """

    global_ = "global"
    category = "category"
    folder = "folder"


class Type3(Enum):
    """
    The type of content in the slot.
    """

    products = "products"
    categories = "categories"
    content_assets = "content_assets"
    html = "html"
    recommended_products = "recommended_products"


class SlotContent(BaseModel):
    """
    <p>Document representing the content type for a slot.</p>
    """

    body: dict[str, MarkupText] | None = Field(
        None, description="The HTML body (valid only for type 'html')."
    )
    category_ids: list[str] | None = Field(
        None, description="The category ids (valid only for type 'categories')."
    )
    content_asset_ids: list[str] | None = Field(
        None,
        description="The content asset ids (valid only for type 'content_assets').",
    )
    product_ids: list[str] | None = Field(
        None, description="The product ids (valid only for type 'products')."
    )
    type: Type3 = Field(..., description="The type of content in the slot.")


class SortOrder(Enum):
    """
    The sort order to be applied when sorting. When omitted, the default sort order (ASC) is used.
    """

    asc = "asc"
    desc = "desc"


class Sort(BaseModel):
    """
    <p>Document representing a sort request.</p>
    """

    field: str = Field(..., description="The name of the field to sort on.")
    sort_order: SortOrder | None = Field(
        None,
        description="The sort order to be applied when sorting. When omitted, the default sort order (ASC) is used.",
    )


class Direction(Enum):
    """
    the direction of the sorting attribute
    """

    asc = "asc"
    desc = "desc"


class SortingRuleStep(BaseModel):
    """
    <p>Document representing a product sorting rule step</p>
    """

    attribute_id: str | None = Field(None, description="the id for sorting attribute.")
    direction: Direction | None = Field(
        None, description="the direction of the sorting attribute"
    )
    is_system: bool | None = Field(
        None, description="whether or not the attribute is a system attribute."
    )
    position: int | None = Field(
        None, description="the position of product sorting rule step."
    )
    text_relevance_included: bool | None = Field(
        None, description="The text relevance included."
    )
    type_id: str | None = Field(
        None, description="the sorting type for sorting attribute."
    )


class LocationType(Enum):
    """
    The type of redirect location, e.g. product (for a product page), category (a category page), home (for home page), page (for content), url (for a URL location)
    """

    default = "default"
    home = "home"
    product = "product"
    category = "category"
    page = "page"
    url = "url"


class SourceCodeRedirectInfo(BaseModel):
    """
    <p>Document representing a source code redirect info</p>
    """

    location: str | None = Field(
        None,
        description="The location of redirect, based on the type, this can be a product location, category location, home page, content page, or just a URL",
    )
    location_type: LocationType | None = Field(
        None,
        description="The type of redirect location, e.g. product (for a product page), category (a category page), home (for home page), page (for content), url (for a URL location)",
    )


class SourceCodeSpecification(BaseModel):
    """
    <p>Document representing a source code specification</p>
    """

    expression: str | None = Field(
        None,
        description="<p>Expression is a value for the \"Source Code Specification\" may be a literal source code, or it may contain wildcards.</p>\n <p>A literal code is simply the literal code. Valid characters are letters and numbers (no spaces).</p>\n <p>A wildcard allows a single source code specification to match multiple source codes. The following wildcards are supported:</p>\n <ul><li>? - Matches any single alpha-numeric character. For example: the source code specification 'ABC?' would match 'ABCD' or 'ABC3', but not 'ABCDE'.</li>\n <li>* - Matches any sequence of alpha-numeric characters. For example: the source code specification 'ABC*' would match 'ABCD', 'ABCDE', or 'ABC123'.</li>\n <li>[n1..n2] - Matches any number from n1 through and including n2.\n For example: the source code specification 'ABC[3..22]' would match 'ABC3', 'ABC4' or 'ABC22', but not 'ABC33' or 'ABCD'.</li></ul>",
    )


class Status8(Enum):
    """
    Status shows successful operation end.
    """

    ok = "ok"
    error = "error"


class StatusModel(BaseModel):
    code: str | None = Field(None, description="Status code.")
    message: str | None = Field(None, description="Status message.")
    status: Status8 | None = Field(
        None, description="Status shows successful operation end."
    )


class StatusMetadata(BaseModel):
    client_id: str | None = Field(
        None, description="The client ID that is responsible for the status."
    )
    reason: str | None = Field(None, description="The reason of the status.")
    user_login: str | None = Field(
        None, description="The user login that is responsible for the status."
    )


class CountryCode1(Enum):
    """
    The two-character country code per ISO 3166-1 alpha-2.
    """

    CA = "CA"
    DE = "DE"
    US = "US"


class Store(BaseModel):
    """
    <p>Document representing a store</p>
    """

    address1: str | None = Field(
        None, description="Returns the first address.", max_length=256
    )
    address2: str | None = Field(
        None, description="Returns the second address value.", max_length=256
    )
    c_countryCodeValue: str | None = Field(
        None, description="Country Code Value - for the form values"
    )
    c_inventoryListId: str | None = Field(None, description="Store Inventory List ID")
    city: str | None = Field(None, description="Returns the city.", max_length=256)
    country_code: CountryCode1 | None = Field(
        None, description="The two-character country code per ISO 3166-1 alpha-2."
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    email: str | None = Field(
        None, description="Email address to contact the store", max_length=256
    )
    fax: str | None = Field(
        None, description="Returns the fax number .", max_length=256
    )
    id: str | None = Field(None, description="The id for the store", max_length=256)
    image: MediaFile | None = None
    inventory_id: str | None = Field(
        None, description="The inventory list associated with the store", max_length=256
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    latitude: float | None = Field(
        None, description="The latitude of the store", ge=-90.0, le=90.0
    )
    link: str | None = Field(
        None,
        description="a URL that is used to get this instance.  The property is computed and cannot be changed.",
    )
    longitude: float | None = Field(
        None, description="The longitude of the store", ge=-180.0, le=180.0
    )
    name: str | None = Field(None, description="The name of the store")
    phone: str | None = Field(
        None, description="Returns the phone number.", max_length=256
    )
    pos_enabled: bool | None = Field(
        None, description="Whether this store uses our Store product for Point-of-Sale"
    )
    postal_code: str | None = Field(
        None, description="The postal code for the store", max_length=10
    )
    state_code: str | None = Field(
        None, description="Returns the customer's state.", max_length=256
    )
    store_events: dict[str, MarkupText] | None = Field(
        None, description="The store events (localized)"
    )
    store_hours: dict[str, MarkupText] | None = Field(
        None, description="The store opening hours (localized)"
    )
    store_locator_enabled: bool | None = Field(
        None, description="Whether this store should appear in store locator searches"
    )


class StoreSearchResult(BaseModel):
    """
    <p>Document representing a store search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Store] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Stores(BaseModel):
    """
    <p>Document representing an unfiltered list of stores.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Store] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class Tag(BaseModel):
    """
    <p>Document representing a tag</p>
    """

    tag_id: str | None = Field(None, description="The id of the tag.")


class Operator1(Enum):
    """
    The operator to compare the field's values with the given ones.
    """

    is_ = "is"
    one_of = "one_of"
    is_null = "is_null"
    is_not_null = "is_not_null"
    less = "less"
    greater = "greater"
    not_in = "not_in"
    neq = "neq"


class TermFilter(BaseModel):
    """
    <p>Document representing a term filter.

     A term filter allows you to restrict a search result to hits that match (exactly) one of the values configured for the
     filter. A term filter is useful for general restrictions that can be shared between searches. Use term filters
     whenever the criterion you filter on is a shared property of multiple searches (for example, like filtering by an
     order status). Use term filters for fields that have a discrete and small set of values only.

      <b> Example: </b>  (id="my_id")
      <pre>
        query: {
            filtered_query: {
                query: { match_all_query: {} },
                filter: {
                    term_filter: {
                        field: "id",
                        operator: "is",
                        values: ["my_id"]
                    }
                }
            }
        }
      </pre>

      <b> Example: </b>  (id IN ("my_id","other_id"))
      <pre>
        query: {
            filtered_query: {
                query: { match_all_query: {} },
                filter: {
                    term_filter: {
                        field: "id",
                        operator: "one_of",
                        values: ["my_id","other_id"]
                    }
                }
            }
        }
      </pre>

      <b> Example: </b>  (description=NULL)
      <pre>
        query: {
            filtered_query: {
                query: { match_all_query: {} },
                filter: {
                    term_filter: {
                        field: "description",
                        operator: "is_null"
                    }
                }
            }
        }
      </pre></p>
    """

    field: str = Field(..., description="The filter field.")
    operator: Operator1 = Field(
        ...,
        description="The operator to compare the field's values with the given ones.",
    )
    values: list[dict[str, Any]] | None = Field(None, description="The filter values.")


class Operator2(Enum):
    """
    Returns the operator to use for the term query.
    """

    is_ = "is"
    one_of = "one_of"
    is_null = "is_null"
    is_not_null = "is_not_null"
    less = "less"
    greater = "greater"
    not_in = "not_in"
    neq = "neq"


class TermQuery(BaseModel):
    """
    <p>A term query matches one (or more) value(s) against one (or more) document field(s). A document is considered a hit
     if one of the values matches (exactly) with at least one of the given fields.  The operator "is" can only take
     one value, while "one_of" can take multiple values. If multiple fields are specified, they are combined using the OR operator.
     The  <code> less </code>  and  <code> greater </code>  operators are not compatible with some search types.
     To query based on numeric bounds in those cases, you can use a  <u> range filter </u>  on a
      <u> filtered query </u> .

      <b> Elastic only </b> : If used with multiple fields, the query is internally handled as a boolean OR of DisjointMaxQueries (with the dismax
     matching a value against all fields). The dismax makes sure that a document carrying a single term in
     multiple fields does not get higher scores than a document matching multiple terms in multiple fields.

      <b> Example: </b>  (id="my_id")
      <pre>
     query: {
         term_query: {
             fields: ["id"],
             operator: "is",
             values: ["my_id"]
         }
     }
      </pre>

      <b> Example: </b>  (id IN ("my_id","other_id"))
      <pre>
     query: {
         term_query: {
             fields: ["id"],
             operator: "one_of",
             values: ["my_id","other_id"]
         }
     }
      </pre>

      <b> Example: </b>  (id=null)
      <pre>
     query: {
         term_query: {
            fields: ["description"],
            operator: "is_null"
        }
     }
      </pre>

      <b> Example: </b>  ((id IN ('generic', 'keyword')) OR (description IN ('generic', 'keyword'))
      <pre>
     query: {
        term_query: {
            fields: ["id", "description"],
            operator: "one_of",
            values: ["generic","keyword"]
        }
     }
      </pre></p>
    """

    fields: list[str] = Field(
        ...,
        description="The document field(s) the value(s) are matched against, combined with the operator.",
        min_length=1,
    )
    operator: Operator2 = Field(
        ..., description="Returns the operator to use for the term query."
    )
    values: list[dict[str, Any]] | None = Field(
        None,
        description="The values the field(s) are compared against, combined with the operator.",
    )


class TextQuery(BaseModel):
    """
    <p>A text query is used to match some text (i.e. a search phrase possibly consisting of multiple terms) against one or
     multiple fields. In case multiple fields are provided, the phrase conceptually forms a logical OR over the fields. In
     this case, the terms of the phrase basically have to match the text that would result from concatenating all
     given fields.

      <b> Example: </b>  (coupon_id contains "xmas" )
      <pre>
        query: {
            text_query: {
                fields: ["coupon_id"],
                search_phrase: "xmas"
            }
        }
      </pre>

      <b> Example: </b>  (coupon_id contains "xmas" OR description contains "xmas")
      <pre>
        query: {
            text_query: {
                fields: ["description", "coupon_id"],
                search_phrase: "xmas"
            }
        }
      </pre>

      <b> Example: </b>  (description contains "holiday" AND description contains "bojo")
      <pre>
        query: {
            text_query: {
                fields: ["description"],
                search_phrase: "holiday bogo"
            }
        }
      </pre></p>
    """

    fields: list[str] = Field(
        ...,
        description="The document fields the search phrase has to match.",
        min_length=1,
    )
    search_phrase: str = Field(
        ..., description="A search phrase which may consist of multiple terms."
    )


class TimeOfDay(BaseModel):
    """
    <p>Document representing a time schedule within a single day.</p>
    """

    time_from: time_aliased | None = Field(
        None,
        description="The time to start from. Time format: HH:mm:ss. Seconds\n are ignored and set to 0.",
    )
    time_to: time_aliased | None = Field(
        None,
        description="The time to end on. Time format: HH:mm:ss. Seconds\n are ignored and set to 0.",
    )


class User(BaseModel):
    """
    <p>Document representing a user.</p>
    """

    creation_date: AwareDatetime | None = None
    disabled: bool | None = Field(
        None, description="Flag whether the user is disabled."
    )
    email: str = Field(..., description="The email address.", max_length=256)
    external_id: str | None = Field(
        None,
        description="The external id. This attribute is only valid when the user uses centralized authentication.",
        max_length=256,
    )
    first_name: str | None = Field(None, description="The first name.", max_length=256)
    last_login_date: date_aliased | None = Field(
        None, description="Last login of the user."
    )
    last_modified: AwareDatetime | None = None
    last_name: str = Field(..., description="The last name.", max_length=256)
    link: str | None = Field(
        None,
        description="URL that is used to get this instance.  This property is computed and cannot be modified.",
    )
    locked: bool | None = Field(None, description="Flag whether the user is locked.")
    login: str | None = Field(None, description="The user login.", max_length=256)
    password: str | None = Field(
        None,
        description="The password. This attribute is only used to set the password upon user creation.\n This attribute is only valid when the user does not use centralized authentication.",
    )
    password_expiration_date: AwareDatetime | None = Field(
        None, description="The user password expiration time"
    )
    password_modification_date: AwareDatetime | None = Field(
        None, description="The time, where the password was last modified"
    )
    preferred_data_locale: str | None = Field(
        None,
        description="The effective preferred data locale of the user. A locale is only considered if the user has at least read\n permission on the locale.",
    )
    preferred_ui_locale: str | None = Field(
        None, description="The preferred UI locale of the user."
    )
    roles: list[str] | None = Field(
        None, description="List of role ids the user is assigned to."
    )


class UserSearchResult(BaseModel):
    """
    <p>Document representing an user search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[User] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Users(BaseModel):
    """
    <p>Document representing a list of users.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[User] | None = Field(None, description="The list of users.")
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class VariationAttributeType(Enum):
    """
    variation attribute type
    """

    string = "string"
    int = "int"
    unknown = "unknown"


class VariationAttributeValue(BaseModel):
    """
    <p>Document representing a variation attribute value.</p>
    """

    description: dict[str, str] | None = Field(
        None, description="The localized description of the variation value."
    )
    image: MediaFile | None = None
    image_swatch: MediaFile | None = None
    link: str | None = None
    name: dict[str, str] | None = Field(
        None, description="The localized display name of the variation value."
    )
    orderable: bool | None = Field(
        None,
        description="A flag indicating whether at least one variant with this variation attribute value is available to sell.",
    )
    position: float | None = Field(
        None,
        description="The position of the value among all values of a variation attribute.",
    )
    value: str = Field(..., description="The actual variation value.", min_length=1)


class VariationAttributeValues(BaseModel):
    """
    <p>Document representing an unfiltered list of variation attribute values.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[VariationAttributeValue] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class VariationGroup(BaseModel):
    """
    <p>Document representing a variation group.</p>
    """

    link: str | None = Field(None, description="The URL addressing the product.")
    orderable: bool | None = Field(
        None, description="A flag indicating whether the variation group is orderable."
    )
    price: float | None = Field(
        None, description="The sales price of the variation group."
    )
    price_per_unit: float | None = Field(
        None, description="The sales price per unit of the variation group."
    )
    product_id: str | None = Field(
        None,
        description="The id (SKU) of the variation group.",
        max_length=100,
        min_length=1,
    )
    variation_values: dict[str, str] | None = Field(
        None, description="The actual variation attribute id - value pairs."
    )


class VariationGroups(BaseModel):
    """
    <p>Document representing an unfiltered list of variation groups.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[VariationGroup] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class VersionRangeObject(BaseModel):
    """
    <p>Object to represent the Version Range. Used in resources_object.</p>
    """

    from_: str | None = Field(None, alias="from", description="Starting version")
    until: str | None = Field(None, description="Ending version")


class WebdavPermission(BaseModel):
    """
    <p>Document representing a WebDAV permission.</p>
    """

    description: dict[str, str] | None = Field(
        None, description="The description of the WebDAV permission."
    )
    folder: str | None = Field(None, description="The folder of the WebDAV permission.")
    type: str | None = Field(None, description="The permission type.")
    values: list[str] | None = Field(
        None,
        description="The list of possible values for the WebDAV permission, e.g. ACCESS or READONLY.",
    )


class WebdavPermissions(BaseModel):
    """
    <p>Document representing the available WebDAV permissions.</p>
    """

    scopes: list[str] | None = Field(
        None, description="The available WebDAV permission scopes (e.g. unscoped)."
    )
    unscoped: list[WebdavPermission] | None = Field(
        None, description="The collection of available unscoped WebDAV permissions."
    )


class Type4(Enum):
    boolean = "boolean"
    date = "date"
    datetime = "datetime"
    decimal = "decimal"
    integer = "integer"
    string = "string"
    time = "time"


class Arguments(BaseModel):
    type: Type4 | None = None
    value: Any | None = None


class Fault1(BaseModel):
    type: str = Field(
        ...,
        description="Error type identifier (e.g., NotFoundException, CodeVersionIdNotFoundException)",
    )
    message: str = Field(..., description="Human-readable error message")
    arguments: dict[str, Arguments] | None = Field(
        None, description="Map of argument values integrated into the message"
    )


class Fault(BaseModel):
    """
    OCAPI error/fault response returned for 4xx/5xx status codes
    """

    field_v: str | None = Field(None, alias="_v", description="API version")
    fault: Fault1 | None = None


class AbTestSegment(BaseModel):
    """
    <p>Document representing an A/B Test Segment</p>
    """

    allocation: int | None = Field(None, description="Test Group percentage allocation")
    custom_experience: bool | None = Field(
        None,
        description="Flag to determine if this Test Group is a customer experience",
    )
    description: str | None = Field(
        None, description="Test Group description", max_length=4000
    )
    id: str | None = Field(
        None, description="Test group id", max_length=40, min_length=1
    )
    link: str | None = Field(None, description="")
    promotions: list[dict[str, Any]] | None = Field(
        None, description="Promotions which this segment has as experiences"
    )
    slot_configs: list[dict[str, Any]] | None = Field(
        None, description="Slot configurations which this segment has as experiences"
    )
    sorting_rules: list[dict[str, Any]] | None = Field(
        None, description="Sorting rules which this segment has as experiences"
    )
    stats: AbTestSegmentStats | None = None


class AccountTransaction(BaseModel):
    """
    <p>Document representing an account transaction</p>
    """

    amount: Money | None = None
    order_no: str | None = Field(
        None, description="The order number of the gift certificate"
    )
    timestamp: AwareDatetime | None = Field(
        None, description="The timestamp of the transaction of the gift certificate"
    )
    type_code: TypeCode | None = Field(
        None, description="The type code of the gift certificate"
    )


class Bmpermissions(BaseModel):
    functional: FunctionalPermissions | None = None
    functional_link: str | None = None
    locale: LocalePermissions | None = None
    locale_link: str | None = None
    module: ModulePermissions | None = None
    module_link: str | None = None
    types: list[str] | None = None
    webdav: WebdavPermissions | None = None
    webdav_link: str | None = None


class BoolFilter(BaseModel):
    """
    <p>Document representing a boolean filter.

     A boolean filter allows you to combine other filters into (possibly recursive) logical expression trees. A boolean filter
     is configured with a boolean operator (AND, OR, NOT) and a list of filters the operator relates to. If multiple
     filters are given to a boolean NOT operator, this is interpreted as a NOT upon a boolean OR of the given filters.

      <b> Example: </b>  (id="myId" AND coupon_id="couponOne")
       <pre>
      query: {
         filtered_query: {
             query: { match_all_query: {} },
             filter: {
                 bool_filter: {
                     operator: "and",
                     filters: [
                         { term_filter: { field: "id", operator: "is", values: ["myId"] } },
                         { term_filter: { field: "coupon_id", operator: "is", values: ["couponOne"] } }
                     ]
                 }
             }
         }
      }
       </pre>
       <b> Example: </b>  (id="holidaySale" OR redemption_count BETWEEN(1, 20)
       <pre>
         query: {
             filtered_query: {
                 query: { match_all_query: {} },
                 filter: {
                     bool_filter: {
                     operator: "or",
                     filters: [
                         { term_filter: { field: "id", operator: "is", values: ["holidaySale"] } },
                         { range_filter: { field: "redemption_count", from: 1, to: 20 } }
                     ]
                 }
             }
         }
      }
       </pre>
       <b> Example: </b>  NOT(enabled=false OR coupon_id="special")
       <pre>
         query: {
             filtered_query: {
                 query: { match_all_query: {} },
                 filter: {
                     bool_filter: {
                     operator: "not",
                     filters: [
                         { term_filter: { field: "enabled", operator: "is", values: [false] } },
                         { term_filter: { field: "coupon_id", operator: "is", values: ["special"] } }
                     ]
                 }
             }
         }
      }
       </pre></p>
    """

    filters: list[Any] | None = Field(
        None,
        description="A list of filters, which are logically combined by an operator.",
    )
    operator: Operator = Field(
        ..., description="The logical operator the filters are combined with."
    )


class BoolQuery(BaseModel):
    """
    <p>A boolean query allows construction of full logical expression trees consisting of other queries (usually term and text
    queries). A boolean query basically has 3 sets of clauses that 'must', 'should' and / or 'must not' match.  If 'must',
    'must_not', or 'should' appear in the same boolean query, they are combined logically using the AND operator.
    The difference between must and should operators is that the must operator requires all subqueries to match whereas the should operator only requires one match

     <b> Example: </b>  (id = 'foo' AND description LIKE 'bar')
     <pre>
       query: {
           bool_query: {
               must: [
                   { term_query: { fields: ["id"], operator: "is", values: ["foo"] } },
                   { text_query: { fields: ["description"], search_phrase: "bar" } }
               ]
           }
       }
     </pre>

     <b> Example: </b>  (id = 'foo' OR description LIKE 'bar')
     <pre>
       query: {
           bool_query: {
               should: [
                   { term_query: { fields: ["id"], operator: "is", values: ["foo"] } },
                   { text_query: { fields: ["description"], search_phrase: "bar" } }
               ]
           }
       }
     </pre>

     <b> Example: </b>  (NOT (id = 'foo' AND description LIKE 'bar'))
     <pre>
       query: {
           bool_query: {
               must_not: [
                   { term_query: { fields: ["id"], operator: "is", values: ["foo"] } },
                   { text_query: { fields: ["description"], search_phrase: "bar" } }
               ]
           }
       }
     </pre>

     <b> Example: </b>  ((coupon_id LIKE "limit" AND description LIKE "limit per customer") AND NOT (enabled=false))
     <pre>
       query: {
           bool_query: {
               must: [
                   { text_query: { fields: [ "coupon_id" ], search_phrase: "limit" } },
                   { text_query: { fields: [ "description" ], search_phrase: "limit per customer" } }
               ],
               must_not: [
                   { term_query: { fields: [ "enabled" ], operator: "is", values: [false] } }
               ]
           }
       }
     </pre></p>
    """

    must: list[Any] | None = Field(None, description="List of queries that must match.")
    must_not: list[Any] | None = Field(
        None, description="List of queries that must not match."
    )
    should: list[Any] | None = Field(
        None,
        description="List of queries that should match (i.e., at least one query must match).",
    )


class CampaignSearchResult(BaseModel):
    """
    <p>Document representing a campaign search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Campaign] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Catalog(BaseModel):
    """
    <p>Document representing a catalog</p>
    """

    assigned_product_count: int | None = Field(
        None,
        description="The count of products assigned to the catalog. It is read only.",
    )
    assigned_sites: list[Site] | None = Field(
        None, description="The sites assigned to the catalog. It is read only."
    )
    category_count: int | None = Field(
        None, description="The category count of catalog. It is read only."
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: dict[str, str] | None = Field(
        None, description="The description of catalog"
    )
    id: str | None = Field(None, description="The catalog Id")
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None, description="URL that is used to get this instance. It is read only."
    )
    name: dict[str, str] | None = Field(None, description="The catalog name")
    online: bool | None = Field(None, description="The online status of catalog")
    owned_product_count: int | None = Field(
        None, description="The count of products owned by the catalog. It is read only."
    )
    recommendation_count: int | None = Field(
        None, description="The recommendation count of the catalog. It is read only."
    )
    root_category: str | None = Field(
        None, description="The root category of the catalog.  It is read only"
    )


class CatalogSearchResult(BaseModel):
    """
    <p>Document representing a catalog search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Catalog] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Catalogs(BaseModel):
    """
    <p>Document representing an unfiltered list of catalogs.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Catalog] | None = Field(None, description="The collection of catalogs.")
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class CategoryProductAssignmentSearchRequest(BaseModel):
    """
    <p>Document representing product_search_request</p>
    """

    count: int | None = Field(
        None, description="The number of returned documents", ge=1, le=200
    )
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="The list of expansions that can be applied:\n <ul>\n <li><p>product_base - String - This expand will enable retrieval of the following basic <b>Product</b> information:</p>\n \t<ul>\n \t\t<li>brand</li>\n    \t<li>ean</li>\n      <li>link</li>\n  \t<li>long_description</li>\n      <li>manufacturer_name</li>\n      <li>manufacturer_sku</li>\n \t\t<li>name</li>\n      <li>page_description</li>\n      <li>page_keywords</li>\n      <li>page_title</li>\n      <li>searchable</li>\n   \t<li>short_description</li>\n      <li>type</li>\n      <li>unit</li>\n     \t<li>upc</li>\n \t</ul></li>\n </ul>",
    )
    query: Any = Field(
        ...,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )


class ContentAsset(BaseModel):
    """
    <p>Document representing a content asset.</p>
    """

    c_Year: str | None = None
    c_body: dict[str, MarkupText] | None = None
    c_customCSSFile: MediaFile | None = None
    classification_folder_id: str | None = Field(
        None,
        description="The ID of the classification folder. It is only part of the response, if the assignment from  this content asset to the folder is marked as 'default'. The property is read-only. To  set the classification folder just create/update an assignment between this content asset and  a folder and mark it as 'default'. See details in  /libraries/{library_id}/folder_assignments/{content_id}/{folder_id} resource.",
    )
    classification_folder_link: str | None = Field(
        None,
        description="The link to the classification folder. It is only part of the response, if the assignment from  this content asset to the folder is marked as 'default'. The property is read-only. To  set the classification folder just create/update an assignment between this content asset and  a folder and mark it as 'default'. See details in  /libraries/{library_id}/folder_assignments/{content_id}/{folder_id} resource.",
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: dict[str, str] | None = Field(
        None, description="The localized content asset description."
    )
    id: str | None = Field(
        None, description="The id of the content asset.", max_length=256, min_length=1
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None, description="The link to the content asset resource."
    )
    name: dict[str, str] | None = Field(
        None, description="The localized content asset name."
    )
    online: dict[str, bool] | None = Field(None, description="Is the asset online?")
    page_description: dict[str, str] | None = Field(
        None, description="The localized content asset page description."
    )
    page_keywords: dict[str, str] | None = Field(
        None, description="The localized content asset page keywords."
    )
    page_title: dict[str, str] | None = Field(
        None, description="The localized content asset page title."
    )
    page_url: dict[str, str] | None = Field(
        None, description="The localized content asset page url."
    )
    searchable: dict[str, bool] | None = Field(
        None, description="Is the asset searchable?"
    )
    site_map_change_frequency: dict[str, SiteMapChangeFrequency] | None = Field(
        None,
        description="The content assets change frequency needed for the sitemap creation  (always, hourly, daily, weekly, monthly, yearly, never).",
    )
    site_map_included: dict[str, SiteMapIncluded] | None = Field(
        None,
        description="The status if the content asset is included into the sitemap (either 0 or  1).",
    )
    site_map_priority: dict[str, SiteMapPriority] | None = Field(
        None,
        description="The content assets priority needed for the sitemap creation (0.0 for no  priority defined).",
    )
    template: str | None = Field(None, description="The rendering template.")


class ContentAssetResult(BaseModel):
    """
    <p>Result document containing an array of content assets.</p>
    """

    count: int | None = Field(
        None, description="The number of search results in the current page."
    )
    data: list[dict[str, Any]] | None = Field(None, description="The returned objects.")
    hits: list[ContentAsset] | None = Field(
        None, description="The sorted array of search hits. This array can be empty."
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search result to include in the document.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of search results.")


class ContentFolder(BaseModel):
    """
    <p>Document representing a content folder.</p>
    """

    c_customCSSFile: MediaFile | None = None
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: dict[str, str] | None = Field(
        None, description="The localized content folder description."
    )
    id: str | None = Field(
        None, description="The id of the content folder.", max_length=256
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None, description="The link to the content folder resource."
    )
    name: dict[str, str] | None = Field(
        None, description="The localized content folder name."
    )
    online: bool | None = Field(
        None,
        description="A flag indicating whether the folder in online (default is false).",
    )
    page_description: dict[str, str] | None = Field(
        None, description="The localized content folder page description."
    )
    page_keywords: dict[str, str] | None = Field(
        None, description="The localized content folder page keywords."
    )
    page_title: dict[str, str] | None = Field(
        None, description="The localized content folder page title."
    )
    page_url: dict[str, str] | None = Field(
        None, description="The localized content folder page URL."
    )
    parent_folder_id: str | None = Field(
        None, description="The id of the parent content folder."
    )
    parent_link: str | None = Field(
        None, description="The URL to the parent content folder."
    )
    sub_folders_link: str | None = Field(
        None, description="The URL to list the content sub-folders."
    )
    template: str | None = Field(None, description="The rendering template.")


class ContentFolderResult(BaseModel):
    """
    <p>Result document containing an array of content folders.</p>
    """

    count: int | None = Field(
        None, description="The number of search results in the current page."
    )
    data: list[dict[str, Any]] | None = Field(None, description="The returned objects.")
    hits: list[ContentFolder] | None = Field(
        None, description="The sorted array of search hits. This array can be empty."
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search result to include in the document.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of search results.")


class ContentSubFolderResult(BaseModel):
    """
    <p>Result document containing an array of content subfolders.</p>
    """

    count: int | None = Field(
        None, description="The number of search results in the current page."
    )
    data: list[dict[str, Any]] | None = Field(None, description="The returned objects.")
    hits: list[ContentFolder] | None = Field(
        None, description="The sorted array of search hits. This array can be empty."
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search result to include in the document.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of search results.")


class Coupon(BaseModel):
    """
    <p>Document representing a coupon.</p>
    """

    case_insensitive: bool | None = Field(
        None,
        description="<code>True</code> if a coupon is case insensitive; <code>false</code> otherwise. This attribute on the coupon can not be\n modified after the coupon has been created. If an attempt was made to modify this the system would return\n CouponUpdateForbiddenException",
    )
    coupon_id: str | None = Field(
        None, description="The id of the coupon.", max_length=256, min_length=1
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: str | None = Field(
        None, description="The description of the coupon.", max_length=4000
    )
    enabled: bool | None = Field(
        None, description="A flag indicating whether the coupon is enabled."
    )
    exported_code_count: int | None = Field(
        None,
        description="The number of coupon codes attached to the coupon that have been issued (request search only).",
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(None, description="A link to the coupon.")
    multiple_codes_per_basket: bool | None = Field(
        None,
        description="<code>True</code> if a coupon with multiple codes can have different codes used on the same basket or order. If the coupon\n type does not support this configuration, this will return <code>false</code>.",
    )
    redemption_count: int | None = Field(
        None,
        description="The number of times the coupon has been redeemed (request search only).",
    )
    redemption_limits: RedemptionLimits | None = None
    single_code: str | None = Field(
        None,
        description="Single coupon code, only valid for Single Code type",
        max_length=256,
        min_length=1,
    )
    system_codes_config: CouponSystemCodeConfig | None = None
    total_codes_count: int | None = Field(
        None, description="The total number of coupon codes associated with this coupon"
    )
    type: Type1 | None = Field(None, description="The type of the coupon code.")


class CouponRedemptionSearchResult(BaseModel):
    """
    <p>The result of the coupon redemption search</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[CouponRedemption] | None = Field(
        None, description="The hits from the search"
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class CouponSearchResult(BaseModel):
    """
    <p>Document representing a coupon search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Coupon] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Coupons(BaseModel):
    """
    <p>Document representing an unfiltered list of coupons.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Coupon] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class Cscpermissions(BaseModel):
    module: ModulePermissions | None = None
    module_link: str | None = None
    types: list[str] | None = None


class CustomLogSettings(BaseModel):
    """
    <p>Document representing custom logging settings.</p>
    """

    debug_permitted: bool | None = Field(
        None, description="False if the current instance is production."
    )
    debug_to_file: bool | None = Field(
        None, description="Indicates if custom debug logs are written to file."
    )
    email_to: str | None = Field(
        None,
        description="Email addresses for fatal log messages with a maximum length of 1000 characters.",
        max_length=1000,
    )
    error_to_file: bool | None = Field(
        None, description="Indicates if custom error logs are written to file."
    )
    fatal_to_file: bool | None = Field(
        None, description="Indicates if custom fatal logs are written to file."
    )
    info_to_file: bool | None = Field(
        None, description="Indicates if custom info logs are written to file."
    )
    log_categories: list[LogCategory] | None = Field(
        None, description="Defined custom log categories."
    )
    root_level: str | None = Field(None, description="Custom root category log level.")
    warn_to_file: bool | None = Field(
        None, description="Indicates if custom warn logs are written to file."
    )


class CustomObjectSearchResult(BaseModel):
    """
    <p>Document representing a custom object search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[CustomObject] | None = Field(
        None, description="The sorted array of search hits. May be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Customer(BaseModel):
    """
    <p>Document representing a customer.</p>
    """

    birthday: date_aliased | None = Field(None, description="The customer's birthday.")
    c_familyStatus: str | None = None
    company_name: str | None = Field(
        None, description="The customer's company name.", max_length=256
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    credentials: Credentials | None = None
    customer_id: str | None = Field(
        None,
        description="The customer's id. Both registered and guest customers have a\n customer id.",
        max_length=28,
    )
    customer_no: str | None = Field(
        None, description="The customer's number.", max_length=100
    )
    email: EmailStr | None = Field(
        None, description="The customer's email address.", max_length=256
    )
    fax: str | None = Field(
        None,
        description="The fax number to use for the customer.\n The length is restricted to 32 characters.",
        max_length=32,
    )
    first_name: str | None = Field(
        None, description="The customer's first name.", max_length=256
    )
    gender: Gender | None = Field(None, description="The customer's gender.")
    global_party_id: str | None = Field(
        None,
        description="The Global Party ID is set by Customer 360 and identifies a person across multiple systems.",
    )
    job_title: str | None = Field(
        None, description="The customer's job title.", max_length=256
    )
    last_login_time: AwareDatetime | None = Field(
        None, description="The last login time of the customer."
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    last_name: str | None = Field(
        None, description="The customer's last name.", max_length=256
    )
    last_visit_time: AwareDatetime | None = Field(
        None, description="The last visit time of the customer."
    )
    phone_business: str | None = Field(
        None, description="The customer's business phone number.", max_length=32
    )
    phone_home: str | None = Field(
        None, description="The customer's home phone number.", max_length=32
    )
    phone_mobile: str | None = Field(
        None, description="The customer's mobile phone number.", max_length=32
    )
    preferred_locale: str | None = Field(
        None,
        description="The customer's preferred locale, formatted with a hyphen. (For example: en-US)\n If the request uses an underscore, as with the Java locale format, the stored value is converted to a hyphen.\n (For example: en_US is stored as en-US)",
    )
    previous_login_time: AwareDatetime | None = Field(
        None, description="The time when the customer logged in previously."
    )
    previous_visit_time: AwareDatetime | None = Field(
        None, description="The time when the customer previously visited the store."
    )
    primary_address: CustomerAddress | None = None
    salutation: str | None = Field(
        None, description="The customer's salutation.", max_length=256
    )
    second_name: str | None = Field(
        None, description="The customer's second name.", max_length=256
    )
    suffix: str | None = Field(
        None,
        description='The customer\'s suffix (for example, "Jr." or "Sr.").',
        max_length=256,
    )
    title: str | None = Field(
        None,
        description='The customer\'s title (for example, "Mrs" or "Mr").',
        max_length=256,
    )


class CustomerGroup(BaseModel):
    """
    <p>Document representing a customer group</p>
    """

    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: str | None = Field(
        None,
        description="The description for the customer group.  This property is read-only for system groups.",
    )
    id: str | None = Field(
        None,
        description="The user specific identifier for the customer group, which must be unique across the organization.  Property\n is read-only.",
        max_length=256,
        min_length=1,
    )
    in_deletion: bool | None = Field(
        None, description="The deletion status of this customer group."
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None,
        description="URL that is used to get this instance.  This property is computed and cannot be modified.",
    )
    member_count: int | None = Field(
        None, description="The number of members in this customer group."
    )
    rule: Rule | None = None
    type: Type2 | None = Field(
        None, description="The type of the customer group.  This property is read-only."
    )


class CustomerGroupMemberSearchResult(BaseModel):
    """
    <p>Document representing a customer group member search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[CustomerGroupMember] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class CustomerGroupSearchResult(BaseModel):
    """
    <p>Document representing a customer group search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[CustomerGroup] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class CustomerGroups(BaseModel):
    """
    <p>Document representing an unfiltered list of customer groups.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[CustomerGroup] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class CustomerList(BaseModel):
    """
    <p>Document representing a customer list.</p>
    """

    id: str = Field(..., description="The id of the customer list.", min_length=1)
    preferences: CustomerListPreferences | None = None


class CustomerSearchHit(BaseModel):
    """
    <p>Document representing a customer search hit.</p>
    """

    data: Customer | None = None
    relevance: float | None = Field(None, description="The hit's relevance score.")


class CustomerSearchResult(BaseModel):
    """
    <p>Document representing a customer search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(None, ge=0)
    expand: list[str] | None = Field(
        None, description="The list of expands set. Can be empty."
    )
    hits: list[CustomerSearchHit] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    sorts: list[Sort] | None = None
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class FilteredQuery(BaseModel):
    """
    <p>A filtered query allows to filter the result of a (possibly complex) query using a (possibly complex) filter.

      <b> Example: </b>
      <pre>
        query : {
            filtered_query: {
                query: {
                    text_query: { fields: ["coupon_id"], search_phrase: "disabled" }
                },
                filter: {
                    term_filter: {
                        field: "enabled", operator: "is", values: [ false ]
                    }
                }
            }
        }
      </pre></p>
    """

    filter: Any = Field(
        ...,
        description="<p>Document representing a filter.\n   \n A filter contains a set of objects that define criteria used to select records. A filter\n can contain one of the following:\n  <ul> \n    <li> term_filter - matches records where a field (or fields) exactly match some simple value (including null). </li> \n    <li> range_filter - matches records where a field value lies in a specified range. </li> \n    <li> query_filter - provides filtering based on a query. </li> \n    <li> bool_filter - provides filtering of records using a set of filters combined with a specified operator. </li> \n  </ul></p>",
    )
    query: Any = Field(
        ...,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )


class GiftCertificate(BaseModel):
    """
    <p>Document representing a gift certificate</p>
    """

    amount: Money | None = None
    balance: Money | None = None
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: str | None = Field(
        None, description="The description of the gift certificate.", max_length=4000
    )
    enabled: bool | None = Field(
        None, description="The enabled flag of the gift certificate."
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None,
        description="The URL to get the gift certificate.\n This is a computed attribute and cannot be modified.",
    )
    masked_gift_certificate_code: str | None = Field(
        None,
        description="The masked gift certificate code with all but the\n last 4 characters replaced with a '*' character.\n This is a computed attribute and cannot be modified.",
    )
    merchant_id: str | None = Field(
        None,
        description="The merchant ID of the gift certificate.\n This is a unique attribute.\n This is a computed attribute and cannot be modified.\n This is used to get, update and the delete gift certificates.",
    )
    message: str | None = Field(
        None,
        description="The message to the recipient of the gift certificate.",
        max_length=4000,
    )
    order_no: str | None = Field(
        None, description="The order number of the gift certificate."
    )
    recipient_email: str | None = Field(
        None, description="The email address of the recipient of the gift certificate."
    )
    recipient_name: str | None = Field(
        None, description="The recipient of the gift certificate.", max_length=256
    )
    sender_name: str | None = Field(
        None, description="The sender of the gift certificate.", max_length=256
    )
    status: Status2 | None = Field(
        None,
        description='The status of the gift certificate.\n While creating a gift certificate, user can set the status\n to either "pending" or "issued" only.',
    )
    transactions: list[AccountTransaction] | None = Field(
        None,
        description="The transactions of the gift certificate. This attribute is only available as part of the response.",
    )


class GiftCertificateSearchResult(BaseModel):
    """
    <p>Document representing a gift certificate search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[GiftCertificate] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class GiftCertificates(BaseModel):
    """
    <p>Document representing an unfiltered list of gift certificates.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[GiftCertificate] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class InventoryListSearchResult(BaseModel):
    """
    <p>Document representing a inventorylist search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[InventoryList] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class JobStepExecution(BaseModel):
    chunk_size: int | None = Field(
        None,
        description="The chunk size for a chunk oriented step execution, otherwise null.",
    )
    duration: int | None = Field(
        None, description="Time in milliseconds, the execution was or is running."
    )
    end_time: AwareDatetime | None = Field(
        None, description="Timestamp, when execution was finished."
    )
    execution_scope: str | None = Field(
        None, description="The ID of the scope this step is or was executed for."
    )
    execution_status: ExecutionStatus1 | None = Field(
        None,
        description="Current execution status of the step.\n <ul>\n <li>'pending': Execution of the step been initiated but the step is not executing yet. Possible next status:\n 'running'.</li>\n <li>'running': The step is currently actively executed. Possible next status: 'finished', 'pausing' or\n 'aborted'.</li>\n <li>'finished': The step execution is finished and is not actively executed currently. Possible next status:\n none.</li>\n <li>'pausing': Pausing of a running step execution has been initiated but the step is not paused yet. Possible\n next status: 'paused' or 'aborted'.</li>\n <li>'paused': The step execution is paused and is not actively executed currently. Possible next status:\n 'pending'.</li>\n <li>'aborted': A running step execution has been aborted and is not actively executed currently. Possible next\n status: none.</li>\n </ul>",
    )
    exit_status: StatusModel | None = None
    id: str | None = Field(None, description="ID of the execution object.")
    include_steps_from_job_id: str | None = Field(
        None,
        description="ID of the job the step of this step execution was included from, if the step was included from another job.",
    )
    is_chunk_oriented: bool | None = Field(
        None,
        description="True if this execution represents a chunk oriented step execution.",
    )
    item_filter_count: int | None = Field(
        None,
        description="The current number of items that have been filtered for a chunk oriented step execution, otherwise null.",
    )
    item_write_count: int | None = Field(
        None,
        description="The current number of items that have been written for a chunk oriented step execution, otherwise null.",
    )
    modification_time: AwareDatetime | None = Field(
        None, description="Timestamp of the last modification time for the execution."
    )
    start_time: AwareDatetime | None = Field(
        None, description="Timestamp, when execution was started."
    )
    status: str | None = Field(
        None,
        description="The current status. If the step execution is currently executed (execution status is one of 'pending', 'running',\n 'pausing') the execution status is returned. If the step execution is not executed currently anymore (execution\n status is one one 'finished', 'paused' or 'aborted') the exit status code of the step execution is returned.",
    )
    status_metadata: StatusMetadata | None = None
    step_description: str | None = Field(
        None,
        description="Description of the step, this execution belongs to.ID of the step",
    )
    step_id: str | None = Field(
        None, description="ID of the step, this execution belongs to.ID of the step"
    )
    step_type_id: str | None = Field(
        None, description="ID of the step's type at the time it is or was executed."
    )
    step_type_info: str | None = Field(
        None,
        description="Additional information regarding the step's type at the time it is or was executed (e.g. name of a script module\n and function).",
    )
    total_item_count: int | None = Field(
        None,
        description="The total number of items that will be processed for a chunk oriented step execution (null if unknown), otherwise\n null.",
    )


class NestedQuery(BaseModel):
    """
    <p>A nested query queries nested documents that are part of a larger document. The classical example is a
     product master with variants (in one big document) where you want to constrain a search to masters that have
     variants that match multiple constraints (like color = blue AND size = M).
     This query is not compatible with some search types.
      <b> Example: </b>  finds all the documents that has firstname = "John" and lastname = "Doe"
      <pre>
      {
       "query": {
         "bool_query": {
           "must": [
             {
               "nested_query": {
                 "path": "order.shipping_addresses",
                 "query": {
                   "bool_query": {
                     "must": [
                       {
                         "bool_query": {
                           "must": [
                             {
                               "term_query": {
                                 "fields": [ "order.shipping_addresses.first_name" ],
                                 "operator": "is",
                                 "values": [ "John" ]
                               }
                             }
                           ]
                         }
                       },
                       {
                         "bool_query": {
                           "must": [
                             {
                               "term_query": {
                                 "fields": [ "order.shipping_addresses.last_name" ],
                                 "operator": "is",
                                 "values": [ "Doe" ]
                               }
                             }
                           ]
                         }
                       }
                     ]
                   }
                 },
                 "score_mode": "avg"
               }
             }
           ]
         }
       }
     }
      </pre></p>
    """

    path: str = Field(..., description="")
    query: Any = Field(
        ...,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    score_mode: ScoreMode | None = Field(None, description="")


class ObjectAttributeDefinition(BaseModel):
    """
    <p>Document representing a attribute definition</p>
    """

    creation_date: AwareDatetime | None = None
    default_value: ObjectAttributeValueDefinition | None = None
    description: dict[str, str] | None = Field(
        None, description="The localized description of the attribute."
    )
    display_name: dict[str, str] | None = Field(
        None, description="The localized name presented to the user in forms."
    )
    effective_id: str | None = Field(
        None,
        description="The effective ID, which is c_id if the attribute is custom, and just the id otherwise. It is read only.",
    )
    externally_defined: bool | None = Field(
        None, description="Flag indicating if this attribute is externally defined."
    )
    externally_managed: bool | None = Field(
        None, description="Flag indicating if this attribute is externally managed."
    )
    field_height: int | None = Field(
        None, description="The height of the field for this attribute in the editor."
    )
    field_length: int | None = Field(
        None, description="The length of the field for this attribute in the editor."
    )
    id: str | None = Field(None, description="The user supplied ID of the attribute.")
    key: bool | None = Field(
        None, description="Flag indicating if this is a key attribute."
    )
    last_modified: AwareDatetime | None = None
    link: str | None = Field(
        None,
        description="The URL that is used to get this instance.  Value is computed and read-only.",
    )
    localizable: bool | None = Field(
        None, description="Flag indicating if this attribute can be localized."
    )
    mandatory: bool | None = Field(
        None, description="Flag indicating if a value is mandatory for the attribute."
    )
    max_value: float | None = Field(
        None, description="The maximum possible value for this attribute."
    )
    min_length: int | None = Field(
        None, description="The minimum length of the field for this attribute."
    )
    min_value: float | None = Field(
        None, description="The minimum possible value for this attribute."
    )
    multi_value_type: bool | None = Field(
        None,
        description="<p>True if the attribute can have multiple values.</p>\n <p>Attributes of the following types are multi-value capable:</p>\n <ul>\n <li>set_of_int</li>\n <li>set_of_number</li>\n <li>set_of_string</li>\n </ul>\n <p>Additionally, attributes of the following types can be multi-value\n enabled:</p>\n <ul>\n <li>enum_of_int</li>\n <li>enum_of_string</li>\n </ul>",
    )
    order_required: bool | None = Field(
        None,
        description="Flag indicating if this attribute is required for order of the attribute model's product. The set of these can be used\n in order line items.",
    )
    queryable: bool | None = Field(
        None,
        description="Returns true if the attribute definition is explicitly marked queryable. If no explicit queryable is found\n and the attribute value type belongs to a queryable type, true is returned too. In all other cases false is returned.\n Value is computed and read-only.",
    )
    read_only: bool | None = Field(
        None,
        description="Flag indicating if this attribute is read-only. It is read only.",
    )
    regular_expression: str | None = Field(
        None,
        description="A regular expression that defines the legal values for this attribute.",
    )
    requires_encoding: bool | None = Field(
        None,
        description='Flag indicating if this attribute can be encoded using the encoding="off" flag in ISML templates. It is read only.',
    )
    scale: int | None = Field(
        None,
        description="The minimum number of fraction digits for a value of this attribute.",
    )
    searchable: bool | None = Field(
        None, description="Flag indicating if this attribute is searchable."
    )
    set_value_type: bool | None = Field(
        None,
        description="Flag indicating if this attribute is of type 'Set of'. It is read only.",
    )
    site_specific: bool | None = Field(
        None, description="Flag indicating if this attribute is site-specific."
    )
    system: bool | None = Field(
        None, description="Flag indicating if this attribute is a system attribute."
    )
    unit: dict[str, str] | None = Field(
        None, description="The unit of measure for this attribute."
    )
    value_definitions: list[ObjectAttributeValueDefinition] | None = Field(
        None,
        description="A set of values that are possible for this attribute. It is read only.",
    )
    value_type: ValueType | None = Field(
        None, description="The type of this attribute."
    )
    visible: bool | None = Field(
        None, description="Flag indicating if this attribute is visible."
    )


class ObjectAttributeDefinitionSearchResult(BaseModel):
    """
    <p>Document representing an attributedefinition search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[ObjectAttributeDefinition] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class ObjectAttributeDefinitions(BaseModel):
    """
    <p>Document representing an unfiltered list of object attribute definitions.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[ObjectAttributeDefinition] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class ObjectAttributeGroup(BaseModel):
    """
    <p>Document representing a attribute group</p>
    """

    attribute_definitions: list[ObjectAttributeDefinition] | None = Field(
        None, description="Attributes with the group displayed when expand=definition"
    )
    attribute_definitions_count: int | None = Field(
        None,
        description="The count of the attributes within the group.  This is a computed attribute and is read-only",
    )
    creation_date: AwareDatetime | None = None
    description: dict[str, str] | None = Field(
        None, description="The free-form text description of the group by locale"
    )
    display_name: dict[str, str] | None = Field(
        None, description="The name used to display the group by locale."
    )
    id: str | None = Field(
        None,
        description="The group's user specified identifier, used to retrieve the group",
    )
    internal: bool | None = Field(
        None,
        description="True if the group is meant only for internal use, false otherwise.  This property is read-only.",
    )
    last_modified: AwareDatetime | None = None
    link: str | None = Field(
        None,
        description="URL that is used to get this instance.  This is a computed attribute and is read-only",
    )
    position: float | None = Field(
        None, description="The position of the group relative to other groups.", ge=0.0
    )


class ObjectAttributeGroupSearchResult(BaseModel):
    """
    <p>Document representing a attributegroup search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[ObjectAttributeGroup] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class ObjectAttributeGroups(BaseModel):
    """
    <p>Document representing an unfiltered list of object group definitions.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[ObjectAttributeGroup] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class ObjectTypeDefinitionSearchResult(BaseModel):
    """
    <p>Document representing a systemobject search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[ObjectTypeDefinition] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class OrganizationPreferences(BaseModel):
    """
    <p>Represents a set of preferences attached at the organization level.</p>
    """

    link: str | None = Field(
        None, description="A URL that returns the full details for a custom preference"
    )
    site_preferences: list[SitePreferences] | None = Field(
        None, description="The list of site preferences, returned with expand=sites"
    )


class PreferenceValue(BaseModel):
    """
    <p>Represents a single preference value</p>
    """

    attribute_definition: ObjectAttributeDefinition | None = None
    description: dict[str, str] | None = Field(
        None, description="Description of the attribute"
    )
    display_name: dict[str, str] | None = Field(
        None, description="Display name for the attribute"
    )
    id: str | None = Field(None, description="The id of the attribute")
    site_values: dict[str, dict[str, Any]] | None = Field(
        None, description="The value of this attribute"
    )
    value_type: ValueType | None = Field(
        None, description="The type of this attribute."
    )


class PreferenceValueSearchResult(BaseModel):
    """
    <p>Document representing a preference value search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[PreferenceValue] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class ProductInventoryRecord(BaseModel):
    """
    <p>Document representing a product inventory record.</p>
    """

    allocation: ProductInventoryRecordAllocation | None = None
    ats: float | None = Field(
        None,
        description="The quantity of items available to sell (ATS). This is calculated as the allocation plus the\n preorderBackorderAllocation minus the turnover.",
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    in_stock_date: AwareDatetime | None = Field(
        None, description="The date that the item is expected to be in stock."
    )
    inventory_list_id: str | None = Field(
        None, description="The user supplied ID of the inventory list."
    )
    inventory_turnover: float | None = Field(
        None,
        description="The sum of all inventory transactions (decrements and increments) that have been recorded subsequent to the\n allocation was reset date. The quantity value can be negative due to higher quantity of inventory decrements than\n increments.",
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None, description="The URL that is used to get this instance."
    )
    perpetual_flag: bool | None = Field(
        None,
        description="The flag that determines if the product is perpetually in stock.",
    )
    pre_order_back_order_allocation: float | None = Field(
        None,
        description="The quantity of items that are allocated for sale, beyond the initial stock allocation.",
    )
    pre_order_back_order_handling: PreOrderBackOrderHandling | None = Field(
        None,
        description="The enum holding the records pre-backorder-handling configuration. Possible values are NONE, PREORDER and\n BACKORDER. Method returns NONE in case the record pre-backorder-handling-code is null or unknown.",
    )
    product_id: str | None = Field(
        None,
        description="The user supplied ID of the product.",
        max_length=256,
        min_length=1,
    )
    product_name: str | None = Field(None, description="The name of the product.")
    quantity_on_order: float | None = Field(
        None,
        description="The on order quantity, the quantity of all transactions for this record since the allocation reset date.",
    )
    stock_level: float | None = Field(
        None,
        description="The current stock level. This is calculated as the allocation minus the turnover.",
    )


class ProductInventoryRecords(BaseModel):
    """
    <p>Document representing an unfiltered list of inventory records.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[ProductInventoryRecord] | None = Field(
        None, description="The collection of product inventory records."
    )
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class ProductOption(BaseModel):
    """
    <p>Document representing a product option</p>
    """

    custom_name: dict[str, str] | None = Field(
        None, description="The localized custom name of the product option."
    )
    default_product_option_value: str | None = Field(
        None, description="The default product option value."
    )
    description: dict[str, str] | None = Field(
        None, description="The localized description of the product option."
    )
    id: str | None = Field(
        None,
        description="The object attribute definition id which is also the identifier for the product option.",
        min_length=1,
    )
    image: MediaFile | None = None
    link: str | None = Field(None, description="The URL link to the product option.")
    name: str | None = Field(
        None, description="The name of the object attribute definition."
    )
    selected_option_value: str | None = Field(
        None, description="The selected option value of the product option."
    )
    shared: bool | None = Field(
        None,
        description="The flag that indicates if the product option is shared or local.",
    )
    sorting_mode: SortingMode | None = Field(
        None, description="The sorting mode for the product option values."
    )
    values: list[ProductOptionValue] | None = Field(
        None, description="The sorted array of values of the product option."
    )


class ProductOptions(BaseModel):
    """
    <p>Document representing an unfiltered list of product options.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[ProductOption] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class Recurrence(BaseModel):
    """
    <p>Document representing a schedule recurrence.</p>
    """

    day_of_week: list[DayOfWeekEnum] | DayOfWeek | None = Field(
        None, description="The days of week for recurrence."
    )
    time_of_day: TimeOfDay | None = None


class ResourceObject(BaseModel):
    """
    <p>Object to represent a resource in ocapi_config_api_request</p>
    """

    cache_time: int | None = Field(None, description="Resource Cache time")
    config: dict[str, str] | None = Field(
        None, description="Configuration of the resource"
    )
    methods: list[str] = Field(
        ..., description="Allowed methods of the resource", min_length=1
    )
    personalized_caching_enabled: bool | None = Field(
        None,
        description="Indicate if the personalized caching is enabled for the resource",
    )
    read_attributes: str | None = Field(
        None, description="Read attributes of the resource"
    )
    resource_id: str = Field(..., description="Resource ID", min_length=1)
    version_range: VersionRangeObject | None = None
    write_attributes: str | None = Field(
        None, description="Write attributes of the resource"
    )


class RolePermissions(BaseModel):
    """
    <p>Document listing the permissions assigned to a certain role (accessible by type).</p>
    """

    functional: RoleFunctionalPermissions | None = None
    locale: RoleLocalePermissions | None = None
    module: RoleModulePermissions | None = None
    webdav: RoleWebdavPermissions | None = None


class RoleSearchRequest(BaseModel):
    """
    <p>Document representing an role search.

     Note that only either an user ID or a permission can be provided (or none), but not both. When one of them is provided,
     the further query elements will filter the respective role set (meaning the user ID / permission is AND-connected to the query definition).

     When a permission definition is using a site scope, it can contain only one site.

     When optional fields in the permission definitions are not provided, they will be treated as 'don't care' (so its e.g. possible so search for
     permission to site-specific BM modules without providing a site, and the search will return all roles having that permission for any site).</p>
    """

    count: int | None = Field(
        None, description="The number of returned documents", ge=1, le=200
    )
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    permissions: RolePermissions | None = None
    query: Any = Field(
        ...,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    user_id: str | None = Field(
        None, description="The id of the user whose roles are to be searched."
    )


class Schedule(BaseModel):
    """
    <p>Document representing a time schedule for slots.</p>
    """

    end_date: AwareDatetime | None = Field(
        None,
        description="The date to end of validity. ISO8601 date time format: yyyy-MM-dd'T'HH:mm:ssZ.",
    )
    recurrence: Recurrence | None = None
    start_date: AwareDatetime | None = Field(
        None,
        description="The date to start validity. ISO8601 date time format: yyyy-MM-dd'T'HH:mm:ssZ.",
    )


class SearchRequest(BaseModel):
    """
    <p>Document representing a search request for retrieving items within the Data API. The query is a potentially complex set of expressions. The fields that each query supports are defined within the search resource.</p>
    """

    count: int | None = Field(
        None, description="The number of returned documents", ge=1, le=200
    )
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    query: Any = Field(
        ...,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )


class SiteSearchResult(BaseModel):
    """
    <p>Document representing a site search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Site] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class SlotConfigurationAbtestGroupAssignment(BaseModel):
    abtest_description: str | None = None
    abtest_id: str | None = None
    enabled: bool | None = None
    schedule: Schedule | None = None
    segment_description: str | None = None
    segment_id: str | None = None


class SortingRule(BaseModel):
    """
    <p>Document representing a product sorting rule</p>
    """

    creation_date: AwareDatetime | None = None
    description: str | None = Field(
        None,
        description="The description of the product sorting rule.",
        max_length=4000,
    )
    id: str | None = Field(None, description="the id of product sorting rule.")
    last_modified: AwareDatetime | None = None
    product_sorting_rule_steps: list[SortingRuleStep] | None = Field(
        None, description="the steps involved in sorting by this rule."
    )
    rule_context: str | None = Field(
        None, description="The context of the rule, either site or global"
    )
    site: str | None = None


class SortingRuleSearchResult(BaseModel):
    """
    <p>Document representing a source code group search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[SortingRule] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class SourceCodeGroup(BaseModel):
    """
    <p>Document representing a source code group</p>
    """

    active: bool | None = Field(
        None,
        description="The active flag, a computed value based on start and end time",
    )
    active_redirect: SourceCodeRedirectInfo | None = None
    cookie_duration: int | None = Field(
        None, description="The cookie duration in days", ge=0, le=999
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: str | None = Field(None, description="The description")
    enabled: bool | None = Field(
        None,
        description="The enabled flag for storefront to consider the source code group, default to false.",
    )
    end_time: AwareDatetime | None = Field(None, description="The end time")
    id: str | None = Field(
        None, description="The id of source code group", max_length=28, min_length=1
    )
    inactive_redirect: SourceCodeRedirectInfo | None = None
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None, description="URL that is used to get this instance, read only"
    )
    specifications: list[SourceCodeSpecification] | None = Field(
        None, description="Source Code specifications"
    )
    start_time: AwareDatetime | None = Field(None, description="The start time")


class SourceCodeGroupSearchResult(BaseModel):
    """
    <p>Document representing a source code group search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[SourceCodeGroup] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class SourceCodeGroups(BaseModel):
    """
    <p>Document representing an unfiltered list of source code groups.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[SourceCodeGroup] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class VariationAttribute(BaseModel):
    """
    <p>Document representing a variation attribute.</p>
    """

    attribute_definition_id: str = Field(
        ..., description="The id of the requested attribute definition."
    )
    attribute_definition_name: dict[str, str] | None = Field(
        None,
        description="The localized display name of the variation attribute definition.",
    )
    default_value: str | None = Field(
        None, description="default variation attribute value"
    )
    id: str | None = Field(
        None, description="The id of the variation attribute.", min_length=1
    )
    link: str | None = Field(None, description="URL that is used to get this instance")
    name: dict[str, str] | None = Field(
        None, description="The localized display name of the variation attribute."
    )
    shared: bool | None = Field(
        None,
        description="Returns the value of attribute 'shared' if attribute is local or shared",
    )
    slicing: bool | None = Field(
        None, description="Returns the value of attribute 'slicing'."
    )
    values: list[VariationAttributeValue] | None = Field(
        None,
        description="The sorted array of variation values. This array can be empty.",
    )
    variation_attribute_type: VariationAttributeType | None = Field(
        None, description="variation attribute type"
    )


class VariationAttributes(BaseModel):
    """
    <p>Document representing an unfiltered list of variation attributes.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[VariationAttribute] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class AbTest(BaseModel):
    """
    <p>The id of the A/B Test</p>
    """

    customer_groups: list[str] | None = Field(
        None,
        description="The list of customer group ids assigned to the A/B Test. Defaults to 'Everyone' if not specified on create",
    )
    description: str | None = Field(
        None, description="The optional description of the A/B Test", max_length=4000
    )
    email_addresses: list[str] | None = Field(
        None,
        description="The optional list of email addresses to send A/B Test results",
    )
    enabled: bool | None = Field(
        None,
        description="The flag representing the enabled state of the A/B Test. Defaults to false if not specified on create",
    )
    end_date: AwareDatetime | None = Field(
        None,
        description="The date that the A/B Test ends. Defaults to two weeks from creation date if both start and end dates are not specified on create",
    )
    expiration_type: ExpirationType | None = Field(
        None,
        description="The participant expiration type of the A/B Test. Defaults to 'never' if not specified on create",
    )
    id: str | None = Field(
        None, description="The id of the A/B Test", max_length=40, min_length=1
    )
    key_metric_id: str | None = Field(
        None,
        description="The key metric that is most important to the A/B Test, among the metrics collected. Defaults to 'Revenue' if not specified from test participant activity",
        max_length=256,
    )
    link: str | None = Field(
        None,
        description="The URL to get the A/B test. This is a computed attribute and cannot be modified",
    )
    paused: bool | None = Field(
        None,
        description="The flag representing the paused state of the A/B Test. Defaults to false if not specified on create",
    )
    segment_count: int | None = Field(
        None,
        description="Segment count of A/B test. This is a computed attribute and cannot be modified",
    )
    start_date: AwareDatetime | None = Field(
        None,
        description="The date that the A/B Test begins. Defaults to a week from creation date if both start and end dates are not specified on create",
    )
    status: Status | None = Field(
        None,
        description="Status of A/B test. This is a computed attribute and cannot be modified",
    )
    tags: list[str] | None = Field(
        None,
        description="The optional list of tags to group similar A/B Tests so that they can be searched easily.",
    )
    test_groups: list[AbTestGroup] | None = Field(
        None,
        description="Test Groups created for an A/B Test. This is a read only attribute for now.",
    )
    test_segments: list[AbTestSegment] | None = Field(
        None,
        description="Test Segments created for an A/B Test. This is a read only attribute for now",
    )
    trigger: AbTestTrigger | None = None


class AbTestSearchResult(BaseModel):
    """
    <p>Request document containing a search response for A/B test</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(None, ge=0)
    expand: list[str] | None = None
    hits: list[AbTest] | None = Field(
        None, description="The search hits returned as an ordered list"
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    sorts: list[Sort] | None = None
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class AbTests(BaseModel):
    """
    <p>Request document containing a set of ABTests</p>
    """

    count: int | None = None
    data: list[AbTest] | None = Field(None, description="")
    expand: list[str] | None = None
    next: str | None = None
    previous: str | None = None
    select: str | None = None
    start: int | None = Field(None, ge=0)
    total: int | None = None


class ApplicationPermissions(BaseModel):
    """
    <p>Document representing the available applications for retrieving permissions.</p>
    """

    applications: list[str] | None = Field(
        None, description="The available applications (e.g. 'bm' for Business Manager)."
    )
    bm: Bmpermissions | None = None
    csc: Cscpermissions | None = None


class Category(BaseModel):
    """
    <p>Document representing a category.</p>
    """

    c_alternativeUrl: MarkupText | None = None
    c_catBannerID: str | None = Field(
        None,
        description="Used to define the content asset used to populate a grid page banner for a category. This value is applied to all sub-category navigation (cascading) if no specific catBannerID has been defined for  a sub-category.",
    )
    c_customCSSFile: MediaFile | None = None
    c_enableCompare: bool | None = Field(
        None,
        description="Used to define if/when the Compare feature is to be visualized in the storefront based on navigation. If enableCompare = FALSE, no Compare checkboxes will be displayed in the grid view. If enableCompare = TRUE, the category (and its children) will support the Compare feature.",
    )
    c_headerMenuBanner: MarkupText | None = None
    c_headerMenuOrientation: CHeaderMenuOrientation | None = Field(
        None,
        description="Which way to orient the menu and optional header menu HTML. Vertical will list all in one line. Horizontal will list in columns.",
    )
    c_showInMenu: bool | None = Field(
        None,
        description="Used to indicate that a category (such as Mens -> Footwear -> Boots) will display in the roll-over navigation. A sub-category only shows if also the parent category is marked as showInMenu. Up to three category levels are shown in roll-over navigation.",
    )
    c_sizeChartID: str | None = Field(
        None,
        description="Used to define the content asset ID of the Size Chart that is appropriate for products whose PRIMARY category is the associated category (and its children). Whenever a product detail page (or quick view) is rendered, the Size Chart link is populated based on the value of this attribute for the products primary categorization. If not defined, NO size chart link is displayed.",
    )
    c_slotBannerHtml: dict[str, MarkupText] | None = None
    c_slotBannerImage: MediaFile | None = None
    catalog_id: str | None = Field(
        None, description="The id of the catalog that contains it."
    )
    categories: list[Category] | None = Field(
        None, description="The array of sub categories for the category."
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    description: dict[str, str] | None = Field(
        None, description="The localized description of the category."
    )
    id: str | None = Field(
        None, description="The id of the category.", max_length=256, min_length=1
    )
    image: str | None = Field(
        None,
        description="The name of the category image. The URL to the image is computed.",
        max_length=256,
        min_length=1,
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None,
        description="The URL to get the category. This is a computed attribute and cannot be modified.",
    )
    name: dict[str, str] | None = Field(
        None, description="The localized name of the category."
    )
    online: bool | None = Field(
        None,
        description="The online status of the category determines if it is visible in the storefront. Defaults to false if not specified on create.",
    )
    page_description: dict[str, str] | None = Field(
        None, description="The localized page description of the category."
    )
    page_keywords: dict[str, str] | None = Field(
        None, description="The localized page keywords for the category."
    )
    page_title: dict[str, str] | None = Field(
        None, description="The localized page title of the category."
    )
    parent_category_id: str | None = Field(
        None,
        description="The id of the parent category. Defaults to root if not specified on create.",
        max_length=256,
        min_length=1,
    )
    paths: list[PathRecord] | None = None
    position: float | None = Field(
        None,
        description="The position of the category determines the display order in the storefront.",
    )
    sorting_rules: list[SortingRule] | None = None
    thumbnail: str | None = Field(
        None,
        description="The name of the category thumbnail. The URL to the thumbnail is computed.",
        max_length=256,
        min_length=1,
    )


class CategorySearchResult(BaseModel):
    """
    <p>Document representing a catalog search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Category] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class ImageGroup(BaseModel):
    """
    <p>Document representing an image group containing a list of images for a particular view type and an optional variation value.</p>
    """

    images: list[MediaFile] | None = Field(
        None, description="The images of the image group."
    )
    variation_attributes: list[VariationAttribute] | None = Field(
        None,
        description="Returns a list of variation attributes applying to this image group.",
    )
    view_type: str | None = Field(None, description="The image view type.")


class JobExecution(BaseModel):
    client_id: str | None = Field(
        None,
        description="When the execution was started by a client, this represents the client's id.",
    )
    continue_information: JobExecutionContinueInformation | None = None
    creation_date: AwareDatetime | None = None
    duration: int | None = Field(
        None, description="Time in milliseconds, the execution was or is running."
    )
    effective_duration: int | None = Field(
        None,
        description="Time in milliseconds, the job has done work. Paused times are evicted.",
    )
    end_time: AwareDatetime | None = Field(
        None, description="Timestamp, when execution was finished."
    )
    executed_server_id: str | None = Field(
        None, description="The ID of the server that executed the job."
    )
    execution_scopes: list[str] | None = Field(
        None,
        description="Sorted set of all execution scopes, used by individual steps.",
    )
    execution_status: ExecutionStatus | None = Field(
        None, description="The current execution status."
    )
    exit_status: StatusModel | None = None
    id: str | None = Field(None, description="ID of the execution object.")
    is_log_file_existing: bool | None = Field(
        None, description="True if the log file exists, otherwise false."
    )
    is_restart: bool | None = Field(
        None, description="True if this execution represents a job restart."
    )
    job_description: str | None = Field(
        None, description="Description of the job, this execution belongs to."
    )
    job_id: str | None = Field(
        None, description="ID of the job, this execution belongs to."
    )
    last_modified: AwareDatetime | None = None
    log_file_path: str | None = Field(
        None, description="Full WebDAV path of the log file, containing execution log."
    )
    modification_time: AwareDatetime | None = Field(
        None, description="Timestamp of the last modification time for the execution."
    )
    parameters: list[JobExecutionParameter] | None = Field(
        None, description="List of all job execution parameters."
    )
    retry_information: JobExecutionRetryInformation | None = None
    start_time: AwareDatetime | None = Field(
        None, description="Timestamp, when execution was started."
    )
    status: str | None = Field(
        None,
        description="The current status. If the execution is currently executed the execution status is returned. If the execution is\n not executed currently anymore the exit status code of the execution.",
    )
    status_metadata: StatusMetadata | None = None
    step_executions: list[JobStepExecution] | None = Field(
        None, description="List of all steps, called for job execution."
    )
    user_login: str | None = Field(
        None,
        description="When the execution was started by a registered user, this represents the user's login.",
    )


class JobExecutionSearchResult(BaseModel):
    """
    <p>Document representing a job execution search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[JobExecution] | None = Field(
        None, description="The sorted array of search hits. May be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class PromotionAbtestGroupAssignment(BaseModel):
    abtest_description: str | None = None
    abtest_id: str | None = None
    enabled: bool | None = None
    schedule: Schedule | None = None
    segment_description: str | None = None
    segment_id: str | None = None


class ResourceInfo(BaseModel):
    allowed_origins: list[str] | None = Field(None, description="Allowed Origins")
    api_type: ApiType = Field(..., description="API Type")
    resources: list[ResourceObject] = Field(
        ..., description="An array of resources", min_length=1
    )
    response_headers: dict[str, str] | None = Field(None, description="Response Header")


class Role(BaseModel):
    """
    <p>Document representing an access role.</p>
    """

    creation_date: AwareDatetime | None = None
    description: str | None = Field(None, description="The role description.")
    id: str | None = Field(None, description="The role ID.")
    last_modified: AwareDatetime | None = None
    link: str | None = Field(
        None,
        description="URL that is used to get this instance.  This property is computed and cannot be modified.",
    )
    permissions: RolePermissions | None = None
    user_count: int | None = Field(
        None, description="Number of users assigned to the role."
    )
    user_manager: bool | None = Field(
        None,
        description="Flag whether this role is allowed to manage users or other access roles.",
    )
    users: list[User] | None = Field(
        None,
        description="The users assigned to the access role. Available through expands.",
    )


class RoleSearchResult(BaseModel):
    """
    <p>Document representing an access role search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Role] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Roles(BaseModel):
    """
    <p>Document representing a list of access roles.</p>
    """

    count: int | None = None
    data: list[Role] | None = Field(None, description="The list of access roles.")
    expand: list[str] | None = None
    next: str | None = None
    previous: str | None = None
    select: str | None = None
    start: int | None = Field(None, ge=0)
    total: int | None = None


class SiteResourceInfo(BaseModel):
    """
    <p>Object to represent a site configuration and available resources in the site configuration.</p>
    """

    site_configs: list[ResourceInfo] = Field(..., description="Site configuration")
    site_id: str | None = Field(None, description="Site ID")


class Variant(BaseModel):
    """
    <p>Document representing a product variation.</p>
    """

    ats: float | None = Field(
        None, description='Inventory "Available to Sell" of the product.'
    )
    default_product_variation: bool | None = Field(None, description="")
    image: MediaFile | None = None
    in_stock: bool | None = Field(
        None,
        description="<code>true</code> if the product is in stock, or <code>false</code> if not.",
    )
    link: str | None = Field(None, description="The URL addressing the product.")
    online: bool | None = Field(
        None,
        description="If the product is currently online.\n <code>true</code> if online\n <code>false</code> if not",
    )
    orderable: bool | None = Field(
        None, description="A flag indicating whether the variant is orderable."
    )
    price: float | None = Field(None, description="The sales price of the variant.")
    price_currency: str | None = Field(
        None, description="Currency code for the price of the product."
    )
    price_per_unit: float | None = Field(
        None, description="The sales price of the variant."
    )
    product_id: str = Field(
        ..., description="The id (SKU) of the variant.", max_length=100, min_length=1
    )
    searchable: dict[str, bool] | None = Field(None, description="")
    variation_attributes: list[VariationAttribute] | None = Field(
        None, description="variation attributes"
    )
    variation_values: dict[str, str] | None = Field(
        None, description="The actual variation attribute id - value pairs."
    )


class VariantSearchResult(BaseModel):
    """
    <p>Document that represents a search on certificates and keys.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Variant] | None = Field(None, description="The hits from the search")
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Variants(BaseModel):
    """
    <p>Document representing an unfiltered list of variants.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Variant] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class Categories(BaseModel):
    """
    <p>Document representing an unfiltered list of categories.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Category] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class OcapiConfigsApiRequest(BaseModel):
    """
    <p>OCAPI configuration APIs request</p>
    """

    resource_info: ResourceInfo
    sites: list[str] = Field(..., description="Sites to be updated")


class OcapiConfigsApiResponse(BaseModel):
    """
    <p>OCAPI configuration APIs response. It contains all available resources for a client</p>
    """

    global_: list[SiteResourceInfo] | None = Field(
        None, alias="global", description="Global configuration"
    )
    sites: list[SiteResourceInfo] | None = Field(
        None, description="Site configurations"
    )


class Product(BaseModel):
    """
    <p>Document representing a product</p>
    """

    assigned_categories: list[CatalogCategoryId] | None = Field(
        None, description="The catalog categories that the product is assigned to"
    )
    ats: float | None = Field(
        None,
        description="The ATS(Available To Sell) inventory value of the product. This is a calculated value.",
    )
    brand: str | None = Field(None, description="The brand of the product.")
    bundled_products: list[Product] | None = Field(
        None, description="The array of bundled products which the product includes."
    )
    c_availableForInStorePickup: bool | None = Field(
        None,
        description="Signals if there are inventory lists for brick-and-mortar stores associated with this product.",
    )
    c_batteryLife: str | None = None
    c_batteryType: str | None = None
    c_bootType: list[CBootTypeEnum] | None = Field(
        None, description="Type of Boot for search refinement."
    )
    c_bottomType: list[CBottomTypeEnum] | None = Field(
        None, description="Bottom type for search refinement"
    )
    c_color: str | None = Field(
        None, description="Product color used for variation attribute"
    )
    c_consoleWarranty: str | None = None
    c_customCSSFile: MediaFile | None = None
    c_digitalCameraFeatures: list[CDigitalCameraFeature] | None = None
    c_digitalCameraPixels: str | None = None
    c_digitalCameraType: str | None = None
    c_digitalCameraWarranty: str | None = None
    c_dimDepth: str | None = None
    c_dimHeight: str | None = None
    c_dimWeight: str | None = None
    c_dimWidth: str | None = None
    c_displaySize: str | None = None
    c_gameGenre: list[CGameGenreEnum] | None = None
    c_gameRating: str | None = None
    c_gameSystemType: str | None = None
    c_gpsFeatures: list[CGpsFeature] | None = None
    c_gpsType: list[CGpsTypeEnum] | None = None
    c_gpsWarranty: str | None = None
    c_imageAspectRatio: str | None = None
    c_isNew: bool | None = None
    c_isNewtest: bool | None = Field(
        None, description="This indiciates if the product is a new arrival."
    )
    c_isSale: bool | None = Field(
        None, description="This is the help text. It is used for sorting rules."
    )
    c_kidsAge: CKidsAge | None = Field(
        None, description="Kids Age used for search refinements"
    )
    c_length: str | None = Field(
        None, description="This attribute is used for mens and womens pants lengths."
    )
    c_lensAperture: str | None = None
    c_materialTest: list[CMaterialTestEnum] | None = None
    c_mediaFormat: list[CMediaFormatEnum] | None = Field(
        None, description="Media Format"
    )
    c_memorySize: str | None = Field(None, description="Memory Size")
    c_memoryType: list[CMemoryTypeEnum] | None = None
    c_musicStorage: str | None = None
    c_opticalZoom: str | None = None
    c_outerwearType: COuterwearType | None = Field(
        None, description="Type of Outerwear for search refinement"
    )
    c_portableAudioType: list[CPortableAudioTypeEnum] | None = None
    c_refinementColor: CRefinementColor | None = None
    c_resolution: str | None = None
    c_sandalType: CSandalType | None = Field(
        None, description="Type of Sandal for search refinement"
    )
    c_sheets: list[CSheet] | None = Field(None, description="test attribute")
    c_shoeType: CShoeType | None = Field(
        None, description="Type of Shoe for search refinements"
    )
    c_size: str | None = Field(
        None,
        description="This attribute is used for all footwear, apparel and accessory sizing for men, women and kids products.",
    )
    c_skinConcern: list[CSkinConcernEnum] | None = None
    c_styleNumber: str | None = None
    c_tabDescription: MarkupText | None = None
    c_tabDetails: MarkupText | None = None
    c_topType: str | None = Field(None, description="Type of tops in clothing")
    c_tvSignalFormat: str | None = None
    c_tvSize: str | None = None
    c_tvType: CTvType | None = None
    c_tvWarranty: str | None = None
    c_videoStorage: str | None = None
    c_waist: str | None = Field(
        None, description="Attribute used for apparel waist sizing."
    )
    c_width: str | None = Field(
        None,
        description="This attribute is used for shoe widths for mens, womens and kids.",
    )
    classification_category: CatalogCategoryId | None = None
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    default_variant_id: str | None = Field(
        None, description="The ID of the product's default variant."
    )
    ean: str | None = Field(
        None, description="The European Article Number of the product."
    )
    id: str | None = Field(
        None, description="The ID (SKU) of the product.", max_length=100, min_length=1
    )
    image: MediaFile | None = None
    image_groups: list[ImageGroup] | None = Field(
        None, description="The array of product image groups."
    )
    in_stock: bool | None = Field(
        None,
        description="The flag that indicates if the product is in stock, or not. This is a calculated value.",
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(None, description="A link to the product.")
    localized_tax_class_id: dict[str, str] | None = None
    long_description: dict[str, MarkupText] | None = Field(
        None, description="The localized long description of the product."
    )
    manufacturer_name: str | None = Field(
        None, description="The name of the product's manufacturer."
    )
    manufacturer_sku: str | None = Field(
        None, description="The SKU of the product's manufacturer."
    )
    master: Master | None = None
    name: dict[str, str] | None = Field(
        None, description="The localized name of the product."
    )
    online: bool | None = Field(
        None,
        description="The flag that indicates if the product is online, or not. This is a calculated value.",
    )
    online_flag: dict[str, bool] | None = Field(
        None, description="The site specific online status of the product."
    )
    owning_catalog_id: str | None = Field(
        None, description="The ID of the catalog that owns the product."
    )
    owning_catalog_name: dict[str, str] | None = Field(
        None, description="The localized name of the catalog that owns the product."
    )
    page_description: dict[str, str] | None = Field(
        None, description="The localized page description of the product."
    )
    page_keywords: dict[str, str] | None = Field(
        None, description="The localized page keywords of the product."
    )
    page_title: dict[str, str] | None = Field(
        None, description="The localized page title of the product."
    )
    price: float | None = Field(None, description="The price of the product.")
    price_currency: str | None = Field(
        None, description="The currency code for product's price."
    )
    price_per_unit: float | None = Field(
        None, description="The price per unit of the product"
    )
    primary_categories: list[CatalogCategoryId] | None = Field(
        None, description="The catalog categories that are primary for the product"
    )
    primary_category_id: str | None = Field(
        None, description="The id of the products primary category."
    )
    product_bundles: list[Product] | None = Field(
        None, description="The array of product bundles which the product belongs to."
    )
    product_options: list[ProductOption] | None = Field(
        None,
        description='The array of product options. This is applicable for products of type "option".',
    )
    product_sets: list[Product] | None = Field(
        None, description="The array of product sets which the product belongs to."
    )
    searchable: dict[str, bool] | None = Field(
        None, description="The site specific searchable status of the product."
    )
    set_products: list[Product] | None = Field(
        None, description="The array of set products which the product includes."
    )
    short_description: dict[str, MarkupText] | None = Field(
        None, description="The localized short description of the product."
    )
    tax_class_id: str | None = Field(
        None, description="The catalog categories that the product is assigned to"
    )
    type: ProductType | None = None
    unit: str | None = Field(None, description="The sales unit of the product.")
    unit_measure: str | None = Field(
        None, description="The unitMeasure of the product."
    )
    unit_quantity: float | None = Field(
        None, description="The unitQuantity of the product."
    )
    upc: str | None = Field(
        None, description="The Universal Product Code of the product."
    )
    valid_from: dict[str, AwareDatetime] | None = Field(
        None, description="The time when product is valid from."
    )
    valid_to: dict[str, AwareDatetime] | None = Field(
        None, description="The time when product is valid to."
    )
    variants: list[Variant] | None = Field(
        None,
        description='The array of variants of the product. This is applicable for product types "master" and "variation_group" only.',
    )
    variation_attributes: list[VariationAttribute] | None = Field(
        None,
        description='The sorted array of variation attributes assigned to the product. This is applicable for product types "master",\n "variation_group" and "variant" only.',
    )
    variation_groups: list[VariationGroup] | None = Field(
        None,
        description='The array of variation groups in the product. This is applicable for product type "master" only.',
    )
    variation_values: dict[str, str] | None = Field(
        None,
        description='The variation values selected for the product in variation attribute id and value pairs. This is applicable for product types "variant" and\n "variation_group" only.\n\n         Only for type variant and variation group.',
    )


class ProductSearchResult(BaseModel):
    """
    <p>Document representing a product search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Product] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class CategoryProductAssignment(BaseModel):
    """
    <p>Document representing a category product assignment.</p>
    """

    catalog_id: str | None = Field(
        None, description="The id of the catalog.", max_length=256, min_length=1
    )
    category_id: str | None = Field(
        None, description="The id of the category.", max_length=256, min_length=1
    )
    creation_date: AwareDatetime | None = None
    last_modified: AwareDatetime | None = None
    link: str | None = Field(
        None, description="The URL used to get the product category assignment."
    )
    owning_catalog_name: dict[str, str] | None = Field(
        None, description="The name of the catalog that owns the product."
    )
    position: float | None = Field(
        None, description="The position of product category assignment."
    )
    product: Product | None = None
    product_id: str | None = Field(
        None, description="The id of the Product.", max_length=256, min_length=1
    )
    product_name: dict[str, str] | None = Field(
        None, description="The name of the product."
    )


class CategoryProductAssignmentSearchResult(BaseModel):
    """
    <p>Document representing a product search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[CategoryProductAssignment] | None = Field(
        None, description="The sorted array of search hits. This array can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Promotion(BaseModel):
    """
    <p>Document representing a promotion. Unless otherwise stated, attributes of this document are not supported when using
     the Open Commerce API to update multiple promotions at once.</p>
    """

    archived: bool | None = Field(
        None,
        description="Determines whether or not this promotion is archived. This attribute is allowed to be updated when using the Open\n Commerce API to update multiple promotions at once.",
    )
    assignment_information: PromotionAssignmentInformation | None = None
    callout_msg: dict[str, MarkupText] | None = Field(
        None, description="The localized callout message of the promotion."
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    currency_code: str | None = Field(
        None,
        description="The ISO 4217 mnemonic code of the currency this promotion is restricted to. If not populated, then there is no\n currency restriction on the promotion.",
        max_length=3,
    )
    disable_globally_excluded: bool | None = Field(
        None,
        description="Determines whether or not this promotion ignores the global product exclusions for promotions. This attribute is\n allowed to be updated when using the Open Commerce API to update multiple promotions at once.",
    )
    enabled: bool | None = Field(
        None,
        description="Determines whether or not this promotion is enabled. This attribute is allowed to be updated when using the Open\n Commerce API to update multiple promotions at once.",
    )
    exclusivity: Exclusivity | None = Field(
        None,
        description="Determines if the promotion can be combined with other promotions of the same promotion class or if it cannot be\n combined with any other promotions. This attribute is allowed to be updated when using the Open Commerce API to\n update multiple promotions at once.",
    )
    id: str | None = Field(None, description="The id for the promotion.")
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(
        None, description="A URL that is used to get the details of this promotion."
    )
    name: dict[str, str] | None = Field(
        None,
        description="The user supplied name of this promotion, which can be localized",
    )
    promotion_class: PromotionClass | None = Field(
        None,
        description="The class of the promotion. If the promotion class is modified, then the promotion rule and all of its values,\n such as whether or not to disable global product exclusions, will be reset.",
    )
    tags: list[Tag] | None = Field(
        None,
        description="Returns the list of tags assigned to this promotion. If used to set the tags on a promotion, the promotion will\n only have the tags passed in the input. Any existing tags will be removed.",
    )


class PromotionAssignmentInformation(BaseModel):
    abtest_id: str | None = Field(
        None,
        description="If there is only one assignment, and that assignment is an A/B test segment, the id of the A/B test the segment\n belongs to. Otherwise, empty.",
    )
    abtest_segment_id: str | None = Field(
        None,
        description="If there is only one assignment, and that assignment is an A/B test segment, the id of the A/B test segment.\n Otherwise, empty.",
    )
    active: bool | None = Field(
        None,
        description="true if the individual assignment or the multiple assignments are currently active (applicable only for non default schedule assignments i.e. either campaign or A/B test schedule).",
    )
    active_abtest_assignments: list[PromotionAbtestGroupAssignment] | None = Field(
        None, description="A list of currently active A/B tests this is assigned to."
    )
    active_campaign_assignments: list[PromotionCampaignAssignment] | None = Field(
        None, description="A list of currently active campaigns this is assigned to."
    )
    campaign_id: str | None = Field(
        None,
        description="If there is only one assignment, and that assignment is a campaign, the id of the campaign. Otherwise, empty.",
    )
    enabled: bool | None = None
    end_date: AwareDatetime | None = Field(
        None,
        description='The end date of the container of the assignment (a Campaign or ABTest). If schedule_type is\n schedule_type : "multiple" or schedule_type : "none", then then result will be null. Also, a null\n date will also return null.',
    )
    schedule: Schedule | None = None
    schedule_type: ScheduleType | None = Field(
        None,
        description='If there is only one active assignment, or no active assignments and one upcoming assignment, this is that type\n of assignment (schedule_type : "campaign" or schedule_type : "abtest"). If there are no\n assignments, it will be schedule_type : "none", otherwise, schedule_type : "multiple".',
    )
    start_date: AwareDatetime | None = Field(
        None,
        description='The start date of the container of the assignment (a Campaign or ABTest). If schedule_type is\n schedule_type : "multiple" or schedule_type : "none", then then result will be null. Also, a null\n date will also return null.',
    )
    upcoming_abtest_assignments: list[PromotionAbtestGroupAssignment] | None = Field(
        None, description="A list of upcoming A/B tests this is assigned to."
    )
    upcoming_campaign_assignments: list[PromotionCampaignAssignment] | None = Field(
        None, description="A list of upcoming campaigns this is assigned to."
    )


class PromotionCampaignAssignment(BaseModel):
    """
    <p>Document representing a promotion campaign assignment.</p>
    """

    campaign: Campaign | None = None
    campaign_id: str | None = Field(
        None, description="The id of the campaign.", max_length=256, min_length=1
    )
    coupons: list[str] | None = Field(
        None, description="The sorted array of assigned coupon ids."
    )
    coupons_based: bool | None = Field(
        None,
        description="True if the assigned promotion is coupon based. When set to false, Coupons in the campaign and on the\n PromotionCampaignAssignment are ignored. The default value is true.",
    )
    creation_date: AwareDatetime | None = None
    customer_groups: list[str] | None = Field(
        None, description="The sorted array of assigned customer groups."
    )
    customer_groups_based: bool | None = Field(
        None,
        description="True if the assigned promotion is customer group based. When set to false, Customer Groups in the campaign and on\n the PromotionCampaignAssignment are ignored. The default value is true.",
    )
    description: str | None = Field(
        None,
        description="The description of the promotion campaign assignment.",
        max_length=4000,
    )
    enabled: bool | None = Field(
        None, description="True if the assignment resource is enabled"
    )
    last_modified: AwareDatetime | None = None
    link: str | None = Field(None, description="link for convenience")
    promotion: Promotion | None = None
    promotion_id: str | None = Field(
        None, description="The id of the Promotion.", max_length=256, min_length=1
    )
    rank: int | None = Field(
        None, description="The rank of promotion campaign assignment"
    )
    required_qualifier: RequiredQualifier | None = Field(
        None,
        description='A constant indicating that one or all qualifier conditions must be\n met in order for the promotion to apply for a given customer.\n Valid values are "any" and "all".',
    )
    schedule: Schedule | None = None
    source_code_based: bool | None = Field(
        None,
        description="True if the assigned promotion is source code group based. When set to false, Source Code Groups in the campaign and on\n the PromotionCampaignAssignment are ignored. The default value is true.",
    )
    source_code_groups: list[str] | None = Field(
        None, description="The sorted array of assigned source code groups."
    )


class PromotionCampaignAssignmentSearchResult(BaseModel):
    """
    <p>Document representing a promotion campaign assignment search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[PromotionCampaignAssignment] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class PromotionSearchResult(BaseModel):
    """
    <p>Document representing a promotion search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Promotion] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Promotions(BaseModel):
    """
    <p>A set of promotions</p>
    """

    count: int | None = None
    data: list[Promotion] | None = Field(None, description="The set of promotions")
    expand: list[str] | None = None
    next: str | None = None
    previous: str | None = None
    select: str | None = None
    start: int | None = Field(None, ge=0)
    total: int | None = None


class Slot(BaseModel):
    """
    <p>Document representing a slot</p>
    """

    context_type: ContextType | None = Field(None, description="A slot context")
    creation_date: AwareDatetime | None = None
    description: str | None = Field(
        None, description="The user supplied description of the slot", max_length=4000
    )
    last_modified: AwareDatetime | None = None
    link: str | None = Field(None, description="A link to the slot")
    preview_url: str | None = Field(None, description="A preview URL the slot")
    slot_configurations: list[SlotConfiguration] | None = Field(
        None, description="A list of slotconfigurations this slot has"
    )
    slot_id: str = Field(
        ..., description="The id for the slot", max_length=256, min_length=1
    )


class SlotConfiguration(BaseModel):
    """
    <p>Document representing a slot configuration.</p>
    """

    field_200: bool | None = Field(
        None,
        alias="200",
        description="A flag indicating whether the configuration is the default one for the slot.",
    )
    assignment_information: SlotConfigurationAssignmentInformation | None = None
    callout_msg: dict[str, MarkupText] | None = Field(
        None, description="The call out message."
    )
    configuration_id: str | None = Field(
        None, description="The id of this configuration.", max_length=256, min_length=1
    )
    context: Context | None = Field(
        None, description="The context of the slot. Ignored in input documents."
    )
    context_id: str | None = Field(
        None,
        description="When the context is <i>category</i>, this is a <i>category_id</i>; when\n the context is <i>folder</i>, this is a <i>folder_id</i>; and when the\n context is <i>global</i>, this is obsolete. This is ignored in input documents.",
    )
    creation_date: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'creationDate'."
    )
    customer_groups: list[str] | None = Field(
        None, description="The customer groups ids."
    )
    description: str | None = Field(
        None, description="The configuration description.", max_length=4000
    )
    enabled: bool | None = Field(
        None, description="A flag indicating whether the slot is enabled."
    )
    last_modified: AwareDatetime | None = Field(
        None, description="Returns the value of attribute 'lastModified'."
    )
    link: str | None = Field(None, description="The link.")
    rank: Rank | None = Field(
        None,
        description="The rank of the slot configuration on its slot. This rank has nothing to do with the rank\n on any campaign-assignment, because these are completely different objects. These must be\n updated separately.",
    )
    schedule: Schedule | None = None
    slot_content: SlotContent
    slot_id: str | None = Field(
        None,
        description="The ID of the slot. Ignored in input documents.",
        max_length=256,
        min_length=1,
    )
    template: str | None = Field(None, description="The template.", max_length=256)
    uuid: str | None = Field(
        None,
        description="The uuid of the slot configuration. This property cannot be written\n and is ignored in input documents.",
        max_length=28,
        min_length=1,
    )


class SlotConfigurationAssignmentInformation(BaseModel):
    abtest_id: str | None = Field(
        None,
        description="If there is only one assignment, and that assignment is an A/B test segment, the id of the A/B test the segment\n belongs to. Otherwise, empty.",
    )
    abtest_segment_id: str | None = Field(
        None,
        description="If there is only one assignment, and that assignment is an A/B test segment, the id of the A/B test segment.\n Otherwise, empty.",
    )
    active: bool | None = Field(
        None,
        description="true if the individual assignment or the multiple assignments are currently active (applicable only for non default schedule assignments i.e. either campaign or A/B test schedule).",
    )
    active_abtest_assignments: list[SlotConfigurationAbtestGroupAssignment] | None = (
        Field(
            None,
            description="A list of currently active A/B tests this is assigned to.",
        )
    )
    active_campaign_assignments: list[SlotConfigurationCampaignAssignment] | None = (
        Field(
            None,
            description="A list of currently active campaigns this is assigned to.",
        )
    )
    campaign_id: str | None = Field(
        None,
        description="If there is only one assignment, and that assignment is a campaign, the id of the campaign. Otherwise, empty.",
    )
    enabled: bool | None = None
    end_date: AwareDatetime | None = Field(
        None,
        description='The end date of the container of the assignment (a Campaign or ABTest). If schedule_type is\n schedule_type : "multiple" or schedule_type : "none", then then result will be null. Also, a null\n date will also return null.',
    )
    schedule: Schedule | None = None
    schedule_type: ScheduleType | None = Field(
        None,
        description='If there is only one active assignment, or no active assignments and one upcoming assignment, this is that type\n of assignment (schedule_type : "campaign" or schedule_type : "abtest"). If there are no\n assignments, it will be schedule_type : "none", otherwise, schedule_type : "multiple".',
    )
    start_date: AwareDatetime | None = Field(
        None,
        description='The start date of the container of the assignment (a Campaign or ABTest). If schedule_type is\n schedule_type : "multiple" or schedule_type : "none", then then result will be null. Also, a null\n date will also return null.',
    )
    upcoming_abtest_assignments: list[SlotConfigurationAbtestGroupAssignment] | None = (
        Field(None, description="A list of upcoming A/B tests this is assigned to.")
    )
    upcoming_campaign_assignments: list[SlotConfigurationCampaignAssignment] | None = (
        Field(None, description="A list of upcoming campaigns this is assigned to.")
    )


class SlotConfigurationCampaignAssignment(BaseModel):
    """
    <p>Document representing a slot_configuration_campaign_assignment</p>
    """

    campaign: Campaign | None = None
    campaign_id: str | None = Field(
        None,
        description="The id of the campaign that has the slot configuration assigned to it.",
        max_length=256,
        min_length=1,
    )
    context: Context1 = Field(..., description="The slot context.")
    creation_date: AwareDatetime | None = None
    customer_groups: list[str] | None = Field(
        None, description="The list of customer groups."
    )
    description: str | None = Field(
        None, description="The description of the slot configuration.", max_length=4000
    )
    enabled: bool | None = Field(
        None, description="True if the assignment resource is enabled"
    )
    last_modified: AwareDatetime | None = None
    link: str | None = Field(
        None, description="The URL to the slot configuration-campaign assignment."
    )
    rank: int | None = Field(
        None,
        description="The rank of the slot confiuration-campaign assignment.\n This is different than the rank of the slot configuration.",
        ge=1,
    )
    schedule: Schedule | None = None
    slot_configuration: SlotConfiguration | None = None
    slot_configuration_id: str = Field(
        ...,
        description="The ID of the slot configuration.",
        max_length=256,
        min_length=1,
    )
    slot_configuration_uuid: str | None = Field(
        None, description="The UUID of the slot configuration.", max_length=28
    )
    slot_context_id: str | None = Field(
        None,
        description="The ID of the slot's context, for example, the category ID for a slot with category context.",
        max_length=256,
    )
    slot_id: str = Field(
        ..., description="The ID of the slot.", max_length=256, min_length=1
    )


class SlotConfigurationCampaignAssignmentSearchResult(BaseModel):
    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[SlotConfigurationCampaignAssignment] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class SlotConfigurationSearchResult(BaseModel):
    """
    <p>Document representing a slot configuration search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[SlotConfiguration] | None = Field(
        None, description="The sorted array of search hits. This array can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class SlotConfigurations(BaseModel):
    """
    <p>Document representing an unfiltered list of slot configurations.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[SlotConfiguration] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


class SlotSearchResult(BaseModel):
    """
    <p>Document representing a slot search result.</p>
    """

    count: int | None = Field(None, description="The number of returned documents")
    data: list[dict[str, Any]] | None = None
    db_start_record_: int | None = Field(
        None,
        description="The zero-based index of the record that we want to start with, used to optimize special handling",
        ge=0,
    )
    expand: list[str] | None = Field(
        None,
        description="List of expansions to be applied to each search results. Expands are optional",
    )
    hits: list[Slot] | None = Field(
        None, description="The sorted array of search hits. Can be empty."
    )
    next: ResultPage | None = None
    previous: ResultPage | None = None
    query: Any | None = Field(
        None,
        description="<p>Document representing a query. A query contains a set of objects that define criteria\n used to select records. A query can contain one of the following:\n <ul> \n <li> match_all_query - returns all records. </li> \n <li> term_query - matches records where a field (or fields) exactly match some simple value (including null). </li> \n <li> text_query - matches records where a field (or fields) contain a search phrase. </li> \n <li> boolean_query - formulates a complex boolean expression using query objects as criteria. </li> \n <li> filtered_query - allows for filtering of records based on both a query and a filter. </li> \n </ul></p>",
    )
    select: str | None = Field(None, description="The field to be selected.")
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional.",
    )
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The number of returned documents")


class Slots(BaseModel):
    """
    <p>Document representing an unfiltered list of slots.</p>
    """

    count: int | None = Field(None, description="The number of returned documents.")
    data: list[Slot] | None = None
    expand: list[str] | None = Field(
        None,
        description="The list of expands set for the search request. Expands are optional.",
    )
    next: str | None = Field(None, description="The URL of the next result page.")
    previous: str | None = Field(
        None, description="The URL of the previous result page."
    )
    select: str | None = Field(None, description="The fields that you want to select.")
    start: int | None = Field(
        None,
        description="The zero-based index of the first search hit to include in the result.",
        ge=0,
    )
    total: int | None = Field(None, description="The total number of documents.")


Category.model_rebuild()
Product.model_rebuild()
Promotion.model_rebuild()
PromotionAssignmentInformation.model_rebuild()
Slot.model_rebuild()
SlotConfiguration.model_rebuild()
SlotConfigurationAssignmentInformation.model_rebuild()
