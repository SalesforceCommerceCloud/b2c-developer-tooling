# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(
        ...,
        description="An identifier for the Salesforce Commerce Cloud organization the request is being made by. It consists of a prefix 'f_ecom_' followed by a 4-character [realm identifier](https://developer.salesforce.com/docs/commerce/commerce-api/guide/base-url.html#realm-id) and a 3-character [instance type identifier](https://developer.salesforce.com/docs/commerce/commerce-api/guide/base-url.html#instance-id).",
        examples=["f_ecom_zzxy_prd"],
        pattern="^f_ecom_[a-z]{4}_(prd|stg|dev|s[0-9]{2}|[0-9]{3})$",
    )


class ResultBase(BaseModel):
    """
    Schema defining generic list result. Each response schema of a resource requiring a list response should extend this schema.
    Additionally it needs to be defined what data is returned.
    """

    limit: int = Field(
        ...,
        description="Maximum records to retrieve per request. The limit with its constraints (minimum, maximum, default) is defined by the request parameter `limit` of the endpoint returning this schema.",
        examples=[10],
    )
    total: int = Field(
        ...,
        description="The total number of hits that match the search's criteria. This can be greater than the number of results returned as search results are pagenated.",
        examples=[10],
        ge=0,
    )


class PaginatedResultBase(ResultBase):
    """
    Schema defining generic pageable result. Each response schema of a resource requiring pagination should extend this schema.
    If you use this extend this schema directly, it needs to be defined what data is returned. Allowed names for the data field is `data`.
    """

    offset: int = Field(
        ..., description="The zero-based index of the first hit/data to include in the result.", examples=[0], ge=0
    )
    limit: int = Field(
        ...,
        description="Maximum records to retrieve per request. The limit with its constraints (minimum, maximum, default) is defined by the request parameter `limit` of the endpoint returning this schema.",
        examples=[10],
    )
    total: int = Field(
        ...,
        description="The total number of hits that match the search's criteria. This can be greater than the number of results returned as search results are pagenated.",
        examples=[10],
        ge=0,
    )


class CustomPreference(BaseModel):
    """
    Preference object
    """

    groupId: str = Field(..., description="The ID of the preference group.")
    id: str = Field(..., description="The Preference Id.")
    value: Any = Field(..., description="The value for the Preference Id.")


class CustomPreferenceList(PaginatedResultBase):
    """
    Document representing a Custom Preference result.
    """

    data: list[CustomPreference] = Field(..., description="The list of custom preferences in the search result.")
    limit: int = Field(
        ...,
        description="Maximum records to retrieve per request. The limit with its constraints (minimum, maximum, default) is defined by the request parameter `limit` of the endpoint returning this schema.",
        examples=[10],
    )
    offset: int = Field(
        ..., description="The zero-based index of the first hit/data to include in the result.", examples=[0], ge=0
    )
    total: int = Field(
        ...,
        description="The total number of hits that match the search's criteria. This can be greater than the number of results returned as search results are pagenated.",
        examples=[10],
        ge=0,
    )


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


class CustomerListLink(BaseModel):
    """
    Document representing a link to a customer list.
    """

    customerListId: str | None = Field(
        None, description="The customer list identifier", examples=["customer-list-1"], max_length=256, min_length=1
    )
    title: str | None = Field(
        None, description="The title of the customer list link", examples=["Default Customer List"], max_length=256
    )


