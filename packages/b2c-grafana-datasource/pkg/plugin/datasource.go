/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"

	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/auth"
	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients/metrics"
	metricsops "github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/operations/metrics"
)

// B2CMetricsDatasource implements the Grafana datasource interface.
type B2CMetricsDatasource struct {
	client *metrics.Client     // default client (datasource-configured tenant/shortCode)
	auth   *auth.OAuthStrategy // retained to build per-query clients for tenant/shortCode overrides
	config DatasourceConfig

	mu          sync.Mutex
	clientCache map[string]*metrics.Client // keyed by tenantId for per-query tenant overrides
}

// clientFor returns a metrics client for the given tenantId, falling back to the
// datasource-configured tenant when empty. Tenants on the same realm share the
// shortCode and OAuth client (the datasource's), so only the tenant — which drives
// the org path and the per-tenant OAuth scope — varies. Clients are cached by
// tenantId so switching between (e.g.) prd and stg doesn't rebuild auth each query.
func (d *B2CMetricsDatasource) clientFor(tenantID string) *metrics.Client {
	if tenantID == "" || tenantID == d.config.TenantID {
		return d.client
	}
	d.mu.Lock()
	defer d.mu.Unlock()
	if c, ok := d.clientCache[tenantID]; ok {
		return c
	}
	// Same shortCode/base-URL as the datasource; only the tenant (org path + scope) changes.
	c := metrics.NewClient(metrics.Config{
		ShortCode: d.config.ShortCode,
		TenantID:  tenantID,
		BaseURL:   d.config.ApiURL, // preserve mock/demo base URL when configured
	}, d.auth)
	d.clientCache[tenantID] = c
	return c
}

// DatasourceConfig holds the non-sensitive configuration from jsonData.
type DatasourceConfig struct {
	ShortCode          string `json:"shortCode"`
	TenantID           string `json:"tenantId"`
	ClientID           string `json:"clientId"`
	AccountManagerHost string `json:"accountManagerHost"`
	ApiURL             string `json:"apiUrl"`   // Optional full Metrics API base URL (incl. /observability/metrics/v1)
	TokenURL           string `json:"tokenUrl"` // Optional full OAuth token endpoint URL
}

// LabelFilter is a post-fetch filter applied to enriched series tags (the derived
// dimensions we compute: metricId, statusClass, cacheStatus, host, apiVersion, ...).
// Op is "=" or "!=" (default "=").
type LabelFilter struct {
	Key   string `json:"key"`
	Op    string `json:"op,omitempty"`
	Value string `json:"value"`
}

// QueryModel represents the query submitted from the frontend.
type QueryModel struct {
	RefID    string `json:"refId"`
	Category string `json:"category"` // "overall", "scapi", "ocapi", etc.

	// MetricIDs selects which metrics to return (e.g. ["requestLatency"]). Empty = all
	// metrics in the category. Applied post-fetch. Multi-select per the editor.
	MetricIDs []string `json:"metricIds,omitempty"`

	// Push-down (server) filters — sent to the API as query params. Validated against
	// the server enum by the editor. These also cause the API to drill down.
	APIFamily           string `json:"apiFamily,omitempty"`
	APIName             string `json:"apiName,omitempty"`
	OcapiCategory       string `json:"ocapiCategory,omitempty"`
	OcapiAPI            string `json:"ocapiApi,omitempty"`
	ThirdPartyServiceID string `json:"thirdPartyServiceId,omitempty"`

	// LabelFilters — post-fetch filters on enriched tags (the tiered "Label filters").
	LabelFilters []LabelFilter `json:"labelFilters,omitempty"`

	// GroupBy — label keys used to build the per-series display name / legend.
	// Empty = use all dimension tags (minus realm/environment identity).
	GroupBy []string `json:"groupBy,omitempty"`

	// Optional per-query tenant override (empty = datasource default). Tenants on the
	// same realm share the datasource's shortCode + OAuth client; only the tenant
	// (org path + per-tenant scope) changes. Enables a dashboard $tenant variable to
	// switch between e.g. prd and stg. Effective only if the datasource's client is
	// authorized for the requested tenant's scope.
	TenantID string `json:"tenantId,omitempty"`
}

