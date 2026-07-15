/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Package metrics provides a typed client for the B2C Commerce Metrics API.
package metrics

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients"
	metricsops "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/operations/metrics"
)

const (
	// MetricsScope is the required OAuth scope for the Metrics API.
	MetricsScope = "sfcc.metrics"
)

// DataPoint represents a single data point in a time series.
// Timestamp is epoch MILLISECONDS (normalized from the API's epoch seconds).
type DataPoint struct {
	Timestamp int64   `json:"timestamp"` // Epoch milliseconds
	Value     float64 `json:"value"`
}

// DataSeries represents a single time series within a metric.
type DataSeries struct {
	ID   string                      `json:"id"`
	Name string                      `json:"name"`
	Data []DataPoint                 `json:"data"`
	Tags metricsops.MetricSeriesTags `json:"tags,omitempty"` // Enriched tags
}

// Metric represents a single metric with its time series.
type Metric struct {
	MetricID    string       `json:"metricId"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Unit        string       `json:"unit,omitempty"`
	DataSeries  []DataSeries `json:"dataSeries"`
}

// MetricsDataResponse is the response from a metrics API call.
type MetricsDataResponse struct {
	Data []Metric `json:"data"`
}

// Config holds configuration for creating a Metrics client.
type Config struct {
	// ShortCode is the SCAPI instance short code (e.g., "kv7kzm78").
	// Ignored if BaseURL is set.
	ShortCode string

	// TenantID is the tenant ID (with or without f_ecom_ prefix).
	// Used to build the organizationId path parameter and tenant-specific OAuth scope.
	TenantID string

	// BaseURL is the full Metrics API base URL including the /observability/metrics/v1 path.
	// If set, used verbatim (supports http:// for local testing).
	// If empty, derived from ShortCode as https://{shortCode}.api.commercecloud.salesforce.com/observability/metrics/v1.
	BaseURL string
}

// Client is a typed client for the Metrics API.
type Client struct {
	baseURL    string
	httpClient *http.Client
	tenantID   string
}

// NewClient creates a new Metrics API client.
// The auth strategy should be an OAuthStrategy with appropriate scopes.
// The client automatically handles:
// - OAuth token management
// - Tenant-specific scopes (SALESFORCE_COMMERCE_API:{tenant})
// - Timestamp normalization (epoch seconds → milliseconds)
// - Tag enrichment on responses
func NewClient(cfg Config, authStrategy *auth.OAuthStrategy) *Client {
	// Build required scopes
	requiredScopes := []string{MetricsScope, clients.BuildTenantScope(cfg.TenantID)}

	// Create scoped auth client
	scopedAuth := authStrategy.WithAdditionalScopes(requiredScopes)

	// Determine base URL
	var baseURL string
	if cfg.BaseURL != "" {
		// Use explicit override (supports http:// for local testing)
		baseURL = cfg.BaseURL
	} else {
		// Derive from ShortCode
		baseURL = fmt.Sprintf("https://%s.api.commercecloud.salesforce.com/observability/metrics/v1", cfg.ShortCode)
	}

	return &Client{
		baseURL:    baseURL,
		httpClient: scopedAuth.Client(),
		tenantID:   cfg.TenantID,
	}
}

// getMetrics is the common method for all category endpoints.
func (c *Client) getMetrics(ctx context.Context, category string, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	orgID := clients.ToOrganizationID(c.tenantID)
	path := fmt.Sprintf("/organizations/%s/metrics/%s", orgID, category)

	// Build query params
	query := url.Values{}
	query.Set("from", strconv.FormatInt(from.Unix(), 10))
	query.Set("to", strconv.FormatInt(to.Unix(), 10))

	// Add category-specific filters
	for k, v := range filters {
		if v != "" {
			query.Set(k, v)
		}
	}

	fullURL := c.baseURL + path + "?" + query.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Bound the error-body read so a large/hostile error page can't exhaust memory.
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 8*1024))
		return nil, &HTTPError{
			StatusCode: resp.StatusCode,
			Status:     resp.Status,
			Body:       string(body),
			RetryAfter: parseRetryAfter(resp.Header.Get("Retry-After")),
		}
	}

	var data MetricsDataResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Normalize timestamps (epoch seconds → milliseconds)
	normalizeTimestamps(&data)

	// Enrich with tags
	enrichWithTags(&data, category, c.tenantID, filters)

	return &data, nil
}

// secondsThreshold is an epoch value below which a timestamp is assumed to be in
// seconds (roughly year 2286 in seconds / year 1970+ in ms). Used to make timestamp
// normalization idempotent so a response that is normalized twice (e.g. served from a
// future response cache) is not scaled to a nonsense far-future instant.
const secondsThreshold = int64(1e11)

// normalizeTimestamps converts data-point timestamps from the API's epoch seconds to
// epoch milliseconds (Go/Grafana convention). It is idempotent: a point already in
// milliseconds (>= secondsThreshold) is left unchanged, so re-normalizing a response is
// a no-op rather than multiplying by 1000 again.
func normalizeTimestamps(resp *MetricsDataResponse) {
	for i := range resp.Data {
		for j := range resp.Data[i].DataSeries {
			for k := range resp.Data[i].DataSeries[j].Data {
				if resp.Data[i].DataSeries[j].Data[k].Timestamp < secondsThreshold {
					resp.Data[i].DataSeries[j].Data[k].Timestamp *= 1000
				}
			}
		}
	}
}

// enrichWithTags adds structured tags to each series based on the series ID and request context.
func enrichWithTags(resp *MetricsDataResponse, category, tenantID string, filters map[string]string) {
	context := metricsops.MetricsTagContext{
		TenantID:            tenantID,
		APIFamily:           filters["apiFamily"],
		APIName:             filters["apiName"],
		OcapiCategory:       filters["ocapiCategory"],
		OcapiAPI:            filters["ocapiApi"],
		ThirdPartyServiceID: filters["thirdPartyServiceId"],
	}

	for i := range resp.Data {
		metricID := resp.Data[i].MetricID
		for j := range resp.Data[i].DataSeries {
			series := &resp.Data[i].DataSeries[j]
			series.Tags = metricsops.ParseSeriesTags(metricsops.ParseSeriesTagsParams{
				Category: category,
				MetricID: metricID,
				SeriesID: series.ID,
				Context:  context,
			})
		}
	}
}

// GetOverallMetrics retrieves overall application metrics.
func (c *Client) GetOverallMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "overall", from, to, filters)
}

// GetSalesMetrics retrieves sales metrics.
func (c *Client) GetSalesMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "sales", from, to, filters)
}

// GetEcdnMetrics retrieves eCDN metrics.
func (c *Client) GetEcdnMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "ecdn", from, to, filters)
}

// GetThirdPartyMetrics retrieves third-party service metrics.
// Optionally filter by thirdPartyServiceId.
func (c *Client) GetThirdPartyMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "third-party", from, to, filters)
}

// GetScapiMetrics retrieves SCAPI metrics.
// Optionally filter by apiFamily and/or apiName.
func (c *Client) GetScapiMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "scapi", from, to, filters)
}

// GetScapiHooksMetrics retrieves SCAPI hooks metrics.
func (c *Client) GetScapiHooksMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "scapi-hooks", from, to, filters)
}

// GetMrtMetrics retrieves MRT (Managed Runtime) metrics.
func (c *Client) GetMrtMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "mrt", from, to, filters)
}

// GetControllerMetrics retrieves controller metrics.
func (c *Client) GetControllerMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "controller", from, to, filters)
}

// GetOcapiMetrics retrieves OCAPI metrics.
// Optionally filter by ocapiCategory and/or ocapiApi.
func (c *Client) GetOcapiMetrics(ctx context.Context, from, to time.Time, filters map[string]string) (*MetricsDataResponse, error) {
	return c.getMetricsRange(ctx, "ocapi", from, to, filters)
}
