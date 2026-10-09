# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class OrganizationId(RootModel[str]):
    root: str = Field(..., max_length=32, min_length=1)


class Operator(Enum):
    and_ = "and"
    or_ = "or"
    not_ = "not"


class FieldModel(RootModel[str]):
    root: str = Field(..., max_length=260)


class FilterMode(Enum):
    overlap = "overlap"
    containing = "containing"
    contained = "contained"


class Range2Filter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    filterMode: FilterMode | None = "overlap"
    fromField: str = Field(..., max_length=260)
    fromInclusive: bool | None = True
    fromValue: Any | None = None
    toField: str = Field(..., max_length=260)
    toInclusive: bool | None = True
    toValue: Any | None = None


class RangeFilter(BaseModel):
    field: str = Field(..., max_length=260)
    from_: AwareDatetime | int | float | None = Field(None, alias="from")
    fromInclusive: bool | None = True
    to: AwareDatetime | int | float | None = None
    toInclusive: bool | None = True


class Operator1(Enum):
    is_ = "is"
    one_of = "one_of"
    is_null = "is_null"
    is_not_null = "is_not_null"
    less = "less"
    greater = "greater"
    not_in = "not_in"
    neq = "neq"


class TermFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=260)
    operator: Operator1
    values: list[str] | None = None


class MatchAllQuery(BaseModel):
    pass


class ScoreMode(Enum):
    avg = "avg"
    total = "total"
    max = "max"
    none = "none"


class TermQuery(BaseModel):
    fields: list[FieldModel] = Field(..., min_length=1)
    operator: Operator1
    values: list[str | float | bool | int] | None = None


class TextQuery(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    fields: list[FieldModel] = Field(..., min_length=1)
    searchPhrase: str


class SortOrder(Enum):
    asc = "asc"
    desc = "desc"


class Sort(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=256)
    sortOrder: SortOrder | None = "asc"


class Sort1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=256)
    sortOrder: SortOrder | None = "asc"


class ResultBase(BaseModel):
    limit: int
    total: int = Field(..., ge=0)


class PaginatedResultBase(ResultBase):
    offset: int = Field(..., ge=0)
    limit: int
    total: int = Field(..., ge=0)


class Sort2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    field: str = Field(..., max_length=256)
    sortOrder: SortOrder | None = "asc"


class ExecutionStatus(Enum):
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


class Status(Enum):
    ok = "ok"
    error = "error"


class ExitStatus(BaseModel):
    code: str | None = Field(None, max_length=256)
    message: str | None = Field(None, max_length=4000)
    status: Status | None = None


class StatusMetadata(BaseModel):
    clientId: str | None = Field(None, max_length=256)
    reason: str | None = Field(None, max_length=4000)
    userLogin: str | None = Field(None, max_length=256)


class JobParameter(BaseModel):
    name: str = Field(..., max_length=256, min_length=1, pattern="\\S|(\\S(.*)\\S)")
    value: str = Field(..., max_length=1000, min_length=0, pattern="\\S|(\\S(.*)\\S)")


class JobExecutionRetryInformation(BaseModel):
    currentRetryAttempt: int | None = None
    maxRetries: int | None = None


class JobExecutionContinueInformation(BaseModel):
    isPending: bool | None = None
    continueStatus: str | None = Field(None, max_length=256)


class JobStepExecution(BaseModel):
    id: str | None = Field(None, max_length=256, min_length=1)
    stepId: str | None = Field(None, max_length=256, min_length=1)
    stepDescription: str | None = Field(None, max_length=4000)
    stepTypeId: str | None = Field(None, max_length=256)
    stepTypeInfo: str | None = Field(None, max_length=4000)
    executionScope: str | None = Field(None, max_length=256)
    executionStatus: ExecutionStatus | None = None
    status: str | None = Field(None, max_length=256)
    startTime: AwareDatetime | None = None
    endTime: AwareDatetime | None = None
    duration: int | None = None
    modificationTime: AwareDatetime | None = None
    statusMetadata: StatusMetadata | None = None
    exitStatus: ExitStatus | None = None
    includeStepsFromJobId: str | None = Field(None, max_length=256)
    isChunkOriented: bool | None = None
    chunkSize: int | None = None
    itemFilterCount: int | None = None
    itemWriteCount: int | None = None
    totalItemCount: int | None = None


class Parameter(BaseModel):
    name: str = Field(..., max_length=256, min_length=1, pattern="\\S|(\\S(.*)\\S)")
    value: str = Field(..., max_length=1000, min_length=0, pattern="\\S|(\\S(.*)\\S)")


class ExecutionScope(RootModel[str]):
    root: str = Field(..., max_length=256)