// NewDatasource creates a new datasource instance.
func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	// Parse jsonData
	var config DatasourceConfig
	if err := json.Unmarshal(settings.JSONData, &config); err != nil {
		return nil, fmt.Errorf("failed to parse datasource settings: %w", err)
	}

	// Validate required fields
	if config.ShortCode == "" {
		return nil, fmt.Errorf("shortCode is required")
	}
	if config.TenantID == "" {
		return nil, fmt.Errorf("tenantId is required")
	}

	// clientId is non-secret config (jsonData); only clientSecret is stored encrypted.
	clientID := config.ClientID
	clientSecret := settings.DecryptedSecureJSONData["clientSecret"]
	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("missing client credentials (clientId in jsonData and clientSecret in secureJsonData required)")
	}

	// Create OAuth strategy
	authCfg := auth.OAuthConfig{
		ClientID:           clientID,
		ClientSecret:       clientSecret,
		AccountManagerHost: config.AccountManagerHost,
		TokenURL:           config.TokenURL, // Optional override
	}
	if authCfg.AccountManagerHost == "" && authCfg.TokenURL == "" {
		authCfg.AccountManagerHost = auth.DefaultAccountManagerHost
	}
	authStrategy := auth.NewOAuthStrategy(authCfg)

	// Create metrics client
	client := metrics.NewClient(metrics.Config{
		ShortCode: config.ShortCode,
		TenantID:  config.TenantID,
		BaseURL:   config.ApiURL, // Optional override
	}, authStrategy)

	return &B2CMetricsDatasource{
		client:      client,
		auth:        authStrategy,
		config:      config,
		clientCache: make(map[string]*metrics.Client),
	}, nil
}

// Dispose cleans up resources.
func (d *B2CMetricsDatasource) Dispose() {
	// No cleanup needed for now
}

// QueryData handles data queries from Grafana.
func (d *B2CMetricsDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()

	// Process each query. Responses are keyed by the authoritative query.RefID (from the
	// Grafana request), never the RefID inside the query JSON, so a missing/inconsistent
	// JSON refId can't misroute or drop a panel's response.
	for _, query := range req.Queries {
		refID := query.RefID
		var qm QueryModel
		if err := json.Unmarshal(query.JSON, &qm); err != nil {
			response.Responses[refID] = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("failed to parse query: %v", err))
			continue
		}

		// Validate category
		if qm.Category == "" {
			response.Responses[refID] = backend.ErrDataResponse(backend.StatusBadRequest, "category is required")
			continue
		}

		// Resolve time window (enforce retention and defaults)
		window, err := metricsops.ResolveMetricsWindow(metricsops.MetricsWindowInput{
			From: query.TimeRange.From.UnixMilli(),
			To:   query.TimeRange.To.UnixMilli(),
		}, time.Now())
		if err != nil {
			response.Responses[refID] = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("invalid time window: %v", err))
			continue
		}

		// Push-down (server) filters go to the API; also selects the client for any
		// per-query tenant/shortCode override.
		filters := buildFilters(qm)
		client := d.clientFor(qm.TenantID)

		// Fetch metrics for the category
		var metricsData *metrics.MetricsDataResponse
		switch qm.Category {
		case "overall":
			metricsData, err = client.GetOverallMetrics(ctx, window.From, window.To, filters)
		case "sales":
			metricsData, err = client.GetSalesMetrics(ctx, window.From, window.To, filters)
		case "ecdn":
			metricsData, err = client.GetEcdnMetrics(ctx, window.From, window.To, filters)
		case "third-party":
			metricsData, err = client.GetThirdPartyMetrics(ctx, window.From, window.To, filters)
		case "scapi":
			metricsData, err = client.GetScapiMetrics(ctx, window.From, window.To, filters)
		case "scapi-hooks":
			metricsData, err = client.GetScapiHooksMetrics(ctx, window.From, window.To, filters)
		case "mrt":
			metricsData, err = client.GetMrtMetrics(ctx, window.From, window.To, filters)
		case "controller":
			metricsData, err = client.GetControllerMetrics(ctx, window.From, window.To, filters)
		case "ocapi":
			metricsData, err = client.GetOcapiMetrics(ctx, window.From, window.To, filters)
		default:
			err = fmt.Errorf("unknown category: %s", qm.Category)
		}

		if err != nil {
			response.Responses[refID] = mapMetricsError(err)
			continue
		}

		// Post-fetch: filter by selected metricIds + label filters (the tiered
		// "Label filters"), then convert to Grafana frames.
		filtered := applyPostFetchFilters(metricsData, qm)
		frames := convertToFrames(filtered, qm, window)
		response.Responses[refID] = backend.DataResponse{Frames: frames}
	}

	return response, nil
}

