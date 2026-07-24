/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Package metrics provides high-level operations for the Metrics API, including
// time-window resolution and series tag extraction.
package metrics

import (
	_ "embed"
	"encoding/json"
	"regexp"
	"strings"

	"github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-tooling-sdk-go/clients"
)

//go:embed data/metrics-tags-catalog.json
var catalogJSON []byte

// MetricSeriesTags is a flat map of a series' identifying dimensions (string → string),
// following the InfluxDB/Prometheus/CloudWatch "tag"/"label"/"dimension" convention.
//
// Always contains `realm` and optionally `environment` (derived from the request context).
// Category-specific keys (apiFamily, host, cacheStatus, statusClass, ocapiCategory,
// controller, exceptionType) are added when recognized.
type MetricSeriesTags map[string]string

// MetricsTagContext holds the request identity and applied filters used to derive authoritative tags.
//
// realm/environment are parsed from tenantID. The optional filter fields mirror the Metrics API's
// category filters; when a filter was sent, that dimension is known from the request and is stamped
// onto every series as an authoritative tag.
type MetricsTagContext struct {
	// TenantID is the tenant or organization id the request targeted (with or without f_ecom_).
	TenantID string

	// APIFamily is the apiFamily filter sent with a scapi request, if any.
	APIFamily string

	// APIName is the apiName filter sent with a scapi request, if any.
	APIName string

	// OcapiCategory is the ocapiCategory filter sent with an ocapi request, if any.
	OcapiCategory string

	// OcapiAPI is the ocapiApi filter sent with an ocapi request, if any.
	OcapiAPI string

	// ThirdPartyServiceID is the thirdPartyServiceId filter sent with a third-party request, if any.
	ThirdPartyServiceID string
}

// ExtractorStrategy defines the strategy name for parsing series IDs.
type ExtractorStrategy string

const (
	StrategyFamilyOrStatus     ExtractorStrategy = "familyOrStatus"
	StrategyFamilyOrOverallAgg ExtractorStrategy = "familyOrOverallAgg"
	StrategyLastSpaceSplit     ExtractorStrategy = "lastSpaceSplit"
	StrategyLastDotSplit       ExtractorStrategy = "lastDotSplit"
	StrategyWholeAs            ExtractorStrategy = "wholeAs"
	StrategyEcdnSuccessError   ExtractorStrategy = "ecdnSuccessError"
)

// ExtractorRule defines a category/metricId-specific extraction rule.
type ExtractorRule struct {
	Category string            `json:"category"`
	MetricID string            `json:"metricId"`
	Strategy ExtractorStrategy `json:"strategy"`
	Key      string            `json:"key,omitempty"` // For wholeAs strategy
}

// ExtractorCatalog holds all extraction rules loaded from the embedded JSON.
type ExtractorCatalog struct {
	Version     string          `json:"version"`
	GeneratedAt string          `json:"generatedAt"`
	Description string          `json:"description"`
	Strategies  []string        `json:"strategies"`
	Rules       []ExtractorRule `json:"rules"`
}

var catalog ExtractorCatalog
var extractorIndex map[string]map[string]ExtractorRule // category -> metricId -> rule

func init() {
	if err := json.Unmarshal(catalogJSON, &catalog); err != nil {
		panic("Failed to load metrics-tags-catalog.json: " + err.Error())
	}

	// Build lookup index
	extractorIndex = make(map[string]map[string]ExtractorRule)
	for _, rule := range catalog.Rules {
		if extractorIndex[rule.Category] == nil {
			extractorIndex[rule.Category] = make(map[string]ExtractorRule)
		}
		extractorIndex[rule.Category][rule.MetricID] = rule
	}
}

// splitRealmEnvironment splits a normalized tenant ID (bdpx_prd) into its realm and environment.
// The environment is the final underscore-delimited segment; everything before it is the realm.
// IDs without an underscore yield just a realm.
func splitRealmEnvironment(tenantID string) (realm string, environment string) {
	normalized := clients.NormalizeTenantID(tenantID)
	lastUnderscore := strings.LastIndex(normalized, "_")
	if lastUnderscore <= 0 || lastUnderscore == len(normalized)-1 {
		return normalized, ""
	}
	return normalized[:lastUnderscore], normalized[lastUnderscore+1:]
}