class StepExecution(BaseModel):
    id: str | None = Field(None, max_length=256, min_length=1)
    stepId: str | None = Field(None, max_length=256, min_length=1)
    stepDescription: str | None = Field(None, max_length=4000)
    stepTypeId: str | None = Field(None, max_length=256)
    stepTypeInfo: str | None = Field(None, max_length=4000)
    executionScope: str | None = Field(None, max_length=256)
    executionStatus: ExecutionStatus | None = None
    status: str | None = Field(None, max_length=256)
    startTime: AwareDatetime | None = None
    endTime: AwareDatetime | None = None
    duration: int | None = None
    modificationTime: AwareDatetime | None = None
    statusMetadata: StatusMetadata | None = None
    exitStatus: ExitStatus | None = None
    includeStepsFromJobId: str | None = Field(None, max_length=256)
    isChunkOriented: bool | None = None
    chunkSize: int | None = None
    itemFilterCount: int | None = None
    itemWriteCount: int | None = None
    totalItemCount: int | None = None


class JobExecution(BaseModel):
    id: str = Field(..., max_length=256, min_length=1)
    jobId: str = Field(..., max_length=256, min_length=1)
    jobDescription: str | None = Field(None, max_length=4000)
    clientId: str | None = Field(None, max_length=256)
    userLogin: str | None = Field(None, max_length=256)
    executionStatus: ExecutionStatus | None = None
    status: str = Field(..., max_length=256)
    startTime: AwareDatetime | None = None
    endTime: AwareDatetime | None = None
    creationDate: AwareDatetime | None = None
    duration: int | None = None
    effectiveDuration: int | None = None
    modificationTime: AwareDatetime | None = None
    lastModified: AwareDatetime | None = None
    executedServerId: str | None = Field(None, max_length=256)
    exitStatus: ExitStatus | None = None
    statusMetadata: StatusMetadata | None = None
    isLogFileExisting: bool | None = None
    isRestart: bool | None = None
    logFilePath: str | None = Field(None, max_length=4000)
    parameters: list[Parameter] | None = None
    executionScopes: list[ExecutionScope] | None = None
    retryInformation: JobExecutionRetryInformation | None = None
    continueInformation: JobExecutionContinueInformation | None = None
    stepExecutions: list[StepExecution] | None = None


class Hit(BaseModel):
    id: str = Field(..., max_length=256, min_length=1)
    jobId: str = Field(..., max_length=256, min_length=1)
    jobDescription: str | None = Field(None, max_length=4000)
    clientId: str | None = Field(None, max_length=256)
    userLogin: str | None = Field(None, max_length=256)
    executionStatus: ExecutionStatus | None = None
    status: str = Field(..., max_length=256)
    startTime: AwareDatetime | None = None
    endTime: AwareDatetime | None = None
    creationDate: AwareDatetime | None = None
    duration: int | None = None
    effectiveDuration: int | None = None
    modificationTime: AwareDatetime | None = None
    lastModified: AwareDatetime | None = None
    executedServerId: str | None = Field(None, max_length=256)
    exitStatus: ExitStatus | None = None
    statusMetadata: StatusMetadata | None = None
    isLogFileExisting: bool | None = None
    isRestart: bool | None = None
    logFilePath: str | None = Field(None, max_length=4000)
    parameters: list[Parameter] | None = None
    executionScopes: list[ExecutionScope] | None = None
    retryInformation: JobExecutionRetryInformation | None = None
    continueInformation: JobExecutionContinueInformation | None = None
    stepExecutions: list[StepExecution] | None = None


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(..., max_length=256)
    type: str = Field(..., max_length=2048)
    detail: str
    instance: str | None = Field(None, max_length=2048)


class JobExecutionRequest(BaseModel):
    parameters: list[Parameter] | None = None


class Query(BaseModel):
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
    model_config = ConfigDict(
        extra="forbid",
    )
    must: list[Query] | None = None
    mustNot: list[Query] | None = None
    should: list[Query] | None = None


class Filter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    boolFilter: BoolFilter | None = None
    queryFilter: QueryFilter | None = None
    range2Filter: Range2Filter | None = None
    rangeFilter: RangeFilter | None = None
    termFilter: TermFilter | None = None


class BoolFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    filters: list[Filter] | None = None
    operator: Operator


class QueryFilter(BaseModel):
    query: Query


class FilteredQuery(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    filter: Filter
    query: Query


class NestedQuery(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    path: str = Field(..., max_length=2048)
    query: Query
    scoreMode: ScoreMode | None = None


class SearchRequest(BaseModel):
    limit: int | None = Field(None, ge=1, le=200)
    query: Query
    sorts: list[Sort1] | None = None
    offset: int | None = Field(0, ge=0)


class PaginatedSearchResult(PaginatedResultBase):
    model_config = ConfigDict(
        extra="forbid",
    )
    query: Query
    sorts: list[Sort2] | None = None
    hits: list[dict[str, Any]] | None = None


class JobExecutionSearchRequest(SearchRequest):
    pass


class JobExecutionSearchResult(PaginatedSearchResult):
    hits: list[Hit]
    query: Query


Query.model_rebuild()
Filter.model_rebuild()