// mapMetricsError converts a Metrics client error into a DataResponse with the correct
// Grafana status + error source. Rate-limit (429) and 5xx are attributed to the
// downstream API (so they don't count against the plugin's own reliability and the UI
// shows a rate-limit/downstream message); other API 4xx are downstream client-config
// issues; anything untyped is treated as a plugin error.
func mapMetricsError(err error) backend.DataResponse {
	if he, ok := metrics.AsHTTPError(err); ok {
		msg := he.Error()
		switch {
		case he.IsRateLimit():
			return backend.ErrDataResponseWithSource(backend.StatusTooManyRequests, backend.ErrorSourceDownstream,
				"B2C Metrics API rate limit exceeded — reduce dashboard refresh/panel count or widen the interval. "+msg)
		case he.StatusCode >= 500:
			return backend.ErrDataResponseWithSource(backend.StatusBadGateway, backend.ErrorSourceDownstream, msg)
		case he.StatusCode >= 400:
			// 4xx (bad request/auth/scope) — downstream config, not a plugin bug.
			return backend.ErrDataResponseWithSource(backend.StatusBadRequest, backend.ErrorSourceDownstream, msg)
		}
	}
	// Untyped (network, decode, unknown category) — attribute to the plugin.
	return backend.ErrDataResponse(backend.StatusInternal, fmt.Sprintf("metrics query failed: %v", err))
}

// buildFilters constructs the filter map from query model.
func buildFilters(qm QueryModel) map[string]string {
	filters := make(map[string]string)

	if qm.APIFamily != "" {
		filters["apiFamily"] = qm.APIFamily
	}
	if qm.APIName != "" {
		filters["apiName"] = qm.APIName
	}
	if qm.OcapiCategory != "" {
		filters["ocapiCategory"] = qm.OcapiCategory
	}
	if qm.OcapiAPI != "" {
		filters["ocapiApi"] = qm.OcapiAPI
	}
	if qm.ThirdPartyServiceID != "" {
		filters["thirdPartyServiceId"] = qm.ThirdPartyServiceID
	}

	return filters
}

// applyPostFetchFilters narrows the API response by the selected metricIds and the
// tiered "Label filters" (post-fetch filters on enriched tags). metricId is matched
// against the parent Metric; all other keys are matched against the series' enriched
// tags. Empty metricIds means "all metrics". Returns a new response; input untouched.
func applyPostFetchFilters(resp *metrics.MetricsDataResponse, qm QueryModel) *metrics.MetricsDataResponse {
	if len(qm.MetricIDs) == 0 && len(qm.LabelFilters) == 0 {
		return resp
	}

	metricWanted := map[string]bool{}
	for _, m := range qm.MetricIDs {
		if m != "" {
			metricWanted[m] = true
		}
	}

	out := &metrics.MetricsDataResponse{}
	for _, metric := range resp.Data {
		if len(metricWanted) > 0 && !metricWanted[metric.MetricID] {
			continue
		}
		kept := metric        // copy metric header
		kept.DataSeries = nil // rebuild series slice
		for _, series := range metric.DataSeries {
			if seriesMatchesLabelFilters(metric.MetricID, series.Tags, qm.LabelFilters) {
				kept.DataSeries = append(kept.DataSeries, series)
			}
		}
		if len(kept.DataSeries) > 0 {
			out.Data = append(out.Data, kept)
		}
	}
	return out
}