// stripRealmPrefix strips a leading "realm." or "realm " prefix from a packed series id, if present.
// Returns the input unchanged when no realm prefix matches.
//
// Parity note: this MUST match the TS stripRealmPrefix (tags.ts) exactly — it strips
// ONLY the realm prefix, never the full normalized tenant id. A multi-underscore tenant
// (realm derived from all-but-last segment) therefore does NOT strip an id like
// "<realm>_<env>.product"; the remainder stays whole. (normalizedTenantID is retained in
// the signature for call-site uniformity but is intentionally unused.)
func stripRealmPrefix(seriesID, realm, normalizedTenantID string) string {
	_ = normalizedTenantID
	if strings.HasPrefix(seriesID, realm+".") {
		return seriesID[len(realm)+1:]
	}
	if strings.HasPrefix(seriesID, realm+" ") {
		return seriesID[len(realm)+1:]
	}
	return seriesID
}

// Strategy implementations

var statusClassRegex = regexp.MustCompile(`^[1-5]xx$`)
var overallRegex = regexp.MustCompile(`(?i)overall`)
var apiVersionRegex = regexp.MustCompile(`^v\d+$`)

// scapiDrilldown parses a SCAPI drill-down remainder into its dimensions. When a
// request filters by apiFamily, the server returns finer-grained series ids of the
// form {apiFamily}.{apiName}[.{apiName...}].{version} — e.g. "shopper.auth.v1" or
// "search.shopper-search.v1". It splits off the leading family, a trailing vN
// version (if present), and treats everything in between as the api name, so that
// otherwise-identical drilled-down series get distinct, groupable tags. apiFamily
// is authoritative-overridden later by any applied filter. Mirrors the TS scapiDrilldown.
func scapiDrilldown(remainder string) MetricSeriesTags {
	segments := strings.Split(remainder, ".")
	tags := MetricSeriesTags{"apiFamily": segments[0]}
	rest := segments[1:]
	if len(rest) > 0 && apiVersionRegex.MatchString(rest[len(rest)-1]) {
		tags["apiVersion"] = rest[len(rest)-1]
		rest = rest[:len(rest)-1]
	}
	if len(rest) > 0 {
		tags["apiName"] = strings.Join(rest, ".")
	}
	return tags
}

func strategyFamilyOrStatus(remainder, rawID, realm, normalizedTenantID, key string) MetricSeriesTags {
	if statusClassRegex.MatchString(remainder) {
		return MetricSeriesTags{"statusClass": remainder}
	}
	// A drill-down id ("shopper.auth.v1") carries an api name/version; a bare
	// family ("product") does not.
	if strings.Contains(remainder, ".") {
		return scapiDrilldown(remainder)
	}
	return MetricSeriesTags{"apiFamily": remainder}
}

func strategyFamilyOrOverallAgg(remainder, rawID, realm, normalizedTenantID, key string) MetricSeriesTags {
	if overallRegex.MatchString(remainder) {
		return MetricSeriesTags{"aggregation": "overall"}
	}
	if strings.Contains(remainder, ".") {
		return scapiDrilldown(remainder)
	}
	return MetricSeriesTags{"apiFamily": remainder}
}

func strategyLastSpaceSplit(remainder, rawID, realm, normalizedTenantID, key string) MetricSeriesTags {
	spaceIdx := strings.LastIndex(remainder, " ")
	if spaceIdx > 0 {
		return MetricSeriesTags{
			"apiFamily":   remainder[:spaceIdx],
			"cacheStatus": remainder[spaceIdx+1:],
		}
	}
	return MetricSeriesTags{"apiFamily": remainder}
}

func strategyLastDotSplit(remainder, rawID, realm, normalizedTenantID, key string) MetricSeriesTags {
	lastDot := strings.LastIndex(remainder, ".")
	if lastDot > 0 {
		return MetricSeriesTags{
			"host":          remainder[:lastDot],
			"exceptionType": remainder[lastDot+1:],
		}
	}
	return MetricSeriesTags{"host": remainder}
}

func strategyWholeAs(remainder, rawID, realm, normalizedTenantID, key string) MetricSeriesTags {
	if key == "" {
		panic("wholeAs strategy requires a key parameter")
	}
	return MetricSeriesTags{key: remainder}
}