class DisplayName(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Site Display Name"], max_length=4000)


class Description(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Site Description"], max_length=4000)


class StorefrontStatus(Enum):
    """
    Status of the storefront
    """

    online = "online"
    maintenance = "maintenance"
    to_be_deleted = "to_be_deleted"
    protected = "protected"


class Site(BaseModel):
    id: str = Field(
        ..., description="The ID of the site.", examples=["RefArch"], max_length=32, min_length=1, title="ID"
    )
    displayName: dict[str, DisplayName] | None = None
    description: dict[str, Description] | None = None
    customerListLink: CustomerListLink | None = Field(None, description="The link to the customer list")
    inDeletion: bool | None = Field(
        None, description="Specifies whether the site status is in deletion (true) or not (false)", examples=[False]
    )
    storefrontStatus: StorefrontStatus | None = Field(None, description="Status of the storefront", examples=["online"])
    siteCatalogId: str | None = Field(
        None,
        description="The catalog bound to the given site.",
        examples=["storefront-catalog-m-en"],
        max_length=256,
        min_length=1,
    )
    cartridges: str | None = Field(
        None,
        description="The cartridge names assigned to a site delemited by ':'.",
        examples=["app_storefront_core:app_storefront_base"],
        max_length=4000,
    )
    creationDate: AwareDatetime | None = Field(
        None, description="The timestamp when the site was created.", examples=["2024-01-15T10:00:00.000Z"]
    )
    lastModified: AwareDatetime | None = Field(
        None, description="The timestamp when the site was last modified.", examples=["2024-10-14T15:30:00.000Z"]
    )


class SitePreferences(BaseModel):
    """
    Represents custom preferences at the site level within a preference group. Custom preference attributes are returned with the "c_" prefix.

    """

    model_config = ConfigDict(
        extra="allow",
    )
    site: Site | None = None


class OrganizationPreferences(BaseModel):
    """
    Represents custom preferences at the global (organization) level within a preference group. Custom preference attributes are returned with the "c_" prefix.

    """

    model_config = ConfigDict(
        extra="allow",
    )
    sitePreferences: list[SitePreferences] | None = Field(
        None, description="The list of site-specific preferences, returned when expand=sites."
    )


class Operator(Enum):
    """
    The logical operator that is used to combine the filters.
    """

    and_ = "and"
    or_ = "or"
    not_ = "not"


class FieldModel(RootModel[str]):
    root: str = Field(
        ...,
        description="Name of the field. Might be a custom field name prefixed with c_.",
        examples=["couponId"],
        max_length=260,
    )


class FilterMode(Enum):
    """
    Compare mode: overlap, containing, or contained.
    """

    overlap = "overlap"
    containing = "containing"
    contained = "contained"


class Range2Filter(BaseModel):
    """
    Allows you to restrict a search result to hits where a range defined by specified attributes has a certain relationship to a specified range.

    The first range (R1) is defined by a pair of attributes (`fromField` and `toField`) that specify the extent of a range, such as attributes `validFrom` and `validTo`.

    The second range (R2) is defined by `fromValue` and `toValue`.

    The filter mode specifies the method used to compare the two ranges:

    * `overlap`: R1 overlaps fully or partially with R2.
    * `containing`: R1 contains R2.
    * `contained`: R1 is contained in R2.

    The range filter supports several value types, and relies on the natural sorting of the value type for range interpretation. Value ranges can be open-ended, but only at one end of the range. You can configure whether the lower bounds and upper bounds are inclusive or exclusive.

    A range 2 filter is useful for general restrictions that can be shared between searches (like a static date range) because the filter result is cached in memory. Range filters are not appropriate if the range is expected to be different for every query (for example, if the user controls the date range down to the hour via a UI control). Range filters are inclusive by default.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    filterMode: FilterMode | None = Field(
        "overlap", description="Compare mode: overlap, containing, or contained.", examples=["overlap"]
    )
    fromField: str = Field(
        ...,
        description="The field name of the field that starts the first range.",
        examples=["validFrom"],
        max_length=260,
    )
    fromInclusive: bool | None = Field(
        True,
        description="A flag indicating if the lower bound of the second range is inclusive. To make the lower bound exclusive, set to `false`.",
        examples=[True],
    )
    fromValue: Any | None = Field(
        None,
        description="The lower bound of the second range. If not specified, the range is open-ended with respect to the lower bound. You can't leave both the lower and upper bounds open-ended.",
        examples=["2007-01-01T00:00:00.000Z"],
    )
    toField: str = Field(
        ..., description="The field name of the field that ends the first range.", examples=["validTo"], max_length=260
    )
    toInclusive: bool | None = Field(
        True,
        description="A flag indicating if the upper bound of the second range is inclusive. To make the lower bound exclusive, set to `false`.",
        examples=[True],
    )
    toValue: Any | None = Field(
        None,
        description="The upper bound of the second range. If not specified, the range is open-ended with respect to the upper bound. You can't leave both the upper and lower bounds open-ended.",
        examples=["2017-01-01T00:00:00.000Z"],
    )


class RangeFilter(BaseModel):
    """
    Allows you to restrict a search result to hits that have values for a given attribute that fall within a given value range. The range filter supports several value types and relies on the natural sorting of the value type for range interpretation. Value ranges can be open-ended, but only at one end of the range. You can configure whether the lower bounds and upper bounds are inclusive or exclusive.

    A range filter is useful for general restrictions that can be shared between searches (like a static date range) because the filter result is cached in memory. Range filters are not appropriate if the range is expected to be different for every query (for example, if the user controls the date range down to the hour via a UI control). Range filters are inclusive by default.
    """

    field: str = Field(..., description="The search field.", examples=["validFrom"], max_length=260)
    from_: AwareDatetime | int | float | None = Field(
        None,
        alias="from",
        description="The lower bound of the filter range. If not specified, the range is open-ended with respect to the lower bound. You can't leave both the lower and upper bounds open-ended.",
    )
    fromInclusive: bool | None = Field(
        True,
        description="A flag indicating if the lower bound of the range is inclusive. To make the lower bound exclusive, set to `false`.",
        examples=[True],
    )
    to: AwareDatetime | int | float | None = Field(
        None,
        description="The upper bound of the filter range. If not specified, the range is open-ended with respect to the upper bound. You can't leave both the upper and lower bounds open-ended.",
    )
    toInclusive: bool | None = Field(
        True,
        description="A flag indicating if the upper bound of the range is inclusive. To make the upper bound exclusive, set to `false`.",
        examples=[True],
    )


class Operator1(Enum):
    """
    The operator used to compare the field's values with the given values.
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
    Allows you to restrict a search result to hits that match exactly one of the values configured for the filter. A term filter is useful for general restrictions that can be shared between searches. Use term filters whenever the criteria you filter on is a shared property of multiple searches (for example, like filtering by an order status). Use term filters for fields that have a discrete and small set of values only.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., description="The filter field.", examples=["couponId"], max_length=260)
    operator: Operator1 = Field(
        ..., description="The operator used to compare the field's values with the given values.", examples=["is"]
    )
    values: list[str] | None = Field(None, description="The filter values.")


class MatchAllQuery(BaseModel):
    """
    Matches all documents (namespace and document type). This query comes in handy if you just want to filter a search result or really do not have any constraints.
    """


class ScoreMode(Enum):
    """
    Indicates how scores for matching child objects affect the root parent document’s relevance score.
    """

    avg = "avg"
    total = "total"
    max = "max"
    none = "none"


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
    A term query matches one or more values against one or more document fields. A document is considered a hit if one of the values matches exactly with at least one of the given fields. The operator `is` can only take one value, while `one_of` can take multiple values. If multiple fields are specified, they are combined using a logical `OR` operator.

    **Limitations:**

    * The `greater` and `less` operators are not supported under certain conditions. Both operators are permitted unless the API documentation states otherwise.
    * A subset of Commerce APIs handle queries with multiple fields differently. If the query has multiple fields, the query is internally handled as a logical `OR` of `DisjointMaxQueries` (with the dismax matching a value against all fields). The dismax makes sure that a document carrying a single term in multiple fields does not get higher scores than a document matching multiple terms in multiple fields.
    """

    fields: list[FieldModel] = Field(
        ...,
        description="The document fields that the values are matched against, combined with the operator.",
        min_length=1,
    )
    operator: Operator2 = Field(..., description="Returns the operator to use for the term query.", examples=["is"])
    values: list[str | float | bool | int] | None = Field(
        None, description="The values that the fields are compared against, combined with the operator."
    )


class TextQuery(BaseModel):
    """
    A text query is used to match some text (for example, a search phrase possibly consisting of multiple terms) against one or more fields. When multiple fields are provided, the phrase conceptually forms a logical `OR` over the fields. In this case, the terms of the phrase basically have to match within the text, that would result in concatenating all given fields.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    fields: list[FieldModel] = Field(
        ..., description="The document fields that the search phrase matches against.", min_length=1
    )
    searchPhrase: str = Field(
        ...,
        description="A search phrase, which can include multiple terms separated by spaces.",
        examples=["campaign summer"],
    )


class SortOrder(Enum):
    """
    The sort order to be applied when sorting. When omitted, the default sort order (asc) is used.
    """

    asc = "asc"
    desc = "desc"


class Sort(BaseModel):
    """
    Document representing a sort request. Each API has a different default sort configuration that can be modified in the request.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., description="The name of the field to sort on.", examples=["couponId"], max_length=256)
    sortOrder: SortOrder | None = Field(
        "asc",
        description="The sort order to be applied when sorting. When omitted, the default sort order (asc) is used.",
        examples=["asc"],
    )


class ValueType(Enum):
    """
    The type of an attribute value
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


class DisplayValue(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Localized value"], max_length=4000)


class Description1(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Localized value"], max_length=4000)


class ObjectAttributeValueDefinition(BaseModel):
    """
    An attribute definition value
    """

    id: str | None = Field(None, description="The ID of the attribute value", examples=["value-1"], max_length=256)
    value: str | None = Field(None, description="The value of the attribute", examples=["1"], max_length=4000)
    displayValue: dict[str, DisplayValue] | None = Field(None, examples=[{"default": "One", "de": "Eins", "en": "One"}])
    description: dict[str, Description1] | None = Field(
        None,
        examples=[
            {
                "default": "Object type representing products.",
                "de": "Objekttyp, der Produkte repräsentiert.",
                "en": "Object type representing products.",
            }
        ],
    )
    position: float | None = Field(
        None, description="The position of the attribute value within the set of attribute values", examples=[1]
    )


class DisplayName1(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Localized value"], max_length=4000)


class Unit(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Localized value"], max_length=4000)


class ObjectAttributeDefinition(BaseModel):
    """
    Document representing an attribute definition
    """

    id: str = Field(
        ..., description="The user supplied ID of the attribute", examples=["color"], max_length=256, min_length=1
    )
    effectiveId: str | None = Field(
        None,
        description="The effective ID, which is c_id if the attribute is custom, and just the id otherwise",
        examples=["c_color"],
        max_length=256,
    )
    displayName: dict[str, DisplayName1] | None = Field(
        None, examples=[{"default": "Product", "de": "Produkt", "en": "Product"}]
    )
    description: dict[str, Description1] | None = Field(
        None,
        examples=[
            {
                "default": "Object type representing products.",
                "de": "Objekttyp, der Produkte repräsentiert.",
                "en": "Object type representing products.",
            }
        ],
    )
    key: bool | None = Field(None, description="Flag indicating if this is a key attribute", examples=[False])
    mandatory: bool | None = Field(
        None, description="Flag indicating if a value is mandatory for the attribute", examples=[False]
    )
    localizable: bool | None = Field(
        None, description="Flag indicating if this attribute can be localized", examples=[False]
    )
    siteSpecific: bool | None = Field(
        None, description="Flag indicating if this attribute is site-specific", examples=[False]
    )
    searchable: bool | None = Field(
        None, description="Flag indicating if this attribute is searchable", examples=[True]
    )
    queryable: bool | None = Field(
        None,
        description="Returns true if the attribute definition is explicitly marked queryable or if the attribute value type belongs to a queryable type. Computed and read-only.",
        examples=[True],
    )
    valueType: ValueType | None = None
    visible: bool | None = Field(None, description="Flag indicating if this attribute is visible", examples=[True])
    system: bool | None = Field(
        None, description="Flag indicating if this attribute is a system attribute", examples=[False]
    )
    unit: dict[str, Unit] | None = Field(
        None, examples=[{"default": "General unit", "de": "Allgemeine Einheit", "en": "General unit"}]
    )
    requiresEncoding: bool | None = Field(
        None,
        description="Flag indicating if this attribute can be encoded using the encoding='off' flag in ISML templates",
        examples=[False],
    )
    multiValueType: bool | None = Field(
        None,
        description="True if the attribute can have multiple values. Applicable to set_of_* and enum_of_* types.",
        examples=[False],
    )
    setValueType: bool | None = Field(
        None, description="Flag indicating if this attribute is of type 'Set of'", examples=[False]
    )
    externallyManaged: bool | None = Field(
        None, description="Flag indicating if this attribute is externally managed", examples=[False]
    )
    externallyDefined: bool | None = Field(
        None, description="Flag indicating if this attribute is externally defined", examples=[False]
    )
    orderRequired: bool | None = Field(
        None,
        description="Flag indicating if this attribute is required for order of the attribute model's product",
        examples=[False],
    )
    regularExpression: str | None = Field(
        None,
        description="A regular expression that defines the legal values for this attribute",
        examples=["^[a-zA-Z]+$"],
        max_length=4000,
    )
    fieldLength: int | None = Field(
        None, description="The length of the field for this attribute in the editor", examples=[50]
    )
    fieldHeight: int | None = Field(
        None, description="The height of the field for this attribute in the editor", examples=[1]
    )
    minLength: int | None = Field(None, description="The minimum length of the field for this attribute", examples=[1])
    readOnly: bool | None = Field(None, description="Flag indicating if this attribute is read-only", examples=[False])
    minValue: float | None = Field(None, description="The minimum possible value for this attribute", examples=[0])
    maxValue: float | None = Field(None, description="The maximum possible value for this attribute", examples=[100])
    scale: int | None = Field(
        None, description="The minimum number of fraction digits for a value of this attribute", examples=[2]
    )
    defaultValue: ObjectAttributeValueDefinition | None = Field(
        None, description="The default value of this attribute. It can be updated, but not created."
    )
    valueDefinitions: list[ObjectAttributeValueDefinition] | None = Field(
        None, description="A set of values that are possible for this attribute"
    )
    creationDate: AwareDatetime | None = Field(
        None, description="The date/time when the attribute definition was created", examples=["2024-01-15T10:30:00Z"]
    )
    lastModified: AwareDatetime | None = Field(
        None,
        description="The date/time when the attribute definition was last modified",
        examples=["2024-01-15T11:00:00Z"],
    )


class Description3(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Preference Description"], max_length=4000)


class DisplayName2(RootModel[str]):
    root: str = Field(..., description="Localized string", examples=["Preference Display Name"], max_length=4000)


class PreferenceValue(BaseModel):
    """
    Represents a single preference value with its attribute definition and site-specific values.
    """

    id: str = Field(
        ..., description="The preference attribute ID", examples=["WapiStringAttr"], max_length=256, min_length=1
    )
    description: dict[str, Description3] | None = None
    displayName: dict[str, DisplayName2] | None = None
    attributeDefinition: ObjectAttributeDefinition | None = None
    siteValues: dict[str, Any] | None = Field(None, description="A mapping of site IDs to their preference values.")
    valueType: ValueType | None = None


class Query(BaseModel):
    """
    A set of objects that define criteria used to select records. A query can contain one of the following:
    * `MatchAllQuery`
     - Matches all documents.
    * `TermQuery`
     - Matches one or more documents against one or more document fields.
    * `TextQuery`
     - Matches text against one or more fields.
    * `BoolQuery`
     - Allows construction of a logical expression of multiple queries.
    * `FilteredQuery`
     - Allows a filter to be applied to a query.
    * `NestedQuery`
     - Allows you to query on nested documents.
     - _Only supported by some Commerce APIs. For more details, see the endpoint descriptions in the API documentation._
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    boolQuery: BoolQuery | None = None
    filteredQuery: FilteredQuery | None = None
    matchAllQuery: MatchAllQuery | None = None
    nestedQuery: NestedQuery | None = None
    termQuery: TermQuery | None = None
    textQuery: TextQuery | None = None


class BoolQuery(BaseModel):
    """
    A boolean query allows construction of full logical expression trees that are composed of other queries (usually term queries and text queries). A boolean query has three sets of clauses:

      - `must`, which combines as an `AND` operator.
      - `should`, which combines as an `OR` operator.
      - `must_not`, which combines as a `NOT` operator.

    If `must`, `mustNot`, or `should` appear in the same boolean query, they are combined logically using the `AND` operator. For example:

        (must-1 AND must-1 AND ...)
          AND (should-1 OR should-2 OR ...)
          AND NOT (must_not-1 OR must_not-2 OR ...)

    """

    model_config = ConfigDict(
        extra="forbid",
    )
    must: list[Query] | None = Field(None, description="List of queries to be evaluated as an `AND` operator.")
    mustNot: list[Query] | None = Field(None, description="List of queries to be evaluated as a `NOT` operator.")
    should: list[Query] | None = Field(None, description="List of queries to be evaluated as an `OR` operator.")


class Filter(BaseModel):
    """
    Contains a set of objects that define criteria used to select records. A filter can contain one of the following:
      * `TermFilter`
       - Matches records where a field (or fields) exactly matches some simple value (including `null`).
      * `RangeFilter`
       - Matches records where a field value lies within a specified range.
      * `Range2Filter`
       - Matches records in a specified range across fields.
      * `QueryFilter`
       - Matches records based on a query.
      * `BoolFilter`
       - Provides filtering of records using a set of filters combined using a logical operator.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    boolFilter: BoolFilter | None = None
    queryFilter: QueryFilter | None = None
    range2Filter: Range2Filter | None = None
    rangeFilter: RangeFilter | None = None
    termFilter: TermFilter | None = None


class BoolFilter(BaseModel):
    """
    Allows you to combine other filters into (possibly recursive) logical expression trees. A boolean filter is composed of a logical operator (`AND`, `OR`, `NOT`) and a list of filters that the operator relates to. Multiple filters can be negated with a single `NOT` operator, even when the filters are combined with the `AND` operator.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    filters: list[Filter] | None = Field(
        None, description="A list of filters that are logically combined by an operator."
    )
    operator: Operator = Field(
        ..., description="The logical operator that is used to combine the filters.", examples=["and"]
    )


class QueryFilter(BaseModel):
    """
    Wraps any query and allows it to be used as a filter.
    """

    query: Query


class FilteredQuery(BaseModel):
    """
    Allows to filter the result of a possibly complex query using a possibly complex filter.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    filter: Filter
    query: Query


class NestedQuery(BaseModel):
    """
    Allows you to query nested documents that are part of a larger document. Say, for example, that you have a main product with variations in one big document, and you want to constrain a search to main products that have variations that match multiple constraints.

    A `NestedQuery` is only supported by some Commerce APIs. For more details, see the endpoint descriptions in the API documentation.

    """

    model_config = ConfigDict(
        extra="forbid",
    )
    path: str = Field(
        ..., description="The path to the nested document.", examples=["order.shippingAddresses"], max_length=2048
    )
    query: Query
    scoreMode: ScoreMode | None = Field(
        None,
        description="Indicates how scores for matching child objects affect the root parent document’s relevance score.",
        examples=["avg"],
    )


class SearchRequest(BaseModel):
    """
    Document representing a search request for retrieving items within the Data API. The query is a potentially complex set of expressions. The fields and expands that each query supports are defined within the search resource.
    """

    limit: int | None = Field(
        None, description="Maximum records to retrieve per request, not to exceed 200.", examples=[10], ge=1, le=200
    )
    query: Query
    sorts: list[Sort] | None = Field(
        None,
        description="The list of sort clauses configured for the search request. Sort clauses are optional. See the description of the search endpoint for details on the default sorting behavior that is used when explicit sorts are not passed.",
    )
    offset: int | None = Field(
        0, description="The zero-based index of the first hit/data to include in the result.", examples=[0], ge=0
    )


class PaginatedSearchResult(PaginatedResultBase):
    """
    Document representing a generic search result. Each search resource should extend this to define what is returned in the `hits`.
    """

    model_config = ConfigDict(
        extra="forbid",
    )
    query: Query
    sorts: list[Sort] | None = Field(None, description="The sorting that was applied to the result.")
    hits: list[dict[str, Any]] | None = Field(None, description="The sorted array of search hits. Can be empty.")


class PreferenceValueSearchResult(PaginatedSearchResult):
    """
    Document representing a preference value search result.
    """

    hits: list[PreferenceValue] | None = Field(None, description="The sorted array of search hits. Can be empty.")


Query.model_rebuild()
Filter.model_rebuild()