// seriesMatchesLabelFilters reports whether a series satisfies every label filter.
// The virtual key "metricId" matches the parent metric id; every other key matches
// the enriched series tags. Op "!=" negates; anything else is treated as "=".
func seriesMatchesLabelFilters(metricID string, tags metricsops.MetricSeriesTags, filters []LabelFilter) bool {
	for _, f := range filters {
		if f.Key == "" {
			continue
		}
		var actual string
		if f.Key == "metricId" {
			actual = metricID
		} else {
			actual = tags[f.Key]
		}
		eq := actual == f.Value
		if f.Op == "!=" {
			if eq {
				return false
			}
		} else if !eq {
			return false
		}
	}
	return true
}

// preparedSeries is an intermediate representation of one series while frame naming
// is computed across the whole result set (collision-aware).
type preparedSeries struct {
	metricID   string
	metricUnit string
	labels     data.Labels
	times      []time.Time
	values     []float64
}

// convertToFrames converts a Metrics API response to Grafana data frames.
//
// Naming is computed in two passes so legends are pretty AND unambiguous:
//  1. Each series gets a name from the group-by values (or all dimensions when no
//     group-by is set). Zero-point series are dropped (e.g. empty rollup series).
//  2. Series whose names collide are disambiguated by appending their remaining
//     distinguishing label values — so "product" HIT vs MISS become "product (HIT)"
//     and "product (MISS)" rather than two identical rows.
//
// metricId is merged into each series' labels so it is a first-class, groupable/
// filterable dimension and remains available for a ${__field.labels.metricId}
// display-name override in the panel.
func convertToFrames(metricsData *metrics.MetricsDataResponse, qm QueryModel, window *metricsops.ResolvedMetricsWindow) data.Frames {
	// Pass 1: materialize series, skipping those with no data points in the window.
	var prepared []preparedSeries
	for _, metric := range metricsData.Data {
		for _, series := range metric.DataSeries {
			if !hasNonNullData(series.Data) {
				continue // drop empty/zero-point series (e.g. inactive rollups)
			}
			times := make([]time.Time, len(series.Data))
			values := make([]float64, len(series.Data))
			for i, point := range series.Data {
				times[i] = time.UnixMilli(point.Timestamp)
				values[i] = point.Value
			}
			labels := cloneLabels(series.Tags)
			labels["metricId"] = metric.MetricID
			prepared = append(prepared, preparedSeries{
				metricID: metric.MetricID, metricUnit: metric.Unit, labels: labels, times: times, values: values,
			})
		}
	}

	// Pass 2: compute base names and detect collisions.
	baseNames := make([]string, len(prepared))
	nameCounts := make(map[string]int)
	for i, ps := range prepared {
		baseNames[i] = baseSeriesName(ps.metricID, metricTitleFor(metricsData, ps.metricID), ps.labels, qm.GroupBy)
		nameCounts[baseNames[i]]++
	}

	frames := make(data.Frames, 0, len(prepared))
	finalCounts := make(map[string]int)
	for i, ps := range prepared {
		name := baseNames[i]
		if nameCounts[name] > 1 {
			// Ambiguous: append the distinguishing labels (those NOT already in the name).
			if extra := distinguishingSuffix(ps.labels, qm.GroupBy); extra != "" {
				name = fmt.Sprintf("%s (%s)", name, extra)
			}
		}
		// Last-resort uniqueness: if two series are still identically named (truly
		// identical labels), append an occurrence index so Grafana keeps them distinct.
		finalCounts[name]++
		if k := finalCounts[name]; k > 1 {
			ps.labels["seriesIndex"] = fmt.Sprintf("%d", k)
			name = fmt.Sprintf("%s #%d", name, k)
		}

		frame := data.NewFrame(name,
			data.NewField("time", nil, ps.times),
			data.NewField(ps.metricID, ps.labels, ps.values),
		)
		frame.Fields[1].Config = &data.FieldConfig{DisplayNameFromDS: name}
		if ps.metricUnit != "" {
			frame.Fields[1].Config.Unit = normalizeUnit(ps.metricUnit)
		}
		frame.Meta = &data.FrameMeta{
			ExecutedQueryString: fmt.Sprintf("category=%s from=%s to=%s", qm.Category, window.From.Format(time.RFC3339), window.To.Format(time.RFC3339)),
		}
		if window.ClampedFrom {
			frame.Meta.Notices = []data.Notice{{
				Severity: data.NoticeSeverityWarning,
				Text:     "Time range was clamped to 30-day retention window",
			}}
		}
		frames = append(frames, frame)
	}

	return frames
}