func strategyEcdnSuccessError(remainder, rawID, realm, normalizedTenantID, key string) MetricSeriesTags {
	// Operates on rawID: "2xx bdpx.host" (status class BEFORE the realm)
	spaceIdx := strings.Index(rawID, " ")
	if spaceIdx > 0 {
		statusClass := rawID[:spaceIdx]
		host := stripRealmPrefix(rawID[spaceIdx+1:], realm, normalizedTenantID)
		return MetricSeriesTags{
			"statusClass": statusClass,
			"host":        host,
		}
	}
	return MetricSeriesTags{"host": stripRealmPrefix(rawID, realm, normalizedTenantID)}
}

func applyStrategy(strategy ExtractorStrategy, remainder, rawID, realm, normalizedTenantID, key string) MetricSeriesTags {
	switch strategy {
	case StrategyFamilyOrStatus:
		return strategyFamilyOrStatus(remainder, rawID, realm, normalizedTenantID, key)
	case StrategyFamilyOrOverallAgg:
		return strategyFamilyOrOverallAgg(remainder, rawID, realm, normalizedTenantID, key)
	case StrategyLastSpaceSplit:
		return strategyLastSpaceSplit(remainder, rawID, realm, normalizedTenantID, key)
	case StrategyLastDotSplit:
		return strategyLastDotSplit(remainder, rawID, realm, normalizedTenantID, key)
	case StrategyWholeAs:
		return strategyWholeAs(remainder, rawID, realm, normalizedTenantID, key)
	case StrategyEcdnSuccessError:
		return strategyEcdnSuccessError(remainder, rawID, realm, normalizedTenantID, key)
	default:
		return MetricSeriesTags{}
	}
}

// ParseSeriesTagsParams holds parameters for ParseSeriesTags.
type ParseSeriesTagsParams struct {
	Category string
	MetricID string
	SeriesID string
	Context  MetricsTagContext
}

// ParseSeriesTags extracts the dimension tags for a single series id.
//
// Combines three tiers, most-authoritative last:
//  1. Request identity — realm/environment from the tenant id (never parsed from the series string).
//  2. String heuristics — category/metric-specific dimensions parsed from the packed id
//     (apiFamily, host, cacheStatus, ...), or the raw remainder under "series" when no rule matches.
//  3. Applied filters — any filter that was sent with the request (MetricsTagContext) is stamped last,
//     overriding a heuristic guess.
//
// The result is always a superset of the request context and never panics.
func ParseSeriesTags(params ParseSeriesTagsParams) MetricSeriesTags {
	normalized := clients.NormalizeTenantID(params.Context.TenantID)
	realm, environment := splitRealmEnvironment(params.Context.TenantID)

	tags := MetricSeriesTags{"realm": realm}
	if environment != "" {
		tags["environment"] = environment
	}

	// Lookup rule by category+metricId (fallback to category+*)
	var rule *ExtractorRule
	if categoryRules, ok := extractorIndex[params.Category]; ok {
		if r, ok := categoryRules[params.MetricID]; ok {
			rule = &r
		} else if r, ok := categoryRules["*"]; ok {
			rule = &r
		}
	}

	remainder := stripRealmPrefix(params.SeriesID, realm, normalized)

	if remainder == params.MetricID {
		// The series id is just the metric id echoed back (e.g. "cacheHitRate",
		// "errors4xx") — a rollup/aggregate series carrying no per-series dimension.
		// Don't run the extractor (which would mis-tag it as apiFamily/host/etc.) and
		// don't record a "series" tag; identity tags alone are correct here.
		tags["aggregation"] = "total"
	} else if rule != nil {
		// Apply strategy
		dimensionTags := applyStrategy(rule.Strategy, remainder, params.SeriesID, realm, normalized, rule.Key)
		for k, v := range dimensionTags {
			tags[k] = v
		}
	} else if remainder != "" {
		// No rule for this category/metric. Preserve the (realm-stripped) remainder
		// so nothing is lost.
		tags["series"] = remainder
	}

	// Applied filters are authoritative — stamp them last so they override any heuristic guess
	if params.Context.APIFamily != "" {
		tags["apiFamily"] = params.Context.APIFamily
	}
	if params.Context.APIName != "" {
		tags["apiName"] = params.Context.APIName
	}
	if params.Context.OcapiCategory != "" {
		tags["ocapiCategory"] = params.Context.OcapiCategory
	}
	if params.Context.OcapiAPI != "" {
		tags["ocapiApi"] = params.Context.OcapiAPI
	}
	if params.Context.ThirdPartyServiceID != "" {
		tags["thirdPartyServiceId"] = params.Context.ThirdPartyServiceID
	}

	return tags
}