// cloneLabels returns a shallow copy of a tag map as data.Labels.
func cloneLabels(tags map[string]string) data.Labels {
	out := make(data.Labels, len(tags)+1)
	for k, v := range tags {
		out[k] = v
	}
	return out
}

// nameDimensionOrder is the stable order of dimension tags used to build a display
// name when the query does not specify explicit group-by keys. Identity tags
// (realm/environment) and metricId are handled separately.
var nameDimensionOrder = []string{
	"apiFamily", "apiName", "apiVersion", "host", "controller",
	"ocapiCategory", "ocapiApi", "statusClass", "cacheStatus", "exceptionType",
	"aggregation",
}

// hasNonNullData reports whether a series has at least one data point. The Metrics API
// can return rollup/aggregate series with an empty data array in a given window; those
// render as an empty legend row and are dropped.
func hasNonNullData(points []metrics.DataPoint) bool {
	return len(points) > 0
}

// metricTitleFor returns the human title for a metricId from the response (falls back
// to the id itself).
func metricTitleFor(resp *metrics.MetricsDataResponse, metricID string) string {
	for _, m := range resp.Data {
		if m.MetricID == metricID {
			if m.Title != "" {
				return m.Title
			}
			return metricID
		}
	}
	return metricID
}

// baseSeriesName builds the pretty legend name for a series. With group-by keys, it is
// the join of those label values (Prometheus {{legend}} style). Without group-by, it is
// the metric title plus all present dimensions. A series that has none of the requested
// group-by labels (e.g. an aggregate rollup) is named by its non-identity dimensions, or
// the metric title as a last resort — never blank.
func baseSeriesName(metricID, metricTitle string, tags data.Labels, groupBy []string) string {
	if len(groupBy) > 0 {
		parts := make([]string, 0, len(groupBy))
		for _, k := range groupBy {
			if v := tags[k]; v != "" {
				parts = append(parts, v)
			}
		}
		if len(parts) > 0 {
			return strings.Join(parts, " · ")
		}
		// Series lacks every grouped label (e.g. rollup): name it by whatever
		// distinguishing dimension it does carry, else the metric title.
		if agg := tags["aggregation"]; agg != "" {
			return fmt.Sprintf("%s (aggregation=%s)", metricTitle, agg)
		}
		if extra := dimensionValues(tags); extra != "" {
			return fmt.Sprintf("%s (%s)", metricTitle, extra)
		}
		return metricTitle
	}

	if extra := dimensionValues(tags); extra != "" {
		return fmt.Sprintf("%s (%s)", metricTitle, extra)
	}
	if realm := tags["realm"]; realm != "" {
		if env := tags["environment"]; env != "" {
			return fmt.Sprintf("%s (%s/%s)", metricTitle, realm, env)
		}
		return fmt.Sprintf("%s (%s)", metricTitle, realm)
	}
	return metricTitle
}

// dimensionValues joins a series' non-identity dimension values in a stable order.
func dimensionValues(tags data.Labels) string {
	parts := []string{}
	for _, k := range nameDimensionOrder {
		if v := tags[k]; v != "" {
			parts = append(parts, v)
		}
	}
	return strings.Join(parts, ", ")
}

// distinguishingSuffix returns the label values that distinguish a series but are NOT
// already part of its group-by name — used to disambiguate colliding legend names
// (e.g. two "product" series differing only by cacheStatus → suffix "HIT" / "MISS").
func distinguishingSuffix(tags data.Labels, groupBy []string) string {
	inGroup := map[string]bool{}
	for _, k := range groupBy {
		inGroup[k] = true
	}
	parts := []string{}
	for _, k := range nameDimensionOrder {
		if inGroup[k] {
			continue
		}
		if v := tags[k]; v != "" {
			parts = append(parts, v)
		}
	}
	return strings.Join(parts, ", ")
}

// normalizeUnit maps a Metrics API unit string to a Grafana unit id. The API uses
// "s" for seconds (which Grafana also understands); other/empty units pass through.
func normalizeUnit(apiUnit string) string {
	switch apiUnit {
	case "s":
		return "s" // seconds
	case "ms":
		return "ms" // milliseconds
	default:
		return apiUnit
	}
}

// CheckHealth performs a health check of the datasource.
func (d *B2CMetricsDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	log.DefaultLogger.Info("Checking datasource health")

	// Try to fetch a small amount of data to verify connectivity
	window, err := metricsops.ResolveMetricsWindow(metricsops.MetricsWindowInput{
		Window: "5m", // Just last 5 minutes
	}, time.Now())
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("Failed to resolve time window: %v", err),
		}, nil
	}

	// Try to fetch overall metrics as a connectivity test
	_, err = d.client.GetOverallMetrics(ctx, window.From, window.To, nil)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("Failed to connect to Metrics API: %v", err),
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: fmt.Sprintf("Successfully connected to B2C Commerce Metrics API (tenant: %s)", d.config.TenantID),
	}, nil
}

// METRIC_CATEGORIES is the fixed set of Metrics API endpoints.
var metricCategories = []map[string]string{
	{"label": "Overall", "value": "overall"},
	{"label": "Sales", "value": "sales"},
	{"label": "eCDN", "value": "ecdn"},
	{"label": "Third-party", "value": "third-party"},
	{"label": "SCAPI", "value": "scapi"},
	{"label": "SCAPI Hooks", "value": "scapi-hooks"},
	{"label": "MRT", "value": "mrt"},
	{"label": "Controller", "value": "controller"},
	{"label": "OCAPI", "value": "ocapi"},
}

// pushDownFiltersByCategory maps each category to its server-side (push-down) filter
// keys — the ones the Metrics API accepts as query params. Their VALUES come from a
// fixed server enum (see pushDownEnum), not from the returned data.
var pushDownFiltersByCategory = map[string][]string{
	"scapi":       {"apiFamily", "apiName"},
	"ocapi":       {"ocapiCategory", "ocapiApi"},
	"third-party": {"thirdPartyServiceId"},
}

// pushDownEnum is the authoritative server-accepted value list for push-down filter
// keys whose values are a fixed enum (as reported by the API's 400 validation error).
// Keys absent here (e.g. apiName, thirdPartyServiceId) are free-form / discovered.
var pushDownEnum = map[string][]string{
	"apiFamily":     {"shopper", "admin", "data", "cdn", "search", "orders", "customers", "products", "inventory", "pricing", "promotions", "content"},
	"ocapiCategory": {"shop", "data"},
}

// identityTagKeys are enrichment tags that identify the request, not a per-series
// dimension; excluded from the derived label-key list offered as label filters.
var identityTagKeys = map[string]bool{"realm": true, "environment": true, "seriesIndex": true}

// CallResource serves the dynamic discovery API that powers the query editor:
//   - GET categories                        → the 9 metric categories
//   - GET metrics?category=&tenantId=        → probed metricIds (+unit) for a category
//   - GET push-down-filters?category=        → server filter keys + enum values (tiered)
//   - GET label-keys?category=&tenantId=     → derived (post-fetch) label keys, probed
//   - GET label-values?category=&key=&...    → values for a label key (enum or probed)
func (d *B2CMetricsDatasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	parsed, _ := url.Parse(req.URL)
	q := url.Values{}
	if parsed != nil {
		q = parsed.Query()
	}
	switch req.Path {
	case "categories":
		return sendJSON(sender, metricCategories)
	case "push-down-filters":
		return d.handlePushDownFilters(sender, q.Get("category"))
	case "metrics":
		return d.handleGetMetrics(ctx, sender, q.Get("category"), q.Get("tenantId"))
	case "label-keys":
		return d.handleLabelKeys(ctx, sender, q.Get("category"), q.Get("tenantId"))
	case "label-values":
		return d.handleLabelValues(ctx, sender, q.Get("category"), q.Get("key"), q.Get("tenantId"))
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte(fmt.Sprintf("unknown resource path: %s", req.Path)),
		})
	}
}

// probeWindow fetches a recent slice of a category (last 24h — the API max) so the
// discovery handlers can read what metricIds/labels actually exist. Best-effort:
// returns nil on error so discovery degrades to empty rather than failing the editor.
func (d *B2CMetricsDatasource) probeCategory(ctx context.Context, category, tenantID string) (*metrics.MetricsDataResponse, error) {
	if category == "" {
		return nil, fmt.Errorf("category is required")
	}
	window, err := metricsops.ResolveMetricsWindow(metricsops.MetricsWindowInput{Window: "24h"}, time.Now())
	if err != nil {
		return nil, err
	}
	client := d.clientFor(tenantID)
	var resp *metrics.MetricsDataResponse
	switch category {
	case "overall":
		resp, err = client.GetOverallMetrics(ctx, window.From, window.To, nil)
	case "sales":
		resp, err = client.GetSalesMetrics(ctx, window.From, window.To, nil)
	case "ecdn":
		resp, err = client.GetEcdnMetrics(ctx, window.From, window.To, nil)
	case "third-party":
		resp, err = client.GetThirdPartyMetrics(ctx, window.From, window.To, nil)
	case "scapi":
		resp, err = client.GetScapiMetrics(ctx, window.From, window.To, nil)
	case "scapi-hooks":
		resp, err = client.GetScapiHooksMetrics(ctx, window.From, window.To, nil)
	case "mrt":
		resp, err = client.GetMrtMetrics(ctx, window.From, window.To, nil)
	case "controller":
		resp, err = client.GetControllerMetrics(ctx, window.From, window.To, nil)
	case "ocapi":
		resp, err = client.GetOcapiMetrics(ctx, window.From, window.To, nil)
	default:
		return nil, fmt.Errorf("unknown category: %s", category)
	}
	if err != nil {
		log.DefaultLogger.Warn("discovery probe failed", "category", category, "error", err)
		return nil, err
	}
	return resp, nil
}

// handleGetMetrics returns the metricIds available in a category (probed live), each
// with its unit, so the editor's Metric multi-select is accurate and unit-aware.
func (d *B2CMetricsDatasource) handleGetMetrics(ctx context.Context, sender backend.CallResourceResponseSender, category, tenantID string) error {
	type metricOpt struct {
		Value string `json:"value"`
		Label string `json:"label"`
		Unit  string `json:"unit"`
	}
	resp, err := d.probeCategory(ctx, category, tenantID)
	if err != nil {
		return sendResourceErr(sender, err)
	}
	opts := []metricOpt{}
	seen := map[string]bool{}
	for _, m := range resp.Data {
		if seen[m.MetricID] {
			continue
		}
		seen[m.MetricID] = true
		label := m.Title
		if label == "" {
			label = m.MetricID
		}
		opts = append(opts, metricOpt{Value: m.MetricID, Label: label, Unit: m.Unit})
	}
	return sendJSON(sender, opts)
}

// handlePushDownFilters returns the server-side (push-down) filter keys for a category,
// each flagged with whether its values come from a fixed enum. This is the tiered
// "Server filters" section of the editor.
func (d *B2CMetricsDatasource) handlePushDownFilters(sender backend.CallResourceResponseSender, category string) error {
	type pushFilter struct {
		Key     string   `json:"key"`
		HasEnum bool     `json:"hasEnum"`
		Values  []string `json:"values,omitempty"`
	}
	out := []pushFilter{}
	for _, key := range pushDownFiltersByCategory[category] {
		vals, hasEnum := pushDownEnum[key]
		out = append(out, pushFilter{Key: key, HasEnum: hasEnum, Values: vals})
	}
	return sendJSON(sender, out)
}

// handleLabelKeys returns the derived (post-fetch) label keys present in a category,
// probed from live data. These populate the tiered "Label filters" / "Group by" pickers.
// metricId is always offered (it is a first-class label we add per series).
func (d *B2CMetricsDatasource) handleLabelKeys(ctx context.Context, sender backend.CallResourceResponseSender, category, tenantID string) error {
	resp, err := d.probeCategory(ctx, category, tenantID)
	if err != nil {
		return sendResourceErr(sender, err)
	}
	keys := map[string]bool{"metricId": true}
	for _, m := range resp.Data {
		for _, s := range m.DataSeries {
			for k := range s.Tags {
				if !identityTagKeys[k] {
					keys[k] = true
				}
			}
		}
	}
	out := make([]string, 0, len(keys))
	for k := range keys {
		out = append(out, k)
	}
	sort.Strings(out)
	return sendJSON(sender, out)
}

// handleLabelValues returns the distinct values for a label key. For push-down keys
// with a fixed server enum it returns that enum; otherwise it probes live data and
// collects the distinct enriched-tag values (Prometheus label_values() style).
func (d *B2CMetricsDatasource) handleLabelValues(ctx context.Context, sender backend.CallResourceResponseSender, category, key, tenantID string) error {
	if key == "" {
		return sendJSON(sender, []string{})
	}
	if enum, ok := pushDownEnum[key]; ok {
		return sendJSON(sender, enum)
	}
	resp, err := d.probeCategory(ctx, category, tenantID)
	if err != nil {
		return sendResourceErr(sender, err)
	}
	set := map[string]bool{}
	for _, m := range resp.Data {
		if key == "metricId" {
			set[m.MetricID] = true
			continue
		}
		for _, s := range m.DataSeries {
			if v := s.Tags[key]; v != "" {
				set[v] = true
			}
		}
	}
	out := make([]string, 0, len(set))
	for v := range set {
		out = append(out, v)
	}
	sort.Strings(out)
	return sendJSON(sender, out)
}

// sendJSON marshals v and writes it as a 200 application/json CallResource response.
func sendJSON(sender backend.CallResourceResponseSender, v any) error {
	body, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return sender.Send(&backend.CallResourceResponse{
		Status:  http.StatusOK,
		Body:    body,
		Headers: map[string][]string{"Content-Type": {"application/json"}},
	})
}

// sendResourceErr surfaces a discovery/probe failure to the query editor as an HTTP
// error (rather than an empty dropdown), so a rate-limited or unreachable API is
// visible as an error the user can act on instead of looking like "no data". Rate
// limits map to 429 so the editor can show a distinct message.
func sendResourceErr(sender backend.CallResourceResponseSender, err error) error {
	status := http.StatusBadGateway
	if he, ok := metrics.AsHTTPError(err); ok && he.IsRateLimit() {
		status = http.StatusTooManyRequests
	}
	return sender.Send(&backend.CallResourceResponse{
		Status: status,
		Body:   []byte(err.Error()),
	})
}

// getTagKeys / getTagValues equivalents are exposed to the frontend via the
// label-keys / label-values resources above; the datasource.ts wires them into
// Grafana's ad-hoc filter and variable-query mechanisms.
